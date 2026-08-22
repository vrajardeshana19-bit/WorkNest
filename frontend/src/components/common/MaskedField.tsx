import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface MaskedFieldProps {
  label: string;
  value: string;
  maskLength?: number;
}

export const MaskedField: React.FC<MaskedFieldProps> = ({ label, value, maskLength = 4 }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const getMaskedValue = () => {
    if (!value) return '—';
    if (isRevealed) return value;
    if (value.length <= maskLength) return '••••';
    const visible = value.slice(-maskLength);
    const masked = '•'.repeat(Math.max(4, value.length - maskLength));
    return `${masked} ${visible}`;
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
      <div>
        <span className="text-[11px] font-medium text-slate-600 block font-medium">
          {label}
        </span>
        <span className="text-sm font-mono font-semibold text-slate-700 mt-0.5 block tracking-wide">
          {getMaskedValue()}
        </span>
      </div>
      <button
        onClick={() => setIsRevealed(!isRevealed)}
        className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        title={isRevealed ? 'Mask value' : 'Reveal value'}
      >
        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
