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

## 部署 (Deployment)

### Vercel 部署 (推荐)

这是部署 Clipzy 最简单快捷的方式。

1.  **Fork 本仓库**: 点击此页面右上角的 "Fork" 按钮。
2.  **连接到 Vercel**: 访问 [vercel.com](https://vercel.com/)，使用您的 GitHub 账号登录，然后选择 "Add New..." -> "Project"。
3.  **导入仓库**: 选择您刚刚 Fork 的 Clipzy 仓库并导入。
4.  **配置环境变量**: 在项目设置的 "Environment Variables" 部分，添加以下两个变量（您需要先去 [Upstash](https://upstash.com/) 创建一个免费的 Redis 数据库来获取这些值）：
    *   `UPSTASH_REDIS_REST_URL`: 您的 Upstash Redis REST URL。
    *   `UPSTASH_REDIS_REST_TOKEN`: 您的 Upstash Redis REST Token。
5.  **部署**: 点击 "Deploy" 按钮。Vercel 将自动处理构建、部署和 HTTPS 证书。

### 本地/服务器部署 (可选)

如果您希望在自己的服务器或本地机器上运行 Clipzy，可以使用本地 Redis 作为存储后端。

**前置要求:**

*   Node.js (建议 v18 或更高版本)
*   pnpm (包管理器)
*   Docker (推荐，用于运行 Redis)
*   Nginx 或其他反向代理服务器 (用于生产环境和 SSL)

**步骤:**

1.  **克隆仓库**: `git clone https://github.com/shuakami/clipzy.git`
2.  **进入目录**: `cd clipzy`
3.  **安装依赖**: `pnpm install`
4.  **运行本地 Redis (使用 Docker):**
    ```bash
    docker run -d --name clipzy-redis -p 127.0.0.1:6379:6379 redis
    ```
    *(这将在本地 6379 端口启动一个 Redis 容器。如果您不使用 Docker，请确保您已安装并运行了 Redis 服务。)*
5.  **配置环境变量**: 创建一个 `.env.local` 文件在项目根目录，并添加以下内容：
    ```env
    DEPLOYMENT_MODE=local
    # 如果您的 Redis 不在默认地址，请取消注释并修改下面这行
    # LOCAL_REDIS_URL=redis://your_redis_host:port
    ```
6.  **构建项目**: `pnpm build`
7.  **运行项目**: `pnpm start`
    *(此时，Next.js 应用应该在 `http://localhost:3000` 运行)*

8.  **配置反向代理和 SSL (生产环境，以 Nginx 为例):**
    *   确保您已安装 Nginx。
    *   创建一个 Nginx 配置文件，例如 `/etc/nginx/sites-available/clipzy.conf`：
        ```nginx
        server {
            listen 80;
            server_name your-domain.com; # <-- 替换为您的域名

            # 将所有 HTTP 请求重定向到 HTTPS
            location / {
                return 301 https://$host$request_uri;
            }
        }

        server {
            listen 443 ssl http2;
            server_name your-domain.com; # <-- 替换为您的域名

            # SSL 证书路径 (使用 Certbot 获取)
            ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

            location / {
                proxy_pass http://127.0.0.1:3000; # 代理到本地运行的 Next.js 应用
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        ```
    *   **获取 SSL 证书**: 使用 Certbot (推荐) 获取免费的 Let's Encrypt 证书：
        ```bash
        sudo apt update
        sudo apt install certbot python3-certbot-nginx
        sudo certbot --nginx -d your-domain.com # <-- 替换为您的域名
        ```
    *   **启用 Nginx 配置**: 创建符号链接，测试配置并重启 Nginx：
        ```bash
        sudo ln -s /etc/nginx/sites-available/clipzy.conf /etc/nginx/sites-enabled/
        sudo nginx -t
        sudo systemctl restart nginx
        ```
    *   **防火墙**: 确保您的服务器防火墙允许 80 (HTTP) 和 443 (HTTPS) 端口的入站连接。

## 本地开发

1.  克隆仓库: `git clone https://github.com/shuakami/clipzy.git`
2.  进入目录: `cd clipzy`
3.  安装依赖: `pnpm install`
4.  *(可选)* 如果你想测试本地 Redis 模式，请参考上面"本地/服务器部署"部分的步骤 4 和 5 来运行 Redis 并创建 `.env.local` 文件。
5.  启动开发服务器: `pnpm dev`
6.  在浏览器中打开 `http://localhost:3000`。

## 贡献

欢迎提出 Issue 和 Pull Request！


## 📄 许可证

本项目采用 [GNU 通用公共许可证 v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0) 授权。