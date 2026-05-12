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

interface SelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
}

export const StatusSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Select status",
  label 
}: Omit<SelectorProps, 'options'>) => {
  const options = [
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Suspended", value: "suspended" },
    { label: "Resolved", value: "resolved" },
    { label: "Rejected", value: "rejected" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
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

export const CategorySelector = ({ 
  value, 
  onValueChange, 
  options,
  placeholder = "Select category",
  label 
}: SelectorProps) => {
  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
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
