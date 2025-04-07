import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import { useSession } from 'next-auth/react';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [urlCode, setUrlCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [alias, setAlias] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchAlias, setSearchAlias] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [shakeError, setShakeError] = useState(false);
  const { data: session } = useSession();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setCopySuccess(false);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          longUrl,
          alias: alias.trim() || undefined,
          isPublic
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao encurtar a URL');
      }

      setShortUrl(data.urlCode);
      setUrlCode(data.urlCode);
      setSuccess(true);
      setShowAddForm(false);

      // Limpar o input após sucesso
      if (!error) {
        setTimeout(() => {
          setLongUrl('');
          setAlias('');
          setIsPublic(true);
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    const searchTerm = searchAlias.trim();
    if (!searchTerm) return;
    
    // Limpar timeout anterior se existir
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      setErrorTimeout(null);
    }
    
    setIsSearching(true);
    setSearchError(false);
    setShakeError(false);
    
    try {
      console.log('Buscando URL:', searchTerm);
      
      // Adiciona timestamp para evitar cache do navegador e forceRefresh=true para buscar direto do banco
      const response = await fetch(`/api/check/${searchTerm}?stats=false&t=${Date.now()}&forceRefresh=true`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resposta da busca:', data);
        
        if (data.exists) {
          // URL existe, abre em nova aba
          window.open(data.longUrl, '_blank');
        } else {
          // URL não existe, mostrar erro
          setSearchError(true);
          setShakeError(true);
          
          // Remove a classe de tremor após a animação terminar
          setTimeout(() => {
            setShakeError(false);
          }, 820); // Um pouco mais longo que a duração da animação
          
          const timeout = setTimeout(() => setSearchError(false), 4000);
          setErrorTimeout(timeout);
        }
      } else {
        // Erro na requisição, mostrar erro
        console.error('Erro na busca:', await response.text());
        setSearchError(true);
        setShakeError(true);
        
        // Remove a classe de tremor após a animação terminar
        setTimeout(() => {
          setShakeError(false);
        }, 820);
        
        const timeout = setTimeout(() => setSearchError(false), 4000);
        setErrorTimeout(timeout);
      }
    } catch (err) {
      console.error(err);
      setSearchError(true);
      setShakeError(true);
      
      // Remove a classe de tremor após a animação terminar
      setTimeout(() => {
        setShakeError(false);
      }, 820);
      
      const timeout = setTimeout(() => setSearchError(false), 4000);
      setErrorTimeout(timeout);
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = () => {
    // Reconstruir a URL completa
    const fullUrl = `${window.location.protocol}//${window.location.host}/${shortUrl}`;
    
    // Usando a API moderna para copiar
    try {
      navigator.clipboard.writeText(fullUrl)
        .then(() => {
          setCopySuccess(true);
          setShowTooltip(true);
          
          setTimeout(() => {
            setShowTooltip(false);
          }, 2000);
        })
        .catch(err => {
          console.error('Erro ao copiar: ', err);
          // Fallback em caso de falha
          const textArea = document.createElement('textarea');
          textArea.value = fullUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopySuccess(true);
          setShowTooltip(true);
          
          setTimeout(() => {
            setShowTooltip(false);
          }, 2000);
        });
    } catch (err) {
      console.error('Erro ao copiar: ', err);
      // Fallback em navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setShowTooltip(true);
      
      setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Head>
        <title>URL Shortener</title>
        <meta name="description" content="Encurtador de URL criado com Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header com gradiente */}
      <header className="bg-gradient-to-r from-[#131a35] to-[#1a234a] shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                URL Shortener
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/urls" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#293366]/30 border border-[#ffffff20] rounded-md hover:bg-[#293366]/50 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Minhas URLs
              </Link>
              
              {session?.user?.isAdmin && (
                <Link href="/admin/users" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#293366]/30 border border-[#ffffff20] rounded-md hover:bg-[#293366]/50 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Admin
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12">
          {/* Seção principal com design de cartão */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-12 px-8 sm:px-16">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-gray-800 dark:text-white">
                  Encurte suas URLs
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Transforme links longos em URLs curtas e fáceis de compartilhar
                </p>
              </div>
              
              {/* Componentes interativos */}
              <div className="max-w-4xl mx-auto">
                {/* Search Box - quando não está no formulário de adição nem no resultado */}
                {!showAddForm && !success && (
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-6 shadow-inner mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Digite o apelido da URL..."
                          value={searchAlias}
                          onChange={(e) => setSearchAlias(e.target.value)}
                          className={`h-14 rounded-lg pl-12 pr-12 w-full shadow-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-dark-800 border transition-all duration-200 ${
                            searchError 
                              ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/40 dark:ring-red-500/40 bg-red-50 dark:bg-red-900/10' 
                              : 'border-gray-300 dark:border-dark-600 focus:ring-2 focus:ring-[#131a35] focus:border-transparent'
                          } ${shakeError ? 'animate-shake' : ''}`}
                          autoFocus
                        />
                        {searchAlias && (
                          <button 
                            type="button" 
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={() => setSearchAlias('')}
                            aria-label="Limpar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        {searchError && (
                          <div className="absolute top-full left-0 mt-1.5 text-xs text-red-400 dark:text-red-300 font-medium flex items-center opacity-90 transition-opacity duration-300 ease-in-out">
                            <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            URL não encontrada
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          type="submit"
                          disabled={isSearching}
                          className="h-14 w-14 rounded-lg bg-white dark:bg-dark-800 text-[#131a35] dark:text-[#131a35]/80 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 border border-gray-300 dark:border-dark-600"
                          aria-label="Buscar URL"
                        >
                          {isSearching ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          )}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowAddForm(true)}
                          className="h-14 w-14 rounded-lg bg-[#131a35] text-white hover:bg-[#1a234a] dark:bg-[#131a35] dark:hover:bg-[#1a234a] flex items-center justify-center transition-colors duration-200"
                          aria-label="Criar nova URL"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Form */}
                {showAddForm && (
                  <div className="bg-white dark:bg-dark-800 rounded-xl p-8 border border-gray-200 dark:border-dark-600 shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Criar nova URL encurtada</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="longUrl">
                          URL original
                        </label>
                        <div className="flex shadow-sm rounded-md">
                          <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 sm:text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </span>
                          <input
                            id="longUrl"
                            type="url"
                            placeholder="https://exemplo.com/pagina-com-url-muito-longa..."
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            required
                            className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-md focus:ring-2 focus:ring-[#131a35] focus:border-[#131a35] text-base border border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 text-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="alias">
                          Apelido personalizado (opcional)
                        </label>
                        <div className="flex shadow-sm rounded-md">
                          <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 dark:border-dark-600 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 text-sm">
                            {window.location.host}/
                          </span>
                          <input
                            id="alias"
                            type="text"
                            placeholder="meu-link"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-md focus:ring-2 focus:ring-[#131a35] focus:border-[#131a35] text-base border border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 text-gray-800 dark:text-white"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Use apenas letras, números, hífens e sublinhados.</p>
                      </div>
                      
                      {/* Campo de visibilidade - mostrado apenas para usuários logados */}
                      {session?.user && (
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Visibilidade da URL
                          </label>
                          <div className="flex space-x-4">
                            <div className="flex items-center">
                              <input
                                id="public"
                                name="visibility"
                                type="radio"
                                checked={isPublic}
                                onChange={() => setIsPublic(true)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <label htmlFor="public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Pública
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Qualquer pessoa pode acessar e ver as estatísticas
                                </p>
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="private"
                                name="visibility"
                                type="radio"
                                checked={!isPublic}
                                onChange={() => setIsPublic(false)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <label htmlFor="private" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Privada
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Apenas você pode ver as estatísticas
                                </p>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-4 pt-4">
                        <button 
                          type="button" 
                          onClick={() => setShowAddForm(false)}
                          className="px-6 py-3 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-700 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-dark-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#131a35]"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading || !longUrl} 
                          className="px-6 py-3 bg-[#131a35] hover:bg-[#1a234a] text-white rounded-md shadow-sm font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#131a35] disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processando...
                            </>
                          ) : (
                            "Encurtar URL"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </section>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg overflow-hidden border border-red-100 dark:border-red-900/30 shadow-sm mx-8 mb-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Result */}
            {success && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md overflow-hidden border border-green-100 dark:border-green-900/30 mx-8 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-100 dark:border-green-900/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-400">URL encurtada com sucesso!</h3>
                    <span className="bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-400 p-1.5 rounded-full">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </div>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="flex items-center rounded-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
                    <input 
                      type="text" 
                      value={`${window.location.protocol}//${window.location.host}/${shortUrl}`} 
                      readOnly 
                      className="flex-grow px-4 py-3 focus:outline-none text-gray-700 dark:text-gray-200 font-medium bg-white dark:bg-dark-700 text-base" 
                      onClick={(e) => e.target.select()} 
                    />
                    <button 
                      onClick={copyToClipboard} 
                      className={`px-4 py-3 flex items-center justify-center transition-colors ${copySuccess ? 'bg-green-500 text-white dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700' : 'bg-[#131a35] text-white hover:bg-[#1a234a]'}`}
                    >
                      {copySuccess ? (
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copiado!
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Copiar
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link 
                      href={`/stats/${urlCode}`}
                      className="flex-1 px-4 py-2 bg-[#131a35] text-white rounded-md shadow-sm font-medium text-sm flex items-center justify-center hover:bg-[#1a234a] transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Ver estatísticas
                    </Link>
                    <a 
                      href={`${window.location.protocol}//${window.location.host}/${shortUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 px-4 py-2 bg-white dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm font-medium text-sm border border-gray-300 dark:border-dark-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Testar URL
                    </a>
                    <button 
                      onClick={() => {
                        setLongUrl('');
                        setAlias('');
                        setSuccess(false);
                        setShowAddForm(true);
                      }} 
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-md shadow-sm font-medium text-sm flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nova URL
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 