import React from 'react';
import { Info } from 'lucide-react';

// Tooltip component
interface TooltipProps {
  id: string;
  content: string;
  isVisible: boolean;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  id, 
  content, 
  isVisible, 
  onMouseEnter, 
  onMouseLeave 
}) => (
  <div className="relative flex">
    <Info
      size={14}
      className="ml-1 hover:cursor-pointer"
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={onMouseLeave}
    />
    {isVisible && (
      <div
        className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
        onMouseEnter={() => onMouseEnter(id)}
        onMouseLeave={onMouseLeave}
      >
        {content}
      </div>
    )}
  </div>
);

// Radio group component
interface RadioGroupProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ name, label, options, value, onChange }) => (
  <div className='flex justify-between items-center mr-4'>
    <span>{label}</span>
    <div className='flex gap-4'>
      {options.map((option) => (
        <label key={option.value} className='items-center mr-4'>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className='mr-2'
          />
          {option.label}
        </label>
      ))}
    </div>
  </div>
);