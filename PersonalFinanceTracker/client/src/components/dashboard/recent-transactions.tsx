import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense } from '@shared/schema';
import { Link } from 'wouter';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCategoryIcon, getCategoryColor, getCategoryBadgeStyles } from '@/lib/category-utils';

interface RecentTransactionsProps {
  expenses: Expense[];
  isLoading: boolean;
}

export default function RecentTransactions({ expenses, isLoading }: RecentTransactionsProps) {
  // Sort expenses by date (newest first) and take only the 5 most recent
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card className="mt-8 bg-white shadow">
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Recent Transactions</CardTitle>
        <p className="mt-1 text-sm text-gray-500">Your latest 5 expenses</p>
      </CardHeader>
      
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-6 text-center">Loading recent transactions...</div>
        ) : recentExpenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No transactions yet. Add your first expense!
          </div>
        ) : (
          recentExpenses.map(expense => (
            <div key={expense.id} className="px-6 py-4 flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="h-10 w-10 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: getCategoryColor(expense.category) }}
                >
                  {getCategoryIcon(expense.category).icon}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{expense.description || expense.category}</p>
                    <p className="text-sm text-gray-500">{expense.note || 'No additional details'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">-{formatCurrency(Number(expense.amount))}</span>
                  </div>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <span>{formatDate(expense.date)}</span>
                  <span className="mx-2">•</span>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeStyles(expense.category)}`}
                  >
                    {expense.category}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <Link href="/expenses">
          <a className="text-sm font-medium text-primary hover:text-primary-dark">
            View all expenses →
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
