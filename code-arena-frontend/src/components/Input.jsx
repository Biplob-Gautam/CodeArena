
function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  required = true,
}) {
  return (
    <div className="w-full space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-300"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

export default Input;
