export default function SegmentedControl({ options, value, onSelect, trackClassName }) {
  return (
    <div className={`flex rounded-xl p-1 ${trackClassName}`}>
      {options.map(([optionValue, label]) => (
        <button
          type="button"
          key={optionValue}
          onClick={() => onSelect(optionValue)}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
            value === optionValue ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
