'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, categoriesApi } from '@/lib';
import { walletsApi } from '@/lib/wallets';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategorySelect } from '@/components/ui/category-select';
import { AmountInput } from '@/components/ui/amount-input';
import { FlowbiteDatepicker } from '@/components/ui/datepicker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Calendar, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Số tiền phải lớn hơn 0'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  description: z.string().optional(),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  walletId: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Tạo chi tiêu thành công',
      });
      setIsDialogOpen(false);
      reset();
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
    mutationFn: ({ id, data }: { id: string; data: any }) => expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Cập nhật chi tiêu thành công',
      });
      setIsDialogOpen(false);
      setEditingExpense(null);
      reset();
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
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Xóa chi tiêu thành công',
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

  const handleEdit = (expense: any) => {
    setEditingExpense(expense.id);
    setValue('amount', expense.amount);
    setValue('categoryId', expense.categoryId);
    setValue('description', expense.description || '');
    setValue('date', format(new Date(expense.date), 'yyyy-MM-dd'));
    setValue('walletId', expense.walletId || '');
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chi tiêu này?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ExpenseFormData) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const expenses = expensesData?.data || [];
  const categories = categoriesData?.data || [];
  const wallets = walletsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý chi tiêu</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý các khoản chi tiêu của bạn</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm chi tiêu
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có chi tiêu nào</p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Thêm chi tiêu đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        {formatCurrency(expense.amount)} đ
                      </h3>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                        {expense.category.name}
                      </span>
                      {expense.wallet && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          {expense.wallet.name}
                        </span>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-muted-foreground mb-2">{expense.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(expense.date), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          onInteractOutside={(e) => {
            // Prevent dialog from closing when clicking on datepicker dropdown
            const target = e.target as HTMLElement;
            if (target.closest('.datepicker-dropdown')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Chỉnh sửa chi tiêu' : 'Thêm chi tiêu mới'}</DialogTitle>
            <DialogDescription>
              {editingExpense
                ? 'Cập nhật thông tin chi tiêu của bạn'
                : 'Thêm một khoản chi tiêu mới vào danh sách'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền *</Label>
              <AmountInput
                id="amount"
                value={watch('amount')}
                onChange={(value) => setValue('amount', value, { shouldValidate: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Danh mục *</Label>
              <CategorySelect
                categories={categories}
                value={watch('categoryId')}
                onValueChange={(value) => setValue('categoryId', value)}
                placeholder="Chọn danh mục"
              />
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                type="text"
                placeholder="Mô tả chi tiêu..."
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletId">Ví</Label>
              <Select
                value={watch('walletId') || 'none'}
                onValueChange={(value) => setValue('walletId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ví (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn ví</SelectItem>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.icon} {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Ngày *</Label>
              <FlowbiteDatepicker
                id="date"
                value={watch('date')}
                onChange={(value) => setValue('date', value, { shouldValidate: true })}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingExpense(null);
                  reset();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingExpense ? 'Cập nhật' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

