import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardThemeToggle from '../../components/DashboardThemeToggle';
import RequireAuth from '../../components/RequireAuth';
import { signOut, useSession } from 'next-auth/react';

export default function UrlsPage() {
  // Componente protegido com autenticação
  return (
    <RequireAuth>
      <UrlsDashboard />
    </RequireAuth>
  );
}

function UrlsDashboard() {
  const { data: session } = useSession();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [urlToEdit, setUrlToEdit] = useState(null);
  const [editAlias, setEditAlias] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Estado de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    async function fetchUrls() {
      try {
        setLoading(true);
        const response = await fetch('/api/urls');
        
        if (response.ok) {
          const data = await response.json();
          setUrls(data);
        } else {
          setError('Erro ao carregar URLs');
        }
      } catch (error) {
        console.error('Erro ao buscar URLs:', error);
        setError('Erro ao buscar URLs');
      } finally {
        setLoading(false);
      }
    }

    fetchUrls();
  }, []);

  // Função para copiar URL encurtada
  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopySuccess(id);
    
    setTimeout(() => {
      setCopySuccess(null);
    }, 2000);
  };

  // Função para preparar exclusão
  const prepareDelete = (url) => {
    setUrlToDelete(url);
    setShowDeleteModal(true);
  };

  // Função para confirmar exclusão
  const confirmDelete = async () => {
    if (!urlToDelete) return;
    
    try {
      const response = await fetch('/api/urls', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlCode: urlToDelete.urlCode }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove o item do estado local
        setUrls(prevUrls => prevUrls.filter(url => url.urlCode !== urlToDelete.urlCode));
        
        // Fecha o modal
        setShowDeleteModal(false);
        setUrlToDelete(null);
      } else {
        console.error('Erro ao excluir URL:', data.error);
        alert(`Erro ao excluir: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir URL:', error);
      alert('Ocorreu um erro ao tentar excluir a URL');
    }
  };

  // Função para ordenar URLs
  const handleSort = (field) => {
    if (sortBy === field) {
      // Se já está ordenando por este campo, inverte a ordem
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é um novo campo, define como padrão descendente
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filtragem e ordenação das URLs
  const filteredAndSortedUrls = urls
    .filter(url => 
      url.longUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.urlCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'clicks') {
        comparison = a.clicks - b.clicks;
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'urlCode') {
        comparison = a.urlCode.localeCompare(b.urlCode);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedUrls.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedUrls.length / itemsPerPage);

  // Trocar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Formatar data
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Função para preparar edição
  const prepareEdit = (url) => {
    setUrlToEdit(url);
    setEditAlias(url.urlCode);
    setShowEditModal(true);
  };

  // Função para confirmar edição
  const confirmEdit = async () => {
    if (!urlToEdit || !editAlias.trim()) return;
    
    // Valida o alias (apenas letras, números, hífens e sublinhados)
    if (!/^[a-zA-Z0-9-_]+$/.test(editAlias)) {
      alert('O apelido contém caracteres inválidos. Use apenas letras, números, hífens e sublinhados.');
      return;
    }
    
    try {
      // Se o alias não mudou, não faz nada
      if (editAlias === urlToEdit.urlCode) {
        setShowEditModal(false);
        setUrlToEdit(null);
        return;
      }
      
      const response = await fetch('/api/edit-url', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          oldUrlCode: urlToEdit.urlCode,
          newUrlCode: editAlias 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Atualiza o item no estado local
        setUrls(prevUrls => prevUrls.map(url => 
          url.urlCode === urlToEdit.urlCode 
            ? { ...url, urlCode: editAlias, shortUrl: url.shortUrl.replace(url.urlCode, editAlias) } 
            : url
        ));
        
        // Fecha o modal
        setShowEditModal(false);
        setUrlToEdit(null);
      } else {
        console.error('Erro ao editar URL:', data.error);
        alert(`Erro ao editar: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao editar URL:', error);
      alert('Ocorreu um erro ao tentar editar a URL');
    }
  };

  // Componente de perfil do usuário para o cabeçalho
  const UserProfile = () => {
    return (
      <div className="relative">
        <button 
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 focus:outline-none"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="w-8 h-8 rounded-full bg-[#131a35] dark:bg-[#131a35]/80 flex items-center justify-center text-white">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
            {session?.user?.name || 'Usuário'}
          </span>
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-md shadow-lg z-10 py-1 border border-gray-200 dark:border-dark-700">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-dark-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
            </div>
            
            <Link href="/auth/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
              Meu Perfil
            </Link>
            
            {session?.user?.isAdmin && (
              <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
                Gerenciar Usuários
              </Link>
            )}
            
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    );
  };

  // Substitua o cabeçalho existente por este
  const renderHeader = () => (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Minhas URLs</h1>
      <div className="flex items-center gap-3">
        <UserProfile />
      </div>
    </header>
  );

  if (loading) return (
    <div className="min-h-screen flex">
      <div className="w-60 bg-[#131a35] text-white p-6 flex flex-col">
        <div className="text-2xl font-bold mb-8 pb-4 border-b border-white/10">
          <span className="flex items-center">
            <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            URLShortner
          </span>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Início
          </Link>
          <Link href="/urls" className="flex items-center p-3 rounded-lg bg-[#1a234a]/70 font-medium">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Minhas URLs
          </Link>
          
          <Link href="/auth/profile" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Meu Perfil
          </Link>
          
          {session?.user?.isAdmin && (
            <Link href="/admin/users" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Gerenciar Usuários
            </Link>
          )}
        </nav>
        <div className="mt-auto pt-8 flex justify-center">
          <DashboardThemeToggle />
        </div>
      </div>
      <div className="flex-1 bg-gray-50 dark:bg-dark-900 p-8">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-dark-700 border-t-primary-400 dark:border-t-primary-400 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando URLs...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex">
      <div className="w-60 bg-[#131a35] text-white p-6 flex flex-col">
        <div className="text-2xl font-bold mb-8 pb-4 border-b border-white/10">
          <span className="flex items-center">
            <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            URLShortner
          </span>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Início
          </Link>
          <Link href="/urls" className="flex items-center p-3 rounded-lg bg-[#1a234a]/70 font-medium">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Minhas URLs
          </Link>
          
          <Link href="/auth/profile" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Meu Perfil
          </Link>
          
          {session?.user?.isAdmin && (
            <Link href="/admin/users" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Gerenciar Usuários
            </Link>
          )}
        </nav>
        <div className="mt-auto pt-8 flex justify-center">
          <DashboardThemeToggle />
        </div>
      </div>
      <div className="flex-1 bg-gray-50 dark:bg-dark-900 p-8">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="text-4xl mb-4 text-red-500">❌</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Erro</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Minhas URLs | Encurtador de URL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="flex flex-1">
        <div className="w-60 bg-[#131a35] text-white p-6 flex flex-col">
          <div className="text-2xl font-bold mb-8 pb-4 border-b border-white/10">
            <span className="flex items-center">
              <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              URLShortner
            </span>
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </Link>
            <Link href="/urls" className="flex items-center p-3 rounded-lg bg-[#1a234a]/70 font-medium">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Minhas URLs
            </Link>
            
            <Link href="/auth/profile" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Meu Perfil
            </Link>
            
            {session?.user?.isAdmin && (
              <Link href="/admin/users" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Gerenciar Usuários
              </Link>
            )}
          </nav>
          <div className="mt-auto pt-8 flex justify-center">
            <DashboardThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-900">
          <div className="flex-1 p-8">
            {renderHeader()}

            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative w-full md:w-auto md:flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar URLs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-4 rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-500"
                />
                {searchTerm && (
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" 
                    onClick={() => setSearchTerm('')}
                    aria-label="Limpar busca"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Ordenar por:</span>
                <div className="flex gap-1">
                  <button 
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      sortBy === 'createdAt' 
                        ? 'bg-[#131a35] text-white border-[#131a35] dark:bg-[#131a35] dark:border-[#131a35]' 
                        : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                    onClick={() => handleSort('createdAt')}
                  >
                    Data {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      sortBy === 'clicks' 
                        ? 'bg-[#131a35] text-white border-[#131a35] dark:bg-[#131a35] dark:border-[#131a35]' 
                        : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                    onClick={() => handleSort('clicks')}
                  >
                    Cliques {sortBy === 'clicks' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      sortBy === 'urlCode' 
                        ? 'bg-[#131a35] text-white border-[#131a35] dark:bg-[#131a35] dark:border-[#131a35]' 
                        : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                    onClick={() => handleSort('urlCode')}
                  >
                    Código {sortBy === 'urlCode' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 overflow-hidden">
              {filteredAndSortedUrls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  {searchTerm ? (
                    <>
                      <div className="text-5xl mb-4">🔍</div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Nenhum resultado encontrado</h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Sua busca por "{searchTerm}" não retornou resultados.</p>
                      <button 
                        className="px-4 py-2 bg-[#131a35] hover:bg-[#1a234a] dark:bg-[#131a35] dark:hover:bg-[#1a234a] text-white rounded-lg transition-colors font-medium"
                        onClick={() => setSearchTerm('')}
                      >
                        Limpar busca
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl mb-4">🔗</div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Nenhuma URL encontrada</h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Você ainda não criou nenhuma URL encurtada.</p>
                      <Link 
                        href="/" 
                        className="px-4 py-2 bg-[#131a35] hover:bg-[#1a234a] dark:bg-[#131a35] dark:hover:bg-[#1a234a] text-white rounded-lg transition-colors font-medium"
                      >
                        Criar minha primeira URL
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">URL Encurtada</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">URL Original</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Cliques</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Data de Criação</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                        {currentItems.map((url) => (
                          <tr key={url.urlCode} className="hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#131a35]/10 dark:bg-[#131a35]/20 text-[#131a35] dark:text-white mr-2">
                                  {url.urlCode}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 text-sm truncate max-w-[200px]">{url.shortUrl}</span>
                                <button 
                                  className={`ml-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 ${copySuccess === url._id ? 'text-green-500 dark:text-green-400' : ''}`}
                                  onClick={() => copyToClipboard(url.shortUrl, url._id)}
                                  title="Copiar URL"
                                >
                                  {copySuccess === url._id ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="text-gray-700 dark:text-gray-300 text-sm truncate max-w-[300px]">{url.longUrl}</span>
                                <a 
                                  href={url.longUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="ml-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
                                  title="Visitar URL"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-300">
                                {url.clicks}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              {formatDate(url.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Link 
                                  href={`/stats/${url.urlCode}`} 
                                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
                                  title="Ver estatísticas"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </Link>
                                <button 
                                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                                  title="Editar URL"
                                  onClick={() => prepareEdit(url)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                  title="Excluir URL"
                                  onClick={() => prepareDelete(url)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-750">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => paginate(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Próxima
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                            <span className="font-medium">{Math.min(indexOfLastItem, filteredAndSortedUrls.length)}</span> de{' '}
                            <span className="font-medium">{filteredAndSortedUrls.length}</span> resultados
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => paginate(1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Primeira</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => paginate(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Anterior</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Página {currentPage} de {totalPages}
                            </div>
                            
                            <button
                              onClick={() => paginate(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Próxima</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => paginate(totalPages)}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Última</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 py-8 px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-center items-center">
                <div className="flex items-center space-x-1 text-[#131a35] dark:text-[#131a35]/80">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    © 2025 URLShortner - Encurtador de URLs
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowDeleteModal(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-75 dark:bg-black dark:opacity-80"></div>
            </div>

            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-dark-800 shadow-xl rounded-lg">
              <div className="mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Confirmar Exclusão
                </h3>
              </div>
              <div className="mt-2 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Tem certeza que deseja excluir a URL <span className="font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">{urlToDelete?.urlCode}</span>?
                </p>
                <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 border border-transparent rounded-md shadow-sm focus:outline-none"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowEditModal(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-75 dark:bg-black dark:opacity-80"></div>
            </div>

            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-dark-800 shadow-xl rounded-lg">
              <div className="mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Editar URL
                </h3>
              </div>
              <div className="mt-2 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Edite o apelido da sua URL encurtada.
                </p>
                <div className="mb-4">
                  <label htmlFor="alias" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apelido
                  </label>
                  <input
                    type="text"
                    id="alias"
                    value={editAlias}
                    onChange={(e) => setEditAlias(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                    placeholder="Novo apelido"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  URL original: <span className="font-medium">{urlToEdit?.longUrl}</span>
                </p>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmEdit} 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 border border-transparent rounded-md shadow-sm focus:outline-none"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 