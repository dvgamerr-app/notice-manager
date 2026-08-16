export default function Spinner({ className = '', colorClassName = 'border-[#06C755]' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-t-transparent ${colorClassName} ${className}`}
    />
  )
}
