/** Small line-art icons for the equipment shelf (ink on paper; orange only where something carries heat or current). */
const INK = '#262626'
const ACCENT = '#F26B1D'

const paths: Record<string, React.ReactNode> = {
  stand: (
    <>
      <rect x="6" y="34" width="28" height="4" rx="1" />
      <path d="M12 34 V6" />
    </>
  ),
  clamp: (
    <>
      <rect x="6" y="14" width="8" height="8" rx="1" />
      <path d="M14 18 H34" />
      <path d="M30 14 V22" />
    </>
  ),
  protractor: <path d="M6 28 A14 14 0 0 1 34 28 Z M20 28 V24 M11 20 l2 2 M29 20 l-2 2" />,
  bob: (
    <>
      <path d="M20 4 V28" />
      <circle cx="20" cy="31" r="5" />
    </>
  ),
  rule: (
    <>
      <rect x="15" y="3" width="10" height="34" rx="1" />
      <path d="M15 9 h4 M15 15 h6 M15 21 h4 M15 27 h6 M15 33 h4" />
    </>
  ),
  beaker: (
    <>
      <path d="M9 6 V34 a2 2 0 0 0 2 2 H29 a2 2 0 0 0 2 -2 V6" />
      <path d="M11 18 H29" strokeDasharray="2 2" />
    </>
  ),
  thermometer: (
    <>
      <rect x="17" y="3" width="6" height="26" rx="3" />
      <circle cx="20" cy="32" r="5" />
      <path d="M20 31 V14" stroke={ACCENT} strokeWidth="2.5" />
    </>
  ),
  heater: (
    <>
      <path d="M20 3 V22" />
      <path d="M14 24 q6 -4 12 0 q-6 4 -12 0 M14 29 q6 -4 12 0 q-6 4 -12 0 M14 34 q6 -4 12 0" stroke={ACCENT} />
    </>
  ),
  power: (
    <>
      <rect x="5" y="14" width="30" height="20" rx="2" />
      <circle cx="13" cy="10" r="2.5" />
      <circle cx="27" cy="10" r="2.5" />
      <path d="M12 24 h6 M15 21 v6 M23 24 h6" />
    </>
  ),
  lagging: (
    <>
      <path d="M8 6 V34 H32 V6" />
      <path d="M8 12 H32 M8 18 H32 M8 24 H32 M8 30 H32" strokeOpacity="0.5" />
    </>
  ),
  stirrer: <path d="M12 36 L28 4" strokeWidth="2.5" />,
}

export function PartIcon({ id, size = 40 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[id] ?? <circle cx="20" cy="20" r="12" />}
    </svg>
  )
}
