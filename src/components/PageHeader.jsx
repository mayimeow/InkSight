export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-maroon/55 uppercase mb-1.5">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-[26px] md:text-3xl font-semibold text-gray-900 leading-tight">
        {title}
      </h1>
      <svg width="76" height="10" viewBox="0 0 76 10" fill="none" className="mt-2 mb-3">
        <path
          d="M2 6.5 Q 20 -1, 38 5.5 T 74 4"
          stroke="#C9A227"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {subtitle && <p className="text-sm text-gray-500 max-w-lg">{subtitle}</p>}
    </div>
  )
}