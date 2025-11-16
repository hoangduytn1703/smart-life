'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, Category } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Search,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  parentId: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Màu sắc nhẹ nhàng theo MoneyLover style - icon tròn với màu pastel
const categoryIconColors = [
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-yellow-100 text-yellow-600',
  'bg-orange-100 text-orange-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-teal-100 text-teal-600',
  'bg-indigo-100 text-indigo-600',
  'bg-rose-100 text-rose-600',
  'bg-cyan-100 text-cyan-600',
  'bg-emerald-100 text-emerald-600',
  'bg-violet-100 text-violet-600',
];

const getCategoryIconColor = (index: number) => {
  return categoryIconColors[index % categoryIconColors.length];
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const importMutation = useMutation({
    mutationFn: categoriesApi.importDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Thành công',
        description: 'Import danh mục mặc định thành công',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Thành công',
        description: 'Tạo danh mục thành công',
      });
      setIsDialogOpen(false);
      reset();
      setSelectedParentId(undefined);
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Thành công',
        description: 'Cập nhật danh mục thành công',
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      reset();
      setSelectedParentId(undefined);
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Thành công',
        description: 'Xóa danh mục thành công',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category.id);
    setValue('name', category.name);
    setSelectedParentId(category.parentId || undefined);
    setValue('parentId', category.parentId || undefined);
    setIsDialogOpen(true);
  };

  const handleAddSubcategory = (parentId: string) => {
    setSelectedParentId(parentId);
    setValue('parentId', parentId);
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ 
        id: editingCategory, 
        data: {
          name: data.name,
          parentId: data.parentId || null,
        }
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const categories = categoriesData?.data || [];
  
  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter((cat) => 
      cat.name.toLowerCase().includes(query) ||
      (cat.parent && cat.parent.name.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  // Tách categories thành parent và children
  const parentCategories = filteredCategories.filter((cat) => !cat.parentId);
  const childCategories = filteredCategories.filter((cat) => cat.parentId);

  // Tạo map để tìm children nhanh
  const childrenMap = new Map<string, Category[]>();
  childCategories.forEach((child) => {
    const parentId = child.parentId!;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(child);
  });

  // Sắp xếp children theo tên
  childrenMap.forEach((children) => {
    children.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Sắp xếp parent categories theo tên
  const sortedParentCategories = [...parentCategories].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  const renderCategory = (category: Category, level: number = 0, index: number = 0) => {
    const children = childrenMap.get(category.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const iconColorClass = getCategoryIconColor(index);

    return (
      <div key={category.id}>
        <div className={cn(
          "flex items-center gap-3 py-3 px-4 rounded-lg transition-colors hover:bg-gray-50 group",
          level > 0 && "ml-8"
        )}>
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-1 rounded transition-colors hover:bg-gray-200 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}

          {/* Icon circle */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            iconColorClass
          )}>
            <span className="text-lg">{category.name.charAt(0)}</span>
          </div>

          {/* Category name */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium text-gray-900",
              level === 0 ? "text-base" : "text-sm"
            )}>
              {category.name}
            </h3>
          </div>

          {/* Children count badge */}
          {hasChildren && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {children.length}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {level === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddSubcategory(category.id)}
                className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(category)}
              className="h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(category.id)}
              className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children categories */}
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 pl-4">
            {children.map((child, idx) => renderCategory(child, level + 1, idx))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nhóm</h1>
              <p className="text-sm text-gray-500 mt-1">Quản lý danh mục chi tiêu</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Import mặc định
              </Button>
              <Button 
                onClick={() => {
                  setEditingCategory(null);
                  setSelectedParentId(undefined);
                  setValue('parentId', undefined);
                  setIsDialogOpen(true);
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm nhóm
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 focus:border-gray-400 focus:ring-gray-400 bg-white"
            />
          </div>
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : sortedParentCategories.length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📁</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có danh mục nào</h3>
              <p className="text-sm text-gray-500 mb-4">Bắt đầu bằng cách tạo danh mục đầu tiên của bạn hoặc import danh mục mặc định</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import mặc định
                </Button>
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setSelectedParentId(undefined);
                    setValue('parentId', undefined);
                    setIsDialogOpen(true);
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo danh mục đầu tiên
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-2">
              <div className="space-y-1">
                {sortedParentCategories.map((category, index) => renderCategory(category, 0, index))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingCategory
                  ? 'Cập nhật thông tin danh mục'
                  : 'Tạo một danh mục mới để phân loại chi tiêu'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Tên danh mục *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ví dụ: Ăn uống, Đi lại..."
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId" className="text-gray-700 font-medium">
                  Danh mục cha (tùy chọn)
                </Label>
                <Select
                  value={selectedParentId || '__none__'}
                  onValueChange={(value) => {
                    const finalValue = value === '__none__' ? undefined : value;
                    setSelectedParentId(finalValue);
                    setValue('parentId', finalValue);
                  }}
                >
                  <SelectTrigger className="border-gray-300 focus:border-gray-400 focus:ring-gray-400">
                    <SelectValue placeholder="Chọn danh mục cha (để trống nếu là danh mục gốc)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không có (danh mục gốc)</SelectItem>
                    {sortedParentCategories
                      .filter((cat) => !editingCategory || cat.id !== editingCategory)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Chọn danh mục cha để tạo danh mục con. Để trống nếu đây là danh mục gốc.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingCategory(null);
                    setSelectedParentId(undefined);
                    reset();
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {editingCategory ? 'Cập nhật' : 'Thêm'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
