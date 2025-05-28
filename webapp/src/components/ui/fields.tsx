interface FieldDisplay {
  label: string;
  value: string;
}
export const DisplayFields: React.FC<{ fields: FieldDisplay[] }> = ({
  fields,
}) => (
  <div className="space-y-2">
    {fields.map((field, index) => (
      <div key={index} className="flex">
        <p className="mr-1 font-medium">{field.label}</p>
        <span>{field.value}</span>
      </div>
    ))}
  </div>
);
