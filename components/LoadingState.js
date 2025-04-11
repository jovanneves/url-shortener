import DashboardLayout from './DashboardLayout';

export default function LoadingState({ title = 'Carregando' }) {
  return (
    <DashboardLayout title={title}>
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-dark-700 border-t-[#131a35] dark:border-t-[#131a35]/80 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Carregando dados...</p>
      </div>
    </DashboardLayout>
  );
} 