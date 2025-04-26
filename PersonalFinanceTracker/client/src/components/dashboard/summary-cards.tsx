import { ArrowDown, ArrowUp, DollarSign, BarChart2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Expense } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
  expenses: Expense[];
  isLoading: boolean;
}

export default function SummaryCards({ expenses, isLoading }: SummaryCardsProps) {
  const { data: goals } = useQuery({ 
    queryKey: ['/api/goals'],
    enabled: !isLoading 
  });

  // Calculate total spending for current month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const lastMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
  });

  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Calculate monthly savings (if goals exist)
  const monthlySavings = goals?.reduce((sum, goal) => sum + Number(goal.currentAmount), 0) || 0;
  
  // Calculate spending comparison with last month
  const spendingDifference = lastMonthTotal ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  
  // Get top spending category
  const categorySpending = currentMonthExpenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);
  
  let topCategory = '';
  let topCategoryAmount = 0;
  
  Object.entries(categorySpending).forEach(([category, amount]) => {
    if (amount > topCategoryAmount) {
      topCategory = category;
      topCategoryAmount = amount;
    }
  });
  
  const topCategoryPercentage = currentMonthTotal ? Math.round((topCategoryAmount / currentMonthTotal) * 100) : 0;

  // Calculate goals progress
  const totalGoalTargets = goals?.reduce((sum, goal) => sum + Number(goal.targetAmount), 0) || 0;
  const totalGoalSavings = goals?.reduce((sum, goal) => sum + Number(goal.currentAmount), 0) || 0;
  const goalsProgress = totalGoalTargets > 0 ? Math.round((totalGoalSavings / totalGoalTargets) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Monthly Spending Card */}
      <Card className="bg-white overflow-hidden shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Monthly Spending</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isLoading ? 'Loading...' : formatCurrency(currentMonthTotal)}
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
          <div className={`text-sm flex items-center ${spendingDifference > 0 ? 'text-red-500' : 'text-green-500'}`}>
            <span>{Math.abs(Math.round(spendingDifference))}% from last month</span>
            {spendingDifference > 0 ? (
              <ArrowUp className="ml-1 h-5 w-5" />
            ) : (
              <ArrowDown className="ml-1 h-5 w-5" />
            )}
          </div>
        </div>
      </Card>

      {/* Monthly Savings Card */}
      <Card className="bg-white overflow-hidden shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Monthly Savings</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isLoading ? 'Loading...' : formatCurrency(monthlySavings)}
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
          <div className="text-sm text-green-500 flex items-center">
            <span>Track your progress in Goals</span>
          </div>
        </div>
      </Card>

      {/* Goals Progress Card */}
      <Card className="bg-white overflow-hidden shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Goals Progress</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isLoading ? 'Loading...' : `${goalsProgress}%`}
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${goalsProgress}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Category Insights Card */}
      <Card className="bg-white overflow-hidden shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart2 className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Top Category</dt>
              <dd className="text-lg font-medium text-gray-900">
                {isLoading ? 'Loading...' : topCategory || 'No data'}
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${topCategoryPercentage}% of your monthly spending`}
          </div>
        </div>
      </Card>
    </div>
  );
}
