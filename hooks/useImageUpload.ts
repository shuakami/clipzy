import { useState, useCallback } from 'react';

interface ImageUploadState {
  isUploading: boolean;
  uploadProgress: number;
  imageUrl: string | null;
  error: string | null;
  urlCopied: boolean;
}

export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    uploadProgress: 0,
    imageUrl: null,
    error: null,
    urlCopied: false
  });

  const uploadImage = useCallback(async (base64Data: string) => {
    if (!base64Data) {
      setState(prev => ({ ...prev, error: '请选择图片文件' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      uploadProgress: 0, 
      error: null,
      urlCopied: false 
    }));

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.uploadProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, uploadProgress: prev.uploadProgress + 10 };
        });
      }, 100);

      const response = await fetch('https://uapis.cn/api/v1/image/frombase64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Data
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `上传失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 200) {
        throw new Error(data.message || '上传失败');
      }

      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        uploadProgress: 100, 
        imageUrl: data.image_url,
        error: null 
      }));

    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        uploadProgress: 0,
        error: error instanceof Error ? error.message : '上传失败，请重试' 
      }));
    }
  }, []);

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setState(prev => ({ ...prev, urlCopied: true }));
      
      // 3秒后重置复制状态
      setTimeout(() => {
        setState(prev => ({ ...prev, urlCopied: false }));
      }, 3000);
    } catch (error) {
      console.error('Copy failed:', error);
      // 降级方案：创建临时文本框
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setState(prev => ({ ...prev, urlCopied: true }));
        setTimeout(() => {
          setState(prev => ({ ...prev, urlCopied: false }));
        }, 3000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      } finally {
        textArea.remove();
      }
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: 0,
      imageUrl: null,
      error: null,
      urlCopied: false
    });
  }, []);

  return {
    isUploading: state.isUploading,
    uploadProgress: state.uploadProgress,
    imageUrl: state.imageUrl,
    error: state.error,
    urlCopied: state.urlCopied,
    uploadImage,
    copyUrl,
    reset
  };
}
