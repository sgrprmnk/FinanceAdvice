import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/main-layout';
import InsightsCharts from '@/components/insights/insights-charts';
import { Expense } from '@shared/schema';

export default function InsightsPage() {
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Insights Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Spending Insights</h1>
          <p className="mt-1 text-sm text-gray-600">Analyze your spending patterns and get personalized recommendations.</p>
        </div>
        
        {/* Insights Charts */}
        <InsightsCharts 
          expenses={expenses} 
          isLoading={isLoading} 
        />
      </div>
    </MainLayout>
  );
}
