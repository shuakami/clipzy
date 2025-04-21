# Clipzy 📎

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/assets/clipzy-white-r.png">
    <source media="(prefers-color-scheme: light)" srcset="public/assets/clipzy-r.png">
    <img alt="Clipzy Logo Banner" src="public/assets/clipzy-r.png" width="400">
  </picture>
</p>

<p align="center">
  <a href="https://www.gnu.org/licenses/gpl-3.0" target="_blank">
    <img alt="License: GPL v3" src="https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square">
  </a>
  <a href="https://github.com/shuakami/clipzy" target="_blank">
    <img alt="Status" src="https://img.shields.io/badge/status-active-success.svg?style=flat-square">
  </a>
   <a href="README.md" target="_blank">
    <img alt="查看中文说明" src="https://img.shields.io/badge/Read-%E4%B8%AD%E6%96%87-orange?style=flat-square">
  </a>
</p>

<p align="center">
  A simple, secure end-to-end encrypted (E2EE) text sharing tool.
  <br />
  Built with Next.js (App Router) and Upstash Redis.
</p>

---

## ✨ Features

*   **End-to-End Encryption (E2EE)**: Text is encrypted/decrypted entirely in the browser; the server never sees the raw content or the key.
*   **Temporary Storage**: Snippets expire automatically (default 1 hour, max 1 day).
*   **Data Compression**: Uses LZString to compress encrypted data before storage.
*   **Simple UI**: Clean, intuitive interface with dark mode support.
*   **API Available**: Provides `/api/store` and `/api/get` endpoints (see `/docs`).

## 🛠️ Tech Stack

*   **Framework**: Next.js (App Router)
*   **Styling**: Tailwind CSS
*   **Encryption**: Web Crypto API (AES-GCM)
*   **Compression**: LZString
*   **Storage**: Upstash Redis (via REST API)
*   **UI**: Framer Motion, React Syntax Highlighter

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/shuakami/clipzy.git
    cd clipzy
    ```
2.  **Install dependencies**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```
3.  **Configure Upstash Redis**
    *   Create a free Redis database on [Upstash](https://upstash.com/).
    *   Get your REST URL and REST Token.
    *   Create a `.env.local` file in the project root and add your credentials:
        ```dotenv
        UPSTASH_REDIS_REST_URL="YOUR_UPSTASH_REDIS_URL"
        UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_REDIS_TOKEN"
        ```
4.  **Run the development server**
    ```bash
    npm run dev
    # or yarn dev / pnpm dev
    ```
5.  Open `http://localhost:3000` in your browser.

## 📄 License

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0). 