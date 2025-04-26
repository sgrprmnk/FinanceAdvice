import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/main-layout';
import GoalCard from '@/components/goals/goal-card';
import AddGoalDialog from '@/components/goals/add-goal-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Goal } from '@shared/schema';

export default function GoalsPage() {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Goals Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Savings Goals</h1>
            <p className="mt-1 text-sm text-gray-600">Set, track, and achieve your financial goals.</p>
          </div>
          <Button 
            onClick={() => setIsAddGoalOpen(true)}
            className="inline-flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </div>
        
        {/* Goals Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading goals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
            
            {/* Add New Goal Card */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-400"
              onClick={() => setIsAddGoalOpen(true)}
            >
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Add a new goal</h3>
              <p className="mt-1 text-sm text-gray-500">Start saving for your next milestone</p>
            </div>
          </div>
        )}
        
        {/* Add Goal Dialog */}
        <AddGoalDialog 
          open={isAddGoalOpen}
          onOpenChange={setIsAddGoalOpen}
        />
      </div>
    </MainLayout>
  );
}
