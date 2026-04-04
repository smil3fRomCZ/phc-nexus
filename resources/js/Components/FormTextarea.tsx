import type { TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
    label?: string;
    error?: string;
    wrapperClassName?: string;
}

export default function FormTextarea({ label, error, id, required, wrapperClassName, ...rest }: FormTextareaProps) {
    return (
        <div className={wrapperClassName}>
            {label && (
                <label htmlFor={id} className="mb-1 block text-xs font-semibold text-text-subtle">
                    {label}
                    {required && ' *'}
                </label>
            )}
            <textarea
                id={id}
                required={required}
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                {...rest}
            />
            {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        </div>
    );
}
