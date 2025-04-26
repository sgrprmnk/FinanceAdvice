import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { getCategoryColor } from '@/lib/category-utils';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

interface InsightsChartsProps {
  expenses: Expense[];
  isLoading: boolean;
}

type TimeFilter = '1month' | '3months' | '6months' | '1year' | 'all';

export default function InsightsCharts({ expenses, isLoading }: InsightsChartsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('3months');
  
  // Filter expenses based on time filter
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const today = new Date();
    
    switch (timeFilter) {
      case '1month':
        const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        return expenseDate >= oneMonthAgo;
      case '3months':
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        return expenseDate >= threeMonthsAgo;
      case '6months':
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        return expenseDate >= sixMonthsAgo;
      case '1year':
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        return expenseDate >= oneYearAgo;
      case 'all':
      default:
        return true;
    }
  });
  
  // Category distribution chart
  const getCategoryData = () => {
    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
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
    
    // Calculate percentages
    const total = data.reduce((sum, value) => sum + value, 0);
    const percentages = data.map(value => Math.round((value / total) * 100));
    
    // Get colors for each category
    const colors = sortedCategories.map(category => getCategoryColor(category));
    
    return { 
      labels: sortedCategories, 
      data, 
      percentages,
      colors,
      total
    };
  };
  
  // Monthly trend chart
  const getMonthlyData = () => {
    const today = new Date();
    const monthLabels = [];
    const monthlyTotals = [];
    
    // Determine number of months to show based on time filter
    let monthsToShow = 12;
    switch (timeFilter) {
      case '1month': monthsToShow = 1; break;
      case '3months': monthsToShow = 3; break;
      case '6months': monthsToShow = 6; break;
      case '1year': monthsToShow = 12; break;
      case 'all': monthsToShow = 24; break; // Show up to 2 years for "all"
    }
    
    // Get months data
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear();
      monthLabels.push(monthYear);
      
      // Filter expenses for this month
      const monthlyExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === d.getMonth() && expenseDate.getFullYear() === d.getFullYear();
      });
      
      const total = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      monthlyTotals.push(total);
    }
    
    // Calculate month-over-month change
    let change = 0;
    let changePercentage = 0;
    
    if (monthlyTotals.length >= 2) {
      const currentMonth = monthlyTotals[monthlyTotals.length - 1];
      const previousMonth = monthlyTotals[monthlyTotals.length - 2];
      
      if (previousMonth > 0) {
        change = currentMonth - previousMonth;
        changePercentage = Math.round((change / previousMonth) * 100);
      }
    }
    
    return { 
      labels: monthLabels, 
      data: monthlyTotals,
      change,
      changePercentage
    };
  };
  
  // Day of week analysis
  const getWeekdayData = () => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      weekdayTotals[day] += Number(expense.amount);
      weekdayCounts[day]++;
    });
    
    // Calculate average daily spending
    const weekdayAverages = weekdayTotals.map((total, i) => 
      weekdayCounts[i] > 0 ? total / weekdayCounts[i] : 0
    );
    
    // Find the day with highest average spending
    let highestDay = 0;
    let highestAvg = 0;
    
    weekdayAverages.forEach((avg, i) => {
      if (avg > highestAvg) {
        highestAvg = avg;
        highestDay = i;
      }
    });
    
    return { 
      labels: weekdays, 
      data: weekdayAverages,
      highestDay: weekdays[highestDay],
      highestAvg
    };
  };
  
  // Prepare chart data
  const categoryData = !isLoading ? getCategoryData() : { labels: [], data: [], percentages: [], colors: [], total: 0 };
  const monthlyData = !isLoading ? getMonthlyData() : { labels: [], data: [], change: 0, changePercentage: 0 };
  const weekdayData = !isLoading ? getWeekdayData() : { labels: [], data: [], highestDay: '', highestAvg: 0 };
  
  // Chart configurations
  const pieChartData: ChartData<'pie'> = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: categoryData.colors,
        borderWidth: 0
      }
    ]
  };
  
  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.raw as number);
            const percentage = categoryData.percentages[context.dataIndex];
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
  
  const barChartData: ChartData<'bar'> = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthlyData.data,
        backgroundColor: 'rgb(79, 70, 229)',
      }
    ]
  };
  
  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.raw as number);
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
  
  const weekdayChartData: ChartData<'bar'> = {
    labels: weekdayData.labels,
    datasets: [
      {
        label: 'Average Daily Spending',
        data: weekdayData.data,
        backgroundColor: 'rgb(16, 185, 129)',
      }
    ]
  };
  
  const weekdayChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.raw as number);
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Loading insights...</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p>Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Time Period Filter */}
      <div className="mb-6 flex justify-end">
        <Select 
          onValueChange={(value) => setTimeFilter(value as TimeFilter)}
          defaultValue={timeFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Last 3 Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">This Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Chart Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Distribution Chart */}
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryData.data.length > 0 ? (
                <Pie data={pieChartData} options={pieChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No expense data to display
                </div>
              )}
            </div>
            {categoryData.data.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {categoryData.labels.slice(0, 6).map((category, i) => (
                  <div key={category} className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: categoryData.colors[i] }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {category} ({categoryData.percentages[i]}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Monthly Trend Chart */}
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Monthly Spending Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {monthlyData.data.length > 0 ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No expense data to display
                </div>
              )}
            </div>
            {monthlyData.change !== 0 && (
              <div className={`mt-4 rounded-lg p-4 ${monthlyData.change < 0 ? 'bg-green-50' : 'bg-blue-50'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {monthlyData.change < 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm ${monthlyData.change < 0 ? 'text-green-700' : 'text-blue-700'}`}>
                      {monthlyData.change < 0 
                        ? `Your spending decreased by ${Math.abs(monthlyData.changePercentage)}% compared to last month. Keep up the good work!`
                        : `Your spending increased by ${monthlyData.changePercentage}% compared to last month. Consider reviewing your budget.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Weekly Comparison Chart */}
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Day of Week Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {weekdayData.data.some(val => val > 0) ? (
                <Bar data={weekdayChartData} options={weekdayChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No expense data to display
                </div>
              )}
            </div>
            {weekdayData.highestAvg > 0 && (
              <div className="mt-4 bg-yellow-50 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-yellow-700">
                      You tend to spend more on {weekdayData.highestDay}s, with an average of {formatCurrency(weekdayData.highestAvg)} per day. Consider setting a weekend budget.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Spending Anomalies */}
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle>Spending Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.labels.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Top Spending Category: {categoryData.labels[0]}</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          {categoryData.percentages[0]}% of your total spending (
                          {formatCurrency(categoryData.data[0])}) went to {categoryData.labels[0].toLowerCase()}.
                          {categoryData.percentages[0] > 30 && " This is a significant portion of your budget."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {monthlyData.data.length >= 2 && monthlyData.changePercentage > 15 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Spending increased by {monthlyData.changePercentage}% last month</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Your expenses were significantly higher than your usual average. This may affect your savings goals.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {monthlyData.data.length >= 2 && monthlyData.changePercentage < -10 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Spending decreased by {Math.abs(monthlyData.changePercentage)}% last month</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Great job reducing your expenses! Your budgeting efforts are paying off.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {filteredExpenses.length === 0 && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">No expense data available</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Start tracking your expenses to see insights and analytics about your spending habits.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
