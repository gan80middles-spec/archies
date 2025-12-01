
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
    <div className="min-h-screen bg-obsidian text-parchment font-sans selection:bg-gold/30 selection:text-white transition-colors duration-500">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />
      <div className="bg-noise"></div>
      
      {/* Central Ambient Light */}
      <div className="ambient-glow"></div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-obsidian/90 backdrop-blur-md border-b border-gold/10 shadow-sm transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div 
                className="font-serif text-xl tracking-wide text-parchment cursor-pointer flex items-center gap-3 hover:text-gold transition-colors"
                onClick={() => setCurrentCategory(null)}
             >
                <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 shadow-[0_0_15px_rgba(232,201,155,0.1)]">
                    <Database className="w-4 h-4 text-gold" />
                </div>
                万象档案馆
             </div>

             <nav className="hidden md:flex items-center text-sm font-medium text-parchment-dim">
               <span className="text-white/10 mx-3">/</span>
               <span 
                 onClick={() => setCurrentCategory(null)}
                 className={`cursor-pointer hover:text-parchment transition-colors ${!currentCategory ? 'text-gold font-serif' : ''}`}
               >
                 大厅
               </span>
               {currentCategory && (
                 <>
                    <span className="text-white/10 mx-3">/</span>
                    <span className="text-gold font-serif animate-fade-in">{currentCategory}</span>
                 </>
               )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Search Bar - Header Compact */}
             <div className="hidden lg:flex relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-parchment-dim group-focus-within:text-gold transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="检索协议..." 
                  className="bg-white/5 border border-white/10 rounded-sm py-1.5 pl-9 pr-4 text-xs w-48 focus:w-64 focus:border-gold/50 focus:bg-white/10 outline-none transition-all font-mono text-parchment"
                />
             </div>

             <div className="h-6 w-[1px] bg-white/10 hidden lg:block"></div>

             {/* Theme Toggle */}
             <button 
               onClick={onToggleTheme}
               className="p-2 rounded-sm text-parchment-dim hover:text-gold hover:bg-white/5 transition-colors border border-transparent hover:border-gold/10"
               title={isLightTheme ? "切换到暗色模式" : "切换到亮色模式"}
             >
               {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>

             <button 
                onClick={() => onNavigateToEditor()}
                className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/50 text-parchment hover:text-gold px-4 py-1.5 rounded-sm text-sm transition-all shadow-lg shadow-black/5"
             >
                <Plus className="w-3 h-3" />
                <span className="font-medium tracking-wide">录入档案</span>
             </button>
             
             {/* User Profile */}
             <div 
                className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer group"
                onClick={onNavigateToProfile}
             >
               <div className="text-right hidden md:block">
                 <div className="text-xs font-bold text-parchment group-hover:text-gold transition-colors">{user.username}</div>
                 <div className="text-[10px] text-parchment-dim font-mono tracking-wider">LEVEL 4</div>
               </div>
               <div className="w-8 h-8 rounded-sm border border-gold/20 flex items-center justify-center overflow-hidden bg-obsidian-light shadow-inner group-hover:border-gold/50 transition-colors">
                  {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  ) : (
                      <UserIcon className="w-4 h-4 text-parchment/50" />
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
                   
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 text-[10px] font-mono text-gold mb-6 tracking-widest uppercase">
                      <Sparkles className="w-3 h-3" /> System Operational
                   </div>
                   <h1 className="text-5xl md:text-7xl font-serif text-parchment mb-6 tracking-tight">
                      欢迎进入<span className="text-gold italic">档案馆</span>
                   </h1>
                   <p className="text-parchment-dim max-w-2xl mx-auto text-lg font-light leading-relaxed">
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
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <h2 className="text-sm font-bold text-parchment-dim uppercase tracking-widest flex items-center gap-2">
                            <Grid className="w-4 h-4" /> 档案扇区 / SECTORS
                        </h2>
                        <div className="text-[10px] font-mono text-parchment-dim/40">SECURE ACCESS GRANTED</div>
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
                                    className="group relative h-80 bg-obsidian-light/40 backdrop-blur-sm border border-white/5 hover:border-gold/30 rounded-sm overflow-hidden transition-all hover:bg-obsidian-light/60 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/20 flex flex-col md:flex-row"
                                >
                                    {/* Background Watermark */}
                                    <div className="absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-parchment pointer-events-none transform -rotate-12 group-hover:scale-110 duration-700 ease-out">
                                        {getIcon(category)}
                                    </div>
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${CATEGORY_COLORS[category]} opacity-60 group-hover:opacity-100 transition-opacity`}></div>

                                    {/* Left Panel: Narrative & Identity (65%) */}
                                    <div className="flex-1 p-8 md:p-10 flex flex-col relative z-10 border-b md:border-b-0 md:border-r border-white/5">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:scale-105 transition-transform duration-500 shadow-inner">
                                                <div className="w-7 h-7">{getIcon(category)}</div>
                                            </div>
                                            <div className="text-[10px] font-mono text-parchment-dim/40 border border-white/10 px-2 py-1 rounded-sm group-hover:text-gold group-hover:border-gold/20 transition-colors">
                                                SEC-{String(index + 1).padStart(2, '0')}
                                            </div>
                                        </div>

                                        <div className="mb-auto">
                                            <h3 className="text-3xl font-serif text-parchment mb-1 group-hover:text-gold transition-colors">{category}</h3>
                                            <div className="text-xs font-bold text-parchment-dim/40 uppercase tracking-[0.2em] mb-6 font-mono">{CATEGORY_EN_TITLES[category]}</div>
                                            <p className="text-parchment-dim/80 text-sm leading-relaxed font-serif italic max-w-xl">
                                                {CATEGORY_DESCRIPTIONS[category]}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 text-[11px] font-mono text-parchment-dim/50 mt-8 pt-6 border-t border-white/5">
                                            <span className="flex items-center gap-2 group-hover:text-parchment-dim transition-colors">
                                                <Database className="w-3 h-3" /> {stats.entries} 条记录
                                            </span>
                                            <span className="flex items-center gap-2 group-hover:text-parchment-dim transition-colors">
                                                <Clock className="w-3 h-3" /> 更新于 {stats.daysAgo} 天前
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Panel: Dashboard & Analytics (35%) */}
                                    <div className="w-full md:w-[35%] bg-black/5 p-8 flex flex-col justify-between relative z-10">
                                        
                                        {/* Status */}
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="text-[10px] uppercase tracking-widest text-parchment-dim font-bold">Sector Status</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[10px] font-mono text-emerald-500/80">ACTIVE</span>
                                            </div>
                                        </div>

                                        {/* Mini Charts */}
                                        <div className="space-y-4 mb-8 flex-1">
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1.5">
                                                    <span className="text-parchment-dim/60 font-mono">MYSTIC</span>
                                                    <span className="text-gold/80 font-mono">{stats.mystic}</span>
                                                </div>
                                                <div className={`h-1 w-full ${trackColor} rounded-full overflow-hidden`}>
                                                    <div className={`h-full ${mysticColor}`} style={{width: `${(stats.mystic / 7) * 100}%`}}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1.5">
                                                    <span className="text-parchment-dim/60 font-mono">RISK</span>
                                                    <span className="text-red-400/80 font-mono">{stats.risk}</span>
                                                </div>
                                                <div className={`h-1 w-full ${trackColor} rounded-full overflow-hidden`}>
                                                    <div className={`h-full ${riskColor}`} style={{width: `${(stats.risk / 8) * 100}%`}}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] mb-1.5">
                                                    <span className="text-parchment-dim/60 font-mono">REALISM</span>
                                                    <span className="text-blue-400/80 font-mono">{stats.realism}</span>
                                                </div>
                                                <div className={`h-1 w-full ${trackColor} rounded-full overflow-hidden`}>
                                                    <div className={`h-full ${realismColor}`} style={{width: `${(stats.realism / 5) * 100}%`}}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-auto">
                                            <button className="flex-1 py-2 bg-white/5 hover:bg-gold hover:text-obsidian border border-white/10 hover:border-gold rounded-sm text-[10px] uppercase tracking-widest text-parchment transition-all flex items-center justify-center gap-2 font-bold group/btn">
                                                <Eye className="w-3 h-3" /> 查阅
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigateToEditor(category);
                                                }}
                                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-sm text-[10px] uppercase tracking-widest text-parchment-dim hover:text-parchment transition-all flex items-center justify-center gap-2"
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
                            <h2 className="text-2xl font-serif text-parchment flex items-center gap-3">
                                {currentCategory && (
                                    <button onClick={() => setCurrentCategory(null)} className="text-parchment-dim hover:text-gold transition-colors">
                                        <ChevronRight className="w-6 h-6 rotate-180" />
                                    </button>
                                )}
                                {searchQuery ? `检索结果: "${searchQuery}"` : currentCategory}
                            </h2>
                            <div className="flex bg-white/5 rounded-sm p-1 border border-white/5">
                                <button 
                                    onClick={() => setViewMode('GRID')}
                                    className={`p-1.5 rounded-sm transition-colors ${viewMode === 'GRID' ? 'bg-white/10 text-gold' : 'text-parchment-dim hover:text-parchment'}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('LIST')}
                                    className={`p-1.5 rounded-sm transition-colors ${viewMode === 'LIST' ? 'bg-white/10 text-gold' : 'text-parchment-dim hover:text-parchment'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {filteredEntries.length === 0 ? (
                            <div className="text-center py-24 border border-dashed border-white/10 rounded-sm bg-white/[0.02]">
                                <div className="text-gold/50 mb-4 mx-auto w-12 h-12 flex items-center justify-center border border-gold/20 rounded-full">
                                    <Database className="w-5 h-5" />
                                </div>
                                <p className="text-parchment-dim font-serif italic text-lg">暂无匹配档案。</p>
                                <p className="text-[10px] text-parchment-dim/40 font-mono mt-2 uppercase tracking-widest">NO_DATA_FOUND</p>
                            </div>
                        ) : (
                            <div className={`grid gap-6 ${viewMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {filteredEntries.map(entry => (
                                    <div 
                                        key={entry.id}
                                        onClick={() => setSelectedEntry(entry)}
                                        className={`group bg-obsidian-light/60 backdrop-blur-sm border border-white/5 hover:border-gold/30 rounded-sm p-6 cursor-pointer transition-all hover:bg-white/10 hover:shadow-xl relative overflow-hidden ${viewMode === 'LIST' ? 'flex gap-6 items-center' : ''}`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${CATEGORY_COLORS[entry.category]} opacity-40 group-hover:opacity-100 transition-opacity`}></div>
                                        
                                        <div className={`${viewMode === 'LIST' ? 'w-48 shrink-0' : 'mb-4'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gold/70">{getMiniIcon(entry.category)}</span>
                                                    <span className="text-[10px] font-bold text-parchment-dim/50 uppercase tracking-widest font-mono">{entry.category}</span>
                                                </div>
                                                {/* Mini Rating Indicators */}
                                                <div className="flex gap-1">
                                                    {entry.risk > 4 && <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" title="高风险"></div>}
                                                    {entry.anomalous > 4 && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" title="高异象"></div>}
                                                </div>
                                            </div>
                                            <h3 className={`font-serif text-parchment group-hover:text-gold transition-colors ${viewMode === 'LIST' ? 'text-lg' : 'text-xl mb-2'}`}>
                                                {entry.title}
                                            </h3>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-parchment-dim/60 line-clamp-2 font-serif italic mb-4">
                                                <ReactMarkdown allowedElements={['p']} unwrapDisallowed={true} remarkPlugins={[remarkGfm]}>
                                                    {entry.content}
                                                </ReactMarkdown>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                {entry.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-[10px] text-parchment-dim bg-white/5 px-2 py-0.5 rounded-sm font-mono border border-white/5 group-hover:border-white/10">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className={`${viewMode === 'LIST' ? 'w-32 text-right border-l border-white/5 pl-6' : 'flex items-center justify-between mt-6 pt-4 border-t border-white/5'}`}>
                                            <div className="text-[10px] text-parchment-dim/40 font-mono mb-1">{entry.author}</div>
                                            <div className="flex items-center gap-4 text-xs text-parchment-dim/60 justify-end">
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
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <h2 className="text-sm font-bold text-parchment-dim uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4" /> 最新收录 / RECENT LOGS
                        </h2>
                        <button className="text-[10px] text-gold hover:underline font-mono uppercase tracking-widest flex items-center gap-1">
                            VIEW ALL <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {recentEntries.map(entry => (
                            <div 
                                key={entry.id}
                                onClick={() => setSelectedEntry(entry)}
                                className="group flex items-center gap-6 bg-obsidian-light/40 border border-white/5 hover:border-gold/30 rounded-sm p-4 cursor-pointer transition-all hover:bg-white/5 hover:translate-x-1"
                            >
                                {/* Category Icon & Name */}
                                <div className="w-32 shrink-0 flex items-center gap-3 border-r border-white/5 pr-4">
                                    <div className="text-gold/50 group-hover:text-gold transition-colors">
                                        {getMiniIcon(entry.category)}
                                    </div>
                                    <div className="text-[10px] font-bold text-parchment-dim/70 uppercase tracking-widest font-mono truncate">{entry.category}</div>
                                </div>

                                {/* Title & Snippet */}
                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                    <h3 className="text-sm font-serif font-bold text-parchment group-hover:text-gold transition-colors whitespace-nowrap">
                                        {entry.title}
                                    </h3>
                                    <span className="text-xs text-parchment-dim/40 hidden md:inline-block font-mono">/</span>
                                    <div className="text-xs text-parchment-dim/50 truncate font-serif italic hidden md:block">
                                        <ReactMarkdown allowedElements={['p']} unwrapDisallowed={true} remarkPlugins={[remarkGfm]}>
                                            {entry.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="flex items-center gap-6 text-[10px] text-parchment-dim/40 font-mono shrink-0 pl-4 border-l border-white/5">
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}></div>
            <div className="relative w-full max-w-4xl h-full md:h-auto max-h-[90vh] bg-obsidian border border-gold/20 rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden animate-slide-up">
                
                {/* Modal Left: Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 bg-obsidian-light/50 relative">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
                     <button 
                        onClick={() => setSelectedEntry(null)}
                        className="absolute top-4 right-4 md:hidden p-2 text-parchment-dim"
                     >
                        Close
                     </button>

                     <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-2 py-1 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest border border-gold/20 rounded-sm font-mono">{selectedEntry.category}</span>
                            <span className="text-xs text-parchment-dim/40 font-mono">{new Date(selectedEntry.createdAt).toLocaleString()}</span>
                        </div>
                        <h1 className="text-4xl font-serif text-parchment mb-4">{selectedEntry.title}</h1>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedEntry.tags.map(tag => (
                                <span key={tag} className="text-xs text-parchment-dim/60 bg-white/5 px-2 py-1 rounded-sm font-mono">#{tag}</span>
                            ))}
                        </div>
                     </div>

                     <div className="prose prose-invert prose-p:text-parchment-dim prose-headings:text-parchment prose-a:text-gold max-w-none font-serif">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedEntry.content}
                        </ReactMarkdown>
                     </div>
                </div>

                {/* Modal Right: Meta & Stats (Sidebar) */}
                <div className="w-full md:w-80 bg-[#0a0a0c] border-l border-white/5 p-8 flex flex-col shrink-0">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                 <UserIcon className="w-4 h-4 text-parchment-dim" />
                             </div>
                             <div>
                                 <div className="text-xs font-bold text-parchment">{selectedEntry.author}</div>
                                 <div className="text-[9px] text-parchment-dim/40 font-mono">AUTHOR_ID: {selectedEntry.authorId?.slice(0,6) || 'UNKNOWN'}</div>
                             </div>
                        </div>
                        <button 
                            onClick={() => onLike(selectedEntry.id)}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        >
                            <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${user.favorites.includes(selectedEntry.id) ? 'fill-gold text-gold' : 'text-parchment-dim'}`} />
                        </button>
                    </div>

                    {/* Parameter Evaluation Panel */}
                    <div className="space-y-6 border-t border-white/5 pt-6 mb-8">
                         <h3 className="text-[10px] font-bold text-parchment-dim uppercase tracking-widest font-mono mb-4">收录参数评估 / PARAMETERS</h3>
                         
                         {/* Realism */}
                         <div className="group relative">
                             <div className="flex justify-between text-[10px] mb-1">
                                 <span className="text-parchment-dim">真实度 / REALISM</span>
                                 <span className="text-gold">{selectedEntry.realism}/5</span>
                             </div>
                             <div className="flex gap-1 h-2 mb-1">
                                 {Array.from({length: 5}).map((_, i) => (
                                     <div key={i} className={`flex-1 rounded-sm ${i < selectedEntry.realism ? 'bg-gold shadow-[0_0_8px_rgba(232,201,155,0.4)]' : 'bg-white/10'}`}></div>
                                 ))}
                             </div>
                             <div className="text-[9px] text-parchment-dim/50 italic opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-4 w-full truncate">
                                 {REALISM_DESCRIPTIONS[selectedEntry.realism]}
                             </div>
                         </div>

                         {/* Risk */}
                         <div className="group relative pt-2">
                             <div className="flex justify-between text-[10px] mb-1">
                                 <span className="text-parchment-dim">风险等级 / RISK</span>
                                 <span className="text-red-400">{selectedEntry.risk}/8</span>
                             </div>
                             <div className="h-2 w-full bg-white/10 rounded-sm overflow-hidden flex">
                                 <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600" style={{width: `${(selectedEntry.risk / 8) * 100}%`}}></div>
                             </div>
                             <div className="text-[9px] text-parchment-dim/50 italic opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-4 w-full truncate">
                                 {RISK_DESCRIPTIONS[selectedEntry.risk]}
                             </div>
                         </div>

                         {/* Anomalous */}
                         <div className="group relative pt-2">
                             <div className="flex justify-between text-[10px] mb-1">
                                 <span className="text-parchment-dim">异象刻度 / ANOMALOUS</span>
                                 <span className="text-cyan-400">{selectedEntry.anomalous}/7</span>
                             </div>
                             <div className="flex gap-0.5 h-2 items-end">
                                 {Array.from({length: 7}).map((_, i) => (
                                     <div 
                                        key={i} 
                                        className={`flex-1 rounded-sm transition-all duration-300 ${i < selectedEntry.anomalous ? 'bg-cyan-500/80 shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'bg-white/5'}`}
                                        style={{height: i < selectedEntry.anomalous ? `${40 + Math.random() * 60}%` : '20%'}}
                                     ></div>
                                 ))}
                             </div>
                             <div className="text-[9px] text-parchment-dim/50 italic opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-4 w-full truncate">
                                 {ANOMALOUS_DESCRIPTIONS[selectedEntry.anomalous]}
                             </div>
                         </div>
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-white/5 text-center">
                        <div className="text-[10px] font-mono text-parchment-dim/30 mb-2">ENTRY_HASH: {selectedEntry.id}</div>
                        <button 
                            onClick={() => setSelectedEntry(null)}
                            className="w-full py-3 border border-white/10 hover:bg-white/5 text-xs font-bold text-parchment uppercase tracking-widest rounded-sm transition-colors"
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
