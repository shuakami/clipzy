'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { Button } from './button'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

// For the main container (dot, text, button)
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

// For the items in the main container
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ease: [0.4, 0, 0.2, 1] as const,
      duration: 0.4
    }
  },
};

// For the text container (the <p> tag)
const textContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

// For the letters
const letterVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};


interface AnnouncementBarProps {
  id?: string
  message: string
  link: string
  linkText?: string
  includePaths?: string[]
  excludePaths?: string[]
  forceShow?: boolean
}

export function AnnouncementBar({ 
  id = 'default', 
  message, 
  link, 
  linkText = '查看详情',
  includePaths,
  excludePaths = [],
  forceShow = false
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()
  const storageKey = `announcement-bar-${id}-dismissed`

  useEffect(() => {
    const isIncluded = !includePaths || includePaths.includes(pathname)
    const isExcluded = excludePaths.includes(pathname)
    
    // Debug logging for production troubleshooting
    if (process.env.NODE_ENV === 'development') {
      console.log('AnnouncementBar debug:', {
        pathname,
        includePaths,
        isIncluded,
        isExcluded,
        forceShow
      })
    }
    
    // 计算新的可见状态
    let shouldBeVisible = false
    
    if (isIncluded && !isExcluded) {
      if (forceShow) {
        shouldBeVisible = true
      } else {
        // 检查用户是否已关闭此通知（添加错误处理）
        try {
          const isDismissed = typeof window !== 'undefined' && localStorage.getItem(storageKey) === 'true'
          shouldBeVisible = !isDismissed
        } catch (error) {
          // 如果 localStorage 不可用，默认显示通知
          console.warn('localStorage not available, showing announcement bar by default')
          shouldBeVisible = true
        }
      }
    }
    
    // 只有在状态真正需要改变时才更新，避免不必要的动画
    setIsVisible(prev => {
      if (prev !== shouldBeVisible) {
        return shouldBeVisible
      }
      return prev
    })
  }, [storageKey, pathname, includePaths, excludePaths, forceShow])

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true')
      }
    } catch (error) {
      console.warn('Failed to save dismissal state to localStorage')
    }
  }

  const handleLinkClick = () => {
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full overflow-hidden relative z-10"
        >
          <div className="bg-teal-600 dark:bg-teal-700 text-white shadow-sm border-b border-teal-500/20">
            <div className="max-w-[1400px] mx-auto px-4 py-1.5 sm:px-8">
              <motion.div 
                className="flex items-center justify-between"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <motion.div variants={itemVariants} className="flex-shrink-0">
                    <motion.div 
                      className="w-1.5 h-1.5 bg-white rounded-full" 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  
                  <motion.p
                    variants={itemVariants}
                    className="text-xs font-medium text-white/95 truncate"
                  >
                    <motion.span
                      className="inline-block"
                      variants={textContainerVariants}
                    >
                      {message.split("").map((char, index) => (
                        <motion.span key={`${char}-${index}`} variants={letterVariants} className="inline-block">
                          {char}
                        </motion.span>
                      ))}
                    </motion.span>
                  </motion.p>
                </div>

                <motion.div variants={itemVariants} className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLinkClick}
                    className="text-white/90 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-200 flex items-center gap-1 text-xs font-medium px-2 py-1 h-auto whitespace-nowrap"
                  >
                    {linkText}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Button>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-white hover:text-white hover:bg-white/20 transition-all duration-200 flex-shrink-0 !w-7 !h-7 !p-0 ml-2 !min-w-0"
                    aria-label="关闭通知"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
