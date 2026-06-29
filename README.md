# 华师一高校指南

基于 [Docusaurus](https://docusaurus.io/) 构建的高校专业选择指南网站，集成 AI 问答助手（RAG + DeepSeek）。

## 项目结构

```
├── api/
│   └── chat.js              # Vercel Serverless Function (处理 /api/chat)
├── chat-backend/             # Express 后端（本地开发 / Linux 自部署用）
│   ├── server.js
│   └── .env
├── patches/                  # vetradocs-docusaurus 补丁
│   ├── patch-vetradocs.mjs   # 中文搜索、RAG context、CSS 等
│   └── postinstall.sh        # yarn install 后自动应用
├── src/
│   ├── theme/Root.js         # 注入 AI 聊天组件
│   └── css/custom.css        # 样式覆盖
├── static/search-index.json  # 构建时生成（.gitignore）
├── docusaurus.config.js
├── vercel.json
└── package.json
```

## 前置要求

- Node.js >= 18
- yarn
- DeepSeek API Key（[platform.deepseek.com](https://platform.deepseek.com/)）

## 本地开发

### 安装依赖

```bash
yarn install
```

`postinstall` 脚本会自动给 `vetradocs-docusaurus` 打补丁（中文搜索、RAG context、CSS 等）。

### 启动后端

```bash
cd chat-backend
# 编辑 .env，填入你的 DeepSeek API Key
node server.js
# 服务运行在 http://localhost:3001
```

### 启动前端

```bash
yarn dev
# 服务运行在 http://localhost:3000
```

前端开发服务器自动代理 `/api/chat` 到后端。

### 构建

```bash
yarn build
# 1. docusaurus build        → 生成 build/
# 2. build-index.mjs         → 生成 static/search-index.json
# 3. cp 到 build/            → 供生产环境使用
```

---

## 部署方案对比

本项目支持两种部署方式，任选其一：

| 方案 | 适用场景 | 复杂度 | 成本 |
|------|----------|--------|------|
| **方案 A：Vercel 一体化部署** | 小规模使用，不想管理服务器 | 低 | Vercel Hobby 免费 + DeepSeek API 按量付费 |
| **方案 B：自建 Linux 服务器** | 需要控制后端，大规模使用 | 中 | 服务器费用 + DeepSeek API 按量付费 |

---

## 方案 A：Vercel 一键部署（推荐）

前端（Docusaurus）和后端（API）部署在同一个 Vercel 项目，无需单独服务器。

### 架构

```
用户浏览器
    │
    ▼
Vercel CDN
    ├── /               → Docusaurus 静态文件 (build/)
    └── /api/chat       → Serverless Function (api/chat.js)
                            └── 调用 DeepSeek API
```

### 部署步骤

1. **推送代码到 GitHub**

2. **在 Vercel 导入项目**
   - 项目根目录 `./`，Vercel 自动检测 Docusaurus
   - 无需修改构建设置，`vercel.json` 已配置

3. **设置环境变量**

   在 Vercel Dashboard → Settings → Environment Variables 添加：

   | 变量 | 必填 | 说明 |
   |------|------|------|
   | `LLM_API_KEY` | **是** | DeepSeek API Key |
   | `LLM_BASE_URL` | 否 | 默认 `https://api.deepseek.com/v1` |
   | `LLM_MODEL` | 否 | 默认 `deepseek-v4-flash` |
    | `CHAT_API_KEY` | 否 | 前后端认证 key，若设置则强制校验；前后端须一致 |

4. **部署完成**

   前端 `https://你的项目名.vercel.app`，API 在同域名下的 `/api/chat`。

### Vercel 配置说明

**现有 `vercel.json` 内容**（位于项目根目录）：

```json
{
  "buildCommand": "yarn build",
  "outputDirectory": "build"
}
```

Vercel 同时会把 `api/` 下的文件自动部署为 Serverless Function，无需额外配置。

**构建流程**：`yarn build` 会执行：

```
docusaurus build                     → 生成 build/
node .../build-index.mjs             → 扫描 docs/ 生成搜索索引 static/search-index.json
cp static/search-index.json build/   → 复制到构建输出目录
```

> **注意**：`docusaurus build` 会在构建时读取 `CHAT_API_KEY` 环境变量并嵌入前端静态页面中。

### 本地模拟 Vercel 环境

如果想在本地测试 Vercel Function，可以使用 Vercel CLI：

```bash
npm install -g vercel
vercel dev
```

`vercel dev` 会同时启动 Docusaurus 和 `api/chat.js` 函数，行为与生产环境一致。

---

## 方案 B：自建 Linux 服务器

如果不想用 Vercel，或需要在自有服务器部署完整后端。

### 架构

```
用户浏览器
    │
    ▼
Nginx (反向代理)
    ├── /               → Docusaurus 静态文件
    └── /api/chat       → 转发到 localhost:3001
                            └── Express (chat-backend/server.js)
                                  └── 调用 DeepSeek API
```

### 部署步骤

#### 1. 构建前端

在本地或 CI 中构建：

```bash
yarn install
yarn build
# 生成 build/ 目录，将其部署到服务器
```

#### 2. 上传到服务器

将 `build/` 和 `chat-backend/` 目录上传到 Linux 服务器。

#### 3. 安装后端依赖

```bash
cd chat-backend
npm install
```

#### 4. 配置环境变量

创建 `chat-backend/.env.production`（不要提交到 Git）：

```
PORT=3001
FRONTEND_URL=https://你的前端域名
CHAT_API_KEY=your-chat-api-key
LLM_API_KEY=sk-你的DeepSeekKey
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-v4-flash
```

或通过系统环境变量注入：

```bash
export PORT=3001
export FRONTEND_URL=https://你的前端域名
export LLM_API_KEY=sk-你的DeepSeekKey
```

#### 5. 使用 PM2 启动后端

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start chat-backend/server.js --name chat-backend

# 保存进程列表（开机自启）
pm2 save
pm2 startup
```

常用 PM2 命令：

```bash
pm2 status              # 查看状态
pm2 logs chat-backend   # 查看日志
pm2 restart chat-backend # 重启
pm2 stop chat-backend   # 停止
```

#### 6. 配置 Nginx 反代

```nginx
# /etc/nginx/sites-available/hsy-guide
server {
    listen 80;
    server_name 你的域名.com;

    # 前端静态文件
    root /path/to/build;
    index index.html;

    # API 代理
    location /api/chat {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }

    # 前端路由（SPA 支持）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用站点并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/hsy-guide /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. 配置 SSL（HTTPS）

推荐使用 Let's Encrypt：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
```

---

## 环境变量参考

| 变量 | 必填 | 默认值 | 用途 | 生效场景 |
|------|------|--------|------|----------|
| `LLM_API_KEY` | **是** | 无 | DeepSeek API Key | Vercel / Linux |
| `LLM_BASE_URL` | 否 | `https://api.deepseek.com/v1` | API 地址 | Vercel / Linux |
| `LLM_MODEL` | 否 | `deepseek-v4-flash` | 模型名 | Vercel / Linux |
| `CHAT_API_KEY` | 否 | — | 前后端认证 key，若设置则强制校验；前后端须一致 | Vercel / Linux |

> **关于 `CHAT_API_KEY`**：仅当显式设置环境变量时，API 才会强制校验 `Authorization` header。前后端值必须一致。不设置则不校验。
>
> **关于 `.env` 文件**：仅用于本地开发，已加入 `.gitignore`，**不会**提交到 Git。生产环境（Vercel Dashboard 或 Linux 系统环境变量）另有配置方式。

## 安全注意事项

1. **API Key 保护**：`LLM_API_KEY`（DeepSeek Key）和 `CHAT_API_KEY`（认证 Key）不得泄露
2. **Vercel 环境变量**：在 Dashboard 中设置，不要在代码中硬编码
3. **Linux 服务器**：使用系统环境变量或 `.env.production`（加入 `.gitignore`）
4. **HTTPS 必须**：生产环境务必配置 SSL，防止传输中泄露 API Key
5. **CORS 限制**：Linux 部署时 `FRONTEND_URL` 设为具体域名，不要使用 `*`

## 技术栈

- **前端：** Docusaurus v3, React 18
- **搜索：** Bigram 字符匹配（替代 Orama，解决中文分词问题）
- **AI：** DeepSeek API（模型：`deepseek-v4-flash`）
- **后端：** Vercel Function（方案 A）/ Express（方案 B）
- **流式传输：** SSE
