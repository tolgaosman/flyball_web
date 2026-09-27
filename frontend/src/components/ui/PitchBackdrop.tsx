'use client';

import { useEffect, useState } from 'react';

/**
 * The painted pitch behind every page (port of PitchBackdrop's CustomPainter):
 * faint mowing stripes, 4.5% chalk lines, and two soft green/gold glows. The
 * pitch lies along the screen's long axis, so it reads horizontally on desktop.
 */
export function PitchBackdrop() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgb(47_209_107/0.02)_0_56px,transparent_56px_112px)] landscape:bg-[repeating-linear-gradient(90deg,rgb(47_209_107/0.02)_0_56px,transparent_56px_112px)]" />
      {size && <PitchLines w={size.w} h={size.h} />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_calc(max(100vw,100vh)*0.45)_at_8%_5%,rgb(47_209_107/0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_calc(max(100vw,100vh)*0.5)_at_95%_98%,rgb(240_180_41/0.08),transparent)]" />
    </div>
  );
}

function PitchLines({ w, h }: { w: number; h: number }) {
  const landscape = w > h;
  // Geometry is drawn portrait (short side across, long side down), then rotated onto landscape screens.
  const width = landscape ? h : w;
  const height = landscape ? w : h;
  const inset = 20;
  const pw = width - inset * 2;
  const ph = height - inset * 2;
  const cx = width / 2;
  const cy = height / 2;
  const boxW = pw * 0.56;
  const boxD = ph * 0.16;
  const goalW = pw * 0.28;
  const goalD = ph * 0.06;
  const arcR = pw * 0.11;
  const spotD = boxD * 0.62;
  const arcStart = 0.34;
  const arcSweep = 2.46;

  const arc = (x: number, y: number, start: number) => {
    const end = start + arcSweep;
    return `M ${x + arcR * Math.cos(start)} ${y + arcR * Math.sin(start)} A ${arcR} ${arcR} 0 0 1 ${x + arcR * Math.cos(end)} ${y + arcR * Math.sin(end)}`;
  };

  return (
    <svg className="absolute inset-0 h-full w-full motion-safe:animate-fade-in" width={w} height={h}>
      <g
        transform={landscape ? `translate(0 ${h}) rotate(-90)` : undefined}
        fill="none"
        stroke="rgb(246 241 230 / 0.045)"
        strokeWidth={1.5}
      >
        <rect x={inset} y={inset} width={pw} height={ph} />
        <line x1={inset} y1={cy} x2={width - inset} y2={cy} />
        <circle cx={cx} cy={cy} r={pw * 0.16} />
        <circle cx={cx} cy={cy} r={2.2} fill="rgb(246 241 230 / 0.045)" />

        <rect x={cx - boxW / 2} y={inset} width={boxW} height={boxD} />
        <rect x={cx - goalW / 2} y={inset} width={goalW} height={goalD} />
        <circle cx={cx} cy={inset + spotD} r={2} fill="rgb(246 241 230 / 0.045)" />
        <path d={arc(cx, inset + spotD, arcStart)} />

        <rect x={cx - boxW / 2} y={height - inset - boxD} width={boxW} height={boxD} />
        <rect x={cx - goalW / 2} y={height - inset - goalD} width={goalW} height={goalD} />
        <circle cx={cx} cy={height - inset - spotD} r={2} fill="rgb(246 241 230 / 0.045)" />
        <path d={arc(cx, height - inset - spotD, arcStart + Math.PI)} />
      </g>
    </svg>
  );
}
