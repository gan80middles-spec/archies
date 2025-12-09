
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Entry, Category, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_DESCRIPTIONS, User, REALISM_DESCRIPTIONS, RISK_DESCRIPTIONS, ANOMALOUS_DESCRIPTIONS } from '../types';
import { Search, Hash, ChevronRight, Grid, List, Database, User as UserIcon, Plus, Dna, Sword, Globe, Scroll, Gem, Users, Flag, Map, Zap, Landmark, Scale, BookOpen, Sparkles, Sun, Moon, Activity, ArrowUpRight, Clock, Eye, PenTool, Bookmark, Bell, Filter, SlidersHorizontal, Calendar, ArrowRight, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
// UserHoverCard is still used in the list cards
import { UserHoverCard } from './UserHoverCard';

interface ArchiveViewProps {
  entries: Entry[];
  user: User;
  onNavigateToEditor: (category?: Category) => void;
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToEntry: (entryId: string) => void; // New Prop for Page Navigation
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onInspectUser: (userId: string, username: string, avatarUrl?: string) => void;
}

// Helper to generate consistent pseudo-random stats for visualization
const getCategoryStats = (category: Category) => {
    const str = category + "omniseed-v2";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    
    return {
        entries: (seed % 400) + 42,
        daysAgo: (seed % 12) + 1,
        // Generate pseudo-averages normalized to 0-1 range for bars
        mystic: parseFloat((((seed % 40) / 10) + 1.5).toFixed(1)), // 1.5 - 5.5 (out of 7)
        risk: parseFloat((((seed % 60) / 10) + 1.5).toFixed(1)),   // 1.5 - 7.5 (out of 8)
        realism: parseFloat((((seed % 35) / 10) + 2).toFixed(1))   // 2.0 - 5.5 (out of 5)
    };
};

const CATEGORY_EN_TITLES: Record<Category, string> = {
  [Category.CREATURE]: 'BESTIARY',
  [Category.ITEM]: 'ARTIFACTS',
  [Category.LAW]: 'LAWS & LOGIC',
  [Category.CHRONICLE]: 'CHRONICLES',
  [Category.CHARACTER]: 'PERSONAE',
  [Category.FACTION]: 'FACTIONS',
  [Category.GEOGRAPHY]: 'ATLAS',
  [Category.SKILL]: 'GRIMOIRE',
  [Category.CULTURE]: 'CIVILIZATION',
};

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 15
    }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const getIcon = (category: Category) => {
  switch (CATEGORY_ICONS[category]) {
    case 'dna': return <Dna className="w-full h-full" />;
    case 'sword': return <Sword className="w-full h-full" />;
    case 'globe': return <Globe className="w-full h-full" />;
    case 'scroll': return <Scroll className="w-full h-full" />;
    case 'gem': return <Gem className="w-full h-full" />;
    case 'users': return <Users className="w-full h-full" />;
    case 'flag': return <Flag className="w-full h-full" />;
    case 'map': return <Map className="w-full h-full" />;
    case 'zap': return <Zap className="w-full h-full" />;
    case 'landmark': return <Landmark className="w-full h-full" />;
    case 'scale': return <Scale className="w-full h-full" />;
    default: return <BookOpen className="w-full h-full" />;
  }
};

