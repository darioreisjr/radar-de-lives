/** Marca original do Radar de Lives: anéis de radar com varredura. */
export function RadarMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rm-sweep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF3D81" />
          <stop offset="1" stopColor="#A76BFF" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="none" stroke="#33323D" strokeWidth="2" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#33323D" strokeWidth="2" />
      <path d="M16 16 L16 2 A14 14 0 0 1 29.3 11.7 Z" fill="url(#rm-sweep)" opacity="0.9" />
      <circle cx="16" cy="16" r="2.5" fill="#32D8E8" />
      <circle cx="22.5" cy="8.5" r="1.8" fill="#FF3548" />
    </svg>
  );
}
