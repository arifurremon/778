"use client";

import { useState, useCallback } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface AdminTableToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  filters?: { key: string; label: string; options: FilterOption[] }[];
  activeFilters?: Record<string, string>;
  onFilter?: (key: string, value: string) => void;
  selectedCount?: number;
  bulkActions?: { label: string; value: string; variant?: "default" | "destructive" }[];
  onBulkAction?: (action: string) => void;
}

export function AdminTableToolbar({
  search,
  onSearch,
  placeholder = "Search...",
  filters = [],
  activeFilters = {},
  onFilter,
  selectedCount = 0,
  bulkActions = [],
  onBulkAction,
}: AdminTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Bulk action bar */}
      {selectedCount > 0 && bulkActions.length > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-primary">{selectedCount} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            {bulkActions.map((action) => (
              <Button
                key={action.value}
                size="sm"
                variant={action.variant === "destructive" ? "destructive" : "outline"}
                className="h-8 text-xs font-bold rounded-lg"
                onClick={() => onBulkAction?.(action.value)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-10 h-10 bg-card/30 border-border/50 rounded-xl font-medium text-sm"
          />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-1">
            {filter.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilter?.(filter.key, opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                  activeFilters[filter.key] === opt.value
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:border-border/50 hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
}

export function AdminPagination({ page, totalPages, onPageChange, total, limit }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = ((page - 1) * (limit ?? 20)) + 1;
  const endItem = Math.min(page * (limit ?? 20), total ?? 0);

  return (
    <div className="flex items-center justify-between py-4 px-1">
      {total !== undefined && (
        <p className="text-xs font-medium text-muted-foreground">
          Showing <span className="font-bold text-foreground">{startItem}–{endItem}</span> of <span className="font-bold text-foreground">{total.toLocaleString()}</span>
        </p>
      )}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={14} />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                  pageNum === page
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function AdminEmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="py-20 text-center">
      {icon && <div className="flex justify-center mb-4 text-muted-foreground/30">{icon}</div>}
      <h3 className="text-sm font-bold text-muted-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground/60 mt-1">{description}</p>}
    </div>
  );
}
