import React from 'react';

/**
 * Componente Skeleton para exibir durante carregamento
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {string} [props.height] - Altura do skeleton
 * @param {string} [props.width] - Largura do skeleton
 * @param {string} [props.borderRadius] - Raio da borda
 * @param {boolean} [props.circle] - Se deve ser um círculo
 */
export default function Skeleton({
  className = '',
  height = '1rem',
  width = '100%',
  borderRadius = '0.25rem',
  circle = false,
  ...props
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{
        height,
        width,
        borderRadius: circle ? '50%' : borderRadius,
        ...props.style,
      }}
      {...props}
      aria-hidden="true"
    />
  );
}

/**
 * Componente SkeletonText para exibir durante carregamento de texto
 * @param {Object} props - Propriedades do componente
 * @param {number} [props.lines=3] - Número de linhas
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {string} [props.height='0.8rem'] - Altura de cada linha
 */
export function SkeletonText({ lines = 3, className = '', height = '0.8rem', ...props }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={height}
          width={index === lines - 1 && lines > 1 ? '80%' : '100%'}
          borderRadius="0.25rem"
          {...props}
        />
      ))}
    </div>
  );
}

/**
 * Componente SkeletonCard para exibir durante carregamento de cards
 */
export function SkeletonCard({ className = '', ...props }) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 ${className}`} aria-hidden="true">
      <Skeleton height="1.5rem" width="50%" className="mb-4" />
      <SkeletonText lines={3} className="mb-4" />
      <div className="flex justify-between">
        <Skeleton height="2rem" width="30%" />
        <Skeleton height="2rem" width="30%" />
      </div>
    </div>
  );
} 