
import React, { useState, useRef } from 'react';
import { User, Entry } from '../types';
import { User as UserIcon, Calendar, Book, ArrowLeft, Heart, Edit2, X, Check, Camera, Trash2, FileText, Image as ImageIcon, Database, Sun, Moon, Plus, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProfileViewProps {
  user: User;
  currentUser: User;
  entries: Entry[];
  onBack: () => void;
  onLogout: () => void;
  onUpdateProfile: (data: Partial<User>) => void;
  onLike: (id: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onNavigateToEditor: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, currentUser, entries, onBack, onLogout, onUpdateProfile, onLike, isLightTheme, onToggleTheme, onNavigateToEditor }) => {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'LIKED'>('POSTS');
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [editName, setEditName] = useState(user.username);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editAvatar, setEditAvatar] = useState(user.avatar || '');
  const [editHeader, setEditHeader] = useState(user.headerImage || '');
  const [editBackground, setEditBackground] = useState(user.backgroundImage || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const displayedEntries = activeTab === 'POSTS' 
      ? entries.filter(e => e.authorId === user.id || e.author === user.username)
      : entries.filter(e => user.favorites.includes(e.id));

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
              {/* Overlay gradient to ensure readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-obsidian/40 mix-blend-multiply"></div>
          </div>
      )}

      <input 
        type="file" 
        ref={avatarInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileSelect(e, setEditAvatar)} 
      />
      <input 
        type="file" 
        ref={headerInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileSelect(e, setEditHeader)} 
      />
      <input 
        type="file" 
        ref={backgroundInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileSelect(e, setEditBackground)} 
      />

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-obsidian/90 backdrop-blur-md border-b border-gold/10 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div 
                className="font-serif text-xl tracking-wide text-parchment cursor-pointer flex items-center gap-3 hover:text-gold transition-colors"
                onClick={onBack}
             >
                <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 shadow-[0_0_15px_rgba(232,201,155,0.1)]">
                    {/* New OmniEye Logo Small - Thinner Strokes */}
                    <svg viewBox="0 0 100 100" className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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

             <nav className="hidden md:flex items-center text-sm font-medium text-parchment-dim">
               <span className="text-white/10 mx-3">/</span>
               <span 
                 onClick={onBack}
                 className="cursor-pointer hover:text-parchment transition-colors text-parchment-dim"
               >
                 大厅
               </span>
               <span className="text-white/10 mx-3">/</span>
               <span className="text-gold font-serif">个人档案</span>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Theme Toggle */}
             <button 
               onClick={onToggleTheme}
               className="p-2 rounded-sm text-parchment-dim hover:text-gold hover:bg-white/5 transition-colors border border-transparent hover:border-gold/10"
               title={isLightTheme ? "切换到暗色模式" : "切换到亮色模式"}
             >
               {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>

             <button 
                onClick={onNavigateToEditor}
                className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/50 text-parchment hover:text-gold px-4 py-1.5 rounded-sm text-sm transition-all shadow-lg shadow-black/5"
             >
                <Plus className="w-3 h-3" />
                <span className="font-medium tracking-wide">录入档案</span>
             </button>

             <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
             
             {/* User Info / Logout */}
             <div className="flex items-center gap-3 pl-2">
               {user.id === currentUser.id && (
                 <button 
                   onClick={onLogout}
                   className="p-2 text-parchment-dim hover:text-red-400 hover:bg-red-900/10 rounded-sm transition-colors"
                   title="断开连接"
                 >
                   <LogOut className="w-4 h-4" />
                 </button>
               )}
               <div 
                  className="w-9 h-9 rounded-sm border border-gold/20 flex items-center justify-center overflow-hidden bg-obsidian-light shadow-inner"
               >
                  {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover grayscale transition-all" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-parchment/50" />
                      </div>
                  )}
               </div>
             </div>
          </div>
        </div>
      </header>

      {/* Header Image */}
      <div className="relative h-72 bg-obsidian-light/50 border-b border-gold/10 overflow-hidden group/header z-10 backdrop-blur-sm">
         {/* Background Image or Gradient */}
         {editHeader || user.headerImage ? (
             <div className="absolute inset-0">
                <img src={isEditing ? editHeader : user.headerImage} className="w-full h-full object-cover opacity-50 grayscale" alt="Header" />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent"></div>
             </div>
         ) : (
            <>
                {/* Abstract Topography Pattern */}
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(var(--c-gold-dim) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidian"></div>
            </>
         )}
         
         {/* Header/Background Upload Overlay */}
         {isEditing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-opacity z-30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Header Controls */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => headerInputRef.current?.click()}
                            className="flex items-center gap-2 bg-white/10 hover:bg-gold/20 border border-white/10 hover:border-gold/40 px-4 py-2 rounded-sm text-parchment font-medium transition-colors"
                        >
                            <Camera className="w-4 h-4" /> 更换封面
                        </button>
                        {editHeader && (
                            <button 
                                onClick={() => setEditHeader('')}
                                className="flex items-center justify-center bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 px-3 py-2 rounded-sm text-red-200 transition-colors"
                                title="移除封面"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="w-px bg-white/20 hidden md:block"></div>

                     {/* Background Controls */}
                     <div className="flex gap-2">
                        <button 
                            onClick={() => backgroundInputRef.current?.click()}
                            className="flex items-center gap-2 bg-white/10 hover:bg-gold/20 border border-white/10 hover:border-gold/40 px-4 py-2 rounded-sm text-parchment font-medium transition-colors"
                        >
                            <ImageIcon className="w-4 h-4" /> 更换全局背景
                        </button>
                         {editBackground && (
                            <button 
                                onClick={() => setEditBackground('')}
                                className="flex items-center justify-center bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 px-3 py-2 rounded-sm text-red-200 transition-colors"
                                title="移除全局背景"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                     </div>
                </div>
            </div>
         )}
      </div>

      {/* Profile Info Section - Dossier Style */}
      {/* z-40 ensures it floats above the header overlay and custom background */}
      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-40">
         <div className="flex flex-col md:flex-row items-end md:items-center gap-8 mb-16">
            {/* Avatar */}
            <div className="relative group/avatar">
                <div 
                    className="w-40 h-40 rounded-sm border border-gold/30 bg-obsidian-light flex items-center justify-center shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 border-[3px] border-obsidian z-10 pointer-events-none transition-colors duration-500"></div>
                    {(isEditing ? editAvatar : user.avatar) ? (
                        <img 
                            src={isEditing ? editAvatar : user.avatar} 
                            className="w-full h-full object-cover grayscale contrast-125" 
                            alt="Avatar"
                        />
                    ) : (
                        <UserIcon className="w-16 h-16 text-parchment/20" />
                    )}
                </div>

                {isEditing && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer z-20">
                         <button onClick={() => avatarInputRef.current?.click()} className="text-parchment hover:text-gold mb-2">
                            <Camera className="w-6 h-6" />
                         </button>
                         {editAvatar && (
                            <button onClick={() => setEditAvatar('')} className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-5 h-5" />
                            </button>
                         )}
                    </div>
                )}
            </div>
            
            {/* User Details */}
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
                        <span className="text-gold/80 flex items-center gap-2"><Heart className="w-3.5 h-3.5" /> {totalLikes} 次获赞</span>
                    </div>
                  </div>
                  
                  {user.id === currentUser.id && !isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/30 rounded-sm text-xs uppercase tracking-widest text-parchment flex items-center gap-2 transition-colors font-mono"
                      >
                          <Edit2 className="w-3 h-3" /> 更新档案
                      </button>
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
                         <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-charcoal/40 border border-white/10 rounded-sm px-4 py-2 text-parchment focus:border-gold/50 outline-none font-mono"
                         />
                     </div>
                     <div>
                         <label className="block text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-2 font-mono">个性签名 / Bio</label>
                         <input 
                            type="text" 
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            className="w-full bg-charcoal/40 border border-white/10 rounded-sm px-4 py-2 text-parchment focus:border-gold/50 outline-none font-serif italic"
                         />
                     </div>
                 </div>
                 
                 <div className="flex justify-end gap-3">
                     <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-xs uppercase tracking-widest text-parchment-dim hover:text-white">取消</button>
                     <button onClick={saveProfile} className="px-5 py-2 bg-gold text-obsidian font-bold rounded-sm text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#c5a676]">
                         <Check className="w-3 h-3" /> 保存更改
                     </button>
                 </div>
             </div>
         )}

         {/* Content Tabs */}
         <div className="border-b border-white/5 mb-8 flex gap-8">
            <button 
                onClick={() => setActiveTab('POSTS')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative font-mono ${activeTab === 'POSTS' ? 'text-gold' : 'text-parchment-dim hover:text-parchment'}`}
            >
                已提交档案
                {activeTab === 'POSTS' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('LIKED')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative font-mono ${activeTab === 'LIKED' ? 'text-gold' : 'text-parchment-dim hover:text-parchment'}`}
            >
                收藏记录 ({user.favorites.length})
                {activeTab === 'LIKED' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"></span>}
            </button>
         </div>

         {/* Entry Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 animate-fade-in">
            {displayedEntries.length > 0 ? (
               displayedEntries.map(entry => {
                  const isLiked = user.favorites.includes(entry.id);
                  return (
                    <article key={entry.id} className="bg-obsidian-light/60 backdrop-blur-sm border border-white/5 hover:border-gold/30 rounded-sm p-6 transition-all hover:bg-white/10 group flex flex-col h-60 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                             <div className="text-[9px] font-bold text-parchment-dim/50 uppercase tracking-widest font-mono border border-white/10 px-1.5 py-0.5 rounded-sm">{entry.category}</div>
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLike(entry.id);
                                }}
                                className="text-parchment-dim/40 hover:text-red-800 transition-colors"
                             >
                                 <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-900 text-red-900' : ''}`} />
                             </button>
                        </div>
                        
                        <h3 className="text-lg font-serif text-parchment mb-2 group-hover:text-gold transition-colors line-clamp-1">{entry.title}</h3>
                        
                        <div className="text-sm text-parchment-dim/60 line-clamp-3 mb-4 flex-1 overflow-hidden font-serif italic">
                            <ReactMarkdown allowedElements={['p']} unwrapDisallowed={true} remarkPlugins={[remarkGfm]}>
                            {entry.content}
                            </ReactMarkdown>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] text-parchment-dim/40 border-t border-white/5 pt-3 mt-auto font-mono uppercase">
                            <span className="flex items-center gap-1">编号-{entry.id.slice(0,4)}</span>
                            <span>{entry.likes} 赞</span>
                        </div>
                    </article>
                  );
               })
            ) : (
               <div className="col-span-full py-24 text-center text-parchment-dim/40 border border-dashed border-white/10 rounded-sm font-serif italic bg-obsidian-light/20">
                  {activeTab === 'POSTS' ? '该对象未提交任何记录。' : '本地存储中未发现收藏条目。'}
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
