import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';

const BASE = 'node_modules/vetradocs-docusaurus';

// Fix 1: Copy CSS files
try {
  mkdirSync(BASE + '/dist/theme/VetradocsChat', { recursive: true });
  mkdirSync(BASE + '/dist/theme/VetradocsFloatingBar', { recursive: true });
  copyFileSync(BASE + '/src/theme/VetradocsChat/styles.css', BASE + '/dist/theme/VetradocsChat/styles.css');
  copyFileSync(BASE + '/src/theme/VetradocsFloatingBar/styles.css', BASE + '/dist/theme/VetradocsFloatingBar/styles.css');
} catch (e) { console.error('CSS copy failed:', e.message); process.exit(1); }

// Fix 2: Patch useVetradocs.js
const hookPath = BASE + '/dist/hooks/useVetradocs.js';
let src = readFileSync(hookPath, 'utf8');
let changed = false;

// 2a. Add apiKey to configuredPaths
if (!src.includes("apiKey: ''")) {
  src = src.replace(
    "shortcut: 'i',",
    "shortcut: 'i',\n    apiKey: '',"
  );
  changed = true;
}

// 2b. Add apiKey to config sync
if (!src.includes('config.apiKey')) {
  src = src.replace(
    "if (config.shortcut)\n            configuredPaths.shortcut = config.shortcut;\n    }, [config.indexPath, config.apiEndpoint, config.shortcut]);",
    "if (config.shortcut)\n            configuredPaths.shortcut = config.shortcut;\n        if (config.apiKey)\n            configuredPaths.apiKey = config.apiKey;\n    }, [config.indexPath, config.apiEndpoint, config.shortcut, config.apiKey]);"
  );
  changed = true;
}

// 2c. Keep webpackIgnore (still needed because @orama/plugin-data-persistence is imported in loadIndex)

// 2d. Add docsCache variable
if (!src.includes('docsCache')) {
  src = src.replace("let indexLoaded = false;", "let indexLoaded = false;\nlet docsCache = null;");
  changed = true;
}

// 2e. Preload docsCache in loadIndex
if (!src.includes('Pre-load docsCache')) {
  src = src.replace(
    "async function loadIndex() {\n            if (indexLoaded)\n                return;\n            try {\n                const response = await fetch(configuredPaths.indexPath);\n                if (!response.ok) {\n                    console.warn('[Vetradocs] Search index not found. Run generated build script first.');\n                    return;\n                }\n                const data = await response.text();\n                // Dynamic import\n                const { restore } = await import('@orama/plugin-data-persistence');",
    "async function loadIndex() {\n            if (indexLoaded)\n                return;\n            try {\n                const response = await fetch(configuredPaths.indexPath);\n                if (!response.ok) {\n                    console.warn('[Vetradocs] Search index not found. Run generated build script first.');\n                    return;\n                }\n                const data = await response.text();\n                // Pre-load docsCache for RAG (also used by bigram search)\n                if (!docsCache) {\n                    try {\n                        docsCache = JSON.parse(data).docs?.docs || {};\n                        console.log('[Vetradocs] RAG: Loaded', Object.keys(docsCache).length, 'docs on mount');\n                    } catch (e) {\n                        console.error('[Vetradocs] RAG: Failed to parse docsCache:', e);\n                    }\n                }\n                // Dynamic import\n                const { restore } = await import('@orama/plugin-data-persistence');"
  );
  changed = true;
}

