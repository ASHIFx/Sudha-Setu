export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-slate-200 border-t-brand-600 animate-spin ${sizes[size]} ${className}`}
    />
  );
}
