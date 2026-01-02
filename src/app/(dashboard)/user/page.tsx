
'use client';

import React, { useState, useEffect, useMemo, FC } from 'react';
import {
  Search, Mic, MapPin, Car, Wrench, Zap, Stethoscope, Menu, User, 
  ScanLine, Wallet, Compass, Sun, Moon, Clock, History, Home, 
  Sparkles, AlertTriangle, Activity, ThermometerSun, Wind, ArrowRight, Plus, FlaskConical 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// NOTE: Placeholder for the utility function that joins class names conditionally
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');


// ====================================================================================================================
// --- 1. FRAMER MOTION VARIANTS ---
// ====================================================================================================================

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const ITEM_VARIANTS_SMOOTH = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 16 } },
};

const ITEM_VARIANTS_SNAPPY = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 18 } },
};

// ====================================================================================================================
// --- 2. UI / THEMING COMPONENTS (ThemeToggle) ---
// ====================================================================================================================

interface ThemeToggleProps {
  isDark: boolean;
  toggle: () => void;
}

const getThemeToggleClasses = (isDark: boolean) => ({
  container: cn(
    'relative w-[52px] h-[28px] rounded-full flex items-center px-1 transition-colors duration-300 border backdrop-blur-md',
    isDark
      ? 'bg-[#111111]/80 border-white/15'
      : 'bg-white/80 border-black/10 shadow-sm'
  ),
  thumb: cn(
    'w-[22px] h-[22px] rounded-full shadow-md flex items-center justify-center',
    isDark ? 'bg-neutral-700 text-white' : 'bg-white text-yellow-500'
  ),
});

