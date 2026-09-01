import { useId } from 'react'

export default function Logo({ size = 28, className = '' }) {
  const gradId = `natio-grad-${useId()}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="12%" y1="92%" x2="90%" y2="8%">
          <stop offset="0%" stopColor="#1D3FC4" />
          <stop offset="55%" stopColor="#3B5FE0" />
          <stop offset="100%" stopColor="#E0A458" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="52" r="37" stroke={`url(#${gradId})`} strokeWidth="3.5" opacity="0.55" />
      <g stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round">
        <line x1="50" y1="9" x2="50" y2="17" />
        <line x1="50" y1="87" x2="50" y2="95" />
        <line x1="7" y1="52" x2="15" y2="52" />
        <line x1="85" y1="52" x2="93" y2="52" />
      </g>

      <circle cx="41" cy="48" r="16.5" fill={`url(#${gradId})`} />
      <path d="M31 57 L51 57 L39 82 Z" fill={`url(#${gradId})`} />
      <path d="M41 30 L64 39 L82 8 Z" fill={`url(#${gradId})`} />
      <circle cx="39" cy="61" r="5" fill="#FBEBD3" />
    </svg>
  )
}
