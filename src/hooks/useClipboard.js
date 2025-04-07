import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar a cópia de texto para a área de transferência
 * @returns {{
 *   copied: boolean,
 *   copyToClipboard: (text: string) => Promise<boolean>,
 *   resetCopyState: () => void
 * }}
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  // Resetar estado de cópia
  const resetCopyState = useCallback(() => {
    setCopied(false);
  }, []);

  // Função para copiar texto para área de transferência
  const copyToClipboard = useCallback(async (text) => {
    if (!text) return false;
    
    try {
      // Usar API moderna do clipboard
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Resetar estado após 2 segundos
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Erro ao usar clipboard API:', err);
      
      try {
        // Fallback para método mais antigo
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';  // Evita rolar para baixo
        textArea.style.opacity = '0';       // Torna invisível
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
          return true;
        } else {
          console.error('Falha ao executar execCommand: copy');
          return false;
        }
      } catch (fallbackErr) {
        console.error('Erro no método fallback:', fallbackErr);
        return false;
      }
    }
  }, []);

  return { copied, copyToClipboard, resetCopyState };
} 