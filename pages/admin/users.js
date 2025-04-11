import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import RequireAdmin from '../../components/RequireAdmin';
import DashboardThemeToggle from '../../components/DashboardThemeToggle';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Erro ao carregar usuários');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message || 'Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    }
    
    if (session?.user?.isAdmin) {
      loadUsers();
    }
  }, [session]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setSuccessMessage('');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }

      // Atualizar a lista localmente
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
      
      setSuccessMessage(`Status do usuário atualizado para ${newStatus}`);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar usuário');
    }
  };

  const toggleAdmin = async (userId, currentIsAdmin) => {
    try {
      setSuccessMessage('');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar permissões');
      }

      // Atualizar a lista localmente
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isAdmin: !user.isAdmin } : user
      ));
      
      setSuccessMessage(`Permissões de administrador ${!currentIsAdmin ? 'concedidas' : 'removidas'}`);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar permissões');
    }
  };

  // Componente de perfil do usuário com menu de opções
  const UserProfile = () => {
    if (!session) return null;
    
    return (
      <div className="relative">
        <button 
          className="flex items-center space-x-2 focus:outline-none"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="w-8 h-8 rounded-full bg-[#131a35] flex items-center justify-center text-white font-medium text-sm">
            {session.user.name ? session.user.name[0].toUpperCase() : "?"}
          </div>
          <span className="text-gray-800 dark:text-white hidden sm:inline">{session.user.name || session.user.email}</span>
          <svg className="w-4 h-4 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 shadow-lg rounded-lg py-1 z-10 border border-gray-200 dark:border-dark-700">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-dark-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{session.user.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user.email}</div>
            </div>
            <Link 
              href="/auth/profile"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Meu Perfil
            </Link>
            <button 
              onClick={() => signOut()}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    );
  };

  // Componente do cabeçalho
  const renderHeader = () => (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerênciar Contas</h1>
      <div className="flex items-center gap-3">
        <UserProfile />
      </div>
    </header>
  );

  return (
    <RequireAdmin>
      <div className="min-h-screen flex flex-col">
        <Head>
          <title>Gerênciar Contas | Encurtador de URL</title>
          <meta name="description" content="Gerencie contas de usuários da plataforma" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-60 bg-[#131a35] text-white p-6 flex flex-col">
            <div className="text-2xl font-bold mb-8 pb-4 border-b border-white/10">
              <span className="flex items-center">
                <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                URLShortener
              </span>
            </div>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Início
              </Link>
              <Link href="/urls" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Minhas URLs
              </Link>
              
              <Link href="/stats/all" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Estatísticas
              </Link>
              
              <Link href="/auth/profile" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Meu Perfil
              </Link>
              
              {session?.user?.isAdmin && (
                <Link href="/admin/users" className="flex items-center p-3 rounded-lg bg-[#1a234a]/70 font-medium">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Gerênciar Contas
                </Link>
              )}
            </nav>
            <div className="mt-auto pt-8 flex justify-center">
              <DashboardThemeToggle />
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-900">
            <div className="flex-1 p-8">
              {renderHeader()}

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700 dark:text-green-200">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Adicionar seção de estatísticas */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-dark-700 mb-6 transition-all hover:shadow-xl">
                <div className="flex items-center">
                  <div className="bg-[#131a35] dark:bg-[#6d7cef] p-3 rounded-lg mr-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gerênciar Contas</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Visualize todas as contas de usuários
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Link 
                      href="/auth/profile"
                      className="px-4 py-2 bg-[#131a35] dark:bg-[#6d7cef] text-white rounded-lg hover:bg-[#1a234a] dark:hover:bg-[#5a69d4] transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Meu Perfil
                    </Link>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-gray-200 dark:border-dark-700 border-t-primary-400 dark:border-t-primary-400 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                      <thead className="bg-gray-50 dark:bg-dark-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Nome
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Data de Cadastro
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Administrador
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${user.status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                  user.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {user.status === 'ativo' ? 'Ativo' : 
                                user.status === 'pendente' ? 'Pendente' : 'Bloqueado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${user.isAdmin ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {user.isAdmin ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {/* Ações para usuários pendentes */}
                                {user.status === 'pendente' && (
                                  <>
                                    <button 
                                      onClick={() => handleStatusChange(user._id, 'ativo')}
                                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                    >
                                      Aprovar
                                    </button>
                                    <button 
                                      onClick={() => handleStatusChange(user._id, 'bloqueado')}
                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    >
                                      Rejeitar
                                    </button>
                                  </>
                                )}
                                
                                {/* Ações para usuários ativos */}
                                {user.status === 'ativo' && (
                                  <button 
                                    onClick={() => handleStatusChange(user._id, 'bloqueado')}
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                  >
                                    Bloquear
                                  </button>
                                )}
                                
                                {/* Ações para usuários bloqueados */}
                                {user.status === 'bloqueado' && (
                                  <button 
                                    onClick={() => handleStatusChange(user._id, 'ativo')}
                                    className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                  >
                                    Desbloquear
                                  </button>
                                )}
                                
                                {/* Botão para tornar admin ou remover privilégio */}
                                {session?.user?.id !== user._id && (
                                  <button 
                                    onClick={() => toggleAdmin(user._id, user.isAdmin)}
                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 ml-2"
                                  >
                                    {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
} 