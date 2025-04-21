import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const theme = {
    bg: 'bg-white dark:bg-black',
    textPrimary: 'text-black dark:text-white',
    textSecondary: 'text-neutral-600 dark:text-zinc-400',
    link: 'text-blue-600 dark:text-blue-400 hover:underline',
    border: 'border-neutral-200 dark:border-zinc-700',
    // Define error color for warning
    errorText: 'text-red-600 dark:text-red-400',
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

      {/* Main Content - Simplified Structure */}
      <main className="flex-1 flex flex-col px-8 pt-10 pb-16 max-w-4xl mx-auto w-full">

        {/* Intro */}
        <div className="mb-10">
          <h1 className="text-3xl font-extralight mb-4">价格说明</h1>
          <p className={`${theme.textSecondary} leading-relaxed max-w-prose`}>
            Clipzy 致力于提供简单、安全、免费的文本分享服务。
          </p>
        </div>

        {/* Free Info */}
        <div className="mb-10">
           <h2 className="text-2xl font-extralight mb-4">完全免费</h2>
           <p className={`${theme.textPrimary} leading-relaxed max-w-prose`}>
             本服务的所有核心功能，包括创建和查看加密文本片段，都是 **完全免费** 的。我们希望为用户提供一个无负担的私密分享工具。
           </p>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        {/* Fair Use Policy */}
        <div className="mb-10">
          <h2 className="text-2xl font-extralight mb-4">公平使用政策</h2>
          <div className="space-y-4 max-w-prose leading-relaxed">
            <p className={theme.textPrimary}>
              为了确保服务的稳定性和可用性，我们设立了公平使用政策。我们鼓励您在正常范围内使用 Clipzy 进行文本分享。
            </p>
            <div>
              <p className={`${theme.textSecondary} mb-2`}>
                请注意，我们<strong>禁止</strong>任何形式的滥用行为，包括但不限于：
              </p>
              <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm ${theme.textSecondary}">
                <li>使用脚本或自动化工具进行高频率的内容创建或读取（刷接口）。</li>
                <li>恶意抓取数据。</li>
                <li>任何可能对服务造成不合理负担或干扰其他用户正常使用的行为。</li>
                <li>将我们的服务用于盈利或商业用途。</li>
              </ul>
            </div>
             {/* Simplified Warning Message */}
            <p className={`${theme.errorText} text-sm`}>
            对于检测到的滥用行为，我们保留采取相应措施的权利，包括但不限于 <strong className="font-semibold">临时或永久封禁相关 IP 地址或 IP 段</strong>，恕不另行通知。
            </p>
          </div>
        </div>

        {/* Separator */}
        <hr className={`${theme.border} my-8`} />

        {/* High Frequency Use */}
        <div>
           <h2 className="text-2xl font-extralight mb-4">高频使用需求？</h2>
            <div className="space-y-4 max-w-prose leading-relaxed">
              <p className={`${theme.textPrimary}`}>
               如果您有合法的高频率使用场景（例如，集成到您自己的应用中，但非滥用性质），或者担心您的使用模式可能触发限制，请提前通过以下邮箱与我们联系说明情况：
               <a href="mailto:Shuakami@sdjz.wiki" className={`ml-1 font-medium ${theme.link}`}>
                 Shuakami@sdjz.wiki
               </a>
             </p>
             <p className={`${theme.textSecondary} text-sm`}>
               请在邮件中详细说明您的使用场景、预期的请求频率以及联系方式，我们会尽快评估并回复。
             </p>
           </div>
        </div>

      </main>

      {/* Use the Footer component */}
      <Footer />

    </div>
  );
} 