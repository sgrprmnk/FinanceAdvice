import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPENSE_CATEGORIES, Expense, insertExpenseSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense; // If provided, we're editing an existing expense
}

export default function AddExpenseDialog({ open, onOpenChange, expense }: AddExpenseDialogProps) {
  const { toast } = useToast();
  const isEditing = !!expense;

  // Create a schema for the form
  const formSchema = insertExpenseSchema
    .omit({ userId: true }) // Remove userId as this will be set server-side
    .extend({
      amount: z.string().min(1, "Amount is required").refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        { message: "Amount must be a positive number" }
      ),
      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Please enter a valid date",
      }),
    });

  type FormValues = z.infer<typeof formSchema>;

  // Convert expense data for form initial values
  const defaultValues: FormValues = {
    amount: expense ? String(expense.amount) : '',
    category: expense?.category || 'Food',
    description: expense?.description || '',
    note: expense?.note || '',
    date: expense?.date ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert amount to a number before sending to the API
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        // The date needs to be a proper date format
        date: new Date(data.date).toISOString().split('T')[0]
      };
      
      if (isEditing) {
        return apiRequest('PUT', `/api/expenses/${expense.id}`, payload);
      } else {
        return apiRequest('POST', '/api/expenses', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: isEditing ? 'Expense updated' : 'Expense added',
        description: isEditing 
          ? 'Your expense has been updated successfully.' 
          : 'Your expense has been added successfully.',
      });
      onOpenChange(false);
      form.reset(defaultValues);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'add'} expense: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your expense details below.' : 'Fill in the expense details below.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0.00" 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Grocery shopping" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Weekly grocery shopping at Whole Foods" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
