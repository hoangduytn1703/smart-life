'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expensesApi } from '@/lib/expenses';
import { categoriesApi } from '@/lib/categories';
import { walletsApi } from '@/lib/wallets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlowbiteDatepicker } from '@/components/ui/datepicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', 'reports', startDate, endDate, selectedCategoryId, selectedWalletId],
    queryFn: () => {
      const params: any = { startDate, endDate };
      if (selectedCategoryId !== 'all') params.categoryId = selectedCategoryId;
      if (selectedWalletId !== 'all') params.walletId = selectedWalletId;
      return expensesApi.getAll(params);
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll(),
  });

  const expenses = expensesData?.data || [];
  const categories = categoriesData?.data || [];
  const wallets = walletsData?.data || [];

  // Statistics
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [expenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    expenses.forEach((exp) => {
      const categoryName = exp.category.name;
      const current = map.get(categoryName) || { name: categoryName, amount: 0 };
      current.amount += Number(exp.amount);
      map.set(categoryName, current);
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Wallet breakdown
  const walletBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    expenses.forEach((exp) => {
      const walletName = exp.wallet?.name || 'Không có ví';
      const current = map.get(walletName) || { name: walletName, amount: 0 };
      current.amount += Number(exp.amount);
      map.set(walletName, current);
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Daily expenses
  const dailyExpenses = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((exp) => {
      const date = format(new Date(exp.date), 'yyyy-MM-dd');
      const current = map.get(date) || 0;
      map.set(date, current + Number(exp.amount));
    });
    return Array.from(map.entries())
      .map(([date, amount]) => ({ date: format(new Date(date), 'dd/MM'), amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expenses]);


  const handleQuickDate = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    setStartDate(format(startOfMonth(date), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(date), 'yyyy-MM-dd'));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
          <p className="text-sm text-gray-500 mt-1">Xem báo cáo chi tiêu theo thời gian, ví và danh mục</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Từ ngày</Label>
                <FlowbiteDatepicker
                  value={startDate}
                  onChange={(value) => setStartDate(value)}
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Đến ngày</Label>
                <FlowbiteDatepicker
                  value={endDate}
                  onChange={(value) => setEndDate(value)}
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Danh mục</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="border-gray-300 focus:border-gray-400 focus:ring-gray-400">
                    <SelectValue placeholder="Tất cả danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Ví</Label>
                <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                  <SelectTrigger className="border-gray-300 focus:border-gray-400 focus:ring-gray-400">
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
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(0)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Tháng này
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Tháng trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(2)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                2 tháng trước
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.total)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Số giao dịch</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trung bình</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.avg)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {expensesLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : expenses.length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">Không có dữ liệu trong khoảng thời gian đã chọn</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Chi tiêu theo danh mục
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${formatCurrency(value)} đ`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Wallet Breakdown */}
            {walletBreakdown.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Chi tiêu theo ví
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={walletBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {walletBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${formatCurrency(value)} đ`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Daily Expenses */}
            {dailyExpenses.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Chi tiêu theo ngày
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyExpenses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" fill="#3b82f6" name="Chi tiêu" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

