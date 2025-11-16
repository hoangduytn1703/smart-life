'use client';

import { forwardRef, useState, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface AmountInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
}

const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
      if (value !== undefined && value !== null) {
        // Format: 1,000.50
        const formatted = value.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
        setDisplayValue(formatted);
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove all non-digit characters except decimal point
      inputValue = inputValue.replace(/[^\d.]/g, '');
      
      // Only allow one decimal point
      const parts = inputValue.split('.');
      if (parts.length > 2) {
        inputValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        inputValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
      
      // Convert to number
      const numValue = inputValue === '' || inputValue === '.' ? 0 : parseFloat(inputValue);
      
      if (!isNaN(numValue)) {
        // Format with commas
        const formatted = numValue.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
        setDisplayValue(formatted);
        
        if (onChange) {
          onChange(numValue);
        }
      } else if (inputValue === '') {
        setDisplayValue('');
        if (onChange) {
          onChange(0);
        }
      }
    };

    const handleBlur = () => {
      // Ensure proper formatting on blur
      if (displayValue) {
        const numValue = parseFloat(displayValue.replace(/,/g, ''));
        if (!isNaN(numValue)) {
          const formatted = numValue.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
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
        onBlur={handleBlur}
        className={cn(className)}
        placeholder="0.00"
        {...props}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';

export { AmountInput };

