
import React, { useState } from 'react';
import { Term, Entry } from '../types';
import { Search, Hash, Plus, Edit3, CheckCircle2 } from 'lucide-react';

interface TermSidebarProps {
  terms: Term[];
  entries: Entry[];
  onCreateEntry: (term: Term) => void;
  onEditEntry: (entry: Entry) => void;
  onEditTerm: (term: Term) => void;
  onResolveTermOnly: (term: Term) => void;
  isLightTheme: boolean;
}

export const TermSidebar: React.FC<TermSidebarProps> = ({ terms, entries, onCreateEntry, onEditEntry, onEditTerm, onResolveTermOnly, isLightTheme }) => {
  const activeTabClass = isLightTheme 
    ? 'text-amber-700 bg-white border-b-2 border-amber-600' 
    : 'text-gold bg-white/5';
  const inactiveTabClass = isLightTheme
    ? 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
    : 'text-parchment-dim hover:text-parchment hover:bg-white/[0.02]';

  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Terms
  const pendingTerms = terms.filter(t => t.status === 'pending');
  const resolvedTerms = terms.filter(t => t.status !== 'pending');

  const filteredList = (activeTab === 'PENDING' ? pendingTerms : resolvedTerms).filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResolveOnly = (e: React.MouseEvent, term: Term) => {
      e.stopPropagation();
      onResolveTermOnly(term);
  };

  const handleEditClick = (e: React.MouseEvent, term: Term) => {
      e.stopPropagation();
      onEditTerm(term);
  };

  return (
    <div className={`flex flex-col h-full border-r w-80 shrink-0 transition-colors duration-500 ${isLightTheme ? 'bg-[#f2f2f2] border-stone-300' : 'bg-[#0a0a0c] border-gold/10'}`}>
        
        {/* Sidebar Header */}
        <div className={`h-10 flex items-center px-4 border-b ${isLightTheme ? 'bg-white border-stone-200' : 'bg-obsidian/50 border-gold/10'}`}>
            <span className={`text-xs font-bold uppercase tracking-widest font-mono flex items-center gap-2 ${isLightTheme ? 'text-stone-600' : 'text-parchment-dim'}`}>
                <Hash className={`w-3 h-3 ${isLightTheme ? 'text-amber-600' : 'text-gold'}`} /> 术语中心 / TERMS
            </span>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isLightTheme ? 'border-stone-200 bg-stone-50' : 'border-white/5 bg-white/[0.02]'}`}>
             <button 
                onClick={() => setActiveTab('PENDING')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors relative flex items-center justify-center gap-2 ${activeTab === 'PENDING' ? activeTabClass : inactiveTabClass}`}
            >
                待录入 ({pendingTerms.length})
                {activeTab === 'PENDING' && !isLightTheme && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('RESOLVED')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors relative flex items-center justify-center gap-2 ${activeTab === 'RESOLVED' ? activeTabClass : inactiveTabClass}`}
            >
                已归档 ({resolvedTerms.length})
                {activeTab === 'RESOLVED' && !isLightTheme && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"></div>}
            </button>
        </div>

        {/* Search */}
        <div className={`p-3 border-b ${isLightTheme ? 'border-stone-200' : 'border-white/5'}`}>
            <div className="relative group">
                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${isLightTheme ? 'text-stone-400 group-focus-within:text-amber-600' : 'text-parchment-dim group-focus-within:text-gold'}`} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="检索术语..." 
                  className={`w-full border rounded-sm py-1.5 pl-8 pr-3 text-xs outline-none transition-all font-mono 
                    ${isLightTheme 
                        ? 'bg-white border-stone-300 text-stone-800 focus:border-amber-500 placeholder:text-stone-400' 
                        : 'bg-white/5 border-white/10 text-parchment focus:border-gold/30 placeholder:text-parchment-dim/30'
                    }`}
                />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {filteredList.length === 0 ? (
                <div className={`text-center py-8 text-xs italic font-mono ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim/30'}`}>
                    NO_DATA_FOUND
                </div>
            ) : (
                filteredList.map(term => {
                    const linkedEntry = term.entryId ? entries.find(e => e.id === term.entryId) : null;
                    const hasEntry = term.status === 'with_entry' && linkedEntry;
                    
                    return (
                        <div key={term.id} className={`group border rounded-sm p-3 transition-all ${isLightTheme ? 'bg-white border-stone-200 hover:border-amber-400 hover:shadow-sm' : 'bg-white/[0.02] border-white/5 hover:border-gold/20 hover:bg-white/[0.04]'}`}>
                             <div className="flex justify-between items-start mb-1">
                                 <span className={`text-sm font-serif font-bold transition-colors ${isLightTheme ? 'text-stone-800 group-hover:text-amber-700' : 'text-parchment group-hover:text-gold'}`}>{term.name}</span>
                                 <span className={`text-[9px] font-mono border px-1 rounded-sm opacity-60 ${isLightTheme ? 'border-stone-200 text-stone-500' : 'border-white/10 text-parchment-dim'}`}>{term.type.split('/')[0]}</span>
                             </div>
                             <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${isLightTheme ? 'text-stone-500' : 'text-parchment-dim/60'}`}>{term.description}</p>
                             
                             <div className={`flex items-center gap-2 pt-2 border-t ${isLightTheme ? 'border-stone-100' : 'border-white/5'}`}>
                                 {activeTab === 'PENDING' ? (
                                     <>
                                        <button 
                                            onClick={() => onCreateEntry(term)}
                                            className={`flex-1 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                                                isLightTheme 
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-400' 
                                                    : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20 hover:border-gold/50'
                                            }`}
                                            title="创建新档案并关联此术语"
                                        >
                                            <Plus className="w-3 h-3" /> 创建档案
                                        </button>
                                        <button 
                                            onClick={(e) => handleResolveOnly(e, term)}
                                            className={`flex-1 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                isLightTheme
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                                            }`}
                                            title="标记为已录入（仅术语，无档案）"
                                        >
                                            <CheckCircle2 className="w-3 h-3" /> 直接录入
                                        </button>
                                        <button 
                                            onClick={(e) => handleEditClick(e, term)}
                                            className={`px-2 py-1.5 border rounded-sm text-[10px] transition-all ${
                                                isLightTheme 
                                                    ? 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-800' 
                                                    : 'bg-white/5 text-parchment-dim border-white/10 hover:bg-white/10 hover:border-white/30'
                                            }`}
                                            title="编辑术语信息"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                        </button>
                                     </>
                                 ) : (
                                     <>
                                         {hasEntry ? (
                                             <button 
                                                 onClick={() => onEditEntry(linkedEntry!)}
                                                 className={`flex-1 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                                                    isLightTheme
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-400'
                                                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/50'
                                                 }`}
                                             >
                                                 <Edit3 className="w-3 h-3" /> 编辑档案
                                             </button>
                                         ) : (
                                              /* term.status === 'term_only' */
                                              <div className={`flex-1 py-1.5 text-center text-[10px] border rounded-sm font-mono uppercase flex items-center justify-center gap-2 group/label ${
                                                  isLightTheme 
                                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                                    : 'text-emerald-500/70 bg-emerald-500/5 border-emerald-500/10'
                                              }`}>
                                                  仅术语记录
                                                  <button 
                                                      onClick={(e) => { e.stopPropagation(); onCreateEntry(term); }}
                                                      className={`hidden group-hover/label:flex p-0.5 rounded-sm transition-colors ${
                                                          isLightTheme 
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                                            : 'bg-obsidian text-gold hover:bg-gold hover:text-obsidian'
                                                      }`}
                                                      title="现在补充档案"
                                                  >
                                                      <Plus className="w-3 h-3" />
                                                  </button>
                                              </div>
                                         )}
                                         <button 
                                            onClick={(e) => handleEditClick(e, term)}
                                            className={`px-2 py-1.5 border rounded-sm text-[10px] transition-all ${
                                                isLightTheme 
                                                    ? 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-800' 
                                                    : 'bg-white/5 text-parchment-dim border-white/10 hover:bg-white/10 hover:border-white/30'
                                            }`}
                                            title="编辑术语信息"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                        </button>
                                     </>
                                 )}
                             </div>
                        </div>
                    );
                })
            )}
        </div>
        
        {/* Footer */}
        <div className={`p-3 border-t text-center ${isLightTheme ? 'border-stone-200' : 'border-gold/10'}`}>
             <div className={`text-[9px] font-mono ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim/30'}`}>
                 WORKSPACE_ACTIVE // VER 2.2
             </div>
        </div>
    </div>
  );
};
