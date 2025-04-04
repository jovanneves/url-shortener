import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchAlias, setSearchAlias] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [errorTimeout, setErrorTimeout] = useState(null);

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
          alias: alias.trim() || undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao encurtar a URL');
      }

      setShortUrl(data.shortUrl);
      setUrlCode(data.urlCode);
      setSuccess(true);
      setShowAddForm(false);

      // Limpar o input após sucesso
      if (!error) {
        setTimeout(() => {
          setLongUrl('');
          setAlias('');
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
    
    try {
      const baseUrl = window.location.host;
      const urlToCheck = `${baseUrl}/${searchTerm}`;
      
      const response = await fetch(`/api/check/${searchTerm}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          // URL existe, abre em nova aba
          window.open(data.longUrl, '_blank');
        } else {
          // URL não existe, mostrar erro
          setSearchError(true);
          const timeout = setTimeout(() => setSearchError(false), 4000);
          setErrorTimeout(timeout);
        }
      } else {
        // Erro na requisição, mostrar erro
        setSearchError(true);
        const timeout = setTimeout(() => setSearchError(false), 4000);
        setErrorTimeout(timeout);
      }
    } catch (err) {
      console.error(err);
      setSearchError(true);
      const timeout = setTimeout(() => setSearchError(false), 4000);
      setErrorTimeout(timeout);
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopySuccess(true);
    setShowTooltip(true);
    
    setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
      <Head>
        <title>Encurtador de URL</title>
        <meta name="description" content="Encurtador de URL criado com Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Navbar */}
          <header className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#131a35] dark:text-[#131a35]/80 flex items-center">
                <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                URLShortner
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/urls" className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-600 hover:text-[#131a35] dark:hover:text-[#131a35]/80 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Minhas URLs
              </Link>
            </nav>
          </header>

          {/* Hero Section */}
          <section className="relative py-12 mb-12">
            <div className="absolute inset-0 bg-[#131a35] rounded-xl shadow-md transform -skew-y-2 -z-10" aria-hidden="true" />
            <div className="relative text-center py-10 px-4 sm:py-12 sm:px-6 lg:px-8 text-white">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#131a35] dark:text-white">
                Shorten URL
              </h1>
              
              {/* Search Box */}
              {!showAddForm && !success && (
                <div className="max-w-3xl mx-auto mb-6">
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Digite o apelido da URL..."
                        value={searchAlias}
                        onChange={(e) => setSearchAlias(e.target.value)}
                        className={`h-14 rounded-lg pl-5 pr-12 w-full text-gray-800 dark:text-gray-200 dark:bg-dark-700 transition-all duration-200 ${
                          searchError 
                            ? 'border-red-300 dark:border-red-500/50 ring-1 ring-red-300 dark:ring-red-500/50' 
                            : 'border-white dark:border-dark-600 focus:ring-2 focus:ring-[#131a35] focus:border-transparent'
                        }`}
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
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="h-14 min-w-[60px] rounded-lg px-4 bg-white dark:bg-dark-800 text-[#131a35] dark:text-[#131a35]/80 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-dark-600"
                    >
                      {isSearching ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="h-14 min-w-[60px] rounded-lg px-4 bg-[#131a35] text-white hover:bg-[#1a234a] dark:bg-[#131a35] dark:hover:bg-[#1a234a] flex items-center justify-center transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </form>
                </div>
              )}
              
              {/* Form */}
              {showAddForm && (
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 p-2 bg-white dark:bg-dark-800 rounded-xl shadow-xl dark:shadow-dark">
                    <div className="relative flex-grow border-b border-gray-200 dark:border-dark-700 pb-2">
                      <input
                        type="url"
                        placeholder="Cole sua URL longa aqui..."
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        required
                        className="input h-14 rounded-lg pl-5 pr-12 w-full"
                        autoFocus
                      />
                      {longUrl && (
                        <button 
                          type="button" 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                          onClick={() => setLongUrl('')}
                          aria-label="Limpar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          placeholder="Apelido personalizado (opcional)"
                          value={alias}
                          onChange={(e) => setAlias(e.target.value)}
                          className="input h-14 rounded-lg pl-5 pr-12 w-full"
                        />
                        {alias && (
                          <button 
                            type="button" 
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={() => setAlias('')}
                            aria-label="Limpar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setShowAddForm(false)}
                          className="btn btn-outline h-14 rounded-lg px-6 flex items-center justify-center border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading || !longUrl} 
                          className="btn btn-primary h-14 rounded-lg px-8 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center bg-[#131a35] hover:bg-[#1a234a] text-white"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Encurtando...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Encurtar URL
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="mt-6 max-w-3xl mx-auto">
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 flex items-start shadow-sm">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {success && (
            <div className="animate-fade-in mt-6 max-w-3xl mx-auto">
              <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-green-400">URL encurtada com sucesso!</h3>
                  <span className="bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-400 p-1.5 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
                
                <div className="flex items-center bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                  <input 
                    type="text" 
                    value={shortUrl} 
                    readOnly 
                    className="flex-grow px-4 py-3 focus:outline-none text-gray-700 dark:text-gray-200 font-medium bg-transparent" 
                    onClick={(e) => e.target.select()} 
                  />
                  <button 
                    onClick={copyToClipboard} 
                    className={`px-4 py-3 flex items-center justify-center transition-colors ${copySuccess ? 'bg-green-500 text-white dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700' : 'bg-[#131a35]/5 dark:bg-[#131a35]/20 text-[#131a35] dark:text-[#131a35]/80 hover:bg-[#131a35]/10 dark:hover:bg-[#131a35]/30'}`}
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copiado!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Copiar
                      </>
                    )}
                    {showTooltip && (
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded">
                        Copiado para a área de transferência!
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <a 
                    href={shortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary flex-1 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Abrir URL
                  </a>
                  <button 
                    onClick={() => {
                      setSuccess(false);
                      setShowAddForm(false);
                    }} 
                    className="btn btn-outline flex-1 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="py-8 mt-auto border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
  );
} 