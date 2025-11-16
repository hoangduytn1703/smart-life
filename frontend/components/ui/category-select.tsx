'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Check, ChevronDown, Search, ChevronRight } from 'lucide-react';
import { Category } from '@/lib/categories';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Input } from './input';

export interface CategorySelectProps {
  categories: Category[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = 'Chọn danh mục',
  className,
}: CategorySelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = React.useRef<HTMLButtonElement>(null);

  // Tách categories thành parent và children
  const parentCategories = useMemo(() => {
    return categories.filter((cat) => !cat.parentId);
  }, [categories]);

  const childCategories = useMemo(() => {
    return categories.filter((cat) => cat.parentId);
  }, [categories]);

  // Tạo map để tìm children nhanh
  const childrenMap = useMemo(() => {
    const map = new Map<string, Category[]>();
    childCategories.forEach((child) => {
      const parentId = child.parentId!;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId)!.push(child);
    });
    // Sắp xếp children theo tên
    map.forEach((children) => {
      children.sort((a, b) => a.name.localeCompare(b.name));
    });
    return map;
  }, [childCategories]);

  // Sắp xếp parent categories theo tên
  const sortedParentCategories = useMemo(() => {
    return [...parentCategories].sort((a, b) => a.name.localeCompare(b.name));
  }, [parentCategories]);

  // Filter categories by search query
  const filteredParentCategories = useMemo(() => {
    if (!searchQuery.trim()) return sortedParentCategories;
    const query = searchQuery.toLowerCase();
    return sortedParentCategories.filter((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(query);
      const childrenMatch = childrenMap.get(cat.id)?.some((child) =>
        child.name.toLowerCase().includes(query)
      );
      return nameMatch || childrenMatch;
    });
  }, [sortedParentCategories, searchQuery, childrenMap]);

  // Tìm category được chọn để hiển thị
  const selectedCategory = useMemo(() => {
    if (!value) return null;
    return categories.find((cat) => cat.id === value);
  }, [categories, value]);

  const handleSelect = (categoryId: string) => {
    if (onValueChange) {
      onValueChange(categoryId);
    }
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Select open={open} onOpenChange={setOpen} value={value}>
      <SelectTrigger ref={inputRef} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="p-0">
        {/* Hidden SelectItems for SelectValue to find the display text */}
        {categories.map((category) => {
          const displayName = category.parent
            ? `${category.parent.name} > ${category.name}`
            : category.name;
          return (
            <SelectItem key={category.id} value={category.id} className="hidden">
              {displayName}
            </SelectItem>
          );
        })}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredParentCategories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy danh mục
            </div>
          ) : (
            filteredParentCategories.map((parent) => {
              const children = childrenMap.get(parent.id) || [];
              const showChildren = !searchQuery.trim() || 
                children.some((child) =>
                  child.name.toLowerCase().includes(searchQuery.toLowerCase())
                ) ||
                parent.name.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <div key={parent.id}>
                  {/* Parent category */}
                  <div
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      value === parent.id && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleSelect(parent.id)}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {value === parent.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                    <span className="pl-6">{parent.name}</span>
                  </div>
                  {/* Children categories */}
                  {showChildren && children.length > 0 && (
                    <div className="pl-4">
                      {children
                        .filter((child) => {
                          if (!searchQuery.trim()) return true;
                          return child.name.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map((child) => (
                          <div
                            key={child.id}
                            className={cn(
                              'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                              value === child.id && 'bg-accent text-accent-foreground'
                            )}
                            onClick={() => handleSelect(child.id)}
                          >
                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                              {value === child.id && (
                                <Check className="h-4 w-4" />
                              )}
                            </span>
                            <ChevronRight className="ml-2 h-3 w-3 text-muted-foreground" />
                            <span className="pl-6">{child.name}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SelectContent>
    </Select>
  );
}

