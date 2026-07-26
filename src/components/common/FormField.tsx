import * as React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert" id={htmlFor ? `${htmlFor}-error` : undefined}>
          {error}
        </p>
      )}
    </div>
  );
};