// 2f. Replace searchDocs with bigram search + auth header in sendMessage + content cleaning
if (src.includes('@orama/orama')) {
  const OLD = `    const searchDocs = useCallback(async (query, limit = 3) => {
        if (!oramaDB)
            return [];
        try {
            const { search } = await import('@orama/orama');
            const result = await search(oramaDB, { term: query, limit });
            return result.hits.map((hit) => ({
                title: hit.document.title,
                url: hit.document.url,
                content: hit.document.content,
            }));
        }
        catch (err) {
            console.error('[Vetradocs] Search failed:', err);
            return [];
        }
    }, []);`;
  const NEW = `    const searchDocs = useCallback(async (query, limit = 3) => {
        if (!docsCache) {
            try {
                const raw = await fetch(configuredPaths.indexPath).then(r => r.text());
                docsCache = JSON.parse(raw).docs?.docs || {};
                console.log('[Vetradocs] RAG: Loaded', Object.keys(docsCache).length, 'docs');
            } catch (e) {
                console.error('[Vetradocs] RAG: Failed to load docs:', e);
                return [];
            }
        }
        const q = query.toLowerCase();
        const grams = [];
        for (let i = 0; i < q.length; i++) {
            const ch = q[i];
            if (ch >= '\\u4e00' && ch <= '\\u9fff' || /[a-zA-Z0-9]/.test(ch)) {
                grams.push(ch);
                if (i + 1 < q.length) grams.push(ch + q[i + 1]);
            }
        }
        if (grams.length === 0) return [];
        const uniqueGrams = [...new Set(grams)];
        const entries = Object.entries(docsCache);
        const scored = entries.map(([id, doc]) => {
            const t = doc.title.toLowerCase();
            const c = doc.content.toLowerCase();
            let score = 0;
            for (const g of uniqueGrams) {
                if (t.includes(g)) score += 2;
                else if (c.includes(g)) score += 1;
            }
            return { doc, score };
        });
        scored.sort((a, b) => b.score - a.score);
        const top = scored.filter(s => s.score > 0).slice(0, limit);
        console.log('[Vetradocs] RAG: Found', top.length, 'docs for "' + query + '"');
        if (top.length > 0) console.log('[Vetradocs] RAG: Top:', top[0].doc.title, '(score:', top[0].score + ')');
        return top.map(s => ({
            title: s.doc.title,
            url: s.doc.url,
            content: s.doc.content,
        }));
    }, []);`;
  if (src.includes(OLD)) {
    src = src.replace(OLD, NEW);
    changed = true;
  } else {
    throw new Error('vetradocs: FAILED - searchDocs OLD pattern not found. The upstream vetradocs-docusaurus has changed, patch needs update.');
  }
}

// 2g. Replace sendMessage to include auth header + Chinese RAG context with content cleaning
if (!src.includes('来源：《')) {
  const OLD_SEND = `    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || loading)
            return;
        const userMsg = { role: 'user', content: text };
        messages = [...messages, userMsg];
        input = ''; // Clear input
        loading = true;
        error = null;
        notify();
        try {
            const context = await searchDocs(text);
            const contextText = context
                .map(doc => \`Source: \${doc.title}\\nContent: \${doc.content}\`)
                .join('\\n---\\n');
            const response = await fetch(configuredPaths.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    context: contextText,
                }),
            });`;
  const NEW_SEND = `    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || loading)
            return;
        const userMsg = { role: 'user', content: text };
        messages = [...messages, userMsg];
        input = ''; // Clear input
        loading = true;
        error = null;
        notify();
        try {
            const context = await searchDocs(text, 5);
            const contextText = context
                .map(doc => \`来源：《\${doc.title}》路径：\${doc.url}\\n内容：\${doc.content
                    .replace(/<[^>]*>/g, '')
                    .replace(/\`\`\`[\\s\\S]*?\`\`\`/g, '')
                    .replace(/[#*>\\-\\[\\]()]/g, '')
                    .replace(/\\n{3,}/g, '\\n\\n')
                    .trim()
                    .slice(0, 1500)}\`)
                .join('\\n\\n---\\n\\n');
            const requestHeaders = { 'Content-Type': 'application/json' };
            if (configuredPaths.apiKey) {
                requestHeaders['Authorization'] = 'Bearer ' + configuredPaths.apiKey;
            }
            const response = await fetch(configuredPaths.apiEndpoint, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify({
                    messages: messages,
                    context: contextText,
                }),
            });`;
  if (src.includes(OLD_SEND)) {
    src = src.replace(OLD_SEND, NEW_SEND);
    changed = true;
  } else {
    throw new Error('vetradocs: FAILED - sendMessage OLD pattern not found. The upstream vetradocs-docusaurus has changed, patch needs update.');
  }
}

if (changed) {
  writeFileSync(hookPath, src);
  console.log('vetradocs: patched useVetradocs.js');
} else {
  console.log('vetradocs: useVetradocs.js already patched');
}

// Fix 3: Fix CRLF in build-index.mjs
const binPath = BASE + '/bin/build-index.mjs';
let binSrc = readFileSync(binPath, 'utf8');
if (binSrc.includes('\r\n')) {
  binSrc = binSrc.replace(/\r\n/g, '\n');
  writeFileSync(binPath, binSrc);
  console.log('vetradocs: fixed CRLF in build-index.mjs');
}

// Fix 4: Click floating bar opens chat sidebar directly
const floatPath = BASE + '/dist/theme/VetradocsFloatingBar/index.js';
let floatSrc = readFileSync(floatPath, 'utf8');
if (floatSrc.includes('onClick: focusInput')) {
  floatSrc = floatSrc.replace('onClick: focusInput', 'onClick: openChat');
  writeFileSync(floatPath, floatSrc);
  console.log('vetradocs: floating bar click now opens chat sidebar');
} else if (!floatSrc.includes('onClick: openChat')) {
  throw new Error('vetradocs: FAILED - focusInput pattern not found in VetradocsFloatingBar');
}
