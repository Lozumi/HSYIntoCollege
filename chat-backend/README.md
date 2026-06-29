# Vetradocs Chat Backend (Node.js/Express)

This is a standard Node.js server for **Vetradocs**, built with **Express**. It acts as a proxy to LLM providers (like OpenAI or Ollama), securing your API keys and managing requests.

## Setup

1. **Install dependencies**:

    ```bash
    npm install
    ```

2. **Configure Environment**:
    Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your values:
    * **`PORT`**: Server port (default: 3000).
    * **`FRONTEND_URL`**: URL of your documentation site for CORS (e.g., `http://localhost:5173`).
     * **`CHAT_API_KEY`**: A secure secret key you create. This secures the endpoint from unauthorized use.
    * **`LLM_API_KEY`**: Your API Key from OpenAI, Anthropic, or similar.
    * **`LLM_BASE_URL`**: The API endpoint (e.g., `https://api.openai.com/v1`).
    * **`LLM_MODEL`**: The model to use (e.g., `gpt-3.5-turbo`, `gpt-4o`).

## Development

Run the server locally:

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

## Production

Start the server in production mode:

```bash
npm start
```

## Frontend Integration

Once running, connect this backend to your documentation site.

### 1. VitePress

If you are using `vetradocs-vitepress`:

Add to your `.env` file:

```bash
VITE_VETRADOCS_BACKEND_URL=http://localhost:3000/api/chat
VITE_VETRADOCS_CHAT_API_KEY=your-secret-api-key
```

### 2. Docusaurus

If you are using `vetradocs-docusaurus`:

Pass the props to `VetradocsChat`:

```jsx
<VetradocsChat
  apiEndpoint="http://localhost:3000/api/chat"
   chatApiKey="your-secret-api-key"
/>
```

### 3. Scalar / Generic

If you are using `vetradocs-scalar`:

```html
<vetradocs-widget
  api-endpoint="http://localhost:3000/api/chat"
     chat-api-key="your-secret-api-key"
></vetradocs-widget>
```

## More Information

For full documentation, visit **[https://vectra-docs.vercel.app](https://vectra-docs.vercel.app)**.
