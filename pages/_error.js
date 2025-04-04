import React from 'react';

function Error({ statusCode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-lg shadow-md p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">{statusCode || 'Erro'}</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {statusCode
            ? `Ocorreu um erro ${statusCode}`
            : 'Ocorreu um erro no cliente'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Pedimos desculpas pelo inconveniente. Por favor, tente novamente mais tarde.
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

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 