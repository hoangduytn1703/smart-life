'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletsApi, Wallet, CreateWalletDto, TransferMoneyDto } from '@/lib/wallets';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const walletSchema = z.object({
  name: z.string().min(1, 'Tên ví không được để trống'),
  includedInTotal: z.boolean().default(true),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const transferSchema = z.object({
  fromWalletId: z.string().min(1, 'Chọn ví nguồn'),
  toWalletId: z.string().min(1, 'Chọn ví đích'),
  amount: z.number().min(0.01, 'Số tiền phải lớn hơn 0'),
  description: z.string().optional(),
});

type WalletFormData = z.infer<typeof walletSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

export default function WalletsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [movingWallet, setMovingWallet] = useState<{ id: string; direction: 'up' | 'down' } | null>(null);

  const { data: walletsData, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll(),
  });

  const { data: totalBalanceData } = useQuery({
    queryKey: ['wallets', 'total-balance'],
    queryFn: () => walletsApi.getTotalBalance(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      includedInTotal: true,
      icon: '💼',
      color: '#3b82f6',
    },
  });

  const {
    register: registerTransfer,
    handleSubmit: handleSubmitTransfer,
    formState: { errors: transferErrors },
    reset: resetTransfer,
    setValue: setValueTransfer,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const includedInTotal = watch('includedInTotal');

  const createMutation = useMutation({
    mutationFn: walletsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Tạo ví thành công',
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
    mutationFn: ({ id, data }: { id: string; data: any }) => walletsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Cập nhật ví thành công',
      });
      setIsDialogOpen(false);
      setEditingWallet(null);
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
    mutationFn: walletsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Xóa ví thành công',
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

  const transferMutation = useMutation({
    mutationFn: walletsApi.transfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'total-balance'] });
      toast({
        title: 'Thành công',
        description: 'Chuyển tiền thành công',
      });
      setIsTransferDialogOpen(false);
      resetTransfer();
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: walletsApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({
        title: 'Thành công',
        description: 'Sắp xếp lại ví thành công',
      });
      setMovingWallet(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet.id);
    setValue('name', wallet.name);
    setValue('includedInTotal', wallet.includedInTotal);
    setValue('icon', wallet.icon || '💼');
    setValue('color', wallet.color || '#3b82f6');
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ví này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleMove = (wallet: Wallet, direction: 'up' | 'down') => {
    const wallets = walletsData?.data || [];
    const currentIndex = wallets.findIndex((w) => w.id === wallet.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const newWallets = [...wallets];
      [newWallets[currentIndex], newWallets[currentIndex - 1]] = [
        newWallets[currentIndex - 1],
        newWallets[currentIndex],
      ];
      reorderMutation.mutate({
        wallets: newWallets.map((w, idx) => ({ id: w.id, order: idx })),
      });
    } else if (direction === 'down' && currentIndex < wallets.length - 1) {
      const newWallets = [...wallets];
      [newWallets[currentIndex], newWallets[currentIndex + 1]] = [
        newWallets[currentIndex + 1],
        newWallets[currentIndex],
      ];
      reorderMutation.mutate({
        wallets: newWallets.map((w, idx) => ({ id: w.id, order: idx })),
      });
    }
  };

  const onSubmit = (data: WalletFormData) => {
    if (editingWallet) {
      updateMutation.mutate({ id: editingWallet, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onSubmitTransfer = (data: TransferFormData) => {
    transferMutation.mutate(data);
  };

  const wallets = walletsData?.data || [];
  const includedWallets = wallets.filter((w) => w.includedInTotal);
  const excludedWallets = wallets.filter((w) => !w.includedInTotal);
  const totalBalance = totalBalanceData?.data?.totalBalance || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ví Của Tôi</h1>
              <p className="text-sm text-gray-500 mt-1">Quản lý các ví và số dư</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsTransferDialogOpen(true)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Chuyển tiền
              </Button>
              <Button
                onClick={() => {
                  setEditingWallet(null);
                  reset();
                  setIsDialogOpen(true);
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm ví
              </Button>
            </div>
          </div>

          {/* Total Balance */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng cộng</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallets List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Included in Total */}
            {includedWallets.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
                  Tính vào tổng
                </h2>
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200">
                      {includedWallets.map((wallet, index) => (
                        <div
                          key={wallet.id}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: wallet.color + '20' }}
                          >
                            {wallet.icon || '💼'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(Number(wallet.balance))}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(wallet, 'up')}
                              disabled={index === 0 || reorderMutation.isPending}
                              className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(wallet, 'down')}
                              disabled={index === includedWallets.length - 1 || reorderMutation.isPending}
                              className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(wallet)}
                              className="h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(wallet.id)}
                              className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Not Included in Total */}
            {excludedWallets.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
                  Không tính vào tổng
                </h2>
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200">
                      {excludedWallets.map((wallet, index) => (
                        <div
                          key={wallet.id}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: wallet.color + '20' }}
                          >
                            {wallet.icon || '💼'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(Number(wallet.balance))}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(wallet, 'up')}
                              disabled={index === 0 || reorderMutation.isPending}
                              className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(wallet, 'down')}
                              disabled={index === excludedWallets.length - 1 || reorderMutation.isPending}
                              className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(wallet)}
                              className="h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(wallet.id)}
                              className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {wallets.length === 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💼</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có ví nào</h3>
                  <p className="text-sm text-gray-500 mb-4">Bắt đầu bằng cách tạo ví đầu tiên của bạn</p>
                  <Button
                    onClick={() => {
                      setEditingWallet(null);
                      reset();
                      setIsDialogOpen(true);
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo ví đầu tiên
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {editingWallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingWallet
                  ? 'Cập nhật thông tin ví'
                  : 'Tạo một ví mới để quản lý số dư'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Tên ví *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ví dụ: Ví tiền mặt, Ngân hàng..."
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon" className="text-gray-700 font-medium">Icon</Label>
                <Input
                  id="icon"
                  type="text"
                  placeholder="💼"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                  {...register('icon')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-gray-700 font-medium">Màu sắc</Label>
                <Input
                  id="color"
                  type="color"
                  className="h-12 border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                  {...register('color')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includedInTotal" className="text-gray-700 font-medium">
                  Tính vào tổng
                </Label>
                <Switch
                  id="includedInTotal"
                  checked={includedInTotal}
                  onCheckedChange={(checked) => setValue('includedInTotal', checked)}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingWallet(null);
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
                  {editingWallet ? 'Cập nhật' : 'Thêm'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Chuyển tiền
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Chuyển tiền giữa các ví
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitTransfer(onSubmitTransfer)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fromWalletId" className="text-gray-700 font-medium">
                  Từ ví *
                </Label>
                <Select
                  onValueChange={(value) => setValueTransfer('fromWalletId', value)}
                >
                  <SelectTrigger className="border-gray-300 focus:border-gray-400 focus:ring-gray-400">
                    <SelectValue placeholder="Chọn ví nguồn" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.icon} {wallet.name} ({formatCurrency(Number(wallet.balance))})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {transferErrors.fromWalletId && (
                  <p className="text-sm text-red-600">{transferErrors.fromWalletId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toWalletId" className="text-gray-700 font-medium">
                  Đến ví *
                </Label>
                <Select
                  onValueChange={(value) => setValueTransfer('toWalletId', value)}
                >
                  <SelectTrigger className="border-gray-300 focus:border-gray-400 focus:ring-gray-400">
                    <SelectValue placeholder="Chọn ví đích" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.icon} {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {transferErrors.toWalletId && (
                  <p className="text-sm text-red-600">{transferErrors.toWalletId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-700 font-medium">
                  Số tiền *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                  {...registerTransfer('amount', { valueAsNumber: true })}
                />
                {transferErrors.amount && (
                  <p className="text-sm text-red-600">{transferErrors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">
                  Mô tả (tùy chọn)
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Ghi chú về giao dịch chuyển tiền"
                  className="border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                  {...registerTransfer('description')}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsTransferDialogOpen(false);
                    resetTransfer();
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Chuyển tiền
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

