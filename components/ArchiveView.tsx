import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Entry, Category, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_DESCRIPTIONS, User, REALISM_DESCRIPTIONS, RISK_DESCRIPTIONS, ANOMALOUS_DESCRIPTIONS } from '../types';
import { Search, Hash, Heart, ChevronRight, Grid, List, Database, User as UserIcon, Plus, Dna, Sword, Globe, Scroll, Gem, Users, Flag, Map, Zap, Landmark, Scale, BookOpen, Sparkles, Sun, Moon, Brain, AlertTriangle, Activity, ArrowUpRight, BarChart3, Clock, Eye, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArchiveViewProps {
  entries: Entry[];
  user: User;
  onNavigateToEditor: (category?: Category) => void;
  onNavigateToProfile: () => void;
  onLike: (id: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
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

export const ArchiveView: React.FC<ArchiveViewProps> = ({ entries, user, onNavigateToEditor, onNavigateToProfile, onLike, isLightTheme, onToggleTheme }) => {
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <div className={`min-h-screen font-sans selection:bg-gold/30 selection:text-white transition-colors duration-500 ${isLightTheme ? 'bg-obsidian text-stone-800' : 'bg-obsidian text-parchment'}`}>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />
      <div className="bg-noise"></div>
      
      {/* Central Ambient Light */}
      <div className="ambient-glow"></div>

      {/* Fixed Header */}
      <header className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-300 ${isLightTheme ? 'bg-white/90 border-stone-200' : 'bg-obsidian/90 border-gold/10'}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div 
                className={`font-serif text-xl tracking-wide cursor-pointer flex items-center gap-3 hover:text-gold transition-colors ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}
                onClick={() => setCurrentCategory(null)}
             >
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center border shadow-[0_0_15px_rgba(232,201,155,0.1)] ${isLightTheme ? 'bg-amber-50 border-amber-200' : 'bg-gradient-to-br from-gold/20 to-gold/5 border-gold/20'}`}>
                    <Database className={`w-4 h-4 ${isLightTheme ? 'text-amber-600' : 'text-gold'}`} />
                </div>
                万象档案馆
             </div>

             <nav className={`hidden md:flex items-center text-sm font-medium ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim'}`}>
               <span className="opacity-20 mx-3">/</span>
               <span 
                 onClick={() => setCurrentCategory(null)}
                 className={`cursor-pointer transition-colors ${!currentCategory ? (isLightTheme ? 'text-amber-600 font-serif' : 'text-gold font-serif') : 'hover:opacity-80'}`}
               >
                 大厅
               </span>
               {currentCategory && (
                 <>
                    <span className="opacity-20 mx-3">/</span>
                    <span className={`${isLightTheme ? 'text-amber-600' : 'text-gold'} font-serif animate-fade-in`}>{currentCategory}</span>
                 </>
               )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Search Bar - Header Compact */}
             <div className="hidden lg:flex relative group">
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

             <button 
                onClick={() => onNavigateToEditor()}
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
            {!currentCategory && !searchQuery && (
                <div className="mb-16 text-center animate-fade-in relative py-12">
                   {/* Decorative lines */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-transparent to-gold/30"></div>
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-t from-transparent to-gold/30"></div>
                   
                   <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono mb-6 tracking-widest uppercase ${isLightTheme ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-gold/20 bg-gold/5 text-gold'}`}>
                      <Sparkles className="w-3 h-3" /> System Operational
                   </div>
                   <h1 className={`text-5xl md:text-7xl font-serif mb-6 tracking-tight ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}>
                      欢迎进入<span className={`italic ${isLightTheme ? 'text-amber-600' : 'text-gold'}`}>档案馆</span>
                   </h1>
                   <p className={`max-w-2xl mx-auto text-lg font-light leading-relaxed ${isLightTheme ? 'text-stone-600' : 'text-parchment-dim'}`}>
                      此处收录了世界的每一次呼吸。从宏大的文明兴衰，到微小的突变异种。<br/>
                      请选择一个扇区开始您的探索，或直接检索核心数据库。
                   </p>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="animate-slide-up">
                
                {/* CATEGORY GRID */}
                {!currentCategory && !searchQuery && (
                  <div className="mb-24">
                    <div className={`flex items-center justify-between mb-8 border-b pb-4 ${theme.divider}`}>
                        <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${theme.textDim}`}>
                            <Grid className="w-4 h-4" /> 档案扇区 / SECTORS
                        </h2>
                        <div className={`text-[10px] font-mono ${theme.textMuted}`}>SECURE ACCESS GRANTED</div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {Object.values(Category).map((category, index) => {
                            const stats = getCategoryStats(category);
                            
                            // Theme-aware bar colors
                            const trackColor = isLightTheme ? 'bg-black/10' : 'bg-white/5';
                            const mysticColor = isLightTheme ? 'bg-amber-600' : 'bg-[rgba(232,201,155,0.6)]';
                            const riskColor = isLightTheme ? 'bg-red-600' : 'bg-red-500/50';
                            const realismColor = isLightTheme ? 'bg-blue-600' : 'bg-blue-400/50';

                            return (
                                <div 
                                    key={category}
                                    onClick={() => setCurrentCategory(category)}
                                    // FIXED: Added transform-gpu to force layer promotion and prevent paint issues during theme switch.
                                    // FIXED: Removed backdrop-blur-sm in light mode as bg is opaque white.
                                    // FIXED: Increased transition duration to 500ms to match body transition.
                                    className={`group relative h-80 ${isLightTheme ? '' : 'backdrop-blur-sm'} border rounded-sm overflow-hidden transition-all duration-500 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/20 flex flex-col md:flex-row transform-gpu ${theme.border} ${isLightTheme ? 'bg-white hover:border-amber-400' : 'bg-obsidian-light/40 hover:border-gold/30 hover:bg-obsidian-light/60'}`}
                                >
                                    {/* Background Watermark */}
                                    <div className={`absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none transform -rotate-12 group-hover:scale-110 duration-700 ease-out ${isLightTheme ? 'text-stone-900' : 'text-parchment'}`}>
                                        {getIcon(category)}
                                    </div>
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${CATEGORY_COLORS[category]} opacity-60 group-hover:opacity-100 transition-opacity`}></div>

                                    {/* Left Panel: Narrative & Identity (65%) */}
                                    <div className={`flex-1 p-8 md:p-10 flex flex-col relative z-10 border-b md:border-b-0 md:border-r ${theme.divider}`}>
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
                                    </div>

                                    {/* Right Panel: Dashboard & Analytics (35%) */}
                                    <div className={`w-full md:w-[35%] p-8 flex flex-col justify-between relative z-10 ${isLightTheme ? 'bg-stone-50' : 'bg-black/5'}`}>
                                        
                                        {/* Status */}
                                        <div className="flex justify-between items-center mb-6">
                                            <div className={`text-[10px] uppercase tracking-widest font-bold ${theme.textDim}`}>Sector Status</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[10px] font-mono text-emerald-500/80">ACTIVE</span>
                                            </div>
                                        </div>

                                        {/* Mini Charts */}
                                        <div className="space-y-4 mb-8 flex-1">
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1.5">
                                                    <span className={`${theme.textMuted} font-mono`}>MYSTIC</span>
                                                    <span className={`${isLightTheme ? 'text-amber-600' : 'text-gold/80'} font-mono`}>{stats.mystic}</span>
                                                </div>
                                                <div className={`h-1 w-full ${trackColor} rounded-full overflow-hidden`}>
                                                    <div className={`h-full ${mysticColor}`} style={{width: `${(stats.mystic / 7) * 100}%`}}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1.5">
                                                    <span className={`${theme.textMuted} font-mono`}>RISK</span>
                                                    <span className="text-red-400/80 font-mono">{stats.risk}</span>
                                                </div>
                                                <div className={`h-1 w-full ${trackColor} rounded-full overflow-hidden`}>
                                                    <div className={`h-full ${riskColor}`} style={{width: `${(stats.risk / 8) * 100}%`}}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1.5">
                                                    <span className={`${theme.textMuted} font-mono`}>REALISM</span>
                                                    <span className="text-blue-400/80 font-mono">{stats.realism}</span>
                                                </div>
                                                <div className={`h-1 w-full ${trackColor} rounded-full overflow-hidden`}>
                                                    <div className={`h-full ${realismColor}`} style={{width: `${(stats.realism / 5) * 100}%`}}></div>
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
                                                    onNavigateToEditor(category);
                                                }}
                                                className={`flex-1 py-2 border rounded-sm text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLightTheme ? 'bg-white border-stone-200 hover:bg-stone-100 hover:border-stone-300 text-stone-400 hover:text-stone-600' : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30 text-parchment-dim hover:text-parchment'}`}
                                            >
                                                <Plus className="w-3 h-3" /> 录入
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                )}

                {/* ENTRIES LIST / GRID */}
                {(currentCategory || searchQuery) && (
                    <div className="animate-fade-in">
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
                            <div className={`text-center py-24 border border-dashed rounded-sm ${isLightTheme ? 'border-stone-200 bg-stone-50/50' : 'border-white/10 bg-white/[0.02]'}`}>
                                <div className={`mb-4 mx-auto w-12 h-12 flex items-center justify-center border rounded-full ${isLightTheme ? 'text-amber-400 border-amber-200' : 'text-gold/50 border-gold/20'}`}>
                                    <Database className="w-5 h-5" />
                                </div>
                                <p className={`font-serif italic text-lg ${theme.textDim}`}>暂无匹配档案。</p>
                                <p className={`text-[10px] font-mono mt-2 uppercase tracking-widest ${theme.textMuted}`}>NO_DATA_FOUND</p>
                            </div>
                        ) : (
                            <div className={`grid gap-6 ${viewMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {filteredEntries.map(entry => (
                                    <div 
                                        key={entry.id}
                                        onClick={() => setSelectedEntry(entry)}
                                        // FIXED: Added transform-gpu and duration-500 here as well
                                        className={`group relative overflow-hidden backdrop-blur-sm border rounded-sm p-6 cursor-pointer transition-all duration-500 transform-gpu ${theme.bgCard} ${theme.border} ${theme.bgHover} ${viewMode === 'LIST' ? 'flex gap-6 items-center' : ''} ${isLightTheme ? 'hover:shadow-lg hover:border-amber-300' : 'hover:shadow-xl hover:border-gold/30'}`}
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
                                        
                                        <div className={`${viewMode === 'LIST' ? `w-32 text-right border-l pl-6 ${theme.divider}` : `flex items-center justify-between mt-6 pt-4 border-t ${theme.divider}`}`}>
                                            <div className={`text-[10px] font-mono mb-1 ${theme.textMuted}`}>{entry.author}</div>
                                            <div className={`flex items-center gap-4 text-xs justify-end ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim/60'}`}>
                                                <span className="flex items-center gap-1 group-hover:text-red-400 transition-colors">
                                                    <Heart className={`w-3 h-3 ${user.favorites.includes(entry.id) ? 'fill-red-900 text-red-900' : ''}`} /> {entry.likes}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* LATEST ENTRIES (Full Width List) */}
                {!currentCategory && !searchQuery && (
                  <div>
                    <div className={`flex items-center justify-between mb-8 border-b pb-4 ${theme.divider}`}>
                        <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${theme.textDim}`}>
                            <Activity className="w-4 h-4" /> 最新收录 / RECENT LOGS
                        </h2>
                        <button className={`text-[10px] hover:underline font-mono uppercase tracking-widest flex items-center gap-1 ${isLightTheme ? 'text-amber-600' : 'text-gold'}`}>
                            VIEW ALL <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {recentEntries.map(entry => (
                            <div 
                                key={entry.id}
                                onClick={() => setSelectedEntry(entry)}
                                // FIXED: Added transform-gpu and duration-500 here as well
                                className={`group flex items-center gap-6 border rounded-sm p-4 cursor-pointer transition-all duration-500 transform-gpu hover:translate-x-1 ${theme.bgCard} ${theme.border} ${isLightTheme ? 'hover:bg-white hover:border-amber-400' : 'bg-obsidian-light/40 hover:border-gold/30 hover:bg-white/5'}`}
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
                                    <span className="hidden sm:inline-block">{entry.author}</span>
                                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                                    <Heart className={`w-3 h-3 group-hover:text-red-400 ${user.favorites.includes(entry.id) ? 'fill-red-900 text-red-900' : ''}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
        </div>
      </main>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}></div>
            <div className={`relative w-full max-w-4xl h-full md:h-auto max-h-[90vh] border rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden animate-slide-up ${isLightTheme ? 'bg-white border-stone-200' : 'bg-obsidian border-gold/20'}`}>
                
                {/* Modal Left: Content */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative ${theme.modalContent}`}>
                     <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-transparent to-transparent ${isLightTheme ? 'via-amber-400/50' : 'via-gold/50'}`}></div>
                     <button 
                        onClick={() => setSelectedEntry(null)}
                        className={`absolute top-4 right-4 md:hidden p-2 ${theme.textDim}`}
                     >
                        Close
                     </button>

                     <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-sm font-mono ${isLightTheme ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gold/10 text-gold border-gold/20'}`}>{selectedEntry.category}</span>
                            <span className={`text-xs font-mono ${theme.textMuted}`}>{new Date(selectedEntry.createdAt).toLocaleString()}</span>
                        </div>
                        <h1 className={`text-4xl font-serif mb-4 ${isLightTheme ? 'text-stone-900' : 'text-parchment'}`}>{selectedEntry.title}</h1>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedEntry.tags.map(tag => (
                                <span key={tag} className={`text-xs px-2 py-1 rounded-sm font-mono ${theme.tagBg} ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim/60'}`}>#{tag}</span>
                            ))}
                        </div>
                     </div>

                     <div className={`prose max-w-none font-serif ${isLightTheme ? 'prose-stone prose-p:text-stone-600 prose-headings:text-stone-800 prose-a:text-amber-600' : 'prose-invert prose-p:text-parchment-dim prose-headings:text-parchment prose-a:text-gold'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedEntry.content}
                        </ReactMarkdown>
                     </div>
                </div>

                {/* Modal Right: Meta & Stats (Sidebar) */}
                <div className={`w-full md:w-80 border-l p-8 flex flex-col shrink-0 ${theme.modalSidebar} ${theme.divider}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLightTheme ? 'bg-white border border-stone-200' : 'bg-white/5'}`}>
                                 <UserIcon className={`w-4 h-4 ${theme.textDim}`} />
                             </div>
                             <div>
                                 <div className={`text-xs font-bold ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}>{selectedEntry.author}</div>
                                 <div className={`text-[9px] font-mono ${theme.textMuted}`}>AUTHOR_ID: {selectedEntry.authorId?.slice(0,6) || 'UNKNOWN'}</div>
                             </div>
                        </div>
                        <button 
                            onClick={() => onLike(selectedEntry.id)}
                            className={`p-2 rounded-full transition-colors group ${isLightTheme ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}
                        >
                            <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${user.favorites.includes(selectedEntry.id) ? (isLightTheme ? 'fill-red-600 text-red-600' : 'fill-gold text-gold') : theme.textDim}`} />
                        </button>
                    </div>

                    {/* Parameter Evaluation Panel */}
                    <div className={`space-y-6 border-t pt-6 mb-8 ${theme.divider}`}>
                         <h3 className={`text-[10px] font-bold uppercase tracking-widest font-mono mb-4 ${theme.textDim}`}>收录参数评估 / PARAMETERS</h3>
                         
                         {/* Realism */}
                         <div className="group relative">
                             <div className="flex justify-between text-[10px] mb-1">
                                 <span className={theme.textDim}>真实度 / REALISM</span>
                                 <span className={isLightTheme ? 'text-amber-600' : 'text-gold'}>{selectedEntry.realism}/5</span>
                             </div>
                             <div className="flex gap-1 h-2 mb-1">
                                 {Array.from({length: 5}).map((_, i) => (
                                     <div key={i} className={`flex-1 rounded-sm ${i < selectedEntry.realism ? (isLightTheme ? 'bg-amber-500 shadow-sm' : 'bg-gold shadow-[0_0_8px_rgba(232,201,155,0.4)]') : (isLightTheme ? 'bg-stone-200' : 'bg-white/10')}`}></div>
                                 ))}
                             </div>
                             <div className={`text-[9px] italic opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-4 w-full truncate ${theme.textMuted}`}>
                                 {REALISM_DESCRIPTIONS[selectedEntry.realism]}
                             </div>
                         </div>

                         {/* Risk */}
                         <div className="group relative pt-2">
                             <div className="flex justify-between text-[10px] mb-1">
                                 <span className={theme.textDim}>风险等级 / RISK</span>
                                 <span className="text-red-400">{selectedEntry.risk}/8</span>
                             </div>
                             <div className={`h-2 w-full rounded-sm overflow-hidden flex ${isLightTheme ? 'bg-stone-200' : 'bg-white/10'}`}>
                                 <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600" style={{width: `${(selectedEntry.risk / 8) * 100}%`}}></div>
                             </div>
                             <div className={`text-[9px] italic opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-4 w-full truncate ${theme.textMuted}`}>
                                 {RISK_DESCRIPTIONS[selectedEntry.risk]}
                             </div>
                         </div>

                         {/* Anomalous */}
                         <div className="group relative pt-2">
                             <div className="flex justify-between text-[10px] mb-1">
                                 <span className={theme.textDim}>异象刻度 / ANOMALOUS</span>
                                 <span className="text-cyan-400">{selectedEntry.anomalous}/7</span>
                             </div>
                             <div className="flex gap-0.5 h-2 items-end">
                                 {Array.from({length: 7}).map((_, i) => (
                                     <div 
                                        key={i} 
                                        className={`flex-1 rounded-sm transition-all duration-300 ${i < selectedEntry.anomalous ? (isLightTheme ? 'bg-cyan-500/80 shadow-sm' : 'bg-cyan-500/80 shadow-[0_0_5px_rgba(6,182,212,0.5)]') : (isLightTheme ? 'bg-stone-200' : 'bg-white/5')}`}
                                        style={{height: i < selectedEntry.anomalous ? `${40 + Math.random() * 60}%` : '20%'}}
                                     ></div>
                                 ))}
                             </div>
                             <div className={`text-[9px] italic opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-4 w-full truncate ${theme.textMuted}`}>
                                 {ANOMALOUS_DESCRIPTIONS[selectedEntry.anomalous]}
                             </div>
                         </div>
                    </div>
                    
                    <div className={`mt-auto pt-6 border-t text-center ${theme.divider}`}>
                        <div className={`text-[10px] font-mono mb-2 ${theme.textMuted}`}>ENTRY_HASH: {selectedEntry.id}</div>
                        <button 
                            onClick={() => setSelectedEntry(null)}
                            className={`w-full py-3 border text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${isLightTheme ? 'border-stone-200 hover:bg-stone-100 text-stone-600' : 'border-white/10 hover:bg-white/5 text-parchment'}`}
                        >
                            关闭档案
                        </button>
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};