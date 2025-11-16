'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '@/lib/expenses';
import { incomesApi } from '@/lib/incomes';
import { categoriesApi } from '@/lib/categories';
import { walletsApi } from '@/lib/wallets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategorySelect } from '@/components/ui/category-select';
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
import { AmountInput } from '@/components/ui/amount-input';
import { FlowbiteDatepicker } from '@/components/ui/datepicker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { DollarSign, Calendar, TrendingUp, Plus, Wallet, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Số tiền phải lớn hơn 0'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  description: z.string().optional(),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  walletId: z.string().optional(),
});

const incomeSchema = z.object({
  amount: z.number().min(0.01, 'Số tiền phải lớn hơn 0'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  description: z.string().optional(),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  walletId: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;
type IncomeFormData = z.infer<typeof incomeSchema>;

export default function DashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'category' | 'wallet'>('category');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: totalBalanceData } = useQuery({
    queryKey: ['wallets', 'total-balance'],
    queryFn: () => walletsApi.getTotalBalance(),
  });

  const wallets = walletsData?.data || [];
  const allCategories = categoriesData?.data || [];
  const categories = allCategories.filter((cat) => cat.type === transactionType || !cat.type);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ExpenseFormData | IncomeFormData>({
    resolver: zodResolver(transactionType === 'expense' ? expenseSchema : incomeSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'weekly'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'monthly'] });
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

  const createIncomeMutation = useMutation({
    mutationFn: incomesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', 'weekly'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Tạo thu nhập thành công',
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

  const onSubmit = (data: ExpenseFormData | IncomeFormData) => {
    if (transactionType === 'expense') {
      createExpenseMutation.mutate(data as ExpenseFormData);
    } else {
      createIncomeMutation.mutate(data as IncomeFormData);
    }
  };

  const { data: expenseAnalytics, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expenses', 'analytics', monthStart, monthEnd, selectedWalletId],
    queryFn: () => {
      const params: any = { startDate: monthStart, endDate: monthEnd };
      if (selectedWalletId !== 'all') params.walletId = selectedWalletId;
      return expensesApi.getAnalytics(params);
    },
    enabled: transactionType === 'expense',
  });

  const { data: incomeAnalytics, isLoading: isLoadingIncome } = useQuery({
    queryKey: ['incomes', 'analytics', monthStart, monthEnd, selectedWalletId],
    queryFn: () => {
      const params: any = { startDate: monthStart, endDate: monthEnd };
      if (selectedWalletId !== 'all') params.walletId = selectedWalletId;
      return incomesApi.getAnalytics(params);
    },
    enabled: transactionType === 'income',
  });

  const analytics = transactionType === 'expense' ? expenseAnalytics : incomeAnalytics;
  const isLoading = transactionType === 'expense' ? isLoadingExpense : isLoadingIncome;

  const { data: expenseDailyTotal } = useQuery({
    queryKey: ['expenses', 'daily', today],
    queryFn: () => expensesApi.getDailyTotal(today),
    enabled: transactionType === 'expense',
  });

  const { data: incomeDailyTotal } = useQuery({
    queryKey: ['incomes', 'daily', today],
    queryFn: () => incomesApi.getDailyTotal(today),
    enabled: transactionType === 'income',
  });

  const dailyTotal = transactionType === 'expense' ? expenseDailyTotal : incomeDailyTotal;

  const { data: expenseWeeklyTotal } = useQuery({
    queryKey: ['expenses', 'weekly', weekStart],
    queryFn: () => expensesApi.getWeeklyTotal(weekStart),
    enabled: transactionType === 'expense',
  });

  const { data: incomeWeeklyTotal } = useQuery({
    queryKey: ['incomes', 'weekly', weekStart],
    queryFn: () => incomesApi.getWeeklyTotal(weekStart),
    enabled: transactionType === 'income',
  });

  const weeklyTotal = transactionType === 'expense' ? expenseWeeklyTotal : incomeWeeklyTotal;

  const { data: expenseMonthlyTotal } = useQuery({
    queryKey: ['expenses', 'monthly', new Date().getFullYear(), new Date().getMonth() + 1],
    queryFn: () =>
      expensesApi.getMonthlyTotal(new Date().getFullYear(), new Date().getMonth() + 1),
    enabled: transactionType === 'expense',
  });

  const { data: incomeMonthlyTotal } = useQuery({
    queryKey: ['incomes', 'monthly', new Date().getFullYear(), new Date().getMonth() + 1],
    queryFn: () =>
      incomesApi.getMonthlyTotal(new Date().getFullYear(), new Date().getMonth() + 1),
    enabled: transactionType === 'income',
  });

  const monthlyTotal = transactionType === 'expense' ? expenseMonthlyTotal : incomeMonthlyTotal;

  // Group categories by parent for chart display
  const categoryData = useMemo(() => {
    const analyticsData = analytics?.data;
    if (!analyticsData?.categoryBreakdown || !categories.length) return [];
    
    // Create a map of category name to category object
    const categoryMap = new Map<string, typeof categories[0]>();
    categories.forEach((cat) => {
      categoryMap.set(cat.name, cat);
    });
    
    // Group by parent category
    const parentMap = new Map<string, { name: string; value: number; children: Array<{ name: string; value: number; categoryId: string }> }>();
    
    analyticsData.categoryBreakdown.forEach((item: any) => {
      const category = categoryMap.get(item.categoryName);
      const parentCategory = category?.parent || category;
      const parentName = parentCategory?.name || item.categoryName;
      
      if (!parentMap.has(parentName)) {
        parentMap.set(parentName, {
          name: parentName,
          value: 0,
          children: [],
        });
      }
      
      const parentData = parentMap.get(parentName)!;
      parentData.value += Number(item.totalAmount);
      parentData.children.push({
        name: item.categoryName,
        value: Number(item.totalAmount),
        categoryId: item.categoryId,
      });
    });
    
    return Array.from(parentMap.values()).sort((a, b) => b.value - a.value);
  }, [analytics?.data, categories]);

  const walletData =
    analytics?.data?.walletBreakdown?.map((item: any) => ({
      name: item.walletName,
      value: Number(item.totalAmount),
    })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const chartData = viewMode === 'category' 
    ? categoryData.map((item) => ({ name: item.name, value: item.value }))
    : walletData;

  const dailyStatsData =
    analytics?.data?.dailyStats
      ?.slice(-7)
      .map((item: any) => ({
        date: format(new Date(item.date), 'dd/MM'),
        total: Number(item.total),
      })) || [];

  const handleAddClick = (type: 'expense' | 'income') => {
    setTransactionType(type);
    setIsDialogOpen(true);
    setShowAddMenu(false);
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen -m-8 p-8">
      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-white/90">Số tiền hiện tại</CardTitle>
          <Wallet className="h-6 w-6 text-white/80" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-1">
            {formatCurrency(totalBalanceData?.data?.totalBalance || 0)} đ
          </div>
          <p className="text-sm text-white/80">Tổng số dư trong tất cả ví</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Tổng quan
          </h1>
          <p className="text-gray-600 text-lg">
            {transactionType === 'expense' ? 'Thống kê chi tiêu của bạn' : 'Thống kê thu nhập của bạn'}
          </p>
        </div>
        
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
              <button
                onClick={() => setTransactionType('expense')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  transactionType === 'expense'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chi tiêu
              </button>
              <button
                onClick={() => setTransactionType('income')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  transactionType === 'income'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Thu nhập
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Xem theo:</label>
              <Select value={viewMode} onValueChange={(value: 'category' | 'wallet') => setViewMode(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Danh mục</SelectItem>
                  <SelectItem value="wallet">Ví</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {viewMode === 'wallet' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Ví:</label>
                <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tất cả ví" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả ví</SelectItem>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.icon} {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="relative">
            <Button 
              onClick={() => setShowAddMenu(!showAddMenu)} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-full w-12 h-12 p-0 shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </Button>
            {showAddMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute right-0 top-14 z-20 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px]">
                  <button
                    onClick={() => handleAddClick('expense')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <span className="text-red-500">-</span>
                    <span>Thêm chi tiêu</span>
                  </button>
                  <button
                    onClick={() => handleAddClick('income')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <span className="text-green-500">+</span>
                    <span>Thêm thu nhập</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Hôm nay</CardTitle>
            <Calendar className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(dailyTotal?.data?.total || 0)} đ
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Tuần này</CardTitle>
            <TrendingUp className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(weeklyTotal?.data?.total || 0)} đ
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Tháng này</CardTitle>
            <DollarSign className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(monthlyTotal?.data?.total || 0)} đ
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Tổng cộng</CardTitle>
            <DollarSign className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(analytics?.data?.total || 0)} đ
            </div>
            <p className="text-xs text-white/80 mt-1">
              {analytics?.data?.count || 0} giao dịch
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              {viewMode === 'category' 
                ? (transactionType === 'expense' ? 'Chi tiêu theo danh mục' : 'Thu nhập theo danh mục')
                : (transactionType === 'expense' ? 'Chi tiêu theo ví' : 'Thu nhập theo ví')}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {viewMode === 'category' 
                ? (transactionType === 'expense' 
                  ? 'Phân bổ chi tiêu trong tháng theo danh mục'
                  : 'Phân bổ thu nhập trong tháng theo danh mục')
                : selectedWalletId === 'all'
                ? (transactionType === 'expense'
                  ? 'Phân bổ chi tiêu trong tháng theo tất cả các ví'
                  : 'Phân bổ thu nhập trong tháng theo tất cả các ví')
                : (transactionType === 'expense'
                  ? 'Phân bổ chi tiêu trong tháng theo ví đã chọn'
                  : 'Phân bổ thu nhập trong tháng theo ví đã chọn')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && viewMode === 'category') {
                        const data = payload[0];
                        const parentData = categoryData.find((item) => item.name === data.name);
                        if (parentData && parentData.children.length > 0) {
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <div className="font-semibold mb-2">{data.name}: {formatCurrency(data.value as number)} đ</div>
                              <div className="text-xs space-y-1">
                                {parentData.children.map((child) => (
                                  <div key={child.categoryId} className="text-gray-600">
                                    • {child.name}: {formatCurrency(child.value)} đ
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      }
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <div className="font-semibold">{data.name}: {formatCurrency(data.value as number)} đ</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Chưa có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              {transactionType === 'expense' ? 'Chi tiêu 7 ngày gần nhất' : 'Thu nhập 7 ngày gần nhất'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {transactionType === 'expense' ? 'Biểu đồ chi tiêu theo ngày' : 'Biểu đồ thu nhập theo ngày'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyStatsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyStatsData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${formatCurrency(value)} đ`} />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Chưa có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Dialog */}
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
            <DialogTitle>{transactionType === 'expense' ? 'Thêm chi tiêu mới' : 'Thêm thu nhập mới'}</DialogTitle>
            <DialogDescription>
              {transactionType === 'expense' 
                ? 'Thêm một khoản chi tiêu mới vào danh sách'
                : 'Thêm một khoản thu nhập mới vào danh sách'}
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
                  reset();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={transactionType === 'expense' ? createExpenseMutation.isPending : createIncomeMutation.isPending}>
                Thêm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