const getMiniIcon = (category: Category) => {
  const props = { className: "w-4 h-4" };
  switch (CATEGORY_ICONS[category]) {
    case 'dna': return <Dna {...props} />;
    case 'sword': return <Sword {...props} />;
    case 'scroll': return <Scroll {...props} />;
    case 'users': return <Users {...props} />;
    case 'flag': return <Flag {...props} />;
    case 'map': return <Map {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'landmark': return <Landmark {...props} />;
    case 'scale': return <Scale {...props} />;
    default: return <BookOpen {...props} />;
  }
};

// --- INTERACTIVE HERO LOGO (Mouse Tracking) ---
const InteractiveHeroLogo = ({ isLightTheme }: { isLightTheme: boolean }) => {
    const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Vector from center to mouse
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            
            const maxDistance = 12; // Maximum pupil movement in pixels
            const sensitivity = 500; // Distance at which movement maxes out
            
            const rawDistance = Math.sqrt(dx * dx + dy * dy);
            const clampedDist = Math.min(rawDistance, sensitivity);
            const moveAmt = (clampedDist / sensitivity) * maxDistance;
            const angle = Math.atan2(dy, dx);
            
            setPupilPos({
                x: Math.cos(angle) * moveAmt,
                y: Math.sin(angle) * moveAmt
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const color = isLightTheme ? '#d97706' : '#e8c99b'; // amber-600 vs gold

    return (
        <div ref={containerRef} className="relative w-32 h-32 mx-auto mb-10 group cursor-default">
            <motion.svg 
                viewBox="0 0 100 100" 
                className="w-full h-full overflow-visible" 
                fill="none" 
                stroke={color} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            >
                {/* 1. Outer Ring: Draws in */}
                <motion.circle 
                    cx="50" cy="50" r="45" 
                    initial={{ pathLength: 0, opacity: 0, rotate: -90 }}
                    animate={{ pathLength: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                
                {/* 2. Eye Shape: Split */}
                <motion.circle 
                    cx="41" cy="50" r="28" 
                    initial={{ cx: 50, opacity: 0 }}
                    animate={{ cx: 41, opacity: 0.8 }}
                    transition={{ duration: 1.2, delay: 0.4, type: "spring", stiffness: 120, damping: 20 }}
                />
                <motion.circle 
                    cx="59" cy="50" r="28" 
                    initial={{ cx: 50, opacity: 0 }}
                    animate={{ cx: 59, opacity: 0.8 }}
                    transition={{ duration: 1.2, delay: 0.4, type: "spring", stiffness: 120, damping: 20 }}
                />
                
                {/* 3. Tracking Pupil Group */}
                <motion.g 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <motion.g animate={{ x: pupilPos.x, y: pupilPos.y }} transition={{ type: "tween", ease: "linear", duration: 0.05 }}>
                        {/* Pupil Outer */}
                        <circle cx="50" cy="50" r="14" />
                        
                        {/* Core Hollow Ring */}
                        <motion.circle 
                            cx="50" cy="50" r="5" 
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 1.1 }}
                        />
                    </motion.g>
                </motion.g>
            </motion.svg>
            
            {/* Glow Effect */}
            <div className={`absolute inset-0 blur-2xl opacity-20 transition-opacity duration-1000 ${isLightTheme ? 'bg-amber-500' : 'bg-gold'}`}></div>
        </div>
    );
};

// --- ADVANCED SEARCH PANEL ---
const AdvancedSearchPanel = ({ 
    isVisible, 
    isLightTheme, 
    onSearch, 
    onClose 
}: { 
    isVisible: boolean; 
    isLightTheme: boolean; 
    onSearch: (params: any) => void;
    onClose: () => void;
}) => {
    // Mock States for Advanced Filters
    const [category, setCategory] = useState<string>('ALL');
    const [risk, setRisk] = useState<string>('ALL');
    const [timeframe, setTimeframe] = useState<string>('ALL');
    const [sort, setSort] = useState<string>('RELEVANCE');

    // Theme Helpers
    const borderColor = isLightTheme ? 'border-amber-200' : 'border-gold/20';
    const bgColor = isLightTheme ? 'bg-white' : 'bg-obsidian-light/90';
    const textColor = isLightTheme ? 'text-stone-700' : 'text-parchment';
    const labelColor = isLightTheme ? 'text-stone-500' : 'text-parchment-dim';
    const selectBg = isLightTheme ? 'bg-stone-50' : 'bg-black/20';
    const selectBorder = isLightTheme ? 'border-stone-200 focus:border-amber-400' : 'border-white/10 focus:border-gold/40';

    const handleSearch = () => {
        onSearch({ category, risk, timeframe, sort });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`w-full max-w-2xl mx-auto overflow-hidden rounded-sm border shadow-2xl backdrop-blur-md relative ${borderColor} ${bgColor}`}
                >
                    <div className="p-6 relative">
                        <button onClick={onClose} className={`absolute top-4 right-4 p-1 rounded-sm opacity-50 hover:opacity-100 transition-opacity ${textColor}`}>
                            <X className="w-4 h-4" />
                        </button>
                        
                        <h3 className={`text-xs font-bold uppercase tracking-widest font-mono mb-6 flex items-center gap-2 ${labelColor}`}>
                            <SlidersHorizontal className="w-3 h-3" /> 高级检索参数 / ADVANCED_QUERY
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Category */}
                            <div>
                                <label className={`block text-[10px] font-mono font-bold uppercase mb-2 ${labelColor}`}>档案扇区 / Sector</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={`w-full text-xs p-2.5 rounded-sm border outline-none font-serif ${selectBg} ${selectBorder} ${textColor}`}
                                >
                                    <option value="ALL">全域检索 (All Sectors)</option>
                                    {Object.values(Category).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                             {/* Risk Level */}
                             <div>
                                <label className={`block text-[10px] font-mono font-bold uppercase mb-2 ${labelColor}`}>风险等级 / Clearance</label>
                                <select 
                                    value={risk}
                                    onChange={(e) => setRisk(e.target.value)}
                                    className={`w-full text-xs p-2.5 rounded-sm border outline-none font-serif ${selectBg} ${selectBorder} ${textColor}`}
                                >
                                    <option value="ALL">全部等级 (Any Risk)</option>
                                    <option value="LOW">低风险 (Safe/Low)</option>
                                    <option value="MEDIUM">中等风险 (Caution)</option>
                                    <option value="HIGH">极度危险 (Critical/Fatal)</option>
                                </select>
                            </div>

                            {/* Timeframe */}
                            <div>
                                <label className={`block text-[10px] font-mono font-bold uppercase mb-2 ${labelColor}`}>收录时间 / Timeframe</label>
                                <select 
                                    value={timeframe}
                                    onChange={(e) => setTimeframe(e.target.value)}
                                    className={`w-full text-xs p-2.5 rounded-sm border outline-none font-serif ${selectBg} ${selectBorder} ${textColor}`}
                                >
                                    <option value="ALL">历史记录 (All Time)</option>
                                    <option value="WEEK">最近一周 (Recent Cycle)</option>
                                    <option value="MONTH">最近一月 (Lunar Cycle)</option>
                                    <option value="YEAR">本年度 (Solar Cycle)</option>
                                </select>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className={`block text-[10px] font-mono font-bold uppercase mb-2 ${labelColor}`}>排序协议 / Sort Protocol</label>
                                <select 
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                    className={`w-full text-xs p-2.5 rounded-sm border outline-none font-serif ${selectBg} ${selectBorder} ${textColor}`}
                                >
                                    <option value="RELEVANCE">相关度 (Relevance)</option>
                                    <option value="NEWEST">最新收录 (Newest First)</option>
                                    <option value="OLDEST">最旧收录 (Oldest First)</option>
                                    <option value="POPULAR">共鸣热度 (Resonance)</option>
                                </select>
                            </div>
                        </div>

                        <div className={`border-t pt-4 flex justify-end gap-3 ${isLightTheme ? 'border-stone-100' : 'border-white/5'}`}>
                             <button 
                                onClick={onClose}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity ${textColor}`}
                             >
                                取消
                             </button>
                             <button 
                                onClick={handleSearch}
                                className={`px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${isLightTheme ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-gold text-obsidian hover:bg-[#c5a676]'}`}
                             >
                                <Filter className="w-3 h-3" /> 执行过滤
                             </button>
                        </div>
                    </div>
                    {/* Decorative Corner */}
                    <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${borderColor}`}></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- CENTRAL SEARCH HERO COMPONENT ---
const CentralSearchHero = ({ 
    isLightTheme, 
    onSearch 
}: { 
    isLightTheme: boolean; 
    onSearch: (query: string, advancedParams?: any) => void;
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch(inputValue);
        }
    };

    const handleSubmit = () => {
        onSearch(inputValue);
    };

    const handleAdvancedSearch = (params: any) => {
        // In a real app, we would merge 'inputValue' + params and trigger the search
        // For now, we just pass the input value to trigger the list view, 
        // assuming filter logic would be handled by the parent or API in a real implementation.
        // We log the params for now.
        console.log("Advanced Params:", params);
        onSearch(inputValue || " ", params); // Pass a space if empty to force list view open
    };

    const theme = isLightTheme ? {
        inputBg: 'bg-white/80',
        inputBorder: 'border-stone-300 focus:border-amber-500',
        text: 'text-stone-800 placeholder:text-stone-400',
        icon: 'text-stone-400',
        button: 'bg-amber-600 hover:bg-amber-700 text-white',
        link: 'text-stone-500 hover:text-amber-700'
    } : {
        inputBg: 'bg-black/40',
        inputBorder: 'border-white/10 focus:border-gold/50',
        text: 'text-parchment placeholder:text-parchment-dim/30',
        icon: 'text-parchment-dim/50',
        button: 'bg-gold hover:bg-[#c5a676] text-obsidian',
        link: 'text-parchment-dim hover:text-gold'
    };

    return (
        <div className="w-full max-w-xl mx-auto mt-10 relative z-20">
            <div className="relative group">
                <div className={`absolute inset-0 blur-xl opacity-0 transition-opacity duration-500 group-focus-within:opacity-20 ${isLightTheme ? 'bg-amber-400' : 'bg-gold'}`}></div>
                <div className={`relative flex items-center rounded-sm border backdrop-blur-sm transition-all duration-300 shadow-lg ${theme.inputBg} ${theme.inputBorder}`}>
                    <Search className={`w-5 h-5 ml-4 ${theme.icon}`} />
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="检索协议、档案、术语..."
                        className={`w-full py-4 px-4 bg-transparent outline-none font-mono text-sm tracking-wide ${theme.text}`}
                    />
                    <button 
                        onClick={handleSubmit}
                        className={`mr-2 px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-transform active:scale-95 ${theme.button}`}
                    >
                        Search
                    </button>
                </div>
            </div>
            
            <div className="flex justify-center mt-4">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${theme.link}`}
                >
                    {showAdvanced ? '关闭高级面板' : '高级检索'} 
                    <span className="opacity-50">// ADVANCED_QUERY</span>
                    {showAdvanced ? <X className="w-3 h-3"/> : <ChevronRight className="w-3 h-3" />}
                </button>
            </div>

            <AdvancedSearchPanel 
                isVisible={showAdvanced} 
                isLightTheme={isLightTheme} 
                onSearch={handleAdvancedSearch} 
                onClose={() => setShowAdvanced(false)}
            />
        </div>
    );
};

// --- CATEGORY LOADER COMPONENT (Unique Animation per Sector) ---
const CategorySigil = ({ category, color }: { category: Category, color: string }) => {
    switch(category) {
        case Category.CREATURE: // Biology / Pulse
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                    <motion.circle cx="50" cy="50" r="10" stroke={color} strokeWidth="2" fill="none" 
                        animate={{ r: [10, 15, 10], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.circle cx="50" cy="50" r="5" fill={color}
                        initial={{ scale: 0 }} animate={{ scale: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                    <motion.circle cx="35" cy="50" r="3" fill={color}
                        initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} />
                    <motion.circle cx="65" cy="50" r="3" fill={color}
                        initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} />
                    <motion.circle cx="50" cy="35" r="3" fill={color}
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} />
                     <motion.circle cx="50" cy="65" r="3" fill={color}
                        initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} />
                </svg>
            );
        case Category.ITEM: // Lock / Keyhole
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                    <motion.rect x="30" y="35" width="40" height="30" rx="2" stroke={color} strokeWidth="2" fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
                    <motion.path d="M50 35 V 20" stroke={color} strokeWidth="2" 
                         initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.5 }} />
                    <motion.circle cx="50" cy="50" r="4" fill={color} 
                        initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }} transition={{ duration: 0.4, delay: 0.8 }} />
                    <motion.path d="M50 50 L 50 60" stroke={color} strokeWidth="3"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.9 }} />
                </svg>
            );
        case Category.LAW: // Grid / Structure
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                    <motion.path d="M20 50 H80" stroke={color} strokeWidth="1" strokeDasharray="4 4"
                         initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8 }} />
                    <motion.path d="M50 20 V80" stroke={color} strokeWidth="1" strokeDasharray="4 4"
                         initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.8 }} />
                    <motion.rect x="30" y="30" width="40" height="40" stroke={color} strokeWidth="2" fill="none"
                         initial={{ opacity: 0, rotate: 45 }} animate={{ opacity: 1, rotate: 0 }} transition={{ duration: 1 }} />
                    <motion.circle cx="50" cy="50" r="2" fill={color} animate={{ opacity: [0,1,0] }} transition={{ duration: 1, repeat: Infinity }} />
                </svg>
            );
        case Category.CHRONICLE: // Timeline / Clock
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                     <motion.line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="1"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                     {[30, 50, 70].map((cx, i) => (
                         <motion.circle key={i} cx={cx} cy="50" r="3" fill={color}
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + (i * 0.2) }} />
                     ))}
                     <motion.line x1="50" y1="50" x2="50" y2="20" stroke={color} strokeWidth="2"
                        initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 2, ease: "linear", repeat: Infinity }} style={{ originX: "50px", originY: "50px" }} />
                </svg>
            );
        case Category.CHARACTER: // Orbit / Persona
             return (
                <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                     <motion.path d="M50 30 Q70 30 70 50 Q70 70 50 70 Q30 70 30 50 Q30 30 50 30" stroke={color} strokeWidth="2" fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                     <motion.circle cx="50" cy="50" r="10" fill={color} opacity="0.5"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
                     <motion.circle cx="50" cy="20" r="3" fill={color}
                        animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ originX: "50px", originY: "50px" }} />
                     <motion.circle cx="50" cy="80" r="2" fill={color}
                        animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ originX: "50px", originY: "50px" }} />
                </svg>
             );
         case Category.FACTION: // Plates splitting
             return (
                <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                     <motion.path d="M50 50 L50 10 A40 40 0 0 1 85 35 Z" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"
                        initial={{ x: 0, y: 0 }} animate={{ x: 5, y: -5 }} transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }} />
                     <motion.path d="M50 50 L85 35 A40 40 0 0 1 50 90 Z" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"
                        initial={{ x: 0, y: 0 }} animate={{ x: 5, y: 5 }} transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }} />
                     <motion.path d="M50 50 L50 90 A40 40 0 0 1 15 35 Z" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"
                         initial={{ x: 0, y: 0 }} animate={{ x: -5, y: 0 }} transition={{ duration: 1.1, repeat: Infinity, repeatType: "reverse" }} />
                </svg>
             );
         case Category.GEOGRAPHY: // Mountains / Waves
             return (
                 <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                     <motion.polyline points="20,60 40,30 60,60 80,40 90,60" stroke={color} strokeWidth="2" fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                     <motion.path d="M20 70 Q30 65 40 70 T60 70 T80 70" stroke={color} strokeWidth="1" fill="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 2, 0] }} transition={{ delay: 0.5, duration: 2, repeat: Infinity }} />
                     <motion.path d="M20 80 Q30 75 40 80 T60 80 T80 80" stroke={color} strokeWidth="1" fill="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.6, y: [0, -2, 0] }} transition={{ delay: 0.7, duration: 2, repeat: Infinity }} />
                 </svg>
             );
         case Category.SKILL: // Hexagon / Magic
             return (
                 <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                     <motion.path d="M50 20 L76 35 L76 65 L50 80 L24 65 L24 35 Z" stroke={color} strokeWidth="2" fill="none"
                        initial={{ pathLength: 0, rotate: 0 }} animate={{ pathLength: 1, rotate: 360 }} transition={{ duration: 1, rotate: { duration: 10, repeat: Infinity, ease: "linear" } }} />
                     <motion.circle cx="50" cy="50" r="15" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1"
                        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                     <motion.circle cx="50" cy="20" r="2" fill={color} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5 }} />
                     <motion.circle cx="76" cy="65" r="2" fill={color} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5, delay: 0.3 }} />
                     <motion.circle cx="24" cy="65" r="2" fill={color} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5, delay: 0.6 }} />
                 </svg>
             );
         case Category.CULTURE: // Connections / Nodes
             return (
                 <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                     {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                         <motion.g key={i} style={{ originX: "50px", originY: "50px" }} initial={{ rotate: deg }}>
                             <motion.circle cx="50" cy="20" r="3" fill={color}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} />
                             <motion.line x1="50" y1="20" x2="50" y2="35" stroke={color} strokeWidth="1"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.1 }} />
                         </motion.g>
                     ))}
                     <motion.circle cx="50" cy="50" r="10" stroke={color} strokeWidth="1" fill="none"
                        animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 2, repeat: Infinity }} />
                 </svg>
             );
        default:
            return <Activity className="w-24 h-24" color={color} />;
    }
}

