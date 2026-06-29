const OpenAI = require('openai');

const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || [];
    const recent = entry.filter(t => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_MAX) return false;
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return true;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const configuredKey = process.env.CHAT_API_KEY;

    if (configuredKey && configuredKey.trim() !== '') {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${configuredKey}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ip = rawIp.split(',')[0].trim();
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const context = typeof body.context === 'string' ? body.context.slice(0, 10000) : '';

        let fullMessages = messages;
        if (context) {
            fullMessages = [
                {
                    role: 'system',
                    content: `你是"华师一高校指南"的AI助手，帮助高中生了解大学专业。\n\n请使用下方指南内容中的信息来回答问题。回答时请自然引导用户去指南中阅读对应章节的完整内容（告知具体篇目标题），例如"指南的《专业名称》篇有详细介绍"。\n\n---BEGIN CONTEXT---\n${context}\n---END CONTEXT---`,
                },
                ...fullMessages,
            ];
        }

        const openai = new OpenAI({
            baseURL: process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
            apiKey: process.env.LLM_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            messages: fullMessages,
            model: process.env.LLM_MODEL || 'deepseek-v4-flash',
            stream: true,
        });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.status(200);

        req.on('close', () => {
            if (typeof completion.controller?.abort === 'function') {
                completion.controller.abort();
            }
        });

        for await (const chunk of completion) {
            if (req.destroyed) break;
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(content);
            }
        }
        if (!req.destroyed) {
            res.end();
        }
    } catch (error) {
        console.error('[api/chat] Error:', error);
        if (res.headersSent) {
            res.end();
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
