'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Wallet, User, Mail, Lock } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast({
        title: 'Đăng ký thành công',
        description: 'Tài khoản của bạn đã được tạo thành công!',
      });
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Đăng ký thất bại',
        description: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-4 rounded-2xl">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        <div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Đăng ký
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Tạo tài khoản mới để bắt đầu quản lý chi tiêu 🎉
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              Họ và tên
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Nguyễn Văn A"
              {...register('name')}
              disabled={isLoading}
              className="h-11 border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl transition-colors"
            />
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-500" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              disabled={isLoading}
              className="h-11 border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl transition-colors"
            />
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
              className="h-11 border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl transition-colors"
            />
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              Xác nhận mật khẩu
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
              className="h-11 border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl transition-colors"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 mt-6" 
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>

          <div className="text-center text-sm pt-2">
            <span className="text-gray-600">Đã có tài khoản? </span>
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

