import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

// Criando o contexto
const ToastContext = createContext(null);

// ID único para cada toast
let toastId = 0;

/**
 * Provedor de contexto para o sistema de notificações Toast
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Elementos filhos
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Adicionar novo toast
  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = toastId++;
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    
    return id;
  }, []);

  // Remover toast pelo ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Shortcuts para diferentes tipos de notificações
  const showSuccess = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const showError = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider 
      value={{ 
        addToast, 
        removeToast, 
        showSuccess, 
        showError, 
        showWarning, 
        showInfo 
      }}
    >
      {children}
      
      {/* Renderizar todos os toasts ativos */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook para usar o contexto de Toast
 * @returns {Object} Métodos para mostrar diferentes tipos de toasts
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === null) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  
  return context;
} 