import type { SelectHTMLAttributes } from 'react';

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    wrapperClassName?: string;
}

export default function FormSelect({
    label,
    error,
    id,
    required,
    options,
    placeholder,
    wrapperClassName,
    ...rest
}: FormSelectProps) {
    return (
        <div className={wrapperClassName}>
            {label && (
                <label htmlFor={id} className="mb-1 block text-xs font-semibold text-text-subtle">
                    {label}
                    {required && ' *'}
                </label>
            )}
            <select
                id={id}
                required={required}
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                {...rest}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        </div>
    );
}
