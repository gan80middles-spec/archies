
import React from 'react';
import { Entry, User, CATEGORY_COLORS, REALISM_DESCRIPTIONS, RISK_DESCRIPTIONS, ANOMALOUS_DESCRIPTIONS } from '../types';
import { UserHoverCard } from './UserHoverCard';
import { CommentSection } from './CommentSection';
import { ArrowLeft, User as UserIcon, Sparkles, Bookmark, Calendar, FileText, Share2, Printer, Moon, Sun, Plus, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

interface ArchiveDetailViewProps {
  entry: Entry;
  currentUser: User;
  onBack: () => void;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onInspectUser: (userId: string, username: string, avatarUrl?: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onNavigateToEditor: () => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
}

export const ArchiveDetailView: React.FC<ArchiveDetailViewProps> = ({
  entry,
  currentUser,
  onBack,
  onLike,
  onBookmark,
  onInspectUser,
  isLightTheme,
  onToggleTheme,
  onNavigateToEditor,
  onNavigateToProfile,
  onLogout
}) => {
  const isLiked = currentUser.likedEntries.includes(entry.id);
  const isBookmarked = currentUser.bookmarks.includes(entry.id);

  // Theme Helpers
  const theme = isLightTheme ? {
    bg: 'bg-[#f7f5ef]',
    textPrimary: 'text-stone-800',
    textSecondary: 'text-stone-500',
    border: 'border-stone-200',
    cardBg: 'bg-white',
    headerBg: 'bg-white/90',
    tagBg: 'bg-stone-100',
    divider: 'border-stone-200',
    accent: 'text-amber-600',
    goldBg: 'bg-amber-50',
    goldBorder: 'border-amber-200',
  } : {
    bg: 'bg-obsidian',
    textPrimary: 'text-parchment',
    textSecondary: 'text-parchment-dim',
    border: 'border-white/10',
    cardBg: 'bg-obsidian-light/40',
    headerBg: 'bg-obsidian/90',
    tagBg: 'bg-white/5',
    divider: 'border-white/10',
    accent: 'text-gold',
    goldBg: 'bg-gold/10',
    goldBorder: 'border-gold/30',
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} transition-colors duration-500 font-sans`}>
      <div className="bg-noise z-50"></div>
      
      {/* --- Header --- */}
      <header className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-300 ${theme.headerBg} ${theme.border}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
                onClick={onBack} 
                className={`group flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${theme.textSecondary} hover:${theme.accent}`}
            >
                <div className={`p-1.5 rounded-sm border ${theme.border} group-hover:${theme.goldBorder}`}>
                    <ArrowLeft className="w-4 h-4" />
                </div>
                返回大厅
            </button>
            
            <div className={`h-6 w-[1px] hidden md:block ${theme.divider}`}></div>

            <nav className={`hidden md:flex items-center text-sm font-medium ${theme.textSecondary}`}>
                <span className={`opacity-60 hover:opacity-100 cursor-pointer`} onClick={onBack}>档案大厅</span>
                <span className="opacity-20 mx-3">/</span>
                <span className={`${theme.accent} font-serif`}>{entry.category}</span>
                <span className="opacity-20 mx-3">/</span>
                <span className="opacity-60 truncate max-w-[200px]">{entry.title}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={onToggleTheme} className={`p-2 rounded-sm transition-colors border border-transparent hover:${theme.goldBorder} ${theme.textSecondary} hover:${theme.accent}`}>
               {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>
             
             <button onClick={onNavigateToEditor} className={`hidden md:flex items-center gap-2 border px-4 py-1.5 rounded-sm text-sm transition-all shadow-lg ${isLightTheme ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' : 'bg-white/5 hover:bg-gold/10 border-white/5 hover:border-gold/50 text-parchment hover:text-gold'}`}>
                <Plus className="w-3 h-3" />
                <span className="font-medium tracking-wide">录入档案</span>
             </button>

             <div className={`h-6 w-[1px] hidden md:block ${theme.divider}`}></div>

             <div className="flex items-center gap-3 pl-2 cursor-pointer group" onClick={onNavigateToProfile}>
               <div className={`w-8 h-8 rounded-sm border flex items-center justify-center overflow-hidden shadow-inner ${isLightTheme ? 'bg-stone-100 border-stone-300' : 'bg-obsidian-light border-gold/20'}`}>
                  {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 opacity-50" />}
               </div>
             </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="pt-24 pb-20 px-6 relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8"
        >
            
            {/* Left Column: Content */}
            <div className={`min-w-0 flex flex-col`}>
                <div className={`p-8 md:p-12 rounded-sm border ${theme.cardBg} ${theme.border} relative overflow-hidden shadow-lg`}>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${theme.accent}`}></div>
                    
                    {/* Header Info */}
                    <div className="mb-8">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-sm font-mono ${isLightTheme ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gold/10 text-gold border-gold/20'}`}>
                                {entry.category}
                            </span>
                            <span className={`flex items-center gap-2 text-xs font-mono ${theme.textSecondary}`}>
                                <Calendar className="w-3 h-3 opacity-70" /> {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                             <span className={`flex items-center gap-2 text-xs font-mono ${theme.textSecondary}`}>
                                <FileText className="w-3 h-3 opacity-70" /> ID: {entry.id.slice(0, 8)}
                            </span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-serif mb-6 leading-tight font-bold">{entry.title}</h1>
                        
                        <div className="flex flex-wrap gap-2 mb-8">
                            {entry.tags.map(tag => (
                                <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-mono border ${theme.tagBg} ${theme.border} ${theme.textSecondary}`}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Markdown Body */}
                    <div className={`prose max-w-none font-serif text-lg leading-relaxed ${isLightTheme ? 'prose-stone prose-headings:text-stone-900 prose-a:text-amber-600' : 'prose-invert prose-headings:text-parchment prose-a:text-gold prose-blockquote:border-gold/50 prose-blockquote:bg-white/5'} mb-16`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {entry.content}
                        </ReactMarkdown>
                    </div>

                    {/* Footer Actions (Share/Print) - Cosmetic */}
                    <div className={`flex items-center justify-between pt-6 border-t ${theme.divider}`}>
                        <div className="flex gap-4">
                            <button className={`flex items-center gap-2 text-xs uppercase tracking-wider font-bold opacity-50 hover:opacity-100 transition-opacity ${theme.textSecondary}`}>
                                <Share2 className="w-3.5 h-3.5" /> Share Access
                            </button>
                             <button className={`flex items-center gap-2 text-xs uppercase tracking-wider font-bold opacity-50 hover:opacity-100 transition-opacity ${theme.textSecondary}`}>
                                <Printer className="w-3.5 h-3.5" /> Print Record
                            </button>
                        </div>
                        <div className={`text-[10px] font-mono opacity-40 ${theme.textSecondary}`}>
                            END_OF_FILE
                        </div>
                    </div>
                </div>

                {/* Comment Section (Independent Block) */}
                <div className="mt-8">
                    <CommentSection 
                        entryId={entry.id}
                        currentUser={currentUser}
                        isLightTheme={isLightTheme}
                        onInspectUser={onInspectUser}
                    />
                </div>
            </div>

            {/* Right Column: Sidebar Meta */}
            <div className="space-y-6">
                
                {/* Author Card */}
                <div className={`p-6 border rounded-sm ${theme.cardBg} ${theme.border}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xs font-bold uppercase tracking-widest font-mono ${theme.textSecondary}`}>Archivist</h3>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center border overflow-hidden ${theme.divider} ${isLightTheme ? 'bg-stone-100' : 'bg-white/5'}`}>
                             {/* Mock avatar if unavailable, usually handled by UserHoverCard internally but needed here for layout */}
                             <UserIcon className={`w-6 h-6 opacity-50 ${theme.textSecondary}`} />
                         </div>
                         <div className="min-w-0">
                             <div className="text-lg font-serif font-bold hover:underline cursor-pointer">
                                 <UserHoverCard userId={entry.authorId || 'unknown'} username={entry.author} currentUser={currentUser} onInspectUser={onInspectUser} isLightTheme={isLightTheme}>
                                    <span className={theme.accent}>{entry.author}</span>
                                 </UserHoverCard>
                             </div>
                             <div className={`text-xs font-mono opacity-60 ${theme.textSecondary}`}>ID: {entry.authorId?.slice(0,8) || 'UNKNOWN'}</div>
                         </div>
                    </div>
                </div>

                {/* Interaction Buttons */}
                <div className={`p-6 border rounded-sm ${theme.cardBg} ${theme.border}`}>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => onLike(entry.id)}
                            className={`w-full py-3 rounded-sm border flex items-center justify-center gap-2 transition-all group ${isLiked ? `${theme.goldBg} ${theme.goldBorder} ${theme.accent}` : `${theme.border} ${theme.textSecondary} hover:${theme.bg}`}`}
                        >
                            <Sparkles className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">{isLiked ? '已共鸣 (Resonated)' : '共鸣 (Resonate)'}</span>
                            <span className="ml-1 opacity-60 font-mono text-[10px]">{entry.likes}</span>
                        </button>

                        <button 
                            onClick={() => onBookmark(entry.id)}
                            className={`w-full py-3 rounded-sm border flex items-center justify-center gap-2 transition-all ${isBookmarked ? (isLightTheme ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400') : `${theme.border} ${theme.textSecondary} hover:${theme.bg}`}`}
                        >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">{isBookmarked ? '已收藏 (Saved)' : '收藏 (Save)'}</span>
                        </button>
                    </div>
                </div>

                {/* Parameters (Stats) */}
                <div className={`p-6 border rounded-sm ${theme.cardBg} ${theme.border}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest font-mono mb-6 ${theme.textSecondary}`}>参数评估 / Parameters</h3>
                    
                    {/* Realism */}
                    <div className="group relative mb-6">
                        <div className="flex justify-between text-[10px] mb-2 font-mono">
                            <span className={theme.textSecondary}>真实度 / REALISM</span>
                            <span className={isLightTheme ? 'text-amber-600' : 'text-gold'}>{entry.realism}/5</span>
                        </div>
                        <div className="flex gap-1 h-2">
                            {Array.from({length: 5}).map((_, i) => (
                                <div key={i} className={`flex-1 rounded-sm ${i < entry.realism ? (isLightTheme ? 'bg-amber-500' : 'bg-gold') : (isLightTheme ? 'bg-stone-200' : 'bg-white/10')}`}></div>
                            ))}
                        </div>
                        <div className={`mt-2 text-[10px] italic opacity-60 ${theme.textSecondary}`}>
                            {REALISM_DESCRIPTIONS[entry.realism]}
                        </div>
                    </div>

                    {/* Risk */}
                    <div className="group relative mb-6">
                        <div className="flex justify-between text-[10px] mb-2 font-mono">
                            <span className={theme.textSecondary}>风险等级 / RISK</span>
                            <span className="text-red-500 font-bold">{entry.risk}/8</span>
                        </div>
                        <div className={`h-2 w-full rounded-sm overflow-hidden flex ${isLightTheme ? 'bg-stone-200' : 'bg-white/10'}`}>
                            <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600" style={{width: `${(entry.risk / 8) * 100}%`}}></div>
                        </div>
                        <div className={`mt-2 text-[10px] italic opacity-60 ${theme.textSecondary}`}>
                            {RISK_DESCRIPTIONS[entry.risk]}
                        </div>
                    </div>

                    {/* Anomaly */}
                    <div className="group relative">
                        <div className="flex justify-between text-[10px] mb-2 font-mono">
                            <span className={theme.textSecondary}>异象刻度 / ANOMALY</span>
                            <span className="text-cyan-500">{entry.anomalous}/7</span>
                        </div>
                        <div className="flex gap-0.5 h-6 items-end">
                            {Array.from({length: 7}).map((_, i) => (
                                <div 
                                key={i} 
                                className={`flex-1 rounded-sm ${i < entry.anomalous ? 'bg-cyan-500/80' : (isLightTheme ? 'bg-stone-200' : 'bg-white/5')}`}
                                style={{height: i < entry.anomalous ? `${30 + Math.random() * 70}%` : '20%'}}
                                ></div>
                            ))}
                        </div>
                        <div className={`mt-2 text-[10px] italic opacity-60 ${theme.textSecondary}`}>
                            {ANOMALOUS_DESCRIPTIONS[entry.anomalous]}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
      </main>
    </div>
  );
};
