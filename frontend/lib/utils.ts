import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format số tiền theo định dạng Việt Nam
 * Dấu chấm (.) phân cách phần nghìn, dấu phẩy (,) là thập phân
 * @param amount Số tiền cần format
 * @param showDecimals Có hiển thị phần thập phân không (mặc định false)
 * @returns Chuỗi đã format, ví dụ: "1.000.000" hoặc "1.000.000,50"
 */
export function formatCurrency(amount: number, showDecimals: boolean = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showDecimals ? '0,00' : '0';
  }

  const parts = amount.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';

  // Format phần nguyên với dấu chấm phân cách phần nghìn
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (showDecimals) {
    // Luôn hiển thị phần thập phân khi showDecimals = true
    const formattedDecimal = decimalPart.substring(0, 2).padEnd(2, '0');
    return `${formattedInteger},${formattedDecimal}`;
  }

  return formattedInteger;
}

