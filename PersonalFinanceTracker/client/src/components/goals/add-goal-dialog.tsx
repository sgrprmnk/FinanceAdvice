import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GOAL_STATUSES, Goal, insertGoalSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal; // If provided, we're editing an existing goal
}

export default function AddGoalDialog({ open, onOpenChange, goal }: AddGoalDialogProps) {
  const { toast } = useToast();
  const isEditing = !!goal;

  // Create a schema for the form
  const formSchema = insertGoalSchema
    .omit({ userId: true }) // Remove userId as this will be set server-side
    .extend({
      targetAmount: z.string().min(1, "Target amount is required").refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        { message: "Target amount must be a positive number" }
      ),
      currentAmount: z.string().refine(
        (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        { message: "Current amount must be a non-negative number" }
      ),
      targetDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Please enter a valid date",
      }),
    });

  type FormValues = z.infer<typeof formSchema>;

  // Convert goal data for form initial values
  const defaultValues: Partial<FormValues> = {
    name: goal?.name || '',
    targetAmount: goal ? String(goal.targetAmount) : '',
    currentAmount: goal ? String(goal.currentAmount) : '0',
    status: goal?.status || 'in_progress',
    targetDate: goal?.targetDate ? format(new Date(goal.targetDate), 'yyyy-MM-dd') : undefined,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const goalMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert numeric strings to numbers before sending to the API
      const payload = {
        ...data,
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: data.currentAmount ? parseFloat(data.currentAmount) : 0,
      };
      
      if (isEditing && goal) {
        return apiRequest('PUT', `/api/goals/${goal.id}`, payload);
      } else {
        return apiRequest('POST', '/api/goals', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: isEditing ? 'Goal updated' : 'Goal added',
        description: isEditing 
          ? 'Your goal has been updated successfully.' 
          : 'Your goal has been added successfully.',
      });
      onOpenChange(false);
      form.reset(defaultValues);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'add'} goal: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    goalMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Emergency Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="5000.00" 
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
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0.00" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="behind_schedule">Behind Schedule</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      value={field.value || ''}
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={goalMutation.isPending}
              >
                {goalMutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
