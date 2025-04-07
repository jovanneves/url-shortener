import React, { forwardRef } from 'react';

/**
 * Componente Input reutilizável
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.label] - Label do input
 * @param {string} [props.type='text'] - Tipo do input
 * @param {string} [props.error] - Mensagem de erro
 * @param {string} [props.helperText] - Texto de ajuda
 * @param {boolean} [props.fullWidth=false] - Se o input deve ocupar a largura total
 * @param {string} [props.id] - ID do input
 * @param {string} [props.className] - Classes adicionais
 */
const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  fullWidth = false,
  id,
  className = '',
  ...props
}, ref) => {
  // ID único para o input se não for fornecido
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Classes base para todos os inputs
  const baseClasses = 'px-4 py-3 bg-white border rounded-lg transition duration-200 focus:outline-none focus:ring-2 dark:bg-dark-800 dark:text-white';
  
  // Classes condicionais
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-400 focus:border-red-500 dark:border-red-500' 
    : 'border-gray-300 focus:ring-primary-400 focus:border-primary-500 dark:border-dark-700 dark:focus:ring-primary-600';
  
  // Classes para largura
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        ref={ref}
        type={type}
        className={`${baseClasses} ${errorClasses} ${widthClasses}`}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 