import React, { useState } from 'react';
import Link from 'next/link';
import { useClipboard } from '../../hooks/useClipboard';
import Button from '../ui/Button';

/**
 * Componente que exibe uma URL encurtada em formato de cartão
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.url - Objeto com dados da URL
 * @param {Function} props.onEdit - Função chamada ao clicar em editar
 * @param {Function} props.onDelete - Função chamada ao clicar em excluir
 */
export default function UrlCard({ url, onEdit, onDelete }) {
  const { copied, copyToClipboard } = useClipboard();
  const [showDetails, setShowDetails] = useState(false);
  
  const handleCopy = () => {
    const fullUrl = `${window.location.protocol}//${window.location.host}/${url.urlCode}`;
    copyToClipboard(fullUrl);
  };
  
  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };
  
  // Truncar URL para exibição
  const truncateUrl = (url, maxLength = 40) => {
    if (!url || url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md hover:shadow-lg transition-all p-5 border border-gray-100 dark:border-dark-700">
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-3">
          {/* Código e Badge */}
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {url.urlCode}
            </h3>
            
            {/* Badge para visibilidade */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              url.isPublic 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {url.isPublic ? 'Pública' : 'Privada'}
            </span>
          </div>
          
          {/* Estatísticas de cliques */}
          <div className="text-right">
            <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
              {url.clicks}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
              cliques
            </span>
          </div>
        </div>
        
        {/* URL Original */}
        <div className="mb-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm break-all">
            {truncateUrl(url.longUrl)}
          </p>
        </div>
        
        {/* Data de criação */}
        <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Criado em {formatDate(url.createdAt)}
          {url.userName && (
            <span className="ml-2 text-gray-500 dark:text-gray-500">
              por {url.userName}
            </span>
          )}
        </div>
        
        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <Button 
            size="sm" 
            variant={copied ? 'success' : 'primary'}
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copiar
              </>
            )}
          </Button>
          
          <Link href={`/stats/${url.urlCode}`} passHref legacyBehavior>
            <Button 
              as="a"
              size="sm" 
              variant="outline"
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Estatísticas
            </Button>
          </Link>
          
          {onEdit && (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => onEdit(url)}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Editar
            </Button>
          )}
          
          {onDelete && (
            <Button 
              size="sm" 
              variant="danger"
              onClick={() => onDelete(url)}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 