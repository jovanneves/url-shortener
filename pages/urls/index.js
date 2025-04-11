import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RequireAuth from '../../components/RequireAuth';
import { useSession } from 'next-auth/react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

export default function UrlsPage() {
  // Componente protegido com autenticação
  return (
    <RequireAuth>
      <UrlsContent />
    </RequireAuth>
  );
}

function UrlsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  // Estados para o modal de confirmação de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Estado para controlar atualizações de visibilidade
  const [updating, setUpdating] = useState(false);
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    // Define a URL base apenas quando executado no navegador
    setBaseUrl(window.location.origin);
  }, []);

  // Calcular índices dos itens a exibir na página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUrls = urls.slice(indexOfFirstItem, indexOfLastItem);
  
  // Calcular número total de páginas
  const totalPages = Math.ceil(urls.length / itemsPerPage);
  
  // Função para mudar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Funções para navegação
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Buscar URLs do usuário
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/urls', {
          credentials: 'include', // Envia cookies de autenticação com a requisição
        });
        
        if (response.ok) {
          const data = await response.json();
          // Corrigir para processar o formato correto da resposta da API
          // A API retorna diretamente um array de URLs, não um objeto com propriedade urls
          setUrls(Array.isArray(data) ? data : []);
          
          // Log para debug
          console.log('URLs carregadas:', data);
        } else {
          console.error('Erro ao buscar URLs:', response.status);
          setError('Erro ao buscar suas URLs');
        }
      } catch (error) {
        console.error('Erro ao buscar URLs:', error);
        setError('Erro ao carregar suas URLs');
      } finally {
        setLoading(false);
      }
    };

    fetchUrls();
  }, []);

  // Copiar link para a área de transferência
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Feedback visual temporário (pode ser melhorado com um toast)
        alert('Link copiado para a área de transferência!');
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
      });
  };

  // Alternar visibilidade (público/privado)
  const toggleVisibility = async (url) => {
    if (updating) return;
    
    try {
      setUpdating(true);
      const newVisibility = !url.isPublic;
      
      const response = await fetch(`/api/urls`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Envia cookies de autenticação com a requisição
        body: JSON.stringify({ 
          urlCode: url.urlCode, 
          isPublic: newVisibility 
        }),
      });
      
      if (response.ok) {
        // Atualizar a lista local após a alteração bem-sucedida
        const updatedUrls = urls.map(item => 
          item.urlCode === url.urlCode 
            ? { ...item, isPublic: newVisibility } 
            : item
        );
        setUrls(updatedUrls);
      } else {
        console.error('Erro ao atualizar visibilidade:', response.status);
        alert('Erro ao alterar a visibilidade da URL');
      }
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
      alert('Erro ao alterar a visibilidade da URL');
    } finally {
      setUpdating(false);
    }
  };

  // Abrir modal de confirmação de exclusão
  const confirmDelete = (url) => {
    setUrlToDelete(url);
    setShowDeleteModal(true);
  };

  // Executar exclusão da URL
  const deleteUrl = async () => {
    if (!urlToDelete) return;
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/urls/${urlToDelete.urlCode}`, {
        method: 'DELETE',
        credentials: 'include', // Envia cookies de autenticação com a requisição
      });
      
      if (response.ok) {
        // Atualizar a lista após exclusão bem-sucedida
        const updatedUrls = urls.filter(url => url.urlCode !== urlToDelete.urlCode);
        setUrls(updatedUrls);
        setShowDeleteModal(false);
        
        // Ajustar a página atual se necessário após a exclusão
        if (currentUrls.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        console.error('Erro ao excluir URL:', response.status);
        alert('Erro ao excluir a URL');
      }
    } catch (error) {
      console.error('Erro ao excluir URL:', error);
      alert('Erro ao excluir a URL');
    } finally {
      setDeleting(false);
      setUrlToDelete(null);
    }
  };

  // Cancelar exclusão
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUrlToDelete(null);
  };

  if (loading) {
    return <LoadingState title="Minhas URLs" />;
  }

  if (error) {
    return <ErrorState error={error} title="Minhas URLs" />;
  }

  return (
    <DashboardLayout title="Minhas URLs">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Minhas URLs</h1>
      </div>

      {/* Container principal */}
      <div className="w-full mx-auto animate-fadeIn">
        {/* Cabeçalho com ações */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-dark-700 mb-6 transition-all hover:shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <div className="bg-[#131a35] dark:bg-[#6d7cef] p-3 rounded-lg mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Minhas URLs</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Gerencie todas as suas URLs encurtadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                href="/?showAdd=true"
                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nova URL
              </Link>
              
              <Link 
                href="/stats/all"
                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Ver estatísticas
              </Link>
            </div>
          </div>
        </div>

        {/* Lista de URLs */}
        {urls.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-md border border-gray-100 dark:border-dark-700 flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Nenhuma URL encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não criou nenhuma URL encurtada.
            </p>
            <Link 
              href="/"
              className="px-4 py-2 bg-[#131a35] dark:bg-[#6d7cef] text-white rounded-lg hover:bg-[#1a234a] dark:hover:bg-[#5a69d4] transition-colors text-sm font-medium"
            >
              Criar primeira URL
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                <thead className="bg-gray-50 dark:bg-dark-750">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      URL Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      URL Original
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Visibilidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Criada em
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                  {currentUrls.map((url) => (
                    <tr key={url.urlCode} className="hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-[#131a35]/10 dark:bg-[#6d7cef]/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-[#131a35] dark:text-[#6d7cef]">
                              {url.urlCode.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {url.urlCode}
                            </div>
                            <div 
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1" 
                              onClick={() => copyToClipboard(`${baseUrl}/${url.urlCode}`)}
                            >
                              <span>{baseUrl}/{url.urlCode}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {url.longUrl}
                        </div>
                        <a 
                          href={url.longUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline block mt-1 flex items-center gap-1"
                        >
                          <span>Visitar site original</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => toggleVisibility(url)}
                          disabled={updating}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center ${
                            url.isPublic 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40' 
                              : 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {url.isPublic ? (
                            <>
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Público</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                              <span>Privado</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(url.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(url.createdAt).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => copyToClipboard(`${baseUrl}/${url.urlCode}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Copiar link"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                          <Link 
                            href={`/stats/${url.urlCode}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            title="Ver estatísticas"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </Link>
                          <button 
                            onClick={() => confirmDelete(url)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Excluir URL"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            {urls.length > itemsPerPage && (
              <div className="bg-gray-50 dark:bg-dark-750 px-4 py-3 border-t border-gray-200 dark:border-dark-700 sm:px-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, urls.length)}</span> de <span className="font-medium">{urls.length}</span> resultados
                  </div>
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md border ${
                        currentPage === 1
                          ? 'border-gray-200 dark:border-dark-600 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`px-3.5 py-2 rounded-md border ${
                          currentPage === i + 1
                            ? 'bg-[#131a35] dark:bg-[#6d7cef] text-white border-[#131a35] dark:border-[#6d7cef]'
                            : 'border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md border ${
                        currentPage === totalPages
                          ? 'border-gray-200 dark:border-dark-600 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-dark-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Excluir URL
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Você tem certeza que deseja excluir a URL <span className="font-medium text-gray-800 dark:text-gray-200">{urlToDelete?.urlCode}</span>? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-750 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={deleteUrl}
                  disabled={deleting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    deleting ? 'bg-red-400 dark:bg-red-700' : 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600'
                  } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors`}
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-600 shadow-sm px-4 py-2 bg-white dark:bg-dark-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 