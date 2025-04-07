import { useState, useEffect } from 'react';

/**
 * Hook para criar um valor com debounce
 * Útil para retardar a execução de operações como buscas em tempo real
 * 
 * @param {any} value - O valor a ser aplicado debounce
 * @param {number} delay - Tempo de espera em milissegundos
 * @returns {any} O valor após o tempo de debounce
 */
export default function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configurar timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar o timer se o valor ou delay mudar ou o componente for desmontado
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
} 