const ThemeToggle: FC<ThemeToggleProps> = ({ isDark, toggle }) => {
  const classes = getThemeToggleClasses(isDark);

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      className={classes.container}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 28 }}
        className={classes.thumb}
        style={{
          marginLeft: isDark ? '2px' : 'auto',
          marginRight: isDark ? 'auto' : '2px',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div key="moon" initial={{ opacity: 0, rotate: -10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 10 }} transition={{ duration: 0.18 }}>
              <Moon size={13} />
            </motion.div>
          ) : (
            <motion.div key="sun" initial={{ opacity: 0, rotate: 10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -10 }} transition={{ duration: 0.18 }}>
              <Sun size={13} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
};

// ====================================================================================================================
// --- 3. DYNAMIC LAYOUT COMPONENTS (DynamicIsland) ---
// ====================================================================================================================

interface DynamicIslandProps {
  isDark: boolean;
}

const DynamicIsland: FC<DynamicIslandProps> = ({ isDark }) => {
  const [expanded, setExpanded] = useState(false); 

  useEffect(() => {
    const interval = setInterval(() => {
      setExpanded(prev => !prev);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      layout
      onClick={() => setExpanded(prev => !prev)}
      className={cn('mx-auto mt-3 mb-4 cursor-pointer w-full max-w-xs')}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className={cn(
          'flex items-center gap-3 px-4 py-2 rounded-3xl border shadow-sm backdrop-blur-2xl',
          isDark
            ? 'bg-black/60 border-white/10 shadow-black/40'
            : 'bg-white/70 border-black/5 shadow-gray-300/40'
        )}
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-green-500/15">
          <span className="absolute inset-0 rounded-full border border-green-500/40 animate-ping" />
          <Clock size={16} className="text-green-400 relative" />
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={expanded ? 'expanded-title' : 'compact-title'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'text-xs font-semibold tracking-wide truncate',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              {expanded ? 'Searching nearby drivers & services…' : 'Live: 3 rides within 5 mins'}
            </motion.p>
          </AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className={cn(
                'text-[10px] mt-0.5 truncate',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}
            >
              Tap to view map · Smart ETA powered by Curocity
            </motion.p>
          )}
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: expanded ? 1 : 0.6, x: expanded ? 0 : 2 }}
          className="flex items-center"
        >
          <ArrowRight size={14} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// ====================================================================================================================
// --- 4. BENTO GRID COMPONENTS (BentoCard) ---
// ====================================================================================================================

type ColorAccent = 'cyan' | 'amber' | 'red' | 'green' | 'purple' | 'gray';

interface BentoCardProps {
  title: string;
  sub: string;
  icon: LucideIcon;
  href: string;
  colorAccent?: ColorAccent;
  tag?: string;
  colSpan?: 1 | 2;
  isDark: boolean;
}

const getColorClass = (color: ColorAccent) => {
  switch (color) {
    case 'cyan': return 'bg-cyan-500/60';
    case 'amber': return 'bg-amber-500/60';
    case 'red': return 'bg-red-500/60';
    case 'green': return 'bg-emerald-500/60';
    case 'purple': return 'bg-purple-500/60';
    case 'gray': return 'bg-gray-400/60';
    default: return '';
  }
};

const getCardClasses = (colSpan: 1 | 2, isDark: boolean) => ({
  link: cn('block h-full', colSpan === 2 ? 'col-span-2' : 'col-span-1'),
  card: cn(
    'relative h-full min-h-[150px] p-5 rounded-3xl overflow-hidden flex flex-col justify-between group transition-all duration-400 border backdrop-blur-2xl',
    isDark
      ? 'bg-[#111111]/80 border-white/8 shadow-[0_18px_40px_rgba(0,0,0,0.7)]'
      : 'bg-white/80 border-black/5 shadow-[0_18px_40px_rgba(15,23,42,0.15)]'
  ),
  iconBg: cn(
    'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-semibold',
    isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'
  ),
  tag: cn(
    'px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.12em] uppercase',
    isDark ? 'bg-white/6 text-gray-200 border border-white/10' : 'bg-black/5 text-gray-700 border border-black/5'
  ),
  title: cn(
    'text-[15px] font-semibold tracking-tight',
    isDark ? 'text-white' : 'text-gray-900'
  ),
  subtitle: cn(
    'text-[12px] mt-1 leading-relaxed',
    isDark ? 'text-gray-400' : 'text-gray-500'
  ),
});


const BentoCard: FC<BentoCardProps> = ({
  title,
  sub,
  icon: Icon,
  href,
  tag,
  colSpan = 1,
  isDark,
  colorAccent = 'cyan'
}) => {
  const classes = getCardClasses(colSpan, isDark);
  return (
    <Link href={href} className={classes.link}>
      <motion.div
        variants={ITEM_VARIANTS_SNAPPY}
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -2 }}
        className={classes.card}
      >
        {/* subtle accent blob */}
        <div
          className={cn(
            'pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-30 blur-3xl transition-opacity duration-500',
            getColorClass(colorAccent)
          )}
        />

        <div className="flex justify-between items-start z-10">
          <div className={classes.iconBg}>
            <Icon size={22} strokeWidth={1.7} />
          </div>

          {tag && (
            <span className={classes.tag}>
              {tag}
            </span>
          )}
        </div>

        <div className="z-10 mt-6">
          <h3 className={classes.title}>
            {title}
          </h3>
          <p className={classes.subtitle}>
            {sub}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};


// ====================================================================================================================
// --- 5. NAVIGATION / DOCK COMPONENTS (NavIcon) ---
// ====================================================================================================================

interface NavIconProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  isDark: boolean;
  isAction?: boolean;
  onClick?: () => void;
}

const NavIcon: FC<NavIconProps> = ({ icon: Icon, label, active = false, isDark, isAction = false, onClick }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.9 }}
    aria-label={label}
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-1 px-2 py-1 rounded-2xl text-[10px] font-medium tracking-wide transition-colors',
      isDark ? 'text-gray-400' : 'text-gray-600',
      active && !isAction && (isDark ? 'text-white' : 'text-black'), 
      isAction &&
        (isDark
          ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40'
          : 'bg-black text-white shadow-lg shadow-black/25')
    )}
  >
    <Icon size={isAction ? 22 : 20} strokeWidth={isAction ? 2.4 : 2} />
    <span className={cn(active || isAction ? 'opacity-100' : 'opacity-70')}>{label}</span>
  </motion.button>
);


// ====================================================================================================================
// --- 6. OVERLAY / ASSISTANT COMPONENTS (AssistantSheet) ---
// ====================================================================================================================

interface AssistantSheetProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
}

