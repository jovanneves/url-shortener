import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DashboardThemeToggle from '../../components/DashboardThemeToggle';
import RequireAuth from '../../components/RequireAuth';
import { signOut, useSession } from 'next-auth/react';

export default function StatsPage() {
  // Componente protegido com autenticação
  return (
    <RequireAuth>
      <StatsContent />
    </RequireAuth>
  );
}

function StatsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { code } = router.query;
  const [urlData, setUrlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clicksData, setClicksData] = useState([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    // Define a URL base apenas quando executado no navegador
    setBaseUrl(window.location.origin);
  }, []);

  // Função para gerar dados reais de cliques por dia
  const generateRealClicksData = useCallback((clickHistory) => {
    console.log('Gerando dados de cliques. Dados recebidos:', clickHistory);
    
    const now = new Date();
    let days = 7; // Padrão: 7 dias
    
    // Ajusta o número de dias baseado no timeRange selecionado
    switch(timeRange) {
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 7;
    }
    
    const data = [];
    
    // Primeiro, vamos processar o histórico de cliques
    const processedHistory = clickHistory.map(record => {
      const date = new Date(record.date);
      date.setHours(0, 0, 0, 0);
      return {
        date: date.getTime(),
        count: record.count
      };
    });

    console.log('Histórico processado:', processedHistory);

    // Agora vamos gerar os dados para cada dia
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const diaDaSemana = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      const dataCompleta = date.toLocaleDateString('pt-BR');
      const day = diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1, 3);
      
      const currentDateTimestamp = date.getTime();
      const matchingRecord = processedHistory.find(record => record.date === currentDateTimestamp);
      
      data.push({ 
        day,
        fullDay: diaDaSemana,
        date: dataCompleta, 
        clicks: matchingRecord ? matchingRecord.count : 0 
      });
    }
    
    console.log('Dados gerados para gráfico:', data);
    setClicksData(data);
  }, [timeRange]);

  const fetchUrlData = useCallback(async () => {
    if (!code) return;

    try {
      console.log('Buscando dados da URL:', code);
      // Usa o parâmetro stats=true para buscar dados do cache
      const response = await fetch(`/api/${code}?stats=true&useCache=true`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos:', data);
        setUrlData(data);
        
        // Usar dados reais de cliques
        if (data.clickHistory) {
          console.log('Histórico de cliques encontrado:', data.clickHistory);
          generateRealClicksData(data.clickHistory);
        } else {
          console.log('Nenhum histórico de cliques encontrado');
          setClicksData([]);
        }
      } else {
        console.error('Erro ao buscar dados:', response.status);
        setError('URL não encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao buscar dados da URL');
    } finally {
      setLoading(false);
    }
  }, [code, generateRealClicksData]);

  useEffect(() => {
    fetchUrlData();
    
    // Configurar atualização periódica a cada 30 segundos
    const intervalId = setInterval(fetchUrlData, 30000);
    
    // Limpar intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [fetchUrlData]);

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

  // Função para calcular estatísticas adicionais
  const calculateAdditionalStats = useCallback((data) => {
    if (!data || data.length === 0) return null;

    const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
    const averageClicks = totalClicks / data.length;
    const maxClicks = Math.max(...data.map(item => item.clicks));
    const minClicks = Math.min(...data.map(item => item.clicks));
    const maxClicksDay = data.find(item => item.clicks === maxClicks);
    const minClicksDay = data.find(item => item.clicks === minClicks);

    // Calcular tendência
    const recentClicks = data.slice(-7).reduce((sum, item) => sum + item.clicks, 0);
    const previousClicks = data.slice(-14, -7).reduce((sum, item) => sum + item.clicks, 0);
    const trend = recentClicks > previousClicks ? 'up' : recentClicks < previousClicks ? 'down' : 'stable';

    return {
      averageClicks: averageClicks.toFixed(1),
      maxClicks,
      minClicks,
      maxClicksDay,
      minClicksDay,
      trend,
      trendPercentage: Math.abs(((recentClicks - previousClicks) / previousClicks) * 100).toFixed(1)
    };
  }, []);

  const additionalStats = useMemo(() => calculateAdditionalStats(clicksData), [clicksData, calculateAdditionalStats]);

  // Memoizar componentes que não precisam ser recriados em cada renderização
  const UserProfile = useMemo(() => {
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
            <Link href="/auth/profile" className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
              Meu Perfil
            </Link>
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
  }, [session, showUserMenu]);

  // Memoizar o cabeçalho
  const Header = useMemo(() => (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas</h1>
      <div className="flex items-center gap-3">
        {UserProfile}
      </div>
    </header>
  ), [UserProfile]);

  // Calcular estatísticas uma vez quando os dados mudam
  const urlStats = useMemo(() => {
    if (!urlData) return null;
    
    return {
      activeTime: getActiveTime(urlData.createdAt),
      dailyAverage: calculateDailyAverage(urlData.clicks, urlData.createdAt),
      creationDate: new Date(urlData.createdAt).toLocaleDateString('pt-BR')
    };
  }, [urlData]);

  // Memoizar componentes que dependem apenas de urlData
  const UrlDetails = useMemo(() => {
    if (!urlData) return null;
    
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Detalhes da URL</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Código</p>
            <p className="text-[#131a35] dark:text-white font-medium">{urlData.urlCode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">URL Original</p>
            <div className="flex items-center justify-between">
              <p className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{urlData.longUrl}</p>
              <a 
                href={urlData.longUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#131a35] dark:text-[#4d5bcf] hover:text-[#1a234a] dark:hover:text-[#6d7cef] ml-2 p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-full transition-colors"
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
              <p className="text-gray-700 dark:text-gray-300">
                {`${window.location.protocol}//${window.location.host}/${urlData.urlCode}`}
              </p>
              <button 
                className="text-[#131a35] dark:text-[#4d5bcf] hover:text-[#1a234a] dark:hover:text-[#6d7cef] ml-2 p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-full transition-colors"
                onClick={() => {
                  // Reconstruir a URL completa a partir do código
                  const fullUrl = `${window.location.protocol}//${window.location.host}/${urlData.urlCode}`;
                  navigator.clipboard.writeText(fullUrl);
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
    );
  }, [urlData]);

  // Memoizar o componente QR Code
  const QRCodeComponent = useMemo(() => {
    if (!urlData) return null;
    
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Compartilhar</h3>
        <div className="flex flex-col items-center">
          <div className="w-36 h-36 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center mb-2 rounded-md overflow-hidden">
            {urlData?.longUrl && (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlData.longUrl)}`}
                alt="QR Code para URL original"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Escaneie para acessar a URL original</p>
          <button
            className="mt-3 text-xs text-[#131a35] dark:text-[#4d5bcf] px-2 py-1 border border-[#131a35]/20 dark:border-[#4d5bcf]/40 rounded hover:bg-[#131a35]/5 dark:hover:bg-[#4d5bcf]/10"
            onClick={() => {
              if (urlData?.longUrl) {
                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlData.longUrl)}`;
                window.open(qrCodeUrl, '_blank');
              }
            }}
          >
            Ampliar QR Code
          </button>
        </div>
      </div>
    );
  }, [urlData]);

  // Função para exportar dados em CSV
  const exportToCSV = useCallback(() => {
    if (!clicksData || clicksData.length === 0) return;

    const headers = ['Data', 'Dia da Semana', 'Cliques'];
    const csvContent = [
      headers.join(','),
      ...clicksData.map(item => [
        item.date,
        item.fullDay,
        item.clicks
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estatisticas-${code}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [clicksData, code]);

  // Função para calcular a altura das barras
  function getBarHeight(clicks) {
    if (!clicks || clicks === 0) return 0;
    
    // Encontra o valor máximo de cliques para normalização
    const maxClicks = Math.max(...clicksData.map(item => item.clicks));
    console.log('Calculando altura para:', clicks, 'cliques. Máximo:', maxClicks);
    
    // Se todos os valores forem 0, retorna 0
    if (maxClicks === 0) return 0;
    
    // Calcula a altura como uma porcentagem do valor máximo
    // Garante que o valor mínimo seja 5% e o máximo 95%
    const height = (clicks / maxClicks) * 90;
    const normalizedHeight = Math.max(5, Math.min(95, height));
    return normalizedHeight;
  }

  // Função para copiar URL para o clipboard
  const copyToClipboard = useCallback(() => {
    if (!baseUrl || !code) return;
    
    const shortUrl = `${baseUrl}/${code}`;
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [baseUrl, code]);

  // Função para compartilhar URL
  const shareUrl = useCallback((platform) => {
    if (!baseUrl || !code) return;
    
    const shortUrl = `${baseUrl}/${code}`;
    const urlTitle = urlData?.longUrl || 'URL Encurtada';
    
    let shareUrl = '';
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent('Confira este link: ')}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Confira este link: ' + shortUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    
    setShowShareOptions(false);
  }, [baseUrl, code, urlData]);

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
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
            {Header}
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
                    © 2025 URLShortener - Encurtador de URLs
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
            {Header}
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
                    © 2025 URLShortener - Encurtador de URLs
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
            {Header}

            <div className="mb-6 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="text-[#131a35] dark:text-[#4d5bcf] hover:underline">Início</Link>
              <span className="mx-2">/</span>
              <span className="font-medium">Estatísticas de URL</span>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Estatísticas da URL: <span className="text-[#131a35] dark:text-[#6d7cef]">{urlData.urlCode}</span>
              </h2>
              <button 
                className="px-3 py-1.5 bg-[#131a35] hover:bg-[#1a234a] text-white text-sm font-medium rounded transition-colors shadow-sm"
                onClick={() => {
                  // Reconstruir a URL completa a partir do código
                  const fullUrl = `${window.location.protocol}//${window.location.host}/${urlData.urlCode}`;
                  navigator.clipboard.writeText(fullUrl);
                  alert('URL copiada para a área de transferência!');
                }}
              >
                Copiar URL
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#6d7cef] mr-4">👁️</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Cliques</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{urlData.clicks}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#6d7cef] mr-4">📅</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Data de Criação</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{urlStats?.creationDate}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#6d7cef] mr-4">⏱️</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tempo Ativo</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{urlStats?.activeTime}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700 flex items-center transform hover:translate-y-[-2px] transition-all">
                <div className="text-3xl text-[#131a35] dark:text-[#6d7cef] mr-4">📈</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Média Diária</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{urlStats?.dailyAverage}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-dark-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Cliques por Período</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={exportToCSV}
                      className="px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Exportar CSV
                    </button>
                    <div className="px-3 py-1 bg-[#131a35]/10 dark:bg-[#131a35]/30 text-[#131a35] dark:text-white text-sm font-medium rounded-full">
                      {urlData?.clicks || 0} cliques totais
                    </div>
                    <select
                      value={timeRange}
                      onChange={(e) => {
                        console.log('Alterando período para:', e.target.value);
                        setTimeRange(e.target.value);
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-700"
                    >
                      <option value="7d">Últimos 7 dias</option>
                      <option value="30d">Últimos 30 dias</option>
                      <option value="90d">Últimos 90 dias</option>
                    </select>
                  </div>
                </div>

                {/* Estatísticas adicionais */}
                {additionalStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Média Diária</div>
                      <div className="text-xl font-bold text-gray-800 dark:text-white">{additionalStats.averageClicks}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Máximo</div>
                      <div className="text-xl font-bold text-gray-800 dark:text-white">{additionalStats.maxClicks}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{additionalStats.maxClicksDay?.date}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Mínimo</div>
                      <div className="text-xl font-bold text-gray-800 dark:text-white">{additionalStats.minClicks}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{additionalStats.minClicksDay?.date}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Tendência</div>
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-gray-800 dark:text-white">
                          {additionalStats.trend === 'up' ? '↑' : additionalStats.trend === 'down' ? '↓' : '→'}
                        </span>
                        <span className={`ml-2 text-sm ${
                          additionalStats.trend === 'up' ? 'text-green-500' : 
                          additionalStats.trend === 'down' ? 'text-red-500' : 
                          'text-gray-500'
                        }`}>
                          {additionalStats.trendPercentage}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">vs período anterior</div>
                    </div>
                  </div>
                )}

                {/* Gráfico */}
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#131a35] dark:border-[#6d7cef]"></div>
                  </div>
                ) : clicksData.length > 0 ? (
                  <div className="relative h-64">
                    {/* Linha de conexão entre pontos - versão minimalista */}
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 2 }}>
                      <polyline 
                        points={clicksData.map((item, index) => {
                          const x = (100 / (clicksData.length - 1) * index);
                          const height = getBarHeight(item.clicks);
                          const y = (100 - height);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#131a35"
                        strokeWidth="0.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="dark:stroke-[#6d7cef]"
                      />
                    </svg>
                    
                    {/* Pontos e valores */}
                    <div className="absolute inset-0 h-full flex justify-between">
                      {clicksData.map((item, index) => {
                        const barHeight = getBarHeight(item.clicks);
                        return (
                          <div key={index} className="h-full flex flex-col justify-end pb-10" style={{width: `${100/clicksData.length}%`}}>
                            <div 
                              className="relative flex justify-center" 
                              style={{height: `${barHeight}%`}}
                            >
                              <div className="absolute bottom-0 transform translate-y-1/2">
                                {/* Apenas o número de cliques acima do pequeno ponto */}
                                <div className="relative flex flex-col items-center">
                                  <div className="mb-1 px-2 py-0.5 bg-white dark:bg-dark-800 rounded shadow-sm border border-gray-200 dark:border-dark-700 text-xs font-medium text-gray-800 dark:text-white">
                                    {item.clicks}
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-[#131a35] dark:bg-[#6d7cef]"></div>
                                </div>
                              </div>
                            </div>
                            <div className="text-center mt-3">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.day}</span>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.date.split('/')[0]}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Nenhum dado disponível para exibição
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {UrlDetails}
              {QRCodeComponent}
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 py-8 px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-center items-center">
                <div className="flex items-center space-x-1 text-[#131a35] dark:text-[#6d7cef]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    © 2025 URLShortener - Encurtador de URLs
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