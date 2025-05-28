
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

