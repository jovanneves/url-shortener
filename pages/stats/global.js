import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardThemeToggle from '../../components/DashboardThemeToggle';
import RequireAuth from '../../components/RequireAuth';
import { useSession } from 'next-auth/react';

export default function GlobalStatsPage() {
  // Componente protegido com autenticação
  return (
    <RequireAuth>
      <GlobalStatsContent />
    </RequireAuth>
  );
}

function GlobalStatsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [urlsData, setUrlsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [activeTab, setActiveTab] = useState('weekly');
  const [periodFilter, setPeriodFilter] = useState('7d'); // 7d, 30d, 90d
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Define a URL base apenas quando executado no navegador
    setBaseUrl(window.location.origin);
  }, []);

  // Buscar dados de todas as URLs
  useEffect(() => {
    const fetchAllUrlsData = async () => {
      try {
        setLoading(true);
        // API endpoint para buscar todas as URLs com estatísticas
        const response = await fetch(`/api/stats?period=${periodFilter}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dados recebidos:', data);
          setUrlsData(data.urls || []);
        } else {
          console.error('Erro ao buscar dados:', response.status);
          setError('Erro ao buscar estatísticas das URLs');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchAllUrlsData();
  }, [periodFilter]);

  // Memoizar as estatísticas organizadas por período
  const statsData = useMemo(() => {
    if (!urlsData || urlsData.length === 0) return { weekly: [], monthly: [] };
    
    // Ordenar por número de cliques (decrescente)
    const sortedUrls = [...urlsData].sort((a, b) => b.clicks - a.clicks);
    
    // Dados para heatmap semanal
    const weeklyData = sortedUrls.map(url => {
      const weekHistory = url.weeklyClicks || [];
      return {
        urlCode: url.urlCode,
        longUrl: url.longUrl,
        totalClicks: url.clicks,
        clicksData: weekHistory
      };
    });
    
    // Dados para heatmap mensal
    const monthlyData = sortedUrls.map(url => {
      const monthHistory = url.monthlyClicks || [];
      return {
        urlCode: url.urlCode,
        longUrl: url.longUrl,
        totalClicks: url.clicks,
        clicksData: monthHistory
      };
    });
    
    return { weekly: weeklyData, monthly: monthlyData };
  }, [urlsData]);

  // Componente de Heatmap melhorado
  const Heatmap = ({ data, periodLabel, timeLabels }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium">Nenhum dado disponível para exibição</p>
            <p className="text-xs mt-1">Tente mudar o período ou criar mais URLs</p>
          </div>
        </div>
      );
    }

    // Encontrar o número máximo de cliques para normalização
    const maxClicks = Math.max(
      ...data.flatMap(url => 
        url.clicksData.map(item => item.count || 0)
      ), 1 // garantir que nunca seja 0
    );

    // Função para gerar a classe de cor do heatmap com base no número de cliques
    const getHeatmapColor = (clicks) => {
      if (clicks === 0) return {
        bg: 'bg-gray-100 dark:bg-dark-700',
        text: 'text-gray-500 dark:text-gray-400'
      };
      
      const intensity = Math.min(1, clicks / maxClicks);
      
      if (intensity < 0.2) return {
        bg: 'bg-green-100 dark:bg-green-900/80',
        text: 'text-green-800 dark:text-green-100'
      };
      if (intensity < 0.4) return {
        bg: 'bg-green-200 dark:bg-green-800/80',
        text: 'text-green-800 dark:text-green-100'
      };
      if (intensity < 0.6) return {
        bg: 'bg-green-300 dark:bg-green-700/80',
        text: 'text-green-800 dark:text-green-100'
      };
      if (intensity < 0.8) return {
        bg: 'bg-green-500 dark:bg-green-600/80',
        text: 'text-white'
      };
      return {
        bg: 'bg-green-700 dark:bg-green-500/90', 
        text: 'text-white'
      };
    };

    return (
      <div className="overflow-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white dark:bg-dark-800 p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-dark-700 whitespace-nowrap">
                URL
              </th>
              {timeLabels.map((label, index) => (
                <th key={index} className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-dark-700 whitespace-nowrap">
                  {label}
                </th>
              ))}
              <th className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-dark-700 whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
            {data.map((url, urlIndex) => (
              <tr 
                key={url.urlCode} 
                className={`hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors`}
                onClick={() => router.push(`/stats/${url.urlCode}`)}
              >
                <td className="sticky left-0 z-10 bg-white dark:bg-dark-800 p-3 align-middle whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex-shrink-0 mr-3 rounded-md bg-[#131a35]/10 dark:bg-[#6d7cef]/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#131a35] dark:text-[#6d7cef]">
                        {url.urlCode.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-800 dark:text-white">
                        {url.urlCode}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                        {url.longUrl}
                      </div>
                    </div>
                  </div>
                </td>
                
                {url.clicksData.map((period, periodIndex) => {
                  const colorClasses = getHeatmapColor(period.count || 0);
                  return (
                    <td key={periodIndex} className="p-1.5 align-middle">
                      <div 
                        className={`h-12 rounded-md flex items-center justify-center transition-colors ${colorClasses.bg}`}
                        title={`${period.count || 0} cliques`}
                      >
                        <span className={`text-sm font-medium ${colorClasses.text}`}>
                          {period.count || 0}
                        </span>
                      </div>
                    </td>
                  );
                })}
                
                <td className="p-3 align-middle text-center">
                  <div className="font-bold text-sm text-gray-800 dark:text-white">
                    {url.totalClicks}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    cliques
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Paginação para muitos resultados */}
        {data.length > 15 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              <button className="p-2 rounded-md border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="px-3.5 py-2 rounded-md border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-700">
                1
              </button>
              <button className="px-3.5 py-2 rounded-md border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
                2
              </button>
              <button className="p-2 rounded-md border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    );
  };

  // Gerar labels para os períodos
  const weeklyTimeLabels = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      result.push(`${dayName} ${dayNum}`);
    }
    
    return result;
  }, []);

  const monthlyTimeLabels = useMemo(() => {
    const today = new Date();
    const result = [];
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7));
      const weekStart = date.getDate();
      date.setDate(date.getDate() + 6);
      const weekEnd = date.getDate();
      result.push(`${weekStart}-${weekEnd}`);
    }
    
    return result;
  }, []);

  // Memoizar o cabeçalho
  const Header = useMemo(() => (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas Globais</h1>
      <div className="flex items-center gap-3">
        <DashboardThemeToggle />
      </div>
    </header>
  ), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-950 py-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          {/* Skeleton do cabeçalho */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-dark-700 mb-6 transition-all">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-gray-200 dark:bg-dark-700 p-3 rounded-lg mr-4 w-14 h-14 animate-pulse"></div>
                <div>
                  <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded w-64 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-48 animate-pulse mt-2"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 bg-gray-200 dark:bg-dark-700 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Skeletons de Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-dark-700">
                <div className="flex items-start justify-between">
                  <div className="w-full">
                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-24 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded w-16 animate-pulse mt-2"></div>
                  </div>
                  <div className="bg-gray-200 dark:bg-dark-700 p-2 rounded-lg w-10 h-10 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-32 animate-pulse mt-2"></div>
              </div>
            ))}
          </div>

          {/* Skeleton de Filtros */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-dark-700 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded w-48 animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 dark:bg-dark-700 rounded w-36 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-dark-700 rounded w-36 animate-pulse"></div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="flex items-center">
                  <div className="w-4 h-4 rounded bg-gray-200 dark:bg-dark-700 animate-pulse mr-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton da tabela */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 md:p-6 shadow-lg border border-gray-100 dark:border-dark-700">
            <div className="overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-dark-700 pb-3 mb-3">
                <div className="w-40 flex-shrink-0">
                  <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded w-20 animate-pulse"></div>
                </div>
                <div className="flex-1 flex">
                  {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                    <div key={item} className="flex-1 px-2">
                      <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                  <div className="w-24 flex-shrink-0">
                    <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded w-16 animate-pulse mx-auto"></div>
                  </div>
                </div>
              </div>
              
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                <div key={row} className="flex py-3 border-b border-gray-200 dark:border-dark-700">
                  <div className="w-40 flex-shrink-0 flex items-center">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-dark-700 rounded mr-3 animate-pulse"></div>
                    <div>
                      <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-32 animate-pulse mt-1"></div>
                    </div>
                  </div>
                  <div className="flex-1 flex">
                    {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                      <div key={cell} className="flex-1 px-2">
                        <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                    <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center">
                      <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded w-12 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-16 animate-pulse mt-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {Header}
          <div className="bg-white dark:bg-dark-800 rounded-lg p-8 shadow-md border border-gray-100 dark:border-dark-700 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Erro ao Carregar Estatísticas</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#131a35] hover:bg-[#1d2754] text-white rounded-lg transition-colors duration-200"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-950 py-12 transition-colors duration-200">
      <Head>
        <title>Estatísticas Globais | Encurtador de URL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 animate-fadeIn">
        {/* Cabeçalho com ações */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-dark-700 mb-6 transition-all hover:shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <div className="bg-[#131a35] dark:bg-[#6d7cef] p-3 rounded-lg mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas Globais</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Visualize os dados de todas as suas URLs encurtadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nova URL
              </Link>
              <DashboardThemeToggle />
            </div>
          </div>
        </div>

        {/* Cards com resumo de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-dark-700 transition-all hover:shadow-lg hover:translate-y-[-2px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total de URLs</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{urlsData.length || 0}</h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No período selecionado
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-dark-700 transition-all hover:shadow-lg hover:translate-y-[-2px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total de Cliques</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {urlsData.reduce((sum, url) => sum + url.clicks, 0) || 0}
                </h3>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <svg className="w-6 h-6 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Total acumulado
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-dark-700 transition-all hover:shadow-lg hover:translate-y-[-2px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Média de Cliques</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {urlsData.length 
                    ? (urlsData.reduce((sum, url) => sum + url.clicks, 0) / urlsData.length).toFixed(1) 
                    : '0'}
                </h3>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Por URL
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-dark-700 transition-all hover:shadow-lg hover:translate-y-[-2px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">URL Mais Popular</p>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                  {urlsData.length > 0 
                    ? urlsData.sort((a, b) => b.clicks - a.clicks)[0].urlCode 
                    : 'N/A'}
                </h3>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <svg className="w-6 h-6 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {urlsData.length > 0 
                ? `${urlsData.sort((a, b) => b.clicks - a.clicks)[0].clicks} cliques` 
                : 'Sem dados'}
            </div>
          </div>
        </div>

        {/* Filtros e controles */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-dark-700 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Mapa de Calor de Cliques</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                As cores indicam a intensidade de cliques em cada período
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-dark-700">
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'weekly' 
                      ? 'bg-[#131a35] text-white dark:bg-[#6d7cef]' 
                      : 'bg-white text-gray-800 dark:bg-dark-800 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'monthly' 
                      ? 'bg-[#131a35] text-white dark:bg-[#6d7cef]' 
                      : 'bg-white text-gray-800 dark:bg-dark-800 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  Mensal
                </button>
              </div>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#131a35] dark:focus:ring-[#6d7cef] cursor-pointer"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </div>
          </div>

          {/* Legenda do heatmap */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-dark-700 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">0</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Baixo</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-700 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Médio-baixo</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Médio</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-700 dark:bg-green-300 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Médio-alto</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-900 dark:bg-green-100 mr-1"></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Alto</span>
            </div>
          </div>
        </div>

        {/* Heatmap container */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 md:p-6 shadow-lg border border-gray-100 dark:border-dark-700">
          {activeTab === 'weekly' ? (
            <Heatmap 
              data={statsData.weekly} 
              periodLabel="Dia da Semana" 
              timeLabels={weeklyTimeLabels} 
            />
          ) : (
            <Heatmap 
              data={statsData.monthly} 
              periodLabel="Semana do Mês" 
              timeLabels={monthlyTimeLabels} 
            />
          )}
        </div>

        {/* Dicas e links */}
        <div className="mt-8 bg-[#131a35]/5 dark:bg-[#6d7cef]/5 rounded-xl p-6 border border-[#131a35]/10 dark:border-[#6d7cef]/10">
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-[#131a35] dark:text-[#6d7cef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white">Dica:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Clique em qualquer URL na tabela para ver estatísticas detalhadas. 
                O período selecionado afeta a visualização e cálculos em toda a página.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/urls" className="text-[#131a35] dark:text-[#6d7cef] hover:underline flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Gerenciar URLs
            </Link>
            <Link href="/" className="text-[#131a35] dark:text-[#6d7cef] hover:underline flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Criar Nova URL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 