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
  // Estados para o modal de edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [urlToEdit, setUrlToEdit] = useState(null);
  const [newUrlCode, setNewUrlCode] = useState('');
  const [newLongUrl, setNewLongUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [urlFilter, setUrlFilter] = useState('all');

  useEffect(() => {
    // Define a URL base apenas quando executado no navegador
    setBaseUrl(window.location.origin);
  }, []);

  const filteredUrls = urls.filter(url => {
    if (urlFilter === 'all') return true;
    if (urlFilter === 'mine') return url.userId === session?.user?.id;
    if (urlFilter === 'others') return url.userId !== session?.user?.id;
    return true;
  });

  // Calcular índices dos itens a exibir na página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUrls = filteredUrls.slice(indexOfFirstItem, indexOfLastItem);
  
  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredUrls.length / itemsPerPage);
  
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
      const response = await fetch('/api/urls', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ urlCode: urlToDelete.urlCode })
      });
      
      if (response.ok) {
        // Atualizar a lista após exclusão bem-sucedida
        setUrls(prevUrls => prevUrls.filter(url => url.urlCode !== urlToDelete.urlCode));
        
        // Ajustar a página atual se necessário após a exclusão
        if (currentUrls.length === 1 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
      } else {
        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            console.error('Erro ao excluir URL:', data.error);
          } catch (e) {
            console.error('Erro ao processar resposta JSON:', e);
          }
        }
        console.error('Erro ao excluir URL:', response.status);
      }
    } catch (error) {
      console.error('Erro ao excluir URL:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setUrlToDelete(null);
    }
  };

  // Cancelar exclusão
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUrlToDelete(null);
  };

  // Função para abrir o modal de edição
  const openEditModal = (url) => {
    setUrlToEdit(url);
    setNewUrlCode(url.urlCode);
    setNewLongUrl(url.longUrl);
    setIsPublic(url.isPublic);
    setShowEditModal(true);
  };

  // Função para fechar o modal de edição
  const closeEditModal = () => {
    setShowEditModal(false);
    setUrlToEdit(null);
    setNewUrlCode('');
    setNewLongUrl('');
    setIsPublic(true);
    setSaving(false);
    setSaveError('');
  };

  // No modal de edição, ajustar o botão Cancelar
  const handleCancel = () => {
    closeEditModal();
    router.push('/urls');
  };

  // Função para salvar as alterações
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    try {
      const response = await fetch('/api/edit-url', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldUrlCode: urlToEdit.urlCode,
          newUrlCode: newUrlCode.trim(),
          longUrl: newLongUrl.trim(),
          isPublic
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar alterações');
      }

      // Atualizar a lista de URLs
      const updatedUrls = urls.map(url => 
        url.urlCode === urlToEdit.urlCode 
          ? { ...url, urlCode: newUrlCode.trim(), longUrl: newLongUrl.trim(), isPublic }
          : url
      );
      setUrls(updatedUrls);
      closeEditModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Minhas URLs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Gerencie todas as suas URLs encurtadas
          </p>
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
        </div>
      </div>

      {/* Conteúdo principal */}
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

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="urlFilter"
                    value="all"
                    checked={urlFilter === 'all'}
                    onChange={() => setUrlFilter('all')}
                    className="form-radio h-4 w-4 text-[#131a35] dark:text-[#6d7cef] focus:ring-[#131a35] dark:focus:ring-[#6d7cef]"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Todas</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="urlFilter"
                    value="mine"
                    checked={urlFilter === 'mine'}
                    onChange={() => setUrlFilter('mine')}
                    className="form-radio h-4 w-4 text-[#131a35] dark:text-[#6d7cef] focus:ring-[#131a35] dark:focus:ring-[#6d7cef]"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Minhas URLs</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="urlFilter"
                    value="others"
                    checked={urlFilter === 'others'}
                    onChange={() => setUrlFilter('others')}
                    className="form-radio h-4 w-4 text-[#131a35] dark:text-[#6d7cef] focus:ring-[#131a35] dark:focus:ring-[#6d7cef]"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Outras URLs</span>
                </label>
              </div>

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
        {filteredUrls.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-md border border-gray-100 dark:border-dark-700 flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Nenhuma URL encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não criou nenhuma URL encurtada.
            </p>
            <Link 
              href="/?showAdd=true"
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">
                      URL Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">
                      URL Original
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">
                      Visibilidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">
                      Criada em
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                  {currentUrls.map((url) => (
                    <tr key={url.urlCode} className="hover:bg-[#131a35]/5 dark:hover:bg-[#6d7cef]/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap w-1/5">
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
                      <td className="px-6 py-4 w-2/5">
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
                      <td className="px-6 py-4 whitespace-nowrap w-1/5">
                        <button 
                          onClick={() => toggleVisibility(url)}
                          disabled={updating || url.userId !== session?.user?.id}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center ${
                            url.isPublic 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40' 
                              : 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                          } ${url.userId !== session?.user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <td className="px-6 py-4 whitespace-nowrap w-1/5">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(url.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(url.createdAt).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-1/5">
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
                          {url.userId === session?.user?.id && (
                            <>
                              <button
                                onClick={() => openEditModal(url)}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Editar URL"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => confirmDelete(url)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Excluir URL"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
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
            
            <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
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

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white dark:bg-dark-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="bg-white dark:bg-dark-800 rounded-xl p-8 border border-gray-200 dark:border-dark-600 shadow-md">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Editar URL encurtada</h3>
                      <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="editLongUrl">
                            URL original
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="flex shadow-sm rounded-md">
                            <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 sm:text-sm">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </span>
                            <input
                              id="editLongUrl"
                              type="url"
                              placeholder="https://exemplo.com/pagina-com-url-muito-longa..."
                              value={newLongUrl}
                              onChange={(e) => setNewLongUrl(e.target.value)}
                              required
                              pattern="https?://.+"
                              title="Digite uma URL válida começando com http:// ou https://"
                              className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-md focus:ring-2 focus:ring-[#131a35] focus:border-[#131a35] text-base border border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 text-gray-800 dark:text-white"
                            />
                          </div>
                          {!newLongUrl && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              A URL original é obrigatória
                            </p>
                          )}
                        </div>
                        
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="editUrlCode">
                            Apelido personalizado
                            <span className="text-gray-400 ml-1">(opcional)</span>
                          </label>
                          <div className="flex shadow-sm rounded-md">
                            <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 text-sm">
                              {baseUrl}/
                            </span>
                            <input
                              id="editUrlCode"
                              type="text"
                              placeholder="meu-link"
                              value={newUrlCode}
                              onChange={(e) => setNewUrlCode(e.target.value)}
                              pattern="^[a-zA-Z0-9-_]+$"
                              title="Use apenas letras, números, hífens e sublinhados"
                              className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-md focus:ring-2 focus:ring-[#131a35] focus:border-[#131a35] text-base border border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 text-gray-800 dark:text-white"
                            />
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Use apenas letras, números, hífens e sublinhados
                          </p>
                        </div>

                        {/* Campo de visibilidade - mostrado apenas para usuários logados */}
                        {session?.user && (
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                              Visibilidade da URL
                              <span className="text-gray-400 ml-1">(opcional)</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer" onClick={() => setIsPublic(true)}>
                                <input
                                  id="public"
                                  name="visibility"
                                  type="radio"
                                  checked={isPublic}
                                  onChange={() => setIsPublic(true)}
                                  className="h-4 w-4 mt-1 text-[#131a35] dark:text-[#6d7cef] focus:ring-[#131a35] dark:focus:ring-[#6d7cef] border-gray-300 dark:border-dark-600"
                                />
                                <label htmlFor="public" className="ml-3 block">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pública</span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Qualquer pessoa pode acessar e ver as estatísticas
                                  </p>
                                </label>
                              </div>
                              <div className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer" onClick={() => setIsPublic(false)}>
                                <input
                                  id="private"
                                  name="visibility"
                                  type="radio"
                                  checked={!isPublic}
                                  onChange={() => setIsPublic(false)}
                                  className="h-4 w-4 mt-1 text-[#131a35] dark:text-[#6d7cef] focus:ring-[#131a35] dark:focus:ring-[#6d7cef] border-gray-300 dark:border-dark-600"
                                />
                                <label htmlFor="private" className="ml-3 block">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Privada</span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Apenas você pode ver as estatísticas
                                  </p>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {saveError && (
                          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                  Erro ao salvar
                                </h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                  {saveError}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-4 pt-4">
                          <button 
                            type="button" 
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-6 py-3 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-700 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-dark-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#131a35] transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            disabled={saving || !newLongUrl} 
                            className="px-6 py-3 bg-[#131a35] hover:bg-[#1a234a] text-white rounded-md shadow-sm font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#131a35] disabled:opacity-60 disabled:cursor-not-allowed flex items-center transition-colors"
                          >
                            {saving ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processando...
                              </>
                            ) : (
                              "Salvar Alterações"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 