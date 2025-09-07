'use client'

import { usePathname } from 'next/navigation'
import { AnnouncementBar } from './AnnouncementBar'

export function GlobalAnnouncementBar() {
  const pathname = usePathname()
  
  return (
    <AnnouncementBar
      id="limit-upgrade"
      message="临时剪切板单次上限已提升至 200万字/8MB，欢迎体验。"
      link="/changelog"
      linkText="查看更新"
      includePaths={["/"]}
      excludePaths={[]}
      forceShow={false}
    />
  )
}
