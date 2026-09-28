'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Cross, Flame, LifeBuoy } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ========================================
// LIVE DISPATCH DEMO DATA
// ========================================

const DEPT = {
  fire: { label: 'Fire', icon: Flame, hex: '#DC2626', soft: '#FEF2F2' },
  medical: { label: 'Medical', icon: Cross, hex: '#16A34A', soft: '#F0FDF4' },
  rescue: { label: 'Rescue', icon: LifeBuoy, hex: '#2563EB', soft: '#EFF6FF' }
};

// Incoming calls that cycle through the feed.
const CALLS = [
  { type: 'fire', place: 'Holy Spirit', km: '0.6' },
  { type: 'medical', place: 'Commonwealth', km: '1.2' },
  { type: 'rescue', place: 'Tandang Sora', km: '0.9' },
  { type: 'fire', place: 'Payatas', km: '2.4' },
  { type: 'medical', place: 'Fairview', km: '1.8' },
  { type: 'rescue', place: 'Culiat', km: '1.1' }
];

// Streets the responder units drive along (station at 110,110).
const ROUTES = [
  { type: 'fire', d: 'M110 110 H250 V50 H430', end: [430, 50], dur: 7, begin: 0 },
  { type: 'medical', d: 'M110 110 H380 V150 H520', end: [520, 150], dur: 9, begin: 1.5 },
  { type: 'rescue', d: 'M110 110 V180 H300', end: [300, 180], dur: 6, begin: 3 }
];

// Incident status is derived from how many ticks old it is.
function statusFor(age) {
  if (age < 3) {
    return { text: 'Call received', color: '#B45309', live: true };
  }

  if (age < 9) {
    const eta = Math.max(1, 4 - Math.floor((age - 3) / 2));
    return { text: `Unit en route · ETA ${eta} min`, color: '#2563EB', live: true };
  }

  return { text: 'Unit on scene', color: '#16A34A', live: false };
}

const ANIMATION_CSS = `
@keyframes esg-pulse{0%{transform:scale(1);opacity:.45}100%{transform:scale(3);opacity:0}}
@keyframes esg-dash{to{stroke-dashoffset:-20}}
@keyframes esg-in{from{opacity:0;transform:translateY(-10px);max-height:0}to{opacity:1;transform:none;max-height:68px}}
.esg-pulse{transform-box:fill-box;transform-origin:center;animation:esg-pulse 2.4s ease-out infinite}
.esg-flow{animation:esg-dash 1.2s linear infinite}
.esg-in{animation:esg-in .55s cubic-bezier(.16,1,.3,1) both;overflow:hidden}
@media (prefers-reduced-motion: reduce){.esg-pulse,.esg-flow,.esg-in{animation:none}}
`;

// ========================================
// MAP: units move from the station to each incident, then repeat
// ========================================

function DispatchMap({ reduce }) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 640 230"
        className="block h-auto w-full"
        role="img"
        aria-label="Animated map of responder units driving to incidents"
      >
        <rect width="640" height="230" fill="#F6F1E9" />

        {/* park + river */}
        <rect x="270" y="62" width="95" height="76" rx="12" fill="#E6EFE1" />
        <path
          d="M-10 205 C120 160 210 225 340 195 S560 150 650 178"
          fill="none"
          stroke="#DCEAF3"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* streets */}
        <g stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none">
          {[110, 250, 380, 520].map(x => (
            <path key={`v${x}`} d={`M${x} -5 V235`} />
          ))}
          {[50, 110, 150, 180].map(y => (
            <path key={`h${y}`} d={`M-5 ${y} H645`} />
          ))}
        </g>

        {/* routes */}
        {ROUTES.map(r => (
          <path
            key={`route-${r.type}`}
            d={r.d}
            fill="none"
            stroke={DEPT[r.type].hex}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 6"
            opacity=".55"
            className="esg-flow"
          />
        ))}

        {/* station + coverage */}
        <circle
          cx="110"
          cy="110"
          r="62"
          fill="#DC2626"
          fillOpacity=".04"
          stroke="#DC2626"
          strokeOpacity=".3"
          strokeDasharray="4 5"
        />
        <circle cx="110" cy="110" r="9" fill="#211B19" stroke="#fff" strokeWidth="3" />
        <text x="110" y="136" textAnchor="middle" fontSize="10" fontWeight="600" fill="#211B19">
          Station
        </text>

        {/* incidents */}
        {ROUTES.map((r, i) => {
          const dept = DEPT[r.type];

          return (
            <g key={`inc-${r.type}`} transform={`translate(${r.end[0]} ${r.end[1]})`}>
              <circle r="10" fill={dept.hex} className="esg-pulse" />
              <circle
                r="10"
                fill={dept.hex}
                className="esg-pulse"
                style={{ animationDelay: '1.2s' }}
              />
              <circle r="8" fill={dept.hex} stroke="#fff" strokeWidth="2.5" />
              <text
                y="3"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#fff"
              >
                {dept.label[0]}
              </text>
            </g>
          );
        })}

        {/* responder units */}
        {!reduce &&
          ROUTES.map(r => {
            const dept = DEPT[r.type];
            const dur = `${r.dur}s`;
            const begin = `${r.begin}s`;

            return (
              <g key={`unit-${r.type}`} opacity="0">
                <circle r="12" fill={dept.hex} opacity=".18" />
                <circle r="6" fill={dept.hex} stroke="#fff" strokeWidth="2.5" />

                <animateMotion
                  path={r.d}
                  dur={dur}
                  begin={begin}
                  repeatCount="indefinite"
                  calcMode="linear"
                  keyPoints="0;1;1"
                  keyTimes="0;0.65;1"
                />

                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.05;0.9;1"
                  dur={dur}
                  begin={begin}
                  repeatCount="indefinite"
                />
              </g>
            );
          })}
      </svg>

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
        3 units responding
      </div>

      <div className="absolute bottom-3 left-4 flex items-center gap-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-gray-600 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {Object.values(DEPT).map(d => (
          <span key={d.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.hex }} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ========================================