const AssistantSheet: FC<AssistantSheetProps> = ({ open, onClose, isDark }) => {
  const [input, setInput] = useState(''); 

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* overlay */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(circle at top, rgba(15, 23, 42, 0.75), rgba(0,0,0,0.9))'
            }}
          />

          {/* sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50"
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div
              className={cn(
                'mx-auto w-full max-w-md rounded-t-3xl border-t px-4 pt-3 pb-5 backdrop-blur-2xl',
                isDark
                  ? 'bg-[#050505]/95 border-white/10 shadow-[0_-18px_40px_rgba(0,0,0,0.9)]'
                  : 'bg-white/95 border-gray-200 shadow-[0_-18px_40px_rgba(15,23,42,0.2)]'
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className={cn('text-[11px] font-semibold tracking-[0.18em] uppercase', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Curo Assist
                  </p>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    Ask anything about your ride, ResQ or doctors
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close assistant"
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border text-xs',
                    isDark ? 'border-white/15 text-gray-300' : 'border-gray-300 text-gray-700'
                  )}
                >
                  <X size={14} />
                </button>
              </div>

              <div
                className={cn(
                  'rounded-2xl p-3 mb-3 text-[12px] leading-relaxed max-h-48 overflow-y-auto',
                  isDark ? 'bg-white/5 text-gray-200' : 'bg-gray-100 text-gray-800'
                )}
              >
                <div className="mb-2">
                  <p className="font-semibold text-[11px] uppercase tracking-wide mb-1 opacity-70">
                    Suggestions
                  </p>
                  <ul className="space-y-1">
                    <li>• Find cheapest ride to airport</li>
                    <li>• Book nearby mechanic for a flat tyre</li>
                    <li>• Ask which doctor to choose for your issue</li>
                  </ul>
                </div>
                <p className="opacity-70 mt-2">
                  I can compare ETA, costs and availability across Ride, ResQ and Cure in one view.
                </p>
              </div>

              <form
                className="flex items-center gap-2"
                onSubmit={e => {
                  e.preventDefault();
                  setInput('');
                }}
              >
                <div
                  className={cn(
                    'flex-1 flex items-center gap-2 rounded-2xl px-3 py-2 border text-[13px]',
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'
                  )}
                >
                  <MessageCircle size={16} className={cn(isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Curo Assist..."
                    className={cn(
                      'bg-transparent w-full outline-none flex-1',
                      isDark ? 'placeholder:text-gray-500' : 'placeholder:text-gray-500'
                    )}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!input.trim()}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'px-3 py-2 rounded-2xl text-[12px] font-semibold transition-colors',
                    !input.trim()
                      ? 'bg-gray-400/40 text-gray-200 cursor-not-allowed'
                      : isDark
                      ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                      : 'bg-black text-white hover:bg-gray-800'
                  )}
                >
                  Send
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


// ====================================================================================================================
// --- 7. MAIN PAGE COMPONENT (THE FINAL EXPORT) ---
// ====================================================================================================================

export default function UserHUDPage() {
  const [isDark, setIsDark] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchActive, setSearchActive] = useState(false); 

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    document.getElementById('main-search-input')?.blur();
  };

  return (
    <div
      className={cn(
        'min-h-screen w-full relative overflow-hidden',
        isDark ? 'bg-black text-white' : 'bg-[#F5F7FA] text-gray-900',
      )}
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1600&q=80"
          alt="City map"
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            isDark ? 'opacity-60' : 'opacity-70',
          )}
        />
        <div
          className={cn(
            'absolute inset-0 transition-all duration-500',
            isDark
              ? 'bg-gradient-to-b from-black/80 via-black/70 to-black/90'
              : 'bg-gradient-to-b from-white/60 via-white/50 to-black/70',
          )}
        />
        <div className="absolute inset-0 backdrop-blur-[18px]" />
      </div>

      <NoiseOverlay />

      {/* MAIN CONTENT FRAME */}
      <div className="relative z-10 max-w-[540px] mx-auto flex flex-col min-h-screen pb-24">
        {/* HEADER */}
        <header className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black/80 border border-white/20 flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.8)]">
              <span className="font-black text-lg italic text-white">C</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
                {greeting}
              </p>
              <p className="text-sm font-semibold leading-tight">
                {userName}, your city is online.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle isDark={isDark} toggle={() => setIsDark((v) => !v)} />
            <Link href="/user/profile">
              <div className="w-9 h-9 rounded-full border border-white/30 overflow-hidden active:scale-95 transition-transform">
                <img
                  src="https://i.pravatar.cc/150?img=11"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* SEARCH BAR (HUD STYLE) */}
        <motion.div
          variants={ITEM_VARIANTS_SMOOTH}
          initial="hidden"
          animate="show"
          className="px-4 mb-3"
        >
          <div
            className={cn(
              'w-full rounded-2xl border px-4 py-3 flex items-center gap-3 backdrop-blur-xl shadow-[0_14px_35px_rgba(0,0,0,0.6)]',
              isDark ? 'bg-black/70 border-white/10' : 'bg-white/90 border-gray-200',
            )}
          >
            <Search size={18} className="text-gray-400" />
            <input
              placeholder="Where to next?"
              className={cn(
                'bg-transparent w-full outline-none text-sm font-medium',
                isDark ? 'placeholder:text-gray-500' : 'placeholder:text-gray-500',
              )}
            />
            <Mic size={18} className="text-cyan-400" />
          </div>
        </motion.div>

        {/* SCROLLABLE AREA */}
        <motion.main
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="show"
          className="flex-1 px-4 pb-4 space-y-5 overflow-y-auto no-scrollbar"
        >
          {/* TOP HUD */}
          <TopHUD isDark={isDark} />

          {/* SMART ACTIONS */}
          <section className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-1">
              Smart actions
            </p>
            <SmartAction
              isDark={isDark}
              title="Go home?"
              desc="It’s evening. Nearest ride 4–6 min from your location."
              icon={Car}
              tone="ride"
            />
            <SmartAction
              isDark={isDark}
              title="Check your bike?"
              desc="ResQ partners active within 3 km radius."
              icon={Wrench}
              tone="resq"
            />
            <SmartAction
              isDark={isDark}
              title="Save a hospital shortcut"
              desc="Pin your preferred hospital for one-tap Cure SOS."
              icon={Stethoscope}
              tone="cure"
            />
          </section>

          {/* CORE MODULES */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Modules
              </p>
              <span className="text-[11px] text-gray-400">Path · ResQ · Cure · More</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ServiceTile
                title="Ride"
                sub="City · Path"
                icon={Car}
                href="/user/ride-booking"
                isDark={isDark}
                meta="Live"
                colorClass="text-cyan-400"
              />
              <ServiceTile
                title="ResQ"
                sub="Roadside help"
                icon={Wrench}
                href="/user/resq"
                isDark={isDark}
                meta="24/7"
                colorClass="text-amber-400"
              />
              <ServiceTile
                title="SOS · Cure"
                sub="Emergency only"
                icon={Zap}
                href="/user/cure-booking"
                isDark={isDark}
                meta="Priority"
                colorClass="text-red-400"
              />
              <ServiceTile
                title="Doctor"
                sub="Consult & book"
                icon={Stethoscope}
                href="/user/appointment-booking"
                isDark={isDark}
                meta="Care"
                colorClass="text-emerald-400"
              />
              <ServiceTile
                title="Lab Tests"
                sub="Home Collection"
                icon={FlaskConical}
                href="/user/lab-tests"
                isDark={isDark}
                meta="Health"
                colorClass="text-purple-400"
               />
              <ServiceTile
                title="More"
                sub="All city tools"
                icon={Menu}
                href="/user/modules"
                isDark={isDark}
                meta="Explore"
                colorClass="text-gray-400"
              />
            </div>
          </section>

          {/* CURO ASSIST */}
          <section>
            <motion.button
              variants={ITEM_VARIANTS_SNAPPY}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                // TODO: open assist bottom sheet
              }}
              className={cn(
                'w-full rounded-2xl py-3.5 px-4 flex items-center justify-between gap-3 font-semibold text-sm shadow-[0_18px_50px_rgba(0,0,0,0.7)]',
                isDark
                  ? 'bg-cyan-400 text-black hover:bg-cyan-300'
                  : 'bg-black text-white hover:bg-gray-900',
              )}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span>Curo Assist</span>
                <span className="text-[11px] font-normal opacity-80">
                  Ask about routes, hospitals, help…
                </span>
              </div>
              <ArrowRightMini />
            </motion.button>
          </section>
        </main>
      </div>
    </div>
  );
}

// small arrow icon so we don't import extra
const ArrowRightMini = () => (
  <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
    <span className="inline-block translate-x-[1px] text-xs">↗</span>
  </div>
);
