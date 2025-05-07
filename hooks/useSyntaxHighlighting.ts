import { useState, useEffect, type CSSProperties } from 'react';

const getStyle = (dark: boolean) => dark
  ? import('react-syntax-highlighter/dist/esm/styles/hljs').then(m => m.atomOneDark)
  : import('react-syntax-highlighter/dist/esm/styles/hljs').then(m => m.atomOneLight);

export function useSyntaxHighlighting(dark: boolean) {
  const [syntaxStyle, setSyntaxStyle] = useState<{ [key: string]: CSSProperties } | null>(null);

  useEffect(() => {
    let isMounted = true;
    getStyle(dark).then(loadedStyle => {
      if (isMounted) {
        setSyntaxStyle(loadedStyle);
      }
    });
    return () => { isMounted = false; };
  }, [dark]);

  return syntaxStyle;
}

export const detectLanguage = (t: string) => {
  if (/(^|\n)\s*```/.test(t) || /(^|\n)#\s/.test(t) || /\[.*\]\(.*\)/.test(t)) return 'markdown';
  if (t.includes('<') && t.includes('>')) return 'xml';
  if (t.includes('{') || t.includes('}')) return 'json';
  if (t.includes('function') || t.includes('=>')) return 'javascript';
  return 'plaintext';
}; 