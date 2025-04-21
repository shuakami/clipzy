import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer'; // Import the shared Footer

export default function PrivacyPage() {
  const theme = {
    bg: 'bg-white dark:bg-black',
    textPrimary: 'text-black dark:text-white',
    textSecondary: 'text-neutral-600 dark:text-zinc-400',
    link: 'text-blue-600 dark:text-blue-400 hover:underline',
    border: 'border-neutral-200 dark:border-zinc-700',
    errorText: 'text-red-600 dark:text-red-400', // Keep consistent if needed
  };

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      {/* Header */}
      <header className={`px-8 py-6 flex justify-between items-center`}>
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/assets/clipzy.png" width={80} height={28} alt="Logo" className="dark:hidden" />
          <Image src="/assets/clipzy-white.png" width={80} height={28} alt="Logo" className="hidden dark:block" />
        </Link>
      </header>

      {/* Main Content - Reverted structure to match docs page */}
      <main className="flex-1 flex flex-col px-8 pt-10 pb-16 max-w-4xl mx-auto w-full">

        {/* Intro section */}
        <div className="mb-10">
          <h1 className="text-3xl font-extralight mb-4">隐私政策</h1>
          <p className={`${theme.textSecondary} text-sm leading-relaxed`}>
            最后更新日期: {new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>

        <div className="max-w-prose space-y-5">
          <p className={`${theme.textPrimary} leading-relaxed`}>
            欢迎使用 Clipzy！我们非常重视您的隐私。本隐私政策旨在说明我们如何处理您的信息（或更准确地说，我们如何设计服务以尽可能少地处理信息）。
          </p>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">我们不收集的信息</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            Clipzy 的核心设计原则是<strong>端到端加密</strong>。这意味着您输入的文本在离开您的设备之前就已经被加密，只有拥有解密密钥（包含在分享链接的 `#` 片段中）的人才能阅读原始内容。
          </p>
          <ul className={`list-disc list-outside pl-5 mt-2 space-y-1.5 text-sm ${theme.textSecondary}`}>
            <li className="leading-relaxed">我们<strong>无法</strong>访问或解密您分享的文本内容。</li>
            <li className="leading-relaxed">我们<strong>不会</strong>要求或存储您的姓名、电子邮件地址或任何其他个人身份信息。</li>
            <li className="leading-relaxed">我们<strong>不</strong>使用 Cookie 来追踪您的个人浏览活动。</li>
          </ul>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">我们存储的信息（临时且加密）</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            当您创建一个分享链接时，我们会将您提供的<strong>加密后且压缩过</strong>的数据存储在我们的服务器上（由 Upstash Redis 提供技术支持）。
          </p>
           <ul className={`list-disc list-outside pl-5 mt-2 space-y-1.5 text-sm ${theme.textSecondary}`}>
             <li className="leading-relaxed">存储的数据是加密的，我们以及 Upstash 都<strong>没有密钥</strong>来解密它。</li>
             <li className="leading-relaxed">这些数据是<strong>临时性</strong>的（除非您选择永久）。默认情况下，它们会在 1 小时后自动从服务器删除。用户可以选择其他留存时间（最长约 30 天）或选择永久存储。</li>
             <li className="leading-relaxed">我们仅存储这些加密数据以使其能够通过链接被检索，一旦过期（如果设置了过期时间），它们将不再可用。</li>
          </ul>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        {/* Raw 功能说明 */}
        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">Raw 功能（服务器端解密）</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            我们提供了一个可选的 "Raw" 功能 (<code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded text-sm font-mono mx-0.5">/api/raw/...</code>)，它允许直接获取纯文本内容。使用此功能时，您需要将解密密钥作为查询参数附加到 URL 中并发送给我们的服务器。
          </p>
          <p className={`${theme.textSecondary} ${theme.errorText} leading-relaxed`}>
            <strong>请注意：</strong>此操作意味着解密过程发生在服务器上。虽然我们<strong>保证不存储</strong>解密后的原始文本内容，但在此过程中，您的密钥和解密后的内容理论上对服务器是可见的。这与标准的端到端加密流程不同，请仅在理解并接受相关风险的情况下使用此功能。
          </p>
           <ul className={`list-disc list-outside pl-5 mt-2 space-y-1.5 text-sm ${theme.textSecondary}`}>
             <li className="leading-relaxed">原始的加密数据仍然遵循上述的存储策略（您可以选择永久存储或设置最长约 30 天的过期时间）。</li>
           </ul>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        {/* 本地历史记录说明 */}
        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">本地历史记录</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            Clipzy 提供了一个可选的"查看历史"功能，允许您查看您通过本浏览器访问过的 Clipzy 链接记录。
          </p>
          <ul className={`list-disc list-outside pl-5 mt-2 space-y-1.5 text-sm ${theme.textSecondary}`}>
            <li className="leading-relaxed">此历史记录是<strong>完全存储在您自己的浏览器本地存储 (IndexedDB)</strong> 中的。</li>
            <li className="leading-relaxed">为了保护隐私，存储在历史记录中的数据是使用一个<strong>独立的本地密钥</strong>进行再次加密的。</li>
            <li className="leading-relaxed">这个本地密钥本身存储在您浏览器的 `localStorage` 中，并且<strong>永远不会发送到我们的服务器</strong>。</li>
            <li className="leading-relaxed">因此，我们<strong>无法访问</strong>您的本地浏览历史记录或用于解密它的本地密钥。</li>
            <li className="leading-relaxed">您可以随时在"查看历史"页面手动删除单个条目，或者通过清除浏览器缓存和站点数据来完全删除所有历史记录和本地密钥。</li>
          </ul>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">服务器日志</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            与几乎所有互联网服务一样，我们的服务器可能会自动记录一些技术信息，例如您的 IP 地址、访问时间、请求的资源等。这些日志主要用于维护服务的安全性、诊断技术问题和防止滥用（如公平使用政策所述）。
          </p>
           <ul className={`list-disc list-outside pl-5 mt-2 space-y-1.5 text-sm ${theme.textSecondary}`}>
            <li className="leading-relaxed">这些日志数据是标准的技术操作记录，我们<strong>不会</strong>将其与您分享的加密内容相关联。</li>
            <li className="leading-relaxed">我们会定期清理这些日志，仅在必要时保留有限的时间。</li>
          </ul>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">第三方服务</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            我们使用 Upstash (Redis) 作为临时存储加密数据的服务提供商。Upstash 有其自己的隐私政策，但如前所述，我们发送给 Upstash 的数据是加密的，他们无法访问您的原始内容。
          </p>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">我们如何保障您的安全？</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            Clipzy 的设计将您的隐私和安全放在首位。我们通过以下方式实现：
          </p>
          <ul className={`list-disc list-outside pl-5 mt-2 space-y-2 text-sm ${theme.textSecondary}`}>
            <li className="leading-relaxed">
              <strong>端到端加密是核心：</strong>
              您的原始文本内容在您的浏览器中使用业界推荐的 <strong>AES-256-GCM</strong> 算法进行加密。每次加密都会生成一个随机且唯一的初始化向量 (IV)，确保即使相同内容多次加密，结果也不同。加密后的密文与 IV 会一起存储，但解密密钥从未发送给我们。这意味着即使是我们或存储提供商，也无法读取您分享的内容。
            </li>
            <li className="leading-relaxed">
              <strong>密钥从不离开您的链接：</strong>
              解密所需的密钥仅作为 URL 的一部分（# 号后面的片段）存在。根据 Web 标准，URL 片段（hash fragment）不会被浏览器发送到服务器。因此，密钥始终掌握在链接持有者手中，从未传输给我们。
            </li>
            <li className="leading-relaxed">
              <strong>最小化数据收集：</strong>
              我们不要求、也不存储任何可以直接识别您个人身份的信息，如姓名、邮箱等。
            </li>
            <li className="leading-relaxed">
              <strong>自动过期删除：</strong>
              您存储的加密数据具有生命周期。除非您选择永久，否则它们会在您设定的时间（默认1小时，最长约30天）后自动从服务器删除。
            </li>
            <li className="leading-relaxed">
              <strong>开源与透明：</strong>
              Clipzy 的核心代码是完全开源的，您可以在 GitHub 上查看所有源代码：
              <a href="https://github.com/shuakami/clipzy" target="_blank" rel="noopener noreferrer" className={`ml-1 font-medium ${theme.link}`}>
                github.com/shuakami/clipzy
              </a>。
              这意味着任何人都可以审查我们的代码，验证我们的安全承诺，并确保不存在任何隐藏的后门或数据收集行为。这种透明度是您信任我们的基础。
            </li>
            <li className="leading-relaxed">
              <strong>可靠的技术栈：</strong>
              我们依赖 Vercel 和 Upstash 等行业内成熟、声誉良好的服务商来部署和运行服务。
            </li>
          </ul>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">政策变更</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            我们可能会不时更新本隐私政策。任何更改都将在此页面上发布，并会更新顶部的"最后更新日期"。我们建议您定期查看以了解最新信息。
          </p>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        <div className="max-w-prose space-y-3">
          <h2 className="text-xl font-semibold mb-3">联系我们</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            如果您对本隐私政策有任何疑问或担忧，请通过以下邮箱与我们联系：
            <a href="mailto:Shuakami@sdjz.wiki" className={`ml-1 font-medium ${theme.link}`}>
              Shuakami@sdjz.wiki
            </a>
          </p>
        </div>

      </main>

      {/* Use the shared Footer */}
      <Footer />

    </div>
  );
} 