import React, { useState, useEffect } from 'react';
import { Input } from './Input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: number;
    onChangeValue?: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChangeValue, placeholder, className, disabled, required, id, name }, ref) => {
        const [displayValue, setDisplayValue] = useState('');

        useEffect(() => {
            if (value === undefined || value === null) {
                setDisplayValue('');
                return;
            }
            // Format number to thousand separator (id-ID locale uses dots for thousands)
            const formatted = new Intl.NumberFormat('id-ID').format(value);
            setDisplayValue(formatted);
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Only allow digits
            const raw = e.target.value.replace(/\D/g, '');
            if (!raw) {
                setDisplayValue('');
                onChangeValue?.(0);
                return;
            }

            const numericValue = parseInt(raw, 10);

            // Format for display
            const formatted = new Intl.NumberFormat('id-ID').format(numericValue);
            setDisplayValue(formatted);

            // Pass actual number back to parent
            if (onChangeValue) {
                onChangeValue(numericValue);
            }
        };

        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <Input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    id={id}
                    name={name}
                    required={required}
                    disabled={disabled}
                    className={`pl-9 ${className || ''}`}
                    placeholder={placeholder || '0'}
                    value={displayValue}
                    onChange={handleChange}
                />
            </div>
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';
