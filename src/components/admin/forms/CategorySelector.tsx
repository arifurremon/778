import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  label: string;
  value: string;
}

interface CategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export const CategorySelector = ({ 
  value, 
  onValueChange, 
  options,
  placeholder = "Select category",
  label,
  className
}: CategorySelectorProps) => {
  return (
    <div className={className}>
      {label && <label className="text-xs font-medium text-muted-foreground block mb-2">{label}</label>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
