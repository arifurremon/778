"use client";

import { CategorySelector } from '@/components/admin/forms/CategorySelector';
import { FilterPanel } from '@/components/admin/forms/FilterPanel';
import { SearchBar } from '@/components/admin/forms/SearchBar';
import { StatusSelector } from '@/components/admin/forms/StatusSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserFilterState {
  search?: string;
  role?: string;
  status?: string;
  joinedFrom?: string;
  joinedTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

interface UserFiltersProps {
  onFilterChange: (filters: UserFilterState) => void;
  onReset: () => void;
  initialFilters: UserFilterState;
}

export const UserFilters = ({ onFilterChange, onReset, initialFilters }: UserFiltersProps) => {
  const [filters, setFilters] = useState<UserFilterState>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters((prev: UserFilterState) => ({ ...prev, search: searchTerm }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search]);

  // Sync internal state with external reset
  useEffect(() => {
    setFilters(initialFilters);
    setSearchTerm(initialFilters.search || '');
  }, [initialFilters]);

  const handleFilterChange = (key: string, value: string | number) => {
    const newFilters: UserFilterState = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    setSearchTerm('');
    onReset();
  };

  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return false;
    return value !== '' && value !== 'all' && value !== null;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="Search name, email or username..." 
          className="max-w-md"
        />
        
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 px-3 gap-2">
              <X className="h-4 w-4" /> Reset
            </Button>
          )}
        </div>
      </div>

      <FilterPanel 
        activeCount={activeCount} 
        onReset={handleReset}
        onApply={handleApply}
      >
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
          <CategorySelector 
            value={filters.role || 'all'} 
            onValueChange={(v) => handleFilterChange('role', v)}
            options={[
              { label: "All Roles", value: "all" },
              { label: "Admin", value: "admin" },
              { label: "Seller", value: "seller" },
              { label: "Provider", value: "provider" },
              { label: "User", value: "user" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
          <StatusSelector 
            value={filters.status || 'all'} 
            onValueChange={(v) => handleFilterChange('status', v)}
            placeholder="All Statuses"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined From</Label>
          <Input 
            type="date" 
            value={filters.joinedFrom || ''} 
            onChange={(e) => handleFilterChange('joinedFrom', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined To</Label>
          <Input 
            type="date" 
            value={filters.joinedTo || ''} 
            onChange={(e) => handleFilterChange('joinedTo', e.target.value)}
            className="h-9"
          />
        </div>
      </FilterPanel>
    </div>
  );
};
