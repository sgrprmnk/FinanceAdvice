import { useState } from 'react';
import { Goal } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import AddGoalDialog from './add-goal-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const { toast } = useToast();

  const progress = Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>;
      case 'on_track':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">On Track</Badge>;
      case 'behind_schedule':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Behind Schedule</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/goals/${goal.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Goal deleted',
        description: 'The goal has been successfully deleted.',
      });
      setIsDeleting(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete goal: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Form schema for adding funds
  const addFundsSchema = z.object({
    amount: z.string().min(1, "Amount is required").refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      { message: "Amount must be a positive number" }
    ),
  });

  type AddFundsFormValues = z.infer<typeof addFundsSchema>;

  const addFundsForm = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: '',
    },
  });

  const addFundsMutation = useMutation({
    mutationFn: async (data: AddFundsFormValues) => {
      const newAmount = Number(goal.currentAmount) + parseFloat(data.amount);
      
      // Determine if the goal is now completed
      const newStatus = newAmount >= Number(goal.targetAmount) ? 'completed' : goal.status;
      
      return apiRequest('PUT', `/api/goals/${goal.id}`, {
        currentAmount: newAmount,
        status: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Funds added',
        description: 'Funds have been added to your goal successfully.',
      });
      setIsAddingFunds(false);
      addFundsForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add funds: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onAddFundsSubmit = (data: AddFundsFormValues) => {
    addFundsMutation.mutate(data);
  };

  return (
    <>
      <Card className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
            {getStatusBadge(goal.status)}
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Progress</span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
            <Progress className="mt-2 h-2.5" value={progress} />
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <span className="block text-sm font-medium text-gray-500">Current</span>
              <span className="block text-xl font-medium text-gray-900">{formatCurrency(Number(goal.currentAmount))}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Target</span>
              <span className="block text-xl font-medium text-gray-900">{formatCurrency(Number(goal.targetAmount))}</span>
            </div>
          </div>
        </div>
        {goal.targetDate && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              <span>Target date: </span>
              <span className="font-medium text-gray-900">{formatDate(goal.targetDate)}</span>
            </div>
          </div>
        )}
        <div className="px-6 py-4 flex justify-end space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddingFunds(true)}
          >
            Add Funds
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleting(true)}
          >
            Delete
          </Button>
        </div>
      </Card>

      {/* Edit Goal Dialog */}
      {isEditing && (
        <AddGoalDialog 
          open={isEditing}
          onOpenChange={setIsEditing}
          goal={goal}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{goal.name}" goal and all its progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteGoalMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Funds Dialog */}
      <Dialog open={isAddingFunds} onOpenChange={setIsAddingFunds}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Funds to {goal.name}</DialogTitle>
          </DialogHeader>
          
          <Form {...addFundsForm}>
            <form onSubmit={addFundsForm.handleSubmit(onAddFundsSubmit)} className="space-y-4">
              <FormField
                control={addFundsForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Add</FormLabel>
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingFunds(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addFundsMutation.isPending}
                >
                  {addFundsMutation.isPending ? 'Adding...' : 'Add Funds'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
