import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function ErrorState({ error, title = 'Erro', returnLink = '/urls', returnText = 'Voltar para minhas URLs' }) {
  return (
    <DashboardLayout title={title}>
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="text-4xl mb-4 text-red-500">❌</div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Erro</h2>
        <p className="text-red-500 mb-6">{error}</p>
        <Link href={returnLink} className="inline-flex items-center px-4 py-2 bg-[#131a35] hover:bg-[#1a234a] text-white font-medium rounded-lg transition-colors">
          {returnText}
        </Link>
      </div>
    </DashboardLayout>
  );
} 