const CategoryLoader = ({ category, isLightTheme }: { category: Category, isLightTheme: boolean }) => {
    const color = isLightTheme ? '#d97706' : '#e8c99b'; // amber-600 vs gold

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md ${isLightTheme ? 'bg-white/80' : 'bg-obsidian/80'}`}
        >
            {/* Outer Ring Pulse */}
            <div className="relative flex items-center justify-center">
                <motion.div 
                    className={`absolute w-64 h-64 rounded-full border border-dashed opacity-20 ${isLightTheme ? 'border-stone-400' : 'border-gold'}`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                    className={`absolute w-56 h-56 rounded-full border opacity-10 ${isLightTheme ? 'border-amber-500' : 'border-gold'}`}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <CategorySigil category={category} color={color} />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-12 text-xs font-mono font-bold tracking-[0.3em] uppercase ${isLightTheme ? 'text-stone-500' : 'text-gold'}`}
            >
                Accessing {CATEGORY_EN_TITLES[category]}...
            </motion.div>
        </motion.div>
    );
};

// --- EDITOR LOADER COMPONENT ---
const EditorLoader = ({ isLightTheme }: { isLightTheme: boolean }) => {
    const color = isLightTheme ? '#d97706' : '#e8c99b'; 

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md ${isLightTheme ? 'bg-white/80' : 'bg-obsidian/80'}`}
        >
            <div className="relative flex items-center justify-center">
                 {/* Rotating Grid Background */}
                 <motion.div 
                    className={`absolute w-72 h-72 border border-dashed opacity-10 ${isLightTheme ? 'border-amber-600' : 'border-gold'}`}
                    animate={{ rotate: [0, 90, 180, 270, 360] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                    className={`absolute w-64 h-64 opacity-5 ${isLightTheme ? 'bg-amber-500' : 'bg-gold'}`}
                    animate={{ scale: [0.8, 1, 0.8], opacity: [0.05, 0.1, 0.05] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                />

                <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                    {/* Document Frame */}
                    <motion.rect x="30" y="20" width="40" height="60" rx="2" fill="none" stroke={color} strokeWidth="2" 
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: "easeInOut" }} />
                    
                    {/* Horizontal Lines (Text) */}
                    <motion.path d="M40 35 H60" stroke={color} strokeWidth="2" strokeLinecap="round"
                         initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }} />
                    <motion.path d="M40 50 H60" stroke={color} strokeWidth="2" strokeLinecap="round"
                         initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.6, duration: 0.4 }} />
                    <motion.path d="M40 65 H50" stroke={color} strokeWidth="2" strokeLinecap="round"
                         initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.8, duration: 0.4 }} />

                    {/* Floating Pen/Cursor */}
                    <motion.g initial={{ x: 10, y: 10, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}>
                        <path d="M60 60 L75 75" stroke={color} strokeWidth="2" strokeLinecap="round" />
                        <circle cx="75" cy="75" r="2" fill={color} />
                    </motion.g>
                </svg>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-12 text-xs font-mono font-bold tracking-[0.3em] uppercase ${isLightTheme ? 'text-stone-500' : 'text-gold'}`}
            >
                INITIALIZING WORKSPACE...
            </motion.div>
        </motion.div>
    );
};

// --- New Sector Card Component with Advanced Boot Sequence ---
const SectorCard = ({ 
    category, 
    index, 
    isLightTheme, 
    theme, 
    onNavigate 
}: { 
    category: Category, 
    index: number, 
    isLightTheme: boolean, 
    theme: any, 
    onNavigate: (cat: Category) => void 
}) => {
    const [bootStage, setBootStage] = useState<'OFFLINE' | 'INIT' | 'ACTIVE_CENTER' | 'ONLINE'>('OFFLINE');
    const stats = useMemo(() => getCategoryStats(category), [category]);
    
    useEffect(() => {
        // Randomized boot sequence to create a "cascading system startup" effect
        const startDelay = Math.random() * 800; // Random start time
        const initDuration = 600 + Math.random() * 400; // How long it stays in "INIT"

        const t1 = setTimeout(() => setBootStage('INIT'), startDelay);
        const t2 = setTimeout(() => setBootStage('ACTIVE_CENTER'), startDelay + initDuration);
        const t3 = setTimeout(() => setBootStage('ONLINE'), startDelay + initDuration + 800); // Hold ACTIVE in center for 800ms

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    // Theme-aware bar colors
    const trackColor = isLightTheme ? 'bg-black/10' : 'bg-white/5';
    const mysticColor = isLightTheme ? 'bg-amber-600' : 'bg-[rgba(232,201,155,0.6)]';
    const riskColor = isLightTheme ? 'bg-red-600' : 'bg-red-500/50';
    const realismColor = isLightTheme ? 'bg-blue-600' : 'bg-blue-400/50';

    const isOnline = bootStage === 'ONLINE';

    return (
        <motion.div 
            variants={itemVariants}
            onClick={() => onNavigate(category)}
            whileHover={isOnline ? { scale: 1.01, transition: { duration: 0.2 } } : {}}
            whileTap={{ scale: 0.98 }}
            className={`group relative h-80 ${isLightTheme ? '' : 'backdrop-blur-sm'} border rounded-sm overflow-hidden transition-colors duration-500 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/20 flex flex-col md:flex-row transform-gpu ${theme.border} ${isLightTheme ? 'bg-white hover:border-amber-400' : 'bg-obsidian-light/40 hover:border-gold/30 hover:bg-obsidian-light/60'}`}
        >
            {/* Background Elements (Always visible but dim) */}
            <div className={`absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none transform -rotate-12 group-hover:scale-110 duration-700 ease-out ${isLightTheme ? 'text-stone-900' : 'text-parchment'}`}>
                {getIcon(category)}
            </div>
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${CATEGORY_COLORS[category]} opacity-60 group-hover:opacity-100 transition-opacity`}></div>

            {/* Left Panel: Narrative & Identity (65%) */}
            <div className={`flex-1 p-8 md:p-10 flex flex-col relative z-10 border-b md:border-b-0 md:border-r ${theme.divider}`}>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isOnline ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 flex flex-col"
                >
                    <div className="flex items-start justify-between mb-6">
                        <div className={`w-14 h-14 rounded-sm border flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-inner ${isLightTheme ? 'bg-stone-50 border-stone-200 text-amber-600' : 'bg-white/5 border-white/10 text-gold'}`}>
                            <div className="w-7 h-7">{getIcon(category)}</div>
                        </div>
                        <div className={`text-[10px] font-mono border px-2 py-1 rounded-sm transition-colors ${isLightTheme ? 'text-stone-400 border-stone-200 group-hover:text-amber-600 group-hover:border-amber-300' : 'text-parchment-dim/40 border-white/10 group-hover:text-gold group-hover:border-gold/20'}`}>
                            SEC-{String(index + 1).padStart(2, '0')}
                        </div>
                    </div>

                    <div className="mb-auto">
                        <h3 className={`text-3xl font-serif mb-1 transition-colors ${isLightTheme ? 'text-stone-800 group-hover:text-amber-700' : 'text-parchment group-hover:text-gold'}`}>{category}</h3>
                        <div className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 font-mono ${theme.textMuted}`}>{CATEGORY_EN_TITLES[category]}</div>
                        <p className={`text-sm leading-relaxed font-serif italic max-w-xl ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim/80'}`}>
                            {CATEGORY_DESCRIPTIONS[category]}
                        </p>
                    </div>

                    <div className={`flex items-center gap-6 text-[11px] font-mono mt-8 pt-6 border-t ${theme.divider} ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim/50'}`}>
                        <span className={`flex items-center gap-2 transition-colors ${isLightTheme ? 'group-hover:text-stone-600' : 'group-hover:text-parchment-dim'}`}>
                            <Database className="w-3 h-3" /> {stats.entries} 条记录
                        </span>
                        <span className={`flex items-center gap-2 transition-colors ${isLightTheme ? 'group-hover:text-stone-600' : 'group-hover:text-parchment-dim'}`}>
                            <Clock className="w-3 h-3" /> 更新于 {stats.daysAgo} 天前
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel: Dashboard & Analytics (40%) */}
            <div className={`w-full md:w-[40%] p-8 flex flex-col justify-between relative z-10 ${isLightTheme ? 'bg-stone-50' : 'bg-black/5'}`}>
                
                {/* Header Status Row */}
                <div className="flex justify-between items-center mb-6 h-6">
                    <motion.div 
                        animate={{ opacity: isOnline ? 1 : 0 }} 
                        className={`text-[10px] uppercase tracking-widest font-bold ${theme.textDim}`}
                    >
                        Sector Status
                    </motion.div>
                    
                    {/* The Target Slot for the Active Badge */}
                    <div className="relative w-20 h-full flex justify-end items-center">
                        {isOnline && (
                             <motion.div 
                                layoutId={`status-badge-${category}`}
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="text-[10px] font-mono font-bold tracking-wider text-emerald-500/80"
                            >
                                ACTIVE
                            </motion.div>
                        )}
                        {isOnline && (
                             <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: 0.2 }}
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                             />
                        )}
                    </div>
                </div>

                {/* Content: Charts & Buttons (Hidden until ONLINE) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isOnline ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col h-full justify-center space-y-6"
                >
                    {/* Mini Charts */}
                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        <div>
                            <div className="flex justify-between text-[10px] mb-2">
                                <span className={`${theme.textMuted} font-mono`}>MYSTIC</span>
                                <span className={`${isLightTheme ? 'text-amber-600' : 'text-gold/80'} font-mono`}>{stats.mystic}</span>
                            </div>
                            <div className={`h-1.5 w-full ${trackColor} rounded-full overflow-hidden`}>
                                <motion.div initial={{ width: 0 }} animate={{ width: isOnline ? `${(stats.mystic / 7) * 100}%` : 0 }} transition={{ duration: 1, delay: 0.2 }} className={`h-full ${mysticColor}`}></motion.div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-2">
                                <span className={`${theme.textMuted} font-mono`}>RISK</span>
                                <span className="text-red-400/80 font-mono">{stats.risk}</span>
                            </div>
                            <div className={`h-1.5 w-full ${trackColor} rounded-full overflow-hidden`}>
                                <motion.div initial={{ width: 0 }} animate={{ width: isOnline ? `${(stats.risk / 8) * 100}%` : 0 }} transition={{ duration: 1, delay: 0.4 }} className={`h-full ${riskColor}`}></motion.div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-2">
                                <span className={`${theme.textMuted} font-mono`}>REALISM</span>
                                <span className="text-blue-400/80 font-mono">{stats.realism}</span>
                            </div>
                            <div className={`h-1.5 w-full ${trackColor} rounded-full overflow-hidden`}>
                                <motion.div initial={{ width: 0 }} animate={{ width: isOnline ? `${(stats.realism / 5) * 100}%` : 0 }} transition={{ duration: 1, delay: 0.6 }} className={`h-full ${realismColor}`}></motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-auto">
                        <button className={`flex-1 py-2 border rounded-sm text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 font-bold group/btn ${isLightTheme ? 'bg-white border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-stone-600 hover:text-amber-700' : 'bg-white/5 hover:bg-gold hover:text-obsidian border-white/10 hover:border-gold text-parchment'}`}>
                            <Eye className="w-3 h-3" /> 查阅
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigate(category);
                            }}
                            className={`flex-1 py-2 border rounded-sm text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLightTheme ? 'bg-white border-stone-200 hover:bg-stone-100 hover:border-stone-300 text-stone-400 hover:text-stone-600' : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30 text-parchment-dim hover:text-parchment'}`}
                        >
                            <Plus className="w-3 h-3" /> 录入
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* BOOT SEQUENCE OVERLAY (Center) */}
            <AnimatePresence>
                {!isOnline && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        {bootStage === 'OFFLINE' && (
                             <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`text-xs font-mono tracking-[0.3em] font-bold ${isLightTheme ? 'text-stone-400' : 'text-stone-600'}`}
                             >
                                 OFFLINE
                             </motion.div>
                        )}
                        {bootStage === 'INIT' && (
                             <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: [1, 0.5, 1] }} 
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ repeat: Infinity, duration: 0.2 }}
                                className="text-xs font-mono tracking-[0.2em] text-amber-500 font-bold"
                             >
                                 INITIALIZING...
                             </motion.div>
                        )}
                        {bootStage === 'ACTIVE_CENTER' && (
                             <motion.div
                                layoutId={`status-badge-${category}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1.5 }}
                                exit={{ opacity: 0 }} // Let layoutId handle the movement, but this handles simple unmount if needed
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="text-sm font-mono font-bold tracking-widest text-emerald-500 border border-emerald-500/50 px-4 py-2 rounded-sm bg-emerald-950/30 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                             >
                                ACTIVE
                             </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const ArchiveView: React.FC<ArchiveViewProps> = ({ entries, user, onNavigateToEditor, onNavigateToProfile, onNavigateToNotifications, onNavigateToEntry, onLike, onBookmark, isLightTheme, onToggleTheme, onInspectUser }) => {
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [bootingCategory, setBootingCategory] = useState<Category | null>(null);
  const [isBootingEditor, setIsBootingEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  // Notification Count State
  const [unreadCount, setUnreadCount] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock Fetch Notification Count
  useEffect(() => {
    // Simulate an API call
    const timer = setTimeout(() => {
        setUnreadCount(3); // Mock unread count
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Theme Constants
  const theme = isLightTheme ? {
      border: 'border-stone-200',
      borderStrong: 'border-stone-300',
      bgHover: 'hover:bg-black/5',
      bgCard: 'bg-white/80',
      bgInput: 'bg-white',
      textDim: 'text-stone-500',
      textMuted: 'text-stone-400',
      divider: 'border-stone-200',
      modalSidebar: 'bg-[#f7f5ef]',
      modalContent: 'bg-white',
      shadow: 'shadow-sm',
      tagBg: 'bg-stone-100',
  } : {
      border: 'border-white/5',
      borderStrong: 'border-gold/30',
      bgHover: 'hover:bg-white/10',
      bgCard: 'bg-obsidian-light/60',
      bgInput: 'bg-white/5',
      textDim: 'text-parchment-dim',
      textMuted: 'text-parchment-dim/40',
      divider: 'border-white/10',
      modalSidebar: 'bg-[#0a0a0c]',
      modalContent: 'bg-obsidian-light/50',
      shadow: 'shadow-xl',
      tagBg: 'bg-white/5',
  };

  // Atmospheric Dust Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number; y: number; size: number; speedY: number; opacity: number }[] = [];
    const PARTICLE_COUNT = 100;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.2,
            speedY: Math.random() * 0.2 + 0.05,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    let animationFrameId: number;

    const render = () => {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            p.y -= p.speedY; 
            if (p.y < 0) {
                p.y = height;
                p.x = Math.random() * width;
            }

            // Color adaptation for dust based on theme
            const dustColor = isLightTheme ? '176, 141, 85' : '232, 201, 155'; // Darker gold for light mode
            ctx.fillStyle = `rgba(${dustColor}, ${p.opacity * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [isLightTheme]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesCategory = currentCategory ? entry.category === currentCategory : true;
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [entries, currentCategory, searchQuery]);

  const recentEntries = useMemo(() => {
      return [...entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  }, [entries]);

  // Handle Sector Navigation with Boot Sequence
  const handleSectorClick = (category: Category) => {
      setBootingCategory(category);
      // Simulate "Awakening" delay
      setTimeout(() => {
          setBootingCategory(null);
          setCurrentCategory(category);
      }, 1200);
  };

  // Handle Editor Navigation with Boot Sequence
  const handleNavigateToEditorWithAnimation = () => {
      setIsBootingEditor(true);
      setTimeout(() => {
          setIsBootingEditor(false);
          onNavigateToEditor();
      }, 1200);
  };
  
  // Handle Search Execution from Center or Header
  const handleSearchExecute = (query: string, advancedParams?: any) => {
      setSearchQuery(query);
      if (advancedParams) {
          // In a real app, apply filters. For now, we rely on searchQuery to show the list view.
          if (advancedParams.category && advancedParams.category !== 'ALL') {
              setCurrentCategory(advancedParams.category as Category);
          } else {
              setCurrentCategory(null);
          }
      }
  };

  const isHeroVisible = !currentCategory && !searchQuery;

  return (
    <div className={`min-h-screen font-sans selection:bg-gold/30 selection:text-white transition-colors duration-500 ${isLightTheme ? 'bg-obsidian text-stone-800' : 'bg-obsidian text-parchment'}`}>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />
      <div className="bg-noise"></div>
      
      {/* Central Ambient Light */}
      <div className="ambient-glow"></div>

      {/* Boot Animation Overlays */}
      <AnimatePresence>
          {bootingCategory && <CategoryLoader category={bootingCategory} isLightTheme={isLightTheme} />}
          {isBootingEditor && <EditorLoader isLightTheme={isLightTheme} />}
      </AnimatePresence>

      {/* Fixed Header */}
      <header className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-300 ${isLightTheme ? 'bg-white/90 border-stone-200' : 'bg-obsidian/90 border-gold/10'}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div 
                className={`font-serif text-xl tracking-wide cursor-pointer flex items-center gap-3 hover:text-gold transition-colors ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}
                onClick={() => { setCurrentCategory(null); setSearchQuery(''); }}
             >
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center border shadow-[0_0_15px_rgba(232,201,155,0.1)] ${isLightTheme ? 'bg-amber-50 border-amber-200' : 'bg-gradient-to-br from-gold/20 to-gold/5 border-gold/20'}`}>
                    {/* New OmniEye Logo Small - Thinner Strokes */}
                    <svg viewBox="0 0 100 100" className={`w-5 h-5 ${isLightTheme ? 'text-amber-600' : 'text-gold'}`} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="50" cy="50" r="45" />
                        <circle cx="41" cy="50" r="28" opacity="0.8" />
                        <circle cx="59" cy="50" r="28" opacity="0.8" />
                        <circle cx="50" cy="50" r="14" />
                        {/* Hollow center ring */}
                        <circle cx="50" cy="50" r="4" strokeWidth="4" /> 
                    </svg>
                </div>
                万象档案馆
             </div>

             <nav className={`hidden md:flex items-center text-sm font-medium ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim'}`}>
               <span className="opacity-20 mx-3">/</span>
               <span 
                 onClick={() => { setCurrentCategory(null); setSearchQuery(''); }}
                 className={`cursor-pointer transition-colors ${!currentCategory && !searchQuery ? (isLightTheme ? 'text-amber-600 font-serif' : 'text-gold font-serif') : 'hover:opacity-80'}`}
               >
                 大厅
               </span>
               <AnimatePresence mode="wait">
               {currentCategory && (
                 <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center"
                 >
                    <span className="opacity-20 mx-3">/</span>
                    <span className={`${isLightTheme ? 'text-amber-600' : 'text-gold'} font-serif`}>{currentCategory}</span>
                 </motion.div>
               )}
               </AnimatePresence>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Search Bar - Header Compact - HIDDEN ON HERO */}
             <div className={`hidden lg:flex relative group transition-opacity duration-300 ${isHeroVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 group-focus-within:text-gold transition-colors ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim'}`} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="检索协议..." 
                  className={`border rounded-sm py-1.5 pl-9 pr-4 text-xs w-48 focus:w-64 outline-none transition-all font-mono 
                    ${isLightTheme 
                        ? 'bg-black/5 border-black/5 text-stone-800 focus:bg-white focus:border-amber-500/50 placeholder:text-stone-400' 
                        : 'bg-white/5 border-white/10 text-parchment focus:border-gold/50 focus:bg-white/10'
                    }`}
                />
             </div>

             <div className={`h-6 w-[1px] hidden lg:block ${isLightTheme ? 'bg-stone-300' : 'bg-white/10'}`}></div>

             {/* Theme Toggle */}
             <button 
               onClick={onToggleTheme}
               className={`p-2 rounded-sm transition-colors border border-transparent ${isLightTheme ? 'text-stone-500 hover:text-amber-600 hover:bg-black/5' : 'text-parchment-dim hover:text-gold hover:bg-white/5 hover:border-gold/10'}`}
               title={isLightTheme ? "切换到暗色模式" : "切换到亮色模式"}
             >
               {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>

             {/* Notification Bell */}
             <button
               onClick={onNavigateToNotifications}
               className={`relative p-2 rounded-sm transition-colors border border-transparent ${isLightTheme ? 'text-stone-500 hover:text-amber-600 hover:bg-black/5' : 'text-parchment-dim hover:text-gold hover:bg-white/5 hover:border-gold/10'}`}
               title="通知中心"
             >
               <Bell className="w-4 h-4" />
               {unreadCount > 0 && (
                   <span className="absolute top-1 right-1 -mt-1 -mr-1 flex items-center justify-center min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 border border-obsidian">
                       {unreadCount > 99 ? '99+' : unreadCount}
                   </span>
               )}
             </button>

             <button 
                onClick={handleNavigateToEditorWithAnimation}
                className={`hidden md:flex items-center gap-2 border px-4 py-1.5 rounded-sm text-sm transition-all shadow-lg 
                    ${isLightTheme 
                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300' 
                        : 'bg-white/5 hover:bg-gold/10 border-white/5 hover:border-gold/50 text-parchment hover:text-gold shadow-black/5'
                    }`}
             >
                <Plus className="w-3 h-3" />
                <span className="font-medium tracking-wide">录入档案</span>
             </button>
             
             {/* User Profile */}
             <div 
                className={`flex items-center gap-3 pl-4 border-l cursor-pointer group ${isLightTheme ? 'border-stone-300' : 'border-white/10'}`}
                onClick={onNavigateToProfile}
             >
               <div className="text-right hidden md:block">
                 <div className={`text-xs font-bold transition-colors ${isLightTheme ? 'text-stone-700 group-hover:text-amber-600' : 'text-parchment group-hover:text-gold'}`}>{user.username}</div>
                 <div className={`text-[10px] font-mono tracking-wider ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim'}`}>LEVEL 4</div>
               </div>
               <div className={`w-8 h-8 rounded-sm border flex items-center justify-center overflow-hidden shadow-inner transition-colors ${isLightTheme ? 'bg-stone-100 border-stone-300 group-hover:border-amber-400' : 'bg-obsidian-light border-gold/20 group-hover:border-gold/50'}`}>
                  {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  ) : (
                      <UserIcon className="w-4 h-4 opacity-50" />
                  )}
               </div>
             </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-[1600px] mx-auto">
            
            {/* HERO SECTION - Only show when no category selected */}
            <AnimatePresence>
            {isHeroVisible && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden', marginBottom: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-16 text-center relative py-12"
                >
                   {/* Decorative lines */}
                   <motion.div initial={{ height: 0 }} animate={{ height: 48 }} transition={{ delay: 0.3 }} className="absolute top-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent to-gold/30"></motion.div>
                   <motion.div initial={{ height: 0 }} animate={{ height: 48 }} transition={{ delay: 0.3 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-t from-transparent to-gold/30"></motion.div>
                   
                   {/* Interactive Hero Logo */}
                   <InteractiveHeroLogo isLightTheme={isLightTheme} />

                   <h1 className={`text-5xl md:text-7xl font-serif mb-6 tracking-tight ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}>
                      欢迎进入<span className={`italic ${isLightTheme ? 'text-amber-600' : 'text-gold'}`}>档案馆</span>
                   </h1>
                   <p className={`max-w-2xl mx-auto text-lg font-light leading-relaxed mb-8 ${isLightTheme ? 'text-stone-600' : 'text-parchment-dim'}`}>
                      此处收录了世界的每一次呼吸。从宏大的文明兴衰，到微小的突变异种。<br/>
                      请选择一个扇区开始您的探索，或直接检索核心数据库。
                   </p>

                   {/* CENTRAL SEARCH HERO */}
                   <CentralSearchHero isLightTheme={isLightTheme} onSearch={handleSearchExecute} />

                </motion.div>
            )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <div className="">
                
                {/* CATEGORY GRID */}
                <AnimatePresence mode='wait'>
                {isHeroVisible && (
                  <motion.div 
                    key="category-grid"
                    className="mb-24"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                  >
                    <div className={`flex items-center justify-between mb-8 border-b pb-4 ${theme.divider}`}>
                        <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${theme.textDim}`}>
                            <Grid className="w-4 h-4" /> 档案扇区 / SECTORS
                        </h2>
                        <div className={`text-[10px] font-mono ${theme.textMuted}`}>SECURE ACCESS GRANTED</div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {Object.values(Category).map((category, index) => (
                            <SectorCard 
                                key={category}
                                category={category}
                                index={index}
                                isLightTheme={isLightTheme}
                                theme={theme}
                                onNavigate={handleSectorClick}
                            />
                        ))}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {/* ENTRIES LIST / GRID */}
                {(currentCategory || searchQuery) && !bootingCategory && (
                    <motion.div 
                        key="entries-list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className=""
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-2xl font-serif flex items-center gap-3 ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}>
                                {currentCategory && (
                                    <button onClick={() => setCurrentCategory(null)} className={`transition-colors ${isLightTheme ? 'text-stone-400 hover:text-amber-600' : 'text-parchment-dim hover:text-gold'}`}>
                                        <ChevronRight className="w-6 h-6 rotate-180" />
                                    </button>
                                )}
                                {searchQuery ? `检索结果: "${searchQuery}"` : currentCategory}
                            </h2>
                            <div className={`flex rounded-sm p-1 border ${isLightTheme ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/5'}`}>
                                <button 
                                    onClick={() => setViewMode('GRID')}
                                    className={`p-1.5 rounded-sm transition-colors ${viewMode === 'GRID' ? (isLightTheme ? 'bg-white text-amber-600 shadow-sm' : 'bg-white/10 text-gold') : (isLightTheme ? 'text-stone-400 hover:text-stone-600' : 'text-parchment-dim hover:text-parchment')}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('LIST')}
                                    className={`p-1.5 rounded-sm transition-colors ${viewMode === 'LIST' ? (isLightTheme ? 'bg-white text-amber-600 shadow-sm' : 'bg-white/10 text-gold') : (isLightTheme ? 'text-stone-400 hover:text-stone-600' : 'text-parchment-dim hover:text-parchment')}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {filteredEntries.length === 0 ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`text-center py-24 border border-dashed rounded-sm ${isLightTheme ? 'border-stone-200 bg-stone-50/50' : 'border-white/10 bg-white/[0.02]'}`}>
                                <div className={`mb-4 mx-auto w-12 h-12 flex items-center justify-center border rounded-full ${isLightTheme ? 'text-amber-400 border-amber-200' : 'text-gold/50 border-gold/20'}`}>
                                    <Database className="w-5 h-5" />
                                </div>
                                <p className={`font-serif italic text-lg ${theme.textDim}`}>暂无匹配档案。</p>
                                <p className={`text-[10px] font-mono mt-2 uppercase tracking-widest ${theme.textMuted}`}>NO_DATA_FOUND</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                layout
                                className={`grid gap-6 ${viewMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
                            >
                                <AnimatePresence mode="popLayout">
                                {filteredEntries.map((entry, index) => {
                                    const isLiked = user.likedEntries.includes(entry.id);
                                    const isBookmarked = user.bookmarks.includes(entry.id);
                                    return (
                                    <motion.div 
                                        layout
                                        key={entry.id}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="show"
                                        exit="exit"
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onNavigateToEntry(entry.id)}
                                        whileHover={{ scale: 1.02 }}
                                        className={`group relative overflow-hidden backdrop-blur-sm border rounded-sm p-6 cursor-pointer transition-colors duration-500 transform-gpu ${theme.bgCard} ${theme.border} ${theme.bgHover} ${viewMode === 'LIST' ? 'flex gap-6 items-center' : ''} ${isLightTheme ? 'hover:shadow-lg hover:border-amber-300' : 'hover:shadow-xl hover:border-gold/30'}`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${CATEGORY_COLORS[entry.category]} opacity-40 group-hover:opacity-100 transition-opacity`}></div>
                                        
                                        <div className={`${viewMode === 'LIST' ? 'w-48 shrink-0' : 'mb-4'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={isLightTheme ? 'text-amber-600' : 'text-gold/70'}>{getMiniIcon(entry.category)}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${theme.textMuted}`}>{entry.category}</span>
                                                </div>
                                                {/* Mini Rating Indicators */}
                                                <div className="flex gap-1">
                                                    {entry.risk > 4 && <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" title="高风险"></div>}
                                                    {entry.anomalous > 4 && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" title="高异象"></div>}
                                                </div>
                                            </div>
                                            <h3 className={`font-serif transition-colors ${viewMode === 'LIST' ? 'text-lg' : 'text-xl mb-2'} ${isLightTheme ? 'text-stone-800 group-hover:text-amber-700' : 'text-parchment group-hover:text-gold'}`}>
                                                {entry.title}
                                            </h3>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm line-clamp-2 font-serif italic mb-4 ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim/60'}`}>
                                                <ReactMarkdown allowedElements={['p']} unwrapDisallowed={true} remarkPlugins={[remarkGfm]}>
                                                    {entry.content}
                                                </ReactMarkdown>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                {entry.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-sm font-mono border ${theme.tagBg} ${theme.border} ${isLightTheme ? 'text-stone-500 group-hover:border-stone-300' : 'text-parchment-dim group-hover:border-white/10'}`}>#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className={`${viewMode === 'LIST' ? `w-40 text-right border-l pl-6 ${theme.divider}` : `flex items-center justify-between mt-6 pt-4 border-t ${theme.divider}`}`}>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <UserHoverCard userId={entry.authorId || 'unknown'} username={entry.author} currentUser={user} onInspectUser={onInspectUser} isLightTheme={isLightTheme}>
                                                    <div className={`text-[10px] font-mono mb-1 ${theme.textMuted} hover:text-gold`}>{entry.author}</div>
                                                </UserHoverCard>
                                            </div>
                                            <div className={`flex items-center gap-3 text-xs justify-end ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim/60'}`}>
                                                {/* Collection (Bookmark) Button */}
                                                <motion.button 
                                                    onClick={(e) => { e.stopPropagation(); onBookmark(entry.id); }}
                                                    whileTap={{ scale: 0.9 }}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="relative flex items-center justify-center p-1"
                                                    title="收藏"
                                                >
                                                     <motion.div
                                                         initial={false}
                                                         animate={isBookmarked ? {
                                                             scale: [1, 0.8, 1.2, 1],
                                                             y: [0, -2, 0],
                                                             color: isLightTheme ? '#0891b2' : '#22d3ee' // cyan
                                                         } : {
                                                             scale: 1,
                                                             y: 0,
                                                             color: isLightTheme ? '#a8a29e' : '#9ca3af'
                                                         }}
                                                         transition={{ duration: 0.4 }}
                                                     >
                                                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                                                     </motion.div>
                                                </motion.button>
                                                
                                                {/* Resonance (Like) Button */}
                                                <motion.button 
                                                    onClick={(e) => { e.stopPropagation(); onLike(entry.id); }}
                                                    whileTap={{ scale: 0.9 }}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="flex items-center gap-1 group/like relative p-1"
                                                    title="共鸣"
                                                >
                                                    <motion.div
                                                        animate={isLiked ? {
                                                            scale: [1, 1.2, 1],
                                                            rotate: [0, 45, 0],
                                                            color: isLightTheme ? '#d97706' : '#e8c99b' // gold
                                                        } : {
                                                            scale: 1,
                                                            rotate: 0,
                                                            color: isLightTheme ? '#a8a29e' : '#9ca3af'
                                                        }}
                                                        transition={{ duration: 0.4 }}
                                                    >
                                                        <Sparkles className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                                                    </motion.div>
                                                    <span className={`text-[10px] font-mono ${isLiked ? (isLightTheme ? 'text-amber-600' : 'text-gold') : ''}`}>
                                                        {entry.likes}
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )})}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>
                )}
                
                {/* LATEST ENTRIES (Full Width List) */}
                <AnimatePresence>
                {isHeroVisible && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className={`flex items-center justify-between mb-8 border-b pb-4 ${theme.divider}`}>
                        <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${theme.textDim}`}>
                            <Activity className="w-4 h-4" /> 最新收录 / RECENT logs
                        </h2>
                        <button className={`text-[10px] hover:underline font-mono uppercase tracking-widest flex items-center gap-1 ${isLightTheme ? 'text-amber-600' : 'text-gold'}`}>
                            VIEW ALL <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {recentEntries.map((entry, i) => {
                             const isLiked = user.likedEntries.includes(entry.id);
                             return (
                            <motion.div 
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                onClick={() => onNavigateToEntry(entry.id)}
                                className={`group flex items-center gap-6 border rounded-sm p-4 cursor-pointer transition-colors duration-500 transform-gpu hover:translate-x-1 ${theme.bgCard} ${theme.border} ${isLightTheme ? 'hover:bg-white hover:border-amber-400' : 'bg-obsidian-light/40 hover:border-gold/30 hover:bg-white/5'}`}
                            >
                                {/* Category Icon & Name */}
                                <div className={`w-32 shrink-0 flex items-center gap-3 border-r pr-4 ${theme.divider}`}>
                                    <div className={`transition-colors ${isLightTheme ? 'text-amber-500 group-hover:text-amber-700' : 'text-gold/50 group-hover:text-gold'}`}>
                                        {getMiniIcon(entry.category)}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest font-mono truncate ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim/70'}`}>{entry.category}</div>
                                </div>

                                {/* Title & Snippet */}
                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                    <h3 className={`text-sm font-serif font-bold transition-colors whitespace-nowrap ${isLightTheme ? 'text-stone-800 group-hover:text-amber-700' : 'text-parchment group-hover:text-gold'}`}>
                                        {entry.title}
                                    </h3>
                                    <span className={`text-xs hidden md:inline-block font-mono ${theme.textMuted}`}>/</span>
                                    <div className={`text-xs truncate font-serif italic hidden md:block ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim/50'}`}>
                                        <ReactMarkdown allowedElements={['p']} unwrapDisallowed={true} remarkPlugins={[remarkGfm]}>
                                            {entry.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className={`flex items-center gap-6 text-[10px] font-mono shrink-0 pl-4 border-l ${theme.divider} ${theme.textMuted}`}>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <UserHoverCard userId={entry.authorId || 'unknown'} username={entry.author} currentUser={user} onInspectUser={onInspectUser} isLightTheme={isLightTheme}>
                                            <span className="hidden sm:inline-block hover:text-gold cursor-pointer">{entry.author}</span>
                                        </UserHoverCard>
                                    </div>
                                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                                    {isLiked && <Sparkles className={`w-3 h-3 ${isLightTheme ? 'fill-amber-500 text-amber-500' : 'fill-gold text-gold'}`} />}
                                </div>
                            </motion.div>
                        )})}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
      </main>
    </div>
  );
};
