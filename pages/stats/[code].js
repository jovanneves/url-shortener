import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardThemeToggle from '../../components/DashboardThemeToggle';

export default function StatsPage() {
  const router = useRouter();
  const { code } = router.query;
  const [urlData, setUrlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Dados fictícios para o gráfico de cliques
  const [clicksData, setClicksData] = useState([]);
  // URL base para QR Code
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Define a URL base apenas quando executado no navegador
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    async function fetchUrlData() {
      if (!code) return;

      try {
        const response = await fetch(`/api/${code}`);
        
        if (response.ok) {
          const data = await response.json();
          setUrlData(data);
          
          // Usar dados reais de cliques em vez de dados fictícios
          generateRealClicksData(data.clickHistory || []);
        } else {
          setError('URL não encontrada');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao buscar dados da URL');
      } finally {
        setLoading(false);
      }
    }

    fetchUrlData();
  }, [code]);

  // Função para gerar dados reais de cliques por dia
  const generateRealClicksData = (clickHistory) => {
    const days = 7; // Últimos 7 dias
    const now = new Date();
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const day = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const record = clickHistory.find(
        r => new Date(r.date).setHours(0,0,0,0) === date.getTime()
      );
      
      data.push({ 
        day, 
        clicks: record ? record.count : 0 
      });
    }
    
    setClicksData(data);
  };

  // Adicionar animação ao gráfico
  useEffect(() => {
    if (clicksData.length > 0 && !loading && !error) {
      const chartBars = document.querySelectorAll('.chart-bar');
      chartBars.forEach((bar, index) => {
        setTimeout(() => {
          bar.style.height = `${getBarHeight(clicksData[index].clicks)}%`;
          bar.classList.add('animated');
        }, index * 100);
      });
    }
  }, [clicksData, loading, error]);

  if (loading) return (
    <div className="min-h-screen flex flex-col">
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
            <Link href="/urls" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Minhas URLs
            </Link>
          </nav>
          <div className="mt-auto pt-8 flex justify-center">
            <DashboardThemeToggle />
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-900">
          <div className="flex-1 p-8">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas</h1>
            </header>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-dark-700 border-t-[#131a35] dark:border-t-[#131a35]/80 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Carregando dados...</p>
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
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col">
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
            <Link href="/urls" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Minhas URLs
            </Link>
          </nav>
          <div className="mt-auto pt-8 flex justify-center">
            <DashboardThemeToggle />
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-900">
          <div className="flex-1 p-8">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas</h1>
            </header>
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="text-4xl mb-4 text-red-500">❌</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Erro</h2>
              <p className="text-red-500 mb-6">{error}</p>
              <Link href="/urls" className="inline-flex items-center px-4 py-2 bg-[#131a35] hover:bg-[#1a234a] text-white font-medium rounded-lg transition-colors">
                Voltar para minhas URLs
              </Link>
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
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Estatísticas | {urlData?.urlCode} | Encurtador de URL</title>
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
            <Link href="/urls" className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Minhas URLs
            </Link>
          </nav>
          <div className="mt-auto pt-8 flex justify-center">
            <DashboardThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-900">
          <div className="flex-1 p-8">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas</h1>
            </header>

            <div className="mb-6 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="text-[#131a35] dark:text-[#131a35]/80 hover:underline">Início</Link>
              <span className="mx-2">/</span>
              <span className="font-medium">Estatísticas de URL</span>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Estatísticas da URL: <span className="text-[#131a35] dark:text-[#131a35]/80">{urlData.urlCode}</span>
              </h2>
              <button 
                className="px-3 py-1.5 bg-[#131a35] hover:bg-[#1a234a] text-white text-sm font-medium rounded transition-colors shadow-sm"
                onClick={() => {
                  navigator.clipboard.writeText(urlData.shortUrl);
                  alert('URL copiada para a área de transferência!');
                }}
              >
                Copiar URL
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#131a35]/80 mr-4">👁️</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Cliques</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{urlData.clicks}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#131a35]/80 mr-4">📅</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Data de Criação</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{new Date(urlData.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#131a35]/80 mr-4">⏱️</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tempo Ativo</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{getActiveTime(urlData.createdAt)}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#131a35]/80 mr-4">📈</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Média Diária</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{calculateDailyAverage(urlData.clicks, urlData.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Cliques nos Últimos 7 Dias</h3>
                  <div className="px-3 py-1 bg-[#131a35]/10 dark:bg-[#131a35]/20 text-[#131a35] dark:text-[#131a35]/80 text-sm font-medium rounded-full">
                    {urlData.clicks} cliques totais
                  </div>
                </div>
                <div className="flex items-end justify-between h-48 px-4 pt-6 pb-8 relative">
                  <div className="absolute left-0 right-0 bottom-10 border-b border-dashed border-gray-200 dark:border-dark-600"></div>
                  
                  {/* Linha que conecta os pontos */}
                  <svg className="absolute bottom-10 left-0 right-0 h-[calc(100%-40px)] w-full" style={{ pointerEvents: 'none' }}>
                    <polyline 
                      points={clicksData.map((item, index) => {
                        const x = (100 / (clicksData.length - 1) * index) + '%';
                        const height = getBarHeight(item.clicks);
                        const y = (100 - height) + '%';
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#131a35"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="dark:stroke-[#131a35]/80"
                    />
                    {clicksData.map((item, index) => {
                      const x = (100 / (clicksData.length - 1) * index) + '%';
                      const height = getBarHeight(item.clicks);
                      const y = (100 - height) + '%';
                      return (
                        <circle 
                          key={index}
                          cx={x} 
                          cy={y} 
                          r="4" 
                          fill="#131a35" 
                          className="dark:fill-[#131a35]/80"
                        />
                      );
                    })}
                  </svg>
                  
                  {clicksData.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="h-full flex items-end">
                        <div 
                          className="chart-bar w-8 bg-[#131a35] dark:bg-[#131a35]/80 rounded-t-md relative flex justify-center cursor-pointer hover:bg-[#1a234a] dark:hover:bg-[#131a35] transition-all shadow-sm"
                          style={{ height: '0%' }}
                        >
                          <span className="absolute -top-6 text-xs font-medium text-gray-700 dark:text-gray-300">{item.clicks}</span>
                        </div>
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Detalhes da URL</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Código</p>
                    <p className="text-[#131a35] dark:text-[#131a35]/80 font-medium">{urlData.urlCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">URL Original</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{urlData.longUrl}</p>
                      <a 
                        href={urlData.longUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#131a35] dark:text-[#131a35]/80 hover:text-[#1a234a] ml-2 p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-full transition-colors"
                        title="Abrir URL"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">URL Encurtada</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700 dark:text-gray-300">{urlData.shortUrl}</p>
                      <button 
                        className="text-[#131a35] dark:text-[#131a35]/80 hover:text-[#1a234a] ml-2 p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-full transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(urlData.shortUrl);
                          alert('URL copiada para a área de transferência!');
                        }}
                        title="Copiar URL"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Compartilhar</h3>
                <div className="flex flex-col items-center">
                  <div className="w-36 h-36 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center mb-2 rounded-md overflow-hidden">
                    {urlData?.longUrl && (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlData.longUrl)}`}
                        alt="QR Code para URL original"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Escaneie para acessar</p>
                </div>
              </div>
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
    </div>
  );
}

// Funções auxiliares
function getActiveTime(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Hoje";
  } else if (diffDays === 1) {
    return "1 dia";
  } else {
    return `${diffDays} dias`;
  }
}

function calculateDailyAverage(clicks, createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  return (clicks / diffDays).toFixed(1);
}

function getBarHeight(clicks) {
  // Para visualização do gráfico - escala os valores para ficar entre 10% e 90%
  if (clicks === 0) return 5;
  return Math.min(90, Math.max(10, clicks * 10));
} 