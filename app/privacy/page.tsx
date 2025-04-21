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
             <li className="leading-relaxed">这些数据是<strong>临时性</strong>的。默认情况下，它们会在 1 小时后自动从服务器删除。用户可以选择最长 1 天（86400 秒）的留存时间，超过此时间的数据也会被自动删除。</li>
             <li className="leading-relaxed">我们仅存储这些加密数据以使其能够通过链接被检索，一旦过期或被检索（取决于具体策略，但终将删除），它们将不再可用。</li>
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
          <h2 className="text-xl font-semibold mb-3">政策变更</h2>
          <p className={`${theme.textSecondary} leading-relaxed`}>
            我们可能会不时更新本隐私政策。任何更改都将在此页面上发布，并会更新顶部的“最后更新日期”。我们建议您定期查看以了解最新信息。
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