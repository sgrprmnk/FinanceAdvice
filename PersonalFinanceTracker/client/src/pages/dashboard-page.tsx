import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/main-layout';
import SummaryCards from '@/components/dashboard/summary-cards';
import SpendingChart from '@/components/dashboard/spending-chart';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import { Expense } from '@shared/schema';

export default function DashboardPage() {
  const { data: expenses, isLoading: isExpensesLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back! Here's your financial overview.</p>
        </div>
        
        {/* Summary Cards */}
        <SummaryCards 
          expenses={expenses || []} 
          isLoading={isExpensesLoading} 
        />
        
        {/* Spending Chart */}
        <SpendingChart 
          expenses={expenses || []} 
          isLoading={isExpensesLoading} 
        />
        
        {/* Recent Transactions */}
        <RecentTransactions 
          expenses={expenses || []} 
          isLoading={isExpensesLoading} 
        />
      </div>
    </MainLayout>
  );
}
