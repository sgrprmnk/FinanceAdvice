import { useState } from 'react';
import { Expense } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCategoryBadgeStyles, getCategoryIcon } from '@/lib/category-utils';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AddExpenseDialog from './add-expense-dialog';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
}

export default function ExpenseList({ expenses, isLoading }: ExpenseListProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: 'Expense deleted',
        description: 'The expense has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete expense: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteExpenseMutation.mutateAsync(deleteId);
      } finally {
        setDeleteId(null);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow">
        <div className="p-8 text-center">
          <p>Loading expenses...</p>
        </div>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="bg-white shadow">
        <div className="p-8 text-center">
          <p className="text-gray-500">No expenses found. Add your first expense to get started!</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50">
            <div className="grid grid-cols-6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Description</div>
              <div>Category</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <div key={expense.id} className="grid grid-cols-6 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="col-span-2 flex items-center">
                  <div 
                    className="h-10 w-10 rounded-md flex items-center justify-center text-white"
                    style={{ backgroundColor: getCategoryIcon(expense.category).color }}
                  >
                    {getCategoryIcon(expense.category).icon}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{expense.description || expense.category}</div>
                    <div className="text-sm text-gray-500">{expense.note || 'No details'}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeStyles(expense.category)}`}>
                    {expense.category}
                  </span>
                </div>
                <div className="flex items-center">{formatDate(expense.date)}</div>
                <div className="flex items-center font-medium text-gray-900">{formatCurrency(Number(expense.amount))}</div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setEditExpense(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Expense Dialog */}
      {editExpense && (
        <AddExpenseDialog 
          open={!!editExpense}
          onOpenChange={(open) => !open && setEditExpense(null)}
          expense={editExpense}
        />
      )}
    </>
  );
}