// LIVE FEED: new calls slide in, statuses progress on their own
// ========================================

function makeItem(n, born) {
  return { id: n, born, ...CALLS[n % CALLS.length] };
}

function LiveFeed({ items, tick }) {
  return (
    <ul className="h-[204px] overflow-hidden">
      {items.map(item => {
        const dept = DEPT[item.type];
        const Icon = dept.icon;
        const status = statusFor(tick - item.born);

        return (
          <li key={item.id} className="esg-in pb-2">
            <div
              className="flex h-[60px] items-center gap-3.5 rounded-xl border bg-white px-3.5 shadow-sm"
              style={{
                borderColor: '#ECE5DA',
                borderLeft: `4px solid ${dept.hex}`
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: dept.soft, color: dept.hex }}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {dept.label} · {item.place}
                </div>

                <div
                  className="mt-0.5 flex items-center gap-1.5 truncate text-xs transition-colors"
                  style={{ color: status.color }}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      status.live ? 'animate-pulse' : ''
                    }`}
                    style={{ backgroundColor: status.color }}
                  />
                  {status.text}
                </div>
              </div>

              <span
                className="rounded px-2 py-1 font-['IBM_Plex_Mono'] text-xs font-semibold"
                style={{ backgroundColor: dept.soft, color: dept.hex }}
              >
                {item.km} km
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LiveDispatchCard() {
  const [tick, setTick] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [items, setItems] = useState(() => [
    makeItem(2, -1),
    makeItem(1, -5),
    makeItem(0, -9),
    makeItem(5, -12)
  ]);

  // Respect the "reduce motion" setting for the moving units.
  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // One clock drives everything: every second statuses advance.
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Every 4 seconds a new call arrives at the top of the feed.
  useEffect(() => {
    if (tick > 0 && tick % 4 === 0) {
      setItems(prev => [makeItem(prev[0].id + 1, tick), ...prev].slice(0, 4));
    }
  }, [tick]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ECE5DA] bg-white shadow-2xl">
      <style>{ANIMATION_CSS}</style>

      <div className="flex items-center gap-4 border-b border-[#ECE5DA] bg-gray-50/50 px-5 py-4">
        <img src="/logo.png" alt="E-Sagip" className="h-auto w-[135px] object-contain" />

        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
          Live
        </span>
      </div>

      <DispatchMap reduce={reduce} />

      <div className="bg-[#FAF7F2] p-4">
        <LiveFeed items={items} tick={tick} />
      </div>
    </div>
  );
}

// ========================================
// PAGE
// ========================================

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-['IBM_Plex_Sans'] text-[#211B19]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#ECE5DA]">
        <div className="max-w-6xl mx-auto px-6 h-[76px] flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-3" aria-label="E-Sagip home">
            <img src="/logo.png" alt="E-Sagip Mobile Emergency App" className="w-[150px] h-auto object-contain" />
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/login')} className="text-sm font-semibold hidden sm:block hover:text-[#B3261E]">Sign in</button>
            <button onClick={() => router.push('/register')} className="text-sm font-semibold px-5 py-2.5 rounded-md bg-[#B3261E] text-white hover:bg-[#8A1913] transition-colors shadow-sm">Register</button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-28">
        <div className="grid md:grid-cols-[38.2fr_61.8fr] gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#B3261E] mb-4">Unified emergency dispatch</p>
            <h1 className="font-['Space_Grotesk'] font-semibold text-4xl sm:text-5xl leading-[1.1] tracking-tight">Every call, routed while seconds still matter.</h1>
            <p className="mt-6 text-[15px] leading-relaxed text-[#726A64] max-w-[34ch]">A live queue, a shared map, and one clear record of every incident, dynamically tailored for Fire, Medical, and Rescue dispatchers.</p>
            <div className="mt-8 flex gap-4">
              <button onClick={() => router.push('/register')} className="flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white rounded-lg font-medium hover:bg-[#B91C1C] transition-colors">Start Dispatching <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>

          <LiveDispatchCard />
        </div>
      </section>
    </div>
  );
}
