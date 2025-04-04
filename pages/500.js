import React from 'react';

export default function Custom500() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-lg shadow-md p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">500</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Erro interno do servidor
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Ocorreu um problema no servidor. Nossa equipe foi notificada e está trabalhando para resolver o problema.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          Voltar para a página inicial
        </button>
      </div>
    </div>
  );
} 