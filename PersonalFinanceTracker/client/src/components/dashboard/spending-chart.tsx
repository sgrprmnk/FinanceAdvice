import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { getCategoryColor } from '@/lib/category-utils';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, ChartData, ChartOptions, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface SpendingChartProps {
  expenses: Expense[];
  isLoading: boolean;
}

export default function SpendingChart({ expenses, isLoading }: SpendingChartProps) {
  // Function to group expenses by month
  const getMonthlyData = () => {
    const today = new Date();
    const monthLabels = [];
    const monthlyTotals = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear();
      monthLabels.push(monthYear);
      
      // Filter expenses for this month
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === d.getMonth() && expenseDate.getFullYear() === d.getFullYear();
      });
      
      const total = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      monthlyTotals.push(total);
    }
    
    return { labels: monthLabels, data: monthlyTotals };
  };
  
  // Function to group expenses by category
  const getCategoryData = () => {
    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const category = expense.category;
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += Number(expense.amount);
    });
    
    // Sort categories by total amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);
    
    const data = sortedCategories.map(category => categoryTotals[category]);
    
    // Get colors for each category
    const colors = sortedCategories.map(category => getCategoryColor(category));
    
    return { 
      labels: sortedCategories, 
      data, 
      colors
    };
  };
  
  // Prepare chart data
  const monthlyData = !isLoading ? getMonthlyData() : { labels: [], data: [] };
  const categoryData = !isLoading ? getCategoryData() : { labels: [], data: [], colors: [] };
  
  const lineChartData: ChartData<'line'> = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthlyData.data,
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };
  
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value as number);
          }
        }
      }
    }
  };
  
  const doughnutChartData: ChartData<'doughnut'> = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: categoryData.colors,
        borderWidth: 0
      }
    ]
  };
  
  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((context.parsed / total) * 100);
            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white shadow">
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2 bg-white shadow">
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <Line data={lineChartData} options={lineChartOptions} />
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {categoryData.data.length > 0 ? (
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No expense data to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
