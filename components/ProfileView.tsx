

import React, { useState, useRef, useEffect } from 'react';
import { User, Entry } from '../types';
import { User as UserIcon, Calendar, FileText, Camera, Trash2, Edit2, X, Check, Bookmark, Zap, LogOut, Sun, Moon, Plus, UserPlus, UserCheck, Users, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEW TYPES ---
interface SimpleUser {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

// --- MOCK API ---
const mockFollowUser = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 800));
};

const mockUnfollowUser = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 800));
};

const mockGetConnections = async (userId: string, type: 'FOLLOWING' | 'FOLLOWERS'): Promise<SimpleUser[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const count = type === 'FOLLOWING' ? 4 : 8;
            resolve(Array.from({ length: count }).map((_, i) => ({
                id: `u-${type}-${i}`,
                username: type === 'FOLLOWING' ? `Observer_${i+1}` : `Agent_${i+42}`,
                bio: type === 'FOLLOWING' ? 'Senior Archivist.' : 'Seeking clearance.',
                avatarUrl: undefined // Use default placeholder
            })));
        }, 1000);
    });
};

interface ProfileViewProps {
  user: User;        // The profile being viewed
  currentUser: User; // The logged-in user
  entries: Entry[];
  onBack: () => void;
  onLogout: () => void;
  onUpdateProfile: (data: Partial<User>) => void;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onNavigateToEditor: () => void;
  onLoginRequired?: () => void; // New prop for auth check
  onInspectUser?: (userId: string, username: string, avatarUrl?: string) => void; // New prop for navigation
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
    user, currentUser, entries, onBack, onLogout, onUpdateProfile, onLike, onBookmark, isLightTheme, onToggleTheme, onNavigateToEditor,
    onLoginRequired, onInspectUser
}) => {
  // Tabs: POSTS | COLLECTION | CONNECTIONS
  const [activeTab, setActiveTab] = useState<'POSTS' | 'COLLECTION' | 'CONNECTIONS'>('POSTS');
  const [isEditing, setIsEditing] = useState(false);
  
  // Follow State
  const [isFollowing, setIsFollowing] = useState(false); // Should be init from props/api in real app
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Connections State
  const [connectionType, setConnectionType] = useState<'FOLLOWING' | 'FOLLOWERS'>('FOLLOWING');
  const [connectionsList, setConnectionsList] = useState<SimpleUser[]>([]);
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(false);
  
  // Edit State
  const [editName, setEditName] = useState(user.username);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editAvatar, setEditAvatar] = useState(user.avatar || '');
  const [editHeader, setEditHeader] = useState(user.headerImage || '');
  const [editBackground, setEditBackground] = useState(user.backgroundImage || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user.id === currentUser.id;

  // Fetch Connections when tab or sub-type changes
  useEffect(() => {
      if (activeTab === 'CONNECTIONS') {
          setIsConnectionsLoading(true);
          mockGetConnections(user.id, connectionType)
              .then(data => setConnectionsList(data))
              .catch(() => setConnectionsList([])) // Handle error silently for mock
              .finally(() => setIsConnectionsLoading(false));
      }
  }, [activeTab, connectionType, user.id]);

  const handleFollowToggle = async () => {
      if (!currentUser || currentUser.id.startsWith('guest')) {
          if (onLoginRequired) onLoginRequired();
          return;
      }
      
      setIsFollowLoading(true);
      try {
          if (isFollowing) {
              await mockUnfollowUser(user.id);
              setIsFollowing(false);
          } else {
              await mockFollowUser(user.id);
              setIsFollowing(true);
          }
      } catch (e) {
          console.error("Follow action failed");
      } finally {
          setIsFollowLoading(false);
      }
  };

  const displayedEntries = (() => {
      switch(activeTab) {
          case 'POSTS':
              return entries.filter(e => e.authorId === user.id || e.author === user.username);
          case 'COLLECTION':
              return entries.filter(e => user.bookmarks.includes(e.id));
          default:
              return [];
      }
  })();

  const totalLikes = entries.filter(e => e.author === user.username).reduce((acc, curr) => acc + curr.likes, 0);

  const saveProfile = () => {
      onUpdateProfile({
          username: editName,
          bio: editBio,
          avatar: editAvatar,
          headerImage: editHeader,
          backgroundImage: editBackground
      });
      setIsEditing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setter(ev.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="min-h-screen bg-obsidian text-parchment transition-colors duration-500 relative pt-16">
      <div className="bg-noise z-50"></div>
      
      {/* Custom Global Background Layer */}
      {(isEditing ? editBackground : user.backgroundImage) && (
          <div className="fixed inset-0 z-0 pointer-events-none">
              <div 
                  className="absolute inset-0 bg-cover bg-center bg-fixed opacity-40 transition-all duration-700"
                  style={{ backgroundImage: `url(${isEditing ? editBackground : user.backgroundImage})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-obsidian/40 mix-blend-multiply"></div>
          </div>
      )}

      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, setEditAvatar)} />
      <input type="file" ref={headerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, setEditHeader)} />
      <input type="file" ref={backgroundInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, setEditBackground)} />

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-obsidian/90 backdrop-blur-md border-b border-gold/10 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div 
                className="font-serif text-xl tracking-wide text-parchment cursor-pointer flex items-center gap-3 hover:text-gold transition-colors"
                onClick={onBack}
             >
                <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 shadow-[0_0_15px_rgba(232,201,155,0.1)]">
                    <svg viewBox="0 0 100 100" className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="50" cy="50" r="45" />
                        <circle cx="41" cy="50" r="28" opacity="0.8" />
                        <circle cx="59" cy="50" r="28" opacity="0.8" />
                        <circle cx="50" cy="50" r="14" />
                        <circle cx="50" cy="50" r="4" strokeWidth="4" /> 
                    </svg>
                </div>
                万象档案馆
             </div>
             <nav className="hidden md:flex items-center text-sm font-medium text-parchment-dim">
               <span className="text-white/10 mx-3">/</span>
               <span onClick={onBack} className="cursor-pointer hover:text-parchment transition-colors text-parchment-dim">大厅</span>
               <span className="text-white/10 mx-3">/</span>
               <span className="text-gold font-serif">个人档案</span>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={onToggleTheme} className="p-2 rounded-sm text-parchment-dim hover:text-gold hover:bg-white/5 transition-colors border border-transparent hover:border-gold/10">
               {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>
             <button onClick={onNavigateToEditor} className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/50 text-parchment hover:text-gold px-4 py-1.5 rounded-sm text-sm transition-all shadow-lg shadow-black/5">
                <Plus className="w-3 h-3" />
                <span className="font-medium tracking-wide">录入档案</span>
             </button>
             <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
             <div className="flex items-center gap-3 pl-2">
               {isOwner && (
                 <button onClick={onLogout} className="p-2 text-parchment-dim hover:text-red-400 hover:bg-red-900/10 rounded-sm transition-colors" title="断开连接">
                   <LogOut className="w-4 h-4" />
                 </button>
               )}
               <div className="w-9 h-9 rounded-sm border border-gold/20 flex items-center justify-center overflow-hidden bg-obsidian-light shadow-inner">
                  {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover grayscale transition-all" /> : <UserIcon className="w-4 h-4 text-parchment/50" />}
               </div>
             </div>
          </div>
        </div>
      </header>

      {/* Header Image */}
      <div className="relative h-72 bg-obsidian-light/50 border-b border-gold/10 overflow-hidden group/header z-10 backdrop-blur-sm">
         {editHeader || user.headerImage ? (
             <div className="absolute inset-0">
                <img src={isEditing ? editHeader : user.headerImage} className="w-full h-full object-cover opacity-50 grayscale" alt="Header" />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent"></div>
             </div>
         ) : (
            <>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(var(--c-gold-dim) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidian"></div>
            </>
         )}
         {isEditing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-opacity z-30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={() => headerInputRef.current?.click()} className="flex items-center gap-2 bg-white/10 hover:bg-gold/20 border border-white/10 hover:border-gold/40 px-4 py-2 rounded-sm text-parchment font-medium transition-colors">
                        <Camera className="w-4 h-4" /> 更换封面
                    </button>
                    {editHeader && (
                        <button onClick={() => setEditHeader('')} className="bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 px-3 py-2 rounded-sm text-red-200 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                     <div className="w-px bg-white/20 hidden md:block"></div>
                     <button onClick={() => backgroundInputRef.current?.click()} className="flex items-center gap-2 bg-white/10 hover:bg-gold/20 border border-white/10 hover:border-gold/40 px-4 py-2 rounded-sm text-parchment font-medium transition-colors">
                        <Camera className="w-4 h-4" /> 更换全局背景
                    </button>
                </div>
            </div>
         )}
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-40">
         <div className="flex flex-col md:flex-row items-end md:items-center gap-8 mb-16">
            <div className="relative group/avatar">
                <div className="w-40 h-40 rounded-sm border border-gold/30 bg-obsidian-light flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 border-[3px] border-obsidian z-10 pointer-events-none transition-colors duration-500"></div>
                    {(isEditing ? editAvatar : user.avatar) ? (
                        <img src={isEditing ? editAvatar : user.avatar} className="w-full h-full object-cover grayscale contrast-125" alt="Avatar"/>
                    ) : (
                        <UserIcon className="w-16 h-16 text-parchment/20" />
                    )}
                </div>
                {isEditing && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer z-20">
                         <button onClick={() => avatarInputRef.current?.click()} className="text-parchment hover:text-gold mb-2"><Camera className="w-6 h-6" /></button>
                         {editAvatar && <button onClick={() => setEditAvatar('')} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>}
                    </div>
                )}
            </div>
            
            <div className="flex-1 pb-4 w-full">
               <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-mono text-gold/60 uppercase tracking-[0.2em] mb-1">人员档案 / Personnel Record</div>
                    <h1 className="text-4xl font-serif text-parchment mb-3 flex items-center gap-3">
                        {user.username}
                        {user.bio && !isEditing && <span className="text-sm font-sans font-normal text-parchment-dim bg-white/5 px-3 py-1 rounded-sm border border-white/5 italic">"{user.bio}"</span>}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-parchment-dim/60 font-mono">
                        <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> 加入于 {new Date(user.joinDate).getFullYear()}</span>
                        <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> {entries.filter(e => e.author === user.username).length} 份档案</span>
                        <span className="text-gold/80 flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> {totalLikes} 次获赞</span>
                    </div>
                  </div>
                  
                  {/* ACTIONS: Edit or Follow */}
                  {!isEditing && (
                      <div className="flex items-center gap-3">
                          {isOwner ? (
                              <button 
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/30 rounded-sm text-xs uppercase tracking-widest text-parchment flex items-center gap-2 transition-colors font-mono"
                              >
                                  <Edit2 className="w-3 h-3" /> 更新档案
                              </button>
                          ) : (
                              <motion.button 
                                onClick={handleFollowToggle}
                                disabled={isFollowLoading}
                                whileTap={{ scale: 0.95 }}
                                className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all font-mono shadow-lg 
                                    ${isFollowing 
                                        ? (isLightTheme ? 'bg-stone-200 text-stone-600 border border-stone-300 hover:bg-stone-300' : 'bg-white/5 text-parchment-dim border border-white/10 hover:bg-white/10 hover:text-parchment')
                                        : (isLightTheme ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-gold text-obsidian hover:bg-[#c5a676]')
                                    }
                                `}
                              >
                                  {isFollowLoading ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : isFollowing ? (
                                      <> <UserCheck className="w-3.5 h-3.5" /> 已关注 </>
                                  ) : (
                                      <> <UserPlus className="w-3.5 h-3.5" /> 关注 </>
                                  )}
                              </motion.button>
                          )}
                      </div>
                  )}
               </div>
            </div>
         </div>

         {/* EDIT MODE PANEL */}
         {isEditing && (
             <div className="mb-12 bg-obsidian-light/90 backdrop-blur border border-gold/20 rounded-sm p-8 animate-slide-up relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
                 <div className="flex items-center justify-between mb-6">
                     <h3 className="font-serif text-xl text-parchment">更新人员档案</h3>
                     <button onClick={() => setIsEditing(false)} className="text-parchment-dim hover:text-white"><X className="w-4 h-4"/></button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div>
                         <label className="block text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-2 font-mono">代号 / Codename</label>
                         <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-charcoal/40 border border-white/10 rounded-sm px-4 py-2 text-parchment focus:border-gold/50 outline-none font-mono" />
                     </div>
                     <div>
                         <label className="block text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-2 font-mono">个性签名 / Bio</label>
                         <input type="text" value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-charcoal/40 border border-white/10 rounded-sm px-4 py-2 text-parchment focus:border-gold/50 outline-none font-serif italic" />
                     </div>
                 </div>
                 <div className="flex justify-end gap-3">
                     <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-xs uppercase tracking-widest text-parchment-dim hover:text-white">取消</button>
                     <button onClick={saveProfile} className="px-5 py-2 bg-gold text-obsidian font-bold rounded-sm text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#c5a676]"><Check className="w-3 h-3" /> 保存更改</button>
                 </div>
             </div>
         )}

         {/* CONTENT TABS */}
         <div className="border-b border-white/5 mb-8 flex gap-8">
            <button onClick={() => setActiveTab('POSTS')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative font-mono ${activeTab === 'POSTS' ? 'text-gold' : 'text-parchment-dim hover:text-parchment'}`}>
                已提交档案
                {activeTab === 'POSTS' && <motion.span layoutId="profileTab" className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"></motion.span>}
            </button>
             <button onClick={() => setActiveTab('COLLECTION')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative font-mono ${activeTab === 'COLLECTION' ? 'text-gold' : 'text-parchment-dim hover:text-parchment'}`}>
                收藏夹 ({user.bookmarks.length})
                {activeTab === 'COLLECTION' && <motion.span layoutId="profileTab" className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"></motion.span>}
            </button>
            <button onClick={() => setActiveTab('CONNECTIONS')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative font-mono ${activeTab === 'CONNECTIONS' ? 'text-gold' : 'text-parchment-dim hover:text-parchment'}`}>
                社交网络
                {activeTab === 'CONNECTIONS' && <motion.span layoutId="profileTab" className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"></motion.span>}
            </button>
         </div>

         {/* TAB CONTENT: POSTS / COLLECTION */}
         {activeTab !== 'CONNECTIONS' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 animate-fade-in">
                {displayedEntries.length > 0 ? (
                   displayedEntries.map(entry => {
                      const isLiked = user.likedEntries.includes(entry.id);
                      const isBookmarked = user.bookmarks.includes(entry.id);
                      return (
                        <article key={entry.id} className="bg-obsidian-light/60 backdrop-blur-sm border border-white/5 hover:border-gold/30 rounded-sm p-6 transition-all hover:bg-white/10 group flex flex-col h-60 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                 <div className="text-[9px] font-bold text-parchment-dim/50 uppercase tracking-widest font-mono border border-white/10 px-1.5 py-0.5 rounded-sm">{entry.category}</div>
                                 <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); onBookmark(entry.id); }} className={`transition-colors hover:text-cyan-400 ${isBookmarked ? 'text-cyan-400' : 'text-parchment-dim/40'}`}>
                                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onLike(entry.id); }} className={`transition-colors hover:text-amber-500 ${isLiked ? 'text-amber-500' : 'text-parchment-dim/40'}`}>
                                        <Zap className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                                    </button>
                                 </div>
                            </div>
                            <h3 className="text-lg font-serif text-parchment mb-2 group-hover:text-gold transition-colors line-clamp-1">{entry.title}</h3>
                            <div className="text-sm text-parchment-dim/60 line-clamp-3 mb-4 flex-1 overflow-hidden font-serif italic">
                                <ReactMarkdown allowedElements={['p']} unwrapDisallowed={true} remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-parchment-dim/40 border-t border-white/5 pt-3 mt-auto font-mono uppercase">
                                <span className="flex items-center gap-1">编号-{entry.id.slice(0,4)}</span>
                                <span>{entry.likes} 共鸣</span>
                            </div>
                        </article>
                      );
                   })
                ) : (
                   <div className="col-span-full py-24 text-center text-parchment-dim/40 border border-dashed border-white/10 rounded-sm font-serif italic bg-obsidian-light/20">
                      {activeTab === 'POSTS' ? '该对象未提交任何记录。' : '收藏夹为空。'}
                   </div>
                )}
             </div>
         )}

         {/* TAB CONTENT: CONNECTIONS */}
         {activeTab === 'CONNECTIONS' && (
             <div className="animate-fade-in pb-20">
                 {/* Sub-Tabs for Connections */}
                 <div className="flex justify-center mb-8">
                     <div className={`inline-flex rounded-sm p-1 border ${isLightTheme ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/10'}`}>
                         <button 
                             onClick={() => setConnectionType('FOLLOWING')}
                             className={`px-6 py-1.5 text-xs font-bold rounded-sm transition-all ${connectionType === 'FOLLOWING' ? (isLightTheme ? 'bg-white shadow-sm text-stone-800' : 'bg-white/10 text-gold') : 'text-parchment-dim hover:text-parchment'}`}
                         >
                             关注的人
                         </button>
                         <button 
                             onClick={() => setConnectionType('FOLLOWERS')}
                             className={`px-6 py-1.5 text-xs font-bold rounded-sm transition-all ${connectionType === 'FOLLOWERS' ? (isLightTheme ? 'bg-white shadow-sm text-stone-800' : 'bg-white/10 text-gold') : 'text-parchment-dim hover:text-parchment'}`}
                         >
                             粉丝
                         </button>
                     </div>
                 </div>

                 {isConnectionsLoading ? (
                     <div className="flex justify-center py-20 opacity-50"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
                 ) : connectionsList.length === 0 ? (
                      <div className="text-center py-24 opacity-50 border border-dashed border-white/10 rounded-sm">
                          <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          <p className="font-serif italic text-sm">{connectionType === 'FOLLOWING' ? '未关注任何档案员。' : '暂无关注者。'}</p>
                      </div>
                 ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         {connectionsList.map(item => (
                             <div 
                                key={item.id} 
                                onClick={() => onInspectUser && onInspectUser(item.id, item.username, item.avatarUrl)}
                                className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${isLightTheme ? 'bg-white border-stone-200 hover:border-amber-400 hover:shadow-md' : 'bg-white/5 border-white/5 hover:border-gold/30 hover:bg-white/10'}`}
                             >
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden shrink-0 ${isLightTheme ? 'bg-stone-100 border-stone-200' : 'bg-black/20 border-white/10'}`}>
                                     {item.avatarUrl ? (
                                         <img src={item.avatarUrl} alt={item.username} className="w-full h-full object-cover" />
                                     ) : (
                                         <span className="font-bold font-mono text-xs opacity-50">{item.username.charAt(0)}</span>
                                     )}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                     <h4 className={`font-serif font-bold text-sm truncate ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}>{item.username}</h4>
                                     <p className={`text-xs truncate opacity-60 font-mono ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim'}`}>{item.bio || 'NO_DATA'}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};
