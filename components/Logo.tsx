// Pàdé mark: two circles meeting, the overlap glows. Wordmark set in the display font.
export function Mark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pade-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7A45" />
          <stop offset="0.5" stopColor="#FF3D8B" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="32" r="16" fill="none" stroke="url(#pade-g)" strokeWidth="6" />
      <circle cx="40" cy="32" r="16" fill="none" stroke="url(#pade-g)" strokeWidth="6" />
      <path d="M32 18.7a16 16 0 0 1 0 26.6a16 16 0 0 1 0-26.6z" fill="url(#pade-g)" />
    </svg>
  );
}

export function Wordmark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark size={size} />
      <span className="font-display font-extrabold tracking-tight" style={{ fontSize: size * 0.95, lineHeight: 1 }}>
        Pàdé
      </span>
    </span>
  );
}
