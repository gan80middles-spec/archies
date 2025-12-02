
import React, { useRef, useEffect } from 'react';
import { EditorTab } from '../types';
import { X, FileText, Plus, Circle } from 'lucide-react';

interface EditorTabsBarProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  isLightTheme: boolean;
}

export const EditorTabsBar: React.FC<EditorTabsBarProps> = ({ tabs, activeTabId, onTabClick, onCloseTab, onNewTab, isLightTheme }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabId && scrollContainerRef.current) {
        const activeEl = document.getElementById(`tab-${activeTabId}`);
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [activeTabId]);

  return (
    <div className={`flex items-center w-full h-10 border-b select-none transition-colors duration-300 ${isLightTheme ? 'bg-[#e5e5e5] border-stone-300' : 'bg-[#0a0a0c] border-gold/10'}`}>
        {/* Tabs Container */}
        <div 
            ref={scrollContainerRef}
            className="flex-1 flex overflow-x-auto scrollbar-hide h-full items-end px-2 gap-1"
        >
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                return (
                    <div 
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        onClick={() => onTabClick(tab.id)}
                        className={`
                            group relative min-w-[120px] max-w-[200px] h-9 px-3 flex items-center justify-between gap-2
                            border-t border-l border-r rounded-t-sm cursor-pointer transition-all
                            ${isActive 
                                ? (isLightTheme 
                                    ? 'bg-[#f7f5ef] text-stone-800 border-stone-300 border-b-[#f7f5ef] z-10' 
                                    : 'bg-obsidian text-parchment border-gold/20 border-b-obsidian z-10'
                                  ) 
                                : (isLightTheme
                                    ? 'bg-[#d4d4d4] text-stone-500 border-stone-300 hover:bg-[#e0e0e0] border-b-stone-300'
                                    : 'bg-white/[0.02] text-parchment-dim border-white/5 hover:bg-white/5 border-b-gold/10'
                                  )
                            }
                        `}
                    >
                        {isActive && <div className={`absolute top-0 left-0 w-full h-[2px] ${isLightTheme ? 'bg-amber-600' : 'bg-gold'}`}></div>}
                        
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className={`w-3 h-3 shrink-0 ${isActive ? (isLightTheme ? 'text-amber-600' : 'text-gold') : 'opacity-50'}`} />
                            <span className={`text-xs font-mono truncate ${tab.isDirty ? 'italic' : ''}`}>
                                {tab.title || 'Untitled'}
                            </span>
                        </div>

                        <div className="flex items-center shrink-0">
                            {tab.isDirty && (
                                <div className={`w-2 h-2 rounded-full mr-1 group-hover:hidden ${isLightTheme ? 'bg-amber-600' : 'bg-gold'}`}></div>
                            )}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }}
                                className={`
                                    p-0.5 rounded-sm hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all
                                    ${isActive ? 'opacity-100' : ''}
                                    ${isLightTheme ? 'text-stone-400 hover:text-red-500 hover:bg-red-100' : 'text-parchment-dim hover:text-red-400'}
                                `}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
        
        {/* New Tab Button */}
        <button 
            onClick={onNewTab}
            className={`w-10 h-full flex items-center justify-center border-l transition-colors
                ${isLightTheme 
                    ? 'text-stone-500 hover:text-amber-600 hover:bg-white/20 border-stone-300' 
                    : 'text-parchment-dim hover:text-gold hover:bg-white/5 border-gold/10'
                }
            `}
            title="新草稿"
        >
            <Plus className="w-4 h-4" />
        </button>
    </div>
  );
};
