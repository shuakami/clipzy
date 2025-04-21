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
  <a href="README_EN.md" target="_blank">
    <img alt="Read in English" src="https://img.shields.io/badge/Read-English-orange?style=flat-square">
  </a>
</p>

<p align="center">
  一个简洁、安全的端到端加密 (E2EE) 文本分享工具。
  <br />
  基于 Next.js (App Router) 和 Upstash Redis 构建。
</p>

---

## ✨ 主要特性

*   **端到端加密 (E2EE)**：文本在浏览器中完成加密与解密，服务器无法获取原始内容或密钥。
*   **临时存储**：文本片段默认 1 小时后自动过期（最长可设为 1 天）。
*   **数据压缩**：使用 LZString 压缩加密数据，节省存储空间。
*   **简洁界面**：清爽、直观的用户界面，并支持暗色模式。
*   **API 支持**：提供 `/api/store` 和 `/api/get` 接口，方便集成（详见 `/docs`）。

## 🛠️ 技术栈

*   **框架**: Next.js (App Router)
*   **样式**: Tailwind CSS
*   **加密**: Web Crypto API (AES-GCM)
*   **压缩**: LZString
*   **存储**: Upstash Redis (通过 REST API)
*   **UI**: Framer Motion (动画), React Syntax Highlighter (代码高亮)

## 🚀 本地运行

1.  **克隆仓库**
    ```bash
    git clone https://github.com/shuakami/clipzy.git
    cd clipzy
    ```
2.  **安装依赖**
    ```bash
    npm install
    # 或 yarn install / pnpm install
    ```
3.  **配置 Upstash Redis**
    *   在 [Upstash](https://upstash.com/) 创建一个免费的 Redis 数据库。
    *   获取数据库的 REST URL 和 REST Token。
    *   在项目根目录创建 `.env.local` 文件，并填入凭证：
        ```dotenv
        UPSTASH_REDIS_REST_URL="YOUR_UPSTASH_REDIS_URL"
        UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_REDIS_TOKEN"
        ```
4.  **启动开发服务器**
    ```bash
    npm run dev
    # 或 yarn dev / pnpm dev
    ```
5.  浏览器访问 `http://localhost:3000`

## 📄 许可证

本项目采用 [GNU 通用公共许可证 v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0) 授权。

