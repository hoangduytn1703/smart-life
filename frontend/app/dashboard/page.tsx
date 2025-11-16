'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expensesApi } from '@/lib/expenses';
import { walletsApi } from '@/lib/wallets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'category' | 'wallet'>('category');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll(),
  });

  const wallets = walletsData?.data || [];

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['expenses', 'analytics', monthStart, monthEnd, selectedWalletId],
    queryFn: () => {
      const params: any = { startDate: monthStart, endDate: monthEnd };
      if (selectedWalletId !== 'all') params.walletId = selectedWalletId;
      return expensesApi.getAnalytics(params);
    },
  });

  const { data: dailyTotal } = useQuery({
    queryKey: ['expenses', 'daily', today],
    queryFn: () => expensesApi.getDailyTotal(today),
  });

  const { data: weeklyTotal } = useQuery({
    queryKey: ['expenses', 'weekly', weekStart],
    queryFn: () => expensesApi.getWeeklyTotal(weekStart),
  });

  const { data: monthlyTotal } = useQuery({
    queryKey: ['expenses', 'monthly', new Date().getFullYear(), new Date().getMonth() + 1],
    queryFn: () =>
      expensesApi.getMonthlyTotal(new Date().getFullYear(), new Date().getMonth() + 1),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const categoryData =
    analytics?.data.categoryBreakdown.map((item) => ({
      name: item.categoryName,
      value: Number(item.totalAmount),
    })) || [];

  const walletData =
    analytics?.data.walletBreakdown.map((item) => ({
      name: item.walletName,
      value: Number(item.totalAmount),
    })) || [];

  const chartData = viewMode === 'category' ? categoryData : walletData;

  const dailyStatsData =
    analytics?.data.dailyStats
      .slice(-7)
      .map((item) => ({
        date: format(new Date(item.date), 'dd/MM'),
        total: Number(item.total),
      })) || [];

  return (
    <div className="space-y-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen -m-8 p-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Tổng quan
          </h1>
          <p className="text-gray-600 text-lg">Thống kê chi tiêu của bạn</p>
        </div>
        
        <div className="flex gap-4 items-center">
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
              {dailyTotal?.data.total.toLocaleString('vi-VN') || 0} đ
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
              {weeklyTotal?.data.total.toLocaleString('vi-VN') || 0} đ
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
              {monthlyTotal?.data.total.toLocaleString('vi-VN') || 0} đ
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
              {analytics?.data.total.toLocaleString('vi-VN') || 0} đ
            </div>
            <p className="text-xs text-white/80 mt-1">
              {analytics?.data.count || 0} giao dịch
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              {viewMode === 'category' ? 'Chi tiêu theo danh mục' : 'Chi tiêu theo ví'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {viewMode === 'category' 
                ? 'Phân bổ chi tiêu trong tháng theo danh mục'
                : selectedWalletId === 'all'
                ? 'Phân bổ chi tiêu trong tháng theo tất cả các ví'
                : 'Phân bổ chi tiêu trong tháng theo ví đã chọn'}
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
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')} đ`} />
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
            <CardTitle className="text-xl font-bold text-gray-800">Chi tiêu 7 ngày gần nhất</CardTitle>
            <CardDescription className="text-gray-600">Biểu đồ chi tiêu theo ngày</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyStatsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyStatsData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')} đ`} />
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
    </div>
  );
}

