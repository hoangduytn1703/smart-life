'use client';

import { forwardRef, useState, useEffect } from 'react';
import { Input } from './input';
import { cn, formatCurrency } from '@/lib/utils';

export interface AmountInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
}

const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        // Chỉ format khi không focus (từ prop value)
        if (value !== undefined && value !== null) {
          // Format: 1.000,50 (VN format)
          const formatted = formatCurrency(value, true);
          setDisplayValue(formatted);
        } else {
          setDisplayValue('');
        }
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove all formatting (dots and commas) to get raw number
      // Allow both . and , as decimal separator (VN uses comma)
      inputValue = inputValue.replace(/\./g, ''); // Remove thousand separators
      
      // Replace comma with dot for parsing (JS uses dot for decimals)
      const normalizedValue = inputValue.replace(',', '.');
      
      // Remove all non-digit characters except one decimal point
      let cleanValue = normalizedValue.replace(/[^\d.]/g, '');
      
      // Only allow one decimal point
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        cleanValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
      
      // Convert to number
      const numValue = cleanValue === '' || cleanValue === '.' ? 0 : parseFloat(cleanValue);
      
      if (!isNaN(numValue)) {
        // Khi đang gõ, chỉ hiển thị số thô (không format) để người dùng dễ nhập
        // Chỉ format khi blur
        if (cleanValue.includes('.')) {
          // Có phần thập phân, hiển thị với dấu phẩy
          const [intPart, decPart] = cleanValue.split('.');
          setDisplayValue(`${intPart},${decPart.padEnd(2, '0').substring(0, 2)}`);
        } else {
          // Không có phần thập phân, hiển thị số nguyên
          setDisplayValue(cleanValue);
        }
        
        if (onChange) {
          onChange(numValue);
        }
      } else if (cleanValue === '') {
        setDisplayValue('');
        if (onChange) {
          onChange(0);
        }
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Khi focus, hiển thị số thô để dễ chỉnh sửa
      // Lấy số thô từ displayValue hiện tại (đã được format)
      if (displayValue) {
        // Remove formatting (dấu chấm và dấu phẩy) để hiển thị số thô
        const cleanValue = displayValue.replace(/\./g, '').replace(',', '.');
        const numValue = parseFloat(cleanValue);
        if (!isNaN(numValue)) {
          // Hiển thị số thô, nếu có phần thập phân thì dùng dấu phẩy
          if (numValue % 1 !== 0) {
            const [intPart, decPart] = numValue.toString().split('.');
            setDisplayValue(`${intPart},${decPart.substring(0, 2)}`);
          } else {
            setDisplayValue(numValue.toString());
          }
        }
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Ensure proper formatting on blur
      if (displayValue) {
        // Remove formatting and parse
        const cleanValue = displayValue.replace(/\./g, '').replace(',', '.');
        const numValue = parseFloat(cleanValue);
        if (!isNaN(numValue)) {
          const formatted = formatCurrency(numValue, true);
          setDisplayValue(formatted);
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(className)}
        placeholder="0,00"
        {...props}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';

export { AmountInput };

