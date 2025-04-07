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

  useEffect(() => {
    // Define a URL base apenas quando executado no navegador
    setBaseUrl(window.location.origin);
  }, []);

  const fetchUrlData = useCallback(async () => {
    if (!code) return;

    try {
      // Usa o parâmetro stats=true para buscar dados do cache
      const response = await fetch(`/api/${code}?stats=true&useCache=true`);
      
      if (response.ok) {
        const data = await response.json();
        setUrlData(data);
        
        // Usar dados reais de cliques
        if (data.clickHistory) {
          generateRealClicksData(data.clickHistory);
        }
      } else {
        setError('URL não encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao buscar dados da URL');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchUrlData();
    
    // Configurar atualização periódica a cada 30 segundos
    const intervalId = setInterval(fetchUrlData, 30000);
    
    // Limpar intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [fetchUrlData]);

  // Função para gerar dados reais de cliques por dia
  const generateRealClicksData = useCallback((clickHistory) => {
    const days = 7; // Últimos 7 dias
    const now = new Date();
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Usamos formato longo para maior clareza dos dias da semana
      const diaDaSemana = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      // Formatamos também a data completa
      const dataCompleta = date.toLocaleDateString('pt-BR');
      
      // Capitalize primeira letra e pegar apenas os primeiros 3 caracteres
      const day = diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1, 3);
      
      // Timestamp para comparação correta
      const currentDateTimestamp = date.getTime();
      const matchingRecord = clickHistory.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === currentDateTimestamp;
      });
      
      data.push({ 
        day,
        fullDay: diaDaSemana,
        date: dataCompleta, 
        clicks: matchingRecord ? matchingRecord.count : 0 
      });
    }
    
    setClicksData(data);
  }, [setClicksData]);

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
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Cliques nos Últimos 7 Dias</h3>
                  <div className="px-3 py-1 bg-[#131a35]/10 dark:bg-[#131a35]/30 text-[#131a35] dark:text-white text-sm font-medium rounded-full">
                    {urlData.clicks} cliques totais
                  </div>
                </div>
                
                <div className="relative h-60 w-full">
                  {/* Área do gráfico com gradiente */}
                  <div className="absolute inset-0 flex items-end px-4 pb-12">
                    {/* Grade horizontal */}
                    <div className="absolute inset-0">
                      {[0, 25, 50, 75, 100].map((position) => (
                        <div 
                          key={position} 
                          className="absolute w-full border-b border-dashed border-gray-200 dark:border-dark-600"
                          style={{ bottom: `${position}%`, height: '1px' }}
                        />
                      ))}
                    </div>
                    
                    {/* Fundo gradiente */}
                    <svg className="absolute left-0 right-0 bottom-0 h-full w-full" style={{ zIndex: 1 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(19, 26, 53, 0.2)" className="dark:stopColor-[rgba(77,91,207,0.3)]" />
                          <stop offset="100%" stopColor="rgba(19, 26, 53, 0)" className="dark:stopColor-[rgba(77,91,207,0)]" />
                        </linearGradient>
                      </defs>
                      <path 
                        d={`M0,${100 - getBarHeight(clicksData[0]?.clicks || 0)} 
                           ${clicksData.map((item, i) => {
                              const x = (100 / (clicksData.length - 1) * i) + '%';
                              const height = getBarHeight(item.clicks);
                              return `L${x},${100 - height}`;
                            }).join(' ')} 
                            L100%,${100 - getBarHeight(clicksData[clicksData.length - 1]?.clicks || 0)} L100%,100% L0,100% Z`}
                        fill="url(#areaGradient)"
                        className="transition-all duration-700 ease-in-out"
                      />
                    </svg>
                    
                    {/* Linha de conexão entre pontos - mais grossa e evidente */}
                    <svg className="absolute inset-0 h-full w-full" style={{ zIndex: 2 }}>
                      <polyline 
                        points={clicksData.map((item, index) => {
                          const x = (100 / (clicksData.length - 1) * index) + '%';
                          const height = getBarHeight(item.clicks);
                          const y = (100 - height) + '%';
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#131a35"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="dark:stroke-[#6d7cef]"
                      />
                    </svg>
                    
                    <div className="grid grid-cols-7 gap-2 w-full h-full relative" style={{ zIndex: 3 }}>
                      {clicksData.map((item, index) => (
                        <div key={index} className="flex flex-col h-full">
                          {/* Número de cliques acima do ponto */}
                          <div className="flex-1 flex items-end justify-center pb-2">
                            <div className="relative">
                              {/* Valor do clique sempre visível acima do ponto */}
                              <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 bg-white dark:bg-dark-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-dark-700 text-xs font-semibold text-gray-800 dark:text-white">
                                {item.clicks}
                              </div>
                              
                              <div className="w-4 h-4 rounded-full bg-[#131a35] dark:bg-[#6d7cef] shadow-md relative">
                                {/* Ponto maior e mais visível */}
                                <div className="absolute inset-0 rounded-full bg-[#131a35] dark:bg-[#6d7cef] animate-ping opacity-75 duration-1000" style={{animationIterationCount: 1}}></div>
                              </div>
                              
                              {/* Tooltip detalhado no hover */}
                              <div className="opacity-0 hover:opacity-100 absolute -translate-x-1/2 left-1/2 -top-20 transform bg-[#131a35] dark:bg-[#1a234a] text-white px-3 py-2 rounded text-xs whitespace-nowrap transition-opacity duration-200 shadow-md z-10 pointer-events-none group-hover:pointer-events-auto w-32 text-center">
                                <div className="font-bold text-sm">{item.clicks} cliques</div>
                                <div className="text-xs text-gray-200">{item.fullDay}</div>
                                <div className="text-[10px] opacity-80">{item.date}</div>
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-[#131a35] dark:bg-[#1a234a]"></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Dia da semana e data abaixo */}
                          <div className="h-10 flex flex-col items-center">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.day}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{item.date.split('/')[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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

function getBarHeight(clicks) {
  // Calcula a altura das barras de forma logarítmica para melhor visualização e valores mais suaves
  if (clicks === 0) return 5;
  // Usa escala logarítmica para evitar que barras com poucos cliques fiquem muito pequenas
  // e barras com muitos cliques fiquem desproporcionalmente grandes
  return Math.min(85, Math.max(10, 15 * Math.log2(clicks + 2) + 5));
} 