interface StratumLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

const SIZES = {
  sm: { icon: 32, textMain: 16, textAI: 13, tagline: 7, gap: 8 },
  md: { icon: 44, textMain: 22, textAI: 18, tagline: 9, gap: 10 },
  lg: { icon: 56, textMain: 28, textAI: 23, tagline: 11, gap: 12 },
};

export default function StratumLogo({ size = 'sm', className = '', iconOnly = false }: StratumLogoProps) {
  const s = SIZES[size];
  const w = s.icon;
  const rowH = Math.floor(w * 0.13);
  const rowGap = Math.floor(w * 0.03);
  const rx = Math.floor(rowH / 2);
  const totalH = rowH * 5 + rowGap * 4;
  const wideW = Math.floor(w * 0.62);
  const narrowW = Math.floor(w * 0.32);
  const colGap = Math.floor(w * 0.06);

  const rows = [
    ['#3B82F6', '#60A5FA'],
    ['#F97316', '#FB923C'],
    ['#10B981', '#34D399'],
    ['#60A5FA', '#3B82F6'],
    ['#FB923C', '#F97316'],
  ];

  return (
    <div className={`flex items-center select-none ${className}`} style={{ gap: s.gap }}>
      <svg
        width={w}
        height={totalH}
        viewBox={`0 0 ${w} ${totalH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {rows.map(([c1, c2], i) => {
          const y = i * (rowH + rowGap);
          return (
            <g key={i}>
              <rect x={0} y={y} width={wideW} height={rowH} rx={rx} fill={c1} />
              <rect x={wideW + colGap} y={y} width={narrowW} height={rowH} rx={rx} fill={c2} />
            </g>
          );
        })}
      </svg>

      {!iconOnly && (
        <div style={{ lineHeight: 1, fontFamily: "'Sora', sans-serif" }}>
          <div
            className="font-bold text-foreground"
            style={{ fontSize: s.textMain, letterSpacing: '-0.01em' }}
          >
            Stratum
          </div>
          <div
            className="font-bold text-foreground"
            style={{ fontSize: s.textAI, letterSpacing: '0.1em' }}
          >
            AI
          </div>
          <div
            className="font-bold uppercase"
            style={{ fontSize: s.tagline, letterSpacing: '0.08em', color: '#F97316', marginTop: 1 }}
          >
            INTELLIGENT CRM PLATFORM
          </div>
        </div>
      )}
    </div>
  );
}
