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
    const childObserversRef = useRef<MutationObserver[]>([]);

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

        // Ensure datepicker dropdown has high z-index when it appears
        const updateZIndex = () => {
          const dropdown = document.querySelector('.datepicker-dropdown');
          if (dropdown) {
            (dropdown as HTMLElement).style.zIndex = '120';
            (dropdown as HTMLElement).style.pointerEvents = 'auto';
          }
        };

        // Prevent click events from closing dialog when clicking on datepicker
        const preventDialogClose = (e: Event) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        };

        // Function to highlight today and fix today button
        const highlightTodayAndFixButton = (dropdown: HTMLElement) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Find all date cells and highlight today
          const dateCells = dropdown.querySelectorAll('.datepicker-days .datepicker-cell[data-date]');
          dateCells.forEach((cell) => {
            const cellElement = cell as HTMLElement;
            const dataDate = cellElement.getAttribute('data-date');
            if (dataDate) {
              try {
                // Parse the date from data-date attribute (format: YYYY-MM-DD or timestamp)
                let cellDate: Date;
                if (dataDate.includes('-')) {
                  cellDate = new Date(dataDate);
                } else {
                  cellDate = new Date(parseInt(dataDate));
                }
                cellDate.setHours(0, 0, 0, 0);
                
                // Check if this cell represents today
                if (cellDate.getTime() === today.getTime()) {
                  cellElement.classList.add('datepicker-today');
                  cellElement.style.border = '2px solid hsl(var(--primary))';
                  cellElement.style.borderRadius = '4px';
                  cellElement.style.fontWeight = '600';
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          });

          // Also try to find today by aria-label or text content
          const allCells = dropdown.querySelectorAll('.datepicker-days .datepicker-cell');
          allCells.forEach((cell) => {
            const cellElement = cell as HTMLElement;
            const ariaLabel = cellElement.getAttribute('aria-label');
            const textContent = cellElement.textContent?.trim();
            
            if (ariaLabel || textContent) {
              try {
                let cellDate: Date | null = null;
                
                if (ariaLabel) {
                  cellDate = new Date(ariaLabel);
                } else if (textContent) {
                  // Try to parse from text content (day number)
                  const dayNum = parseInt(textContent);
                  if (!isNaN(dayNum)) {
                    // Get current month and year from datepicker
                    const monthView = dropdown.querySelector('.datepicker-view-month');
                    if (monthView) {
                      const monthText = monthView.textContent;
                      // This is a simplified approach - may need adjustment
                      cellDate = new Date();
                      cellDate.setDate(dayNum);
                    }
                  }
                }
                
                if (cellDate) {
                  cellDate.setHours(0, 0, 0, 0);
                  if (cellDate.getTime() === today.getTime()) {
                    cellElement.classList.add('datepicker-today');
                    cellElement.style.border = '2px solid hsl(var(--primary))';
                    cellElement.style.borderRadius = '4px';
                    cellElement.style.fontWeight = '600';
                  }
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          });

          // Fix today button - try multiple possible selectors
          const todayButtonSelectors = [
            '.datepicker-today-btn',
            'button[data-action="today"]',
            '.datepicker-footer button:first-child',
            '.datepicker-buttons button:first-child',
          ];
          
          let todayButton: HTMLElement | null = null;
          for (const selector of todayButtonSelectors) {
            todayButton = dropdown.querySelector(selector) as HTMLElement;
            if (todayButton) break;
          }
          
          // Also try to find by text content
          if (!todayButton) {
            const buttons = dropdown.querySelectorAll('button');
            buttons.forEach((btn) => {
              const text = btn.textContent?.toLowerCase().trim();
              if (text === 'today' || text === 'hôm nay' || text === 'hôm nay') {
                todayButton = btn as HTMLElement;
              }
            });
          }
          
          if (todayButton && !todayButton.hasAttribute('data-today-handler')) {
            todayButton.setAttribute('data-today-handler', 'true');
            todayButton.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (datepickerRef.current) {
                datepickerRef.current.setDate(today, true);
                if (onChange) {
                  const formattedDate = format(today, 'yyyy-MM-dd');
                  onChange(formattedDate);
                }
              }
            });
          }
        };

        // Function to add event listeners to datepicker dropdown
        const addEventListenersToDropdown = (dropdown: HTMLElement) => {
          // Prevent all click events from bubbling up
          dropdown.addEventListener('click', preventDialogClose, true);
          dropdown.addEventListener('mousedown', preventDialogClose, true);
          dropdown.addEventListener('mouseup', preventDialogClose, true);
          dropdown.addEventListener('pointerdown', preventDialogClose, true);
          dropdown.addEventListener('pointerup', preventDialogClose, true);
          
          // Highlight today and fix today button
          highlightTodayAndFixButton(dropdown);
          
          // Also prevent for all child elements (including dynamically added ones)
          const addListenersToChildren = () => {
            const allElements = dropdown.querySelectorAll('*');
            allElements.forEach((el) => {
              el.addEventListener('click', preventDialogClose, true);
              el.addEventListener('mousedown', preventDialogClose, true);
              el.addEventListener('mouseup', preventDialogClose, true);
              el.addEventListener('pointerdown', preventDialogClose, true);
              el.addEventListener('pointerup', preventDialogClose, true);
            });
          };
          
          addListenersToChildren();
          
          // Watch for new elements added to dropdown
          const childObserver = new MutationObserver(() => {
            addListenersToChildren();
            // Re-highlight today when calendar changes (month/year navigation)
            setTimeout(() => highlightTodayAndFixButton(dropdown), 50);
          });
          
          childObserver.observe(dropdown, {
            childList: true,
            subtree: true,
          });
          
          return childObserver;
        };

        // Use MutationObserver to watch for datepicker dropdown creation
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const element = node as HTMLElement;
                if (element.classList?.contains('datepicker-dropdown') || 
                    element.querySelector?.('.datepicker-dropdown')) {
                  updateZIndex();
                  
                  // Add event listeners to prevent dialog from closing
                  const dropdown = element.classList?.contains('datepicker-dropdown') 
                    ? element 
                    : element.querySelector('.datepicker-dropdown') as HTMLElement;
                  
                  if (dropdown) {
                    const childObserver = addEventListenersToDropdown(dropdown);
                    childObserversRef.current.push(childObserver);
                  }
                }
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // Also update when input is clicked/focused
        const handleFocus = () => {
          setTimeout(updateZIndex, 50);
        };

        inputRef.current.addEventListener('focus', handleFocus);
        inputRef.current.addEventListener('click', handleFocus);

        return () => {
          if (inputRef.current) {
            inputRef.current.removeEventListener('changeDate', handleChangeDate);
            inputRef.current.removeEventListener('focus', handleFocus);
            inputRef.current.removeEventListener('click', handleFocus);
          }
          observer.disconnect();
          // Disconnect all child observers
          childObserversRef.current.forEach((childObserver) => {
            childObserver.disconnect();
          });
          childObserversRef.current = [];
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

