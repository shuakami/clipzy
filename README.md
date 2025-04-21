# Clipzy 📎

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/status-active-success.svg?style=flat-square)](https://github.com/YOUR_USERNAME/clipzy) 

A simple, end-to-end encrypted text sharing tool built with Next.js and Upstash Redis.

一个简单的、使用 Next.js 和 Upstash Redis 构建的端到端加密文本分享工具。

## ✨ Features / 特性

*   **End-to-End Encryption (E2EE)**: Text is encrypted/decrypted entirely in the browser. The server never sees the raw content or the decryption key.
    *   **端到端加密 (E2EE)**：文本内容完全在浏览器端进行加密和解密，服务器无法获取原始内容或密钥。
*   **Temporary Storage**: Shared text snippets expire automatically (default 1 hour, max 1 day).
    *   **临时存储**：分享的文本片段会自动过期（默认1小时，最长1天）。
*   **Compression**: Encrypted data is compressed using LZString before storing to save space.
    *   **压缩**：加密后的数据在存储前会使用 LZString 进行压缩以节省空间。
*   **Simple UI**: Clean and minimalist interface with dark mode support.
    *   **简洁界面**：干净、极简的用户界面，支持暗色模式。
*   **API Available**: Provides `/api/store` and `/api/get` endpoints (see `/docs` page for details).
    *   **提供 API**：提供 `/api/store` 和 `/api/get` 接口（详见 `/docs` 页面）。

## 🛠️ Tech Stack / 技术栈

*   **Framework**: Next.js (App Router)
*   **Styling**: Tailwind CSS
*   **Encryption**: Web Crypto API (AES-GCM)
*   **Compression**: LZString
*   **Storage**: Upstash Redis (via REST API)
*   **UI Components**: Framer Motion (for animations), React Syntax Highlighter

## 🚀 Getting Started / 本地运行

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shuakami/clipzy.git
    cd clipzy
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Set up Upstash Redis:**
    *   Create a free Redis database on [Upstash](https://upstash.com/).
    *   Get your REST URL and REST Token.
    *   Create a `.env.local` file in the project root and add your credentials:
        ```dotenv
        UPSTASH_REDIS_REST_URL="YOUR_UPSTASH_REDIS_URL"
        UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_REDIS_TOKEN"
        ```
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License / 许可证

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the [LICENSE](LICENSE) file for details.

本项目采用 GNU 通用公共许可证第 3 版（GPL-3.0）授权。详见 [LICENSE](LICENSE) 文件。

