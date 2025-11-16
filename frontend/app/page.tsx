import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, PieChart, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="z-10 max-w-6xl w-full items-center justify-center text-center space-y-8">
        {/* Icon and Title */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Wallet className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Quản lý chi tiêu cá nhân
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-2 max-w-2xl mx-auto">
            Theo dõi và quản lý chi tiêu của bạn một cách dễ dàng
          </p>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
            Giúp bạn kiểm soát tài chính cá nhân hiệu quả hơn mỗi ngày
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 mb-8 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-emerald-100">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Theo dõi chi tiêu</h3>
            <p className="text-sm text-gray-600">Ghi chép mọi khoản chi tiêu một cách nhanh chóng</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-teal-100">
            <div className="bg-gradient-to-br from-teal-400 to-teal-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Thống kê thông minh</h3>
            <p className="text-sm text-gray-600">Phân tích chi tiêu theo danh mục và thời gian</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-cyan-100">
            <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Dễ sử dụng</h3>
            <p className="text-sm text-gray-600">Giao diện thân thiện, dễ thương và trực quan</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Link href="/login">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-6 text-lg rounded-xl"
            >
              Đăng nhập
            </Button>
          </Link>
          <Link href="/register">
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-6 text-lg rounded-xl font-semibold"
            >
              Đăng ký miễn phí
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

