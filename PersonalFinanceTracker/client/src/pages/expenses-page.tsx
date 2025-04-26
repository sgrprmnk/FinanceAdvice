import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/main-layout';
import ExpenseFilters, { DateFilter, SortOption } from '@/components/expenses/expense-filters';
import ExpenseList from '@/components/expenses/expense-list';
import AddExpenseDialog from '@/components/expenses/add-expense-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Expense } from '@shared/schema';

export default function ExpensesPage() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  // Filter and sort expenses based on user selections
  const filteredExpenses = expenses.filter(expense => {
    // Filter by category
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false;
    }
    
    // Filter by date
    const expenseDate = new Date(expense.date);
    const today = new Date();
    
    switch (dateFilter) {
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        if (expenseDate < sevenDaysAgo) return false;
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        if (expenseDate < thirtyDaysAgo) return false;
        break;
      case 'month':
        if (expenseDate.getMonth() !== today.getMonth() || 
            expenseDate.getFullYear() !== today.getFullYear()) {
          return false;
        }
        break;
      case 'year':
        if (expenseDate.getFullYear() !== today.getFullYear()) {
          return false;
        }
        break;
      case 'all':
      default:
        // No date filtering
        break;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const descriptionMatch = expense.description?.toLowerCase().includes(searchLower) || false;
      const categoryMatch = expense.category.toLowerCase().includes(searchLower);
      const noteMatch = expense.note?.toLowerCase().includes(searchLower) || false;
      
      if (!descriptionMatch && !categoryMatch && !noteMatch) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Sort expenses
    switch (sortOption) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount_high':
        return Number(b.amount) - Number(a.amount);
      case 'amount_low':
        return Number(a.amount) - Number(b.amount);
      default:
        return 0;
    }
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Expenses Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your expenses and track your spending.</p>
          </div>
          <Button 
            onClick={() => setIsAddExpenseOpen(true)}
            className="inline-flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
        
        {/* Expense Filters */}
        <ExpenseFilters 
          onCategoryChange={setCategoryFilter}
          onDateFilterChange={setDateFilter}
          onSortChange={setSortOption}
          onSearchChange={setSearchTerm}
        />
        
        {/* Expense List */}
        <ExpenseList 
          expenses={filteredExpenses} 
          isLoading={isLoading} 
        />
        
        {/* Add Expense Dialog */}
        <AddExpenseDialog 
          open={isAddExpenseOpen}
          onOpenChange={setIsAddExpenseOpen}
        />
      </div>
    </MainLayout>
  );
}
