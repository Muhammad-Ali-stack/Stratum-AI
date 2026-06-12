interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'sm', className = '' }: LogoProps) {
  const heights: Record<string, string> = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-14',
  };

  return (
    <img
      src="/logo.png"
      alt="Stratum AI"
      className={`${heights[size]} w-auto object-contain object-left ${className}`}
      draggable={false}
    />
  );
}
