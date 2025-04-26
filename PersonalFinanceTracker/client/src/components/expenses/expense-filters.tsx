import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPENSE_CATEGORIES } from '@shared/schema';

export type DateFilter = '7days' | '30days' | 'month' | 'year' | 'all';
export type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

interface ExpenseFiltersProps {
  onCategoryChange: (category: string) => void;
  onDateFilterChange: (filter: DateFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (search: string) => void;
}

export default function ExpenseFilters({
  onCategoryChange,
  onDateFilterChange,
  onSortChange,
  onSearchChange
}: ExpenseFiltersProps) {
  return (
    <Card className="bg-white shadow mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <Label htmlFor="category-filter" className="mb-1">Category</Label>
            <Select 
              onValueChange={(value) => onCategoryChange(value)}
              defaultValue="all"
            >
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date-filter" className="mb-1">Time Period</Label>
            <Select 
              onValueChange={(value) => onDateFilterChange(value as DateFilter)}
              defaultValue="30days"
            >
              <SelectTrigger id="date-filter">
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sort-filter" className="mb-1">Sort by</Label>
            <Select 
              onValueChange={(value) => onSortChange(value as SortOption)}
              defaultValue="newest"
            >
              <SelectTrigger id="sort-filter">
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="amount_high">Amount (high to low)</SelectItem>
                <SelectItem value="amount_low">Amount (low to high)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="search-expenses" className="mb-1">Search</Label>
            <Input 
              type="text" 
              id="search-expenses" 
              placeholder="Search expenses..."
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
