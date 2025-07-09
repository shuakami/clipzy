import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  themeClasses: {
    bg: string;
    textPrimary: string;
    textSecondary: string;
    btnSecondary: string;
    border: string;
  };
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, url, themeClasses }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`p-6 md:p-16 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row items-center gap-8 md:gap-16 border ${themeClasses.border}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Column: QR Code */}
            <div className="flex-shrink-0">
              <div className="p-4 md:p-6 bg-white rounded-xl md:rounded-2xl border border-neutral-200/50">
                <QRCodeSVG value={url} size={208} bgColor="#FFFFFF" fgColor="#000000" level="L" />
              </div>
            </div>

            {/* Right Column: Instructions */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
              <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${themeClasses.textPrimary}`}>
                在另一台设备上打开
              </h2>
              <p className={`mt-2 md:mt-4 text-base md:text-lg max-w-md ${themeClasses.textSecondary}`}>
                使用您手机的相机扫描此二维码，即可立即访问链接。
              </p>
              
              <div className="mt-6 md:mt-10 space-y-4 md:space-y-6 w-full">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className={`w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center text-lg md:text-xl font-bold rounded-full bg-black/5 dark:bg-white/10 ${themeClasses.textPrimary}`}>1</div>
                  <p className={`text-base md:text-lg ${themeClasses.textSecondary}`}>打开相机应用</p>
                </div>
                <div className="flex items-center gap-4 md:gap-5">
                  <div className={`w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center text-lg md:text-xl font-bold rounded-full bg-black/5 dark:bg-white/10 ${themeClasses.textPrimary}`}>2</div>
                  <p className={`text-base md:text-lg ${themeClasses.textSecondary}`}>对准二维码</p>
                </div>
                 <div className="flex items-center gap-4 md:gap-5">
                  <div className={`w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center text-lg md:text-xl font-bold rounded-full bg-black/5 dark:bg-white/10 ${themeClasses.textPrimary}`}>3</div>
                  <p className={`text-base md:text-lg ${themeClasses.textSecondary}`}>点击弹出的链接</p>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 