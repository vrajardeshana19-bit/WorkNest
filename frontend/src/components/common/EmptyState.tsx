import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-200 rounded-lg bg-white my-4">
      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">{description}</p>}
      {actionText && onAction && (
        <button onClick={onAction} className="wn-btn-primary text-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
