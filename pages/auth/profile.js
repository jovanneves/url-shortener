import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RequireAuth from '../../components/RequireAuth';
import DashboardThemeToggle from '../../components/DashboardThemeToggle';

export default function Profile() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));
      
      // Verificar se a conta está pendente
      if (session.user.status === 'pendente') {
        setPendingMessage('Sua conta está pendente de aprovação por um administrador.');
      } else if (session.user.status === 'bloqueado') {
        setPendingMessage('Sua conta está bloqueada. Entre em contato com o administrador.');
      } else {
        setPendingMessage('');
      }
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validação de dados
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar perfil');
      }

      setSuccess('Perfil atualizado com sucesso!');
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao atualizar o perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validação de senhas
      if (!formData.currentPassword) {
        throw new Error('A senha atual é obrigatória');
      }

      if (formData.newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao alterar senha');
      }

      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setSuccess('Senha alterada com sucesso!');
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao alterar a senha');
    } finally {
      setLoading(false);
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
            {session.user.isAdmin && (
              <Link href="/admin/users" className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
                Gerenciar Usuários
              </Link>
            )}
            <button 
              onClick={() => signOut()}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700"
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Meu Perfil</h1>
      <div className="flex items-center gap-3">
        <UserProfile />
      </div>
    </header>
  );

  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col">
        <Head>
          <title>Meu Perfil | Encurtador de URL</title>
          <meta name="description" content="Gerencie seu perfil" />
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
              <Link href="/auth/profile" className="flex items-center p-3 rounded-lg bg-[#1a234a]/70 font-medium">
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

          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-900">
            <div className="flex-1 p-8">
              {renderHeader()}

              {pendingMessage && (
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-md">
                  {pendingMessage}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-md">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formulário de Perfil */}
                <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Informações de Perfil</h2>
                  
                  <form onSubmit={handleProfileUpdate}>
                    <div className="mb-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white bg-gray-50 dark:bg-dark-600"
                        disabled={true}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">O email não pode ser alterado</p>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status da Conta
                      </label>
                      <div className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-gray-50 dark:bg-dark-600 text-gray-700 dark:text-gray-300">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${session?.user?.status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                            session?.user?.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {session?.user?.status === 'ativo' ? 'Ativo' : 
                           session?.user?.status === 'pendente' ? 'Pendente' : 'Bloqueado'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#131a35] hover:bg-[#131a35]/90 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#131a35]/50 transition-colors disabled:opacity-50"
                        disabled={loading || session?.user?.status !== 'ativo'}
                      >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* Formulário de Alteração de Senha */}
                <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Alterar Senha</h2>
                  
                  <form onSubmit={handlePasswordChange}>
                    <div className="mb-4">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Senha Atual
                      </label>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                        disabled={loading || session?.user?.status !== 'ativo'}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nova Senha
                      </label>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                        disabled={loading || session?.user?.status !== 'ativo'}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                        disabled={loading || session?.user?.status !== 'ativo'}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#131a35] hover:bg-[#131a35]/90 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#131a35]/50 transition-colors disabled:opacity-50"
                        disabled={loading || session?.user?.status !== 'ativo'}
                      >
                        {loading ? 'Alterando...' : 'Alterar Senha'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
} 