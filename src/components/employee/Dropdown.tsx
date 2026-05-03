interface DropdownProps {
  labelText: string;
  options: string[];
  onChange: ((value: string) => void) | null;
}

export default function Dropdown({ labelText, options, onChange }: DropdownProps) {
  return (
    <select
      data-testid="dropdown"
      defaultValue=""
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="" disabled>
        {labelText}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
