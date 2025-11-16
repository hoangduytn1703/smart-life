'use client';

import { useEffect, useRef, forwardRef } from 'react';
import Datepicker from 'flowbite-datepicker/Datepicker';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface DatepickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
}

const FlowbiteDatepicker = forwardRef<HTMLInputElement, DatepickerProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const datepickerRef = useRef<Datepicker | null>(null);

    // Load CSS dynamically
    useEffect(() => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/datepicker.min.css';
      if (!document.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }
    }, []);

    useEffect(() => {
      if (inputRef.current && !datepickerRef.current) {
        const datepicker = new Datepicker(inputRef.current, {
          format: 'dd/mm/yyyy',
          autohide: true,
          todayBtn: true,
          clearBtn: true,
        });

        datepickerRef.current = datepicker;

        // Listen for change events
        const handleChangeDate = (e: any) => {
          if (onChange && e.detail.date) {
            const formattedDate = format(e.detail.date, 'yyyy-MM-dd');
            onChange(formattedDate);
          }
        };

        inputRef.current.addEventListener('changeDate', handleChangeDate);

        return () => {
          if (inputRef.current) {
            inputRef.current.removeEventListener('changeDate', handleChangeDate);
          }
          if (datepickerRef.current) {
            datepickerRef.current.destroy();
            datepickerRef.current = null;
          }
        };
      }
    }, [onChange]);

    useEffect(() => {
      if (datepickerRef.current && value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            datepickerRef.current.setDate(date, true);
          }
        } catch (e) {
          // Invalid date, ignore
        }
      } else if (datepickerRef.current && !value) {
        datepickerRef.current.clear();
      }
    }, [value]);

    // Combine refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else {
          ref.current = inputRef.current;
        }
      }
    }, [ref]);

    return (
      <Input
        ref={inputRef}
        type="text"
        className={cn('cursor-pointer', className)}
        placeholder="dd/mm/yyyy"
        readOnly
        {...props}
      />
    );
  }
);

FlowbiteDatepicker.displayName = 'FlowbiteDatepicker';

export { FlowbiteDatepicker };

