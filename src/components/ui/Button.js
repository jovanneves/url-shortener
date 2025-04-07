import React from 'react';

/**
 * Componente Button reutilizável com diferentes variantes
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.variant='primary'] - Variante do botão: 'primary', 'secondary', 'outline', 'danger'
 * @param {string} [props.size='md'] - Tamanho do botão: 'sm', 'md', 'lg'
 * @param {boolean} [props.isLoading=false] - Se o botão está em estado de carregamento
 * @param {boolean} [props.fullWidth=false] - Se o botão deve ocupar a largura total
 * @param {React.ReactNode} props.children - Conteúdo do botão
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  // Classes base para todos os botões
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Classes de tamanho
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Classes de variante
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm dark:bg-primary-500 dark:hover:bg-primary-600',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm dark:bg-gray-700 dark:hover:bg-gray-800',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-primary-500 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm dark:bg-red-500 dark:hover:bg-red-600',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm dark:bg-green-500 dark:hover:bg-green-600',
  };
  
  // Classes para largura
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Classes para loading
  const loadingClasses = isLoading ? 'opacity-70 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClasses} ${loadingClasses} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
} 