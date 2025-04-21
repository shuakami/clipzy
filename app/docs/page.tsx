import Image from 'next/image';
import Link from 'next/link'; // 可选：返回首页链接
import Footer from '@/components/Footer'; // Import the Footer component

// 代码块组件，可复用展示代码
function CodeBlock({ language, children }: { language: string; children: string }) {
  return (
    <pre className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-md overflow-x-auto my-3 text-sm">
      <code className={`language-${language}`}>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  // 主题样式
  const theme = {
    bg: 'bg-white dark:bg-black',
    textPrimary: 'text-black dark:text-white',
    textSecondary: 'text-neutral-600 dark:text-zinc-400',
    link: 'text-blue-600 dark:text-blue-400 hover:underline',
    border: 'border-neutral-200 dark:border-zinc-700',
  };

  // 内联代码样式
  const inlineCodeStyle = 'px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded text-sm font-mono mx-0.5';

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      {/* 头部 */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/assets/clipzy.png" width={80} height={28} alt="Logo" className="dark:hidden" />
          <Image src="/assets/clipzy-white.png" width={80} height={28} alt="Logo" className="hidden dark:block" />
        </Link>
      </header>

      {/* 主体内容 */}
      <main className="flex-1 flex flex-col px-8 pt-10 pb-16 max-w-4xl mx-auto w-full">
        {/* 标题与简介 */}
        <div className="mb-10">
          <h1 className="text-3xl font-extralight mb-4">API 文档</h1>
          <p className={`${theme.textSecondary} leading-relaxed max-w-prose`}>
            欢迎使用 Clipzy API。此 API 允许您以编程方式创建和检索端到端加密的文本片段。
          </p>
        </div>

        <hr className={`${theme.border} my-8`} />

        {/* 基本信息 */}
        <div className="mb-10">
          <h2 className="text-2xl font-extralight mt-8 mb-6">基本信息</h2>
          <ul className="list-disc list-outside pl-5 space-y-3 max-w-prose">
            <li><strong>基础 URL:</strong> 相对于当前域名。</li>
            <li><strong>认证:</strong> 无需认证，安全性依赖链接片段中的密钥。</li>
            <li><strong>数据格式:</strong> 请求和响应均为 JSON (<code className={inlineCodeStyle}>application/json</code>)。</li>
            <li><strong>数据留存与大小限制:</strong>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>默认 1 小时 (<code className={inlineCodeStyle}>ttl=3600</code>) 后删除。</li>
                <li>可通过 <code className={inlineCodeStyle}>ttl</code> 参数自定义：
                  <ul className="list-disc pl-8 mt-1 space-y-1">
                    <li>正数：指定留存秒数（服务器端最大限制约 30 天）。</li>
                    <li><code className={inlineCodeStyle}>-1</code>：永久存储（无过期时间）。</li>
                  </ul>
                </li>
                <li>大小限制:
                  <ul className="list-disc pl-8 mt-1 space-y-1">
                    <li>永久或超过 7 天：约 17 万字符上限。</li>
                    <li>7 天及以内：约 70 万字符上限。</li>
                    <li>(注意：服务器端基于压缩后数据有对应限制，分别为 ~0.6MB 和 ~2MB)</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><strong>加密:</strong> 客户端 AES-GCM 加密，密钥仅在 URL 片段中。</li>
          </ul>
        </div>

        <hr className={`${theme.border} my-8`} />

        {/* 端点 */}
        <div className="mb-10">
          <h2 className="text-2xl font-extralight mt-8 mb-6">端点</h2>
        </div>

        {/* POST /api/store */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-3">创建加密片段</h3>
          <div className="space-y-3 mb-5">
            <p>
              <span className="font-mono font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded mr-2">POST</span>
              <code className={inlineCodeStyle}>/api/store</code>
            </p>
            <p className={`${theme.textSecondary} leading-relaxed max-w-prose`}>
              上传压缩后加密的数据，返回唯一 ID。
            </p>
          </div>

          <h4 className="text-lg font-medium mt-8 mb-1">请求 Body</h4>
          <CodeBlock language="json">
{`{
  "compressedData": "string", // 必需：加密并 LZString 压缩后的 Base64 字符串
  "ttl": number | null       // 可选：秒。正数秒数 (最大约30天), -1 为永久, 默认 3600
}`}
          </CodeBlock>

          <h4 className="text-lg font-medium mt-8 mb-1">响应 (200 OK)</h4>
          <CodeBlock language="json">
{`{
  "id": "string" // 用于构建分享链接的唯一 ID
}`}
          </CodeBlock>

          <h4 className="text-lg font-medium mt-8 mb-1">错误响应</h4>
          <ul className="list-disc pl-5 text-sm space-y-1.5 mb-2">
            <li><code className={inlineCodeStyle}>400 Bad Request</code>: 请求体缺失或格式错误。</li>
            <li><code className={inlineCodeStyle}>413 Payload Too Large</code>: 请求体（压缩后数据）超过限制。
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li>若 TTL 为永久或 &gt; 7天: 限制约 0.6MB。</li>
                <li>若 TTL &lt;= 7天: 限制为 2MB。</li>
              </ul>
            </li>
            <li><code className={inlineCodeStyle}>405 Method Not Allowed</code>: 非 POST 方法。</li>
            <li><code className={inlineCodeStyle}>500 Internal Server Error</code>: 服务器错误。</li>
          </ul>
          <CodeBlock language="json">
{`{
  "error": "string",    // 错误信息
  "details"?: "string" // 可选：详细说明
}`}
          </CodeBlock>
        </section>

        {/* GET /api/get */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-3">获取加密片段</h3>
          <div className="space-y-3 mb-5">
            <p>
              <span className="font-mono font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded mr-2">GET</span>
              <code className={inlineCodeStyle}>/api/get</code>
            </p>
            <p className={`${theme.textSecondary} leading-relaxed max-w-prose`}>
              根据 ID 获取加密并压缩的数据。
            </p>
          </div>

          <h4 className="text-lg font-medium mt-8 mb-1">查询参数</h4>
          <ul className="list-disc pl-5 text-sm space-y-1.5">
            <li><code className={inlineCodeStyle}>id=string</code> (必需)：片段唯一 ID。</li>
          </ul>
          <p className="text-sm mt-2 leading-relaxed">示例：<code className={inlineCodeStyle}>/api/get?id=your_unique_id</code></p>

          <h4 className="text-lg font-medium mt-8 mb-1">响应 (200 OK)</h4>
          <CodeBlock language="json">
{`{
  "compressedData": "string" // 加密并压缩后的数据
}`}
          </CodeBlock>

          <h4 className="text-lg font-medium mt-8 mb-1">错误响应</h4>
          <ul className="list-disc pl-5 text-sm space-y-1.5 mb-2">
            <li><code className={inlineCodeStyle}>400 Bad Request</code>: 缺少或无效 ID。</li>
            <li><code className={inlineCodeStyle}>404 Not Found</code>: 片段不存在或已过期。</li>
            <li><code className={inlineCodeStyle}>405 Method Not Allowed</code>: 非 GET 方法。</li>
            <li><code className={inlineCodeStyle}>500 Internal Server Error</code>: 服务器错误。</li>
          </ul>
          <CodeBlock language="json">
{`{
  "error": "string",    // 错误信息
  "details"?: "string" // 可选：详细说明
}`}
          </CodeBlock>
        </section>

        {/* GET /api/raw/{id} */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-3">获取原始文本 (服务器端解密)</h3>
          {/* 安全警告 */}
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">安全警告：</strong>
            <span className="block sm:inline ml-1">此端点在服务器端解密数据。<br/>
            虽然我们保证<strong>不存储</strong>解密后的原始文本内容，但只要使用了此端点，您的数据将不再属于端到端加密。建议谨慎使用。链接有效期与原片段相同。</span>
          </div>
          <div className="space-y-3 mb-5">
            <p>
              <span className="font-mono font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded mr-2">GET</span>
              <code className={inlineCodeStyle}>/api/raw/{'{id}'}</code>
            </p>
            <p className={`${theme.textSecondary} leading-relaxed max-w-prose`}>
              根据 ID 和密钥获取解密后的原始文本内容。数据在服务器端解密后直接以 <code className={inlineCodeStyle}>text/plain</code> 格式返回。
            </p>
          </div>

          <h4 className="text-lg font-medium mt-8 mb-1">路径参数</h4>
          <ul className="list-disc pl-5 text-sm space-y-1.5">
            <li><code className={inlineCodeStyle}>{'{id}'}</code> (必需)：片段唯一 ID。</li>
          </ul>

          <h4 className="text-lg font-medium mt-8 mb-1">查询参数</h4>
          <ul className="list-disc pl-5 text-sm space-y-1.5">
            <li><code className={inlineCodeStyle}>key=string</code> (必需)：用于解密的 Base64 编码的 AES 密钥。</li>
          </ul>
          <p className="text-sm mt-2 leading-relaxed">示例：<code className={inlineCodeStyle}>/api/raw/your_unique_id?key=your_base64_key</code></p>


          <h4 className="text-lg font-medium mt-8 mb-1">响应 (200 OK)</h4>
          <p className="text-sm mt-2 leading-relaxed mb-2">
            <code className={inlineCodeStyle}>Content-Type: text/plain; charset=utf-8</code>
          </p>
          <CodeBlock language="text">
{`解密后的纯文本内容...`}
          </CodeBlock>

          <h4 className="text-lg font-medium mt-8 mb-1">错误响应</h4>
          <ul className="list-disc pl-5 text-sm space-y-1.5 mb-2">
            <li><code className={inlineCodeStyle}>400 Bad Request</code>: 缺少或无效的 ID 或密钥。</li>
            <li><code className={inlineCodeStyle}>403 Forbidden</code>: 提供的密钥无法解密数据。</li>
            <li><code className={inlineCodeStyle}>404 Not Found</code>: 片段不存在或已过期。</li>
            <li><code className={inlineCodeStyle}>405 Method Not Allowed</code>: 非 GET 方法。</li>
            <li><code className={inlineCodeStyle}>500 Internal Server Error</code>: 服务器错误（例如解密失败）。</li>
          </ul>
           <CodeBlock language="json">
{`{
  "error": "string",    // 错误信息
  "details"?: "string" // 可选：详细说明
}`}
          </CodeBlock>
        </section>

        {/* 客户端工作流程 */}
        <div className="mb-10">
          <h2 className="text-2xl font-extralight mt-8 mb-6">客户端工作流程</h2>
          <p className={`${theme.textSecondary} leading-relaxed mb-5 max-w-prose`}>
            前端与 API 交互流程：
          </p>
          <ol className="list-decimal pl-5 space-y-2.5 max-w-prose">
            <li>生成 AES-GCM 密钥 (<code className={inlineCodeStyle}>generateKey</code>)。</li>
            <li>加密文本 (<code className={inlineCodeStyle}>encryptData</code>)。</li>
            <li>压缩密文 (<code className={inlineCodeStyle}>compressString</code>)。</li>
            <li>POST /api/store 上传数据并可选设置 <code className={inlineCodeStyle}>ttl</code>。</li>
            <li>组合 URL，例如 <code className={inlineCodeStyle}>https://domain/#id!base64Key</code>。</li>
            <li>分享该 URL。</li>
            <li>访问时解析 URL 片段获取 ID 和密钥。</li>
            <li>GET /api/get?id=ID 获取数据。</li>
            <li>解压 (<code className={inlineCodeStyle}>decompressString</code>)。</li>
            <li>解密 (<code className={inlineCodeStyle}>decryptData</code>) 并显示文本。</li>
          </ol>
          <p className={`${theme.textSecondary} leading-relaxed mt-6 max-w-prose`}>
            密钥仅在客户端保留，确保端到端加密安全。
          </p>
        </div>
      </main>

      {/* Use the Footer component */}
      <Footer />

    </div>
  );
}
