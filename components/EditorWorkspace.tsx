
import React, { useState, useEffect } from 'react';
import { Entry, Term, Category, EditorTab, EditorTabMode } from '../types';
import { EditorView } from './EditorView';
import { EditorTabsBar } from './EditorTabsBar';
import { TermSidebar } from './TermSidebar';
import { TermEditDialog } from './TermEditDialog';
import { ArrowLeft, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorWorkspaceProps {
  entries: Entry[];
  terms: Term[];
  onBack: () => void;
  onSaveEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'likes' | 'author'>) => string; // Returns new ID
  onUpdateTerm: (term: Term) => void;
  onResolveTermOnly: (term: Term) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  initialOpenEntryId?: string; // Optional: Open this ID on load
  initialOpenTermName?: string; // Optional: Create draft for this term on load
}

// --- CONSTRUCTION OVERLAY ANIMATION ---
const ConstructionOverlay = ({ isLightTheme }: { isLightTheme: boolean }) => {
    const color = isLightTheme ? '#d97706' : '#e8c99b'; // Gold
    
    return (
        <motion.div 
            className="absolute inset-0 z-[100] pointer-events-none overflow-hidden"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <svg className="w-full h-full">
                {/* 1. Sidebar Divider (Fixed 320px / 20rem) */}
                <motion.line 
                    x1="320" y1="0" x2="320" y2="100%" 
                    stroke={color} strokeWidth="1"
                    strokeOpacity={0.5}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />
                
                {/* 2. Tabs Bar Divider (Height ~40px) */}
                <motion.line 
                    x1="320" y1="40" x2="100%" y2="40" 
                    stroke={color} strokeWidth="1"
                    strokeOpacity={0.5}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
                />

                {/* 3. Editor Toolbar Divider (Height ~40px + 48px = 88px) */}
                 <motion.line 
                    x1="320" y1="88" x2="100%" y2="88" 
                    stroke={color} strokeWidth="1" 
                    strokeOpacity={0.3}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeInOut" }}
                />
                
                {/* 4. Split View Divider (Center of remaining space: 320px + (100% - 320px)/2 = 50% + 160px) */}
                 <motion.line 
                    x1="calc(50% + 160px)" y1="88" x2="calc(50% + 160px)" y2="100%" 
                    stroke={color} strokeWidth="1"
                    strokeDasharray="4 4"
                    strokeOpacity={0.3}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
                />

                {/* Decorative Corners */}
                <motion.path 
                    d="M 315 40 L 325 40 M 320 35 L 320 45" 
                    stroke={color} strokeWidth="1"
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                />
            </svg>
        </motion.div>
    );
};

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ 
    entries, terms, onBack, onSaveEntry, onUpdateTerm, onResolveTermOnly, isLightTheme, onToggleTheme, initialOpenEntryId, initialOpenTermName 
}) => {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  // Animation State
  const [isReady, setIsReady] = useState(false);

  // Term Edit Modal State
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  // Initialize with requested entry or term if provided
  useEffect(() => {
    if (initialOpenEntryId) {
        const entry = entries.find(e => e.id === initialOpenEntryId);
        if (entry) {
            openExistingEntry(entry);
        }
    } else if (initialOpenTermName) {
        const term = terms.find(t => t.name === initialOpenTermName);
        if (term) {
            openNewEntryForTerm(term);
        }
    }

    // Trigger Ready State for Animation
    const timer = setTimeout(() => setIsReady(true), 1200);
    return () => clearTimeout(timer);
  }, []); 

  const generateTabId = () => Math.random().toString(36).substr(2, 9);

  const openNewTab = () => {
      const newTab: EditorTab = {
          id: generateTabId(),
          mode: 'new',
          title: '新建档案',
          isDirty: false
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
  };

  const openNewEntryForTerm = (term: Term) => {
      // Check if already open
      const existingTab = tabs.find(t => t.termId === term.id);
      if (existingTab) {
          setActiveTabId(existingTab.id);
          return;
      }

      const newTab: EditorTab = {
          id: generateTabId(),
          mode: 'new',
          termId: term.id,
          title: term.name, // Use term name as draft title
          isDirty: false
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
  };

  const openExistingEntry = (entry: Entry) => {
      // Check if already open
      const existingTab = tabs.find(t => t.entryId === entry.id);
      if (existingTab) {
          setActiveTabId(existingTab.id);
          return;
      }

      const newTab: EditorTab = {
          id: generateTabId(),
          mode: 'existing',
          entryId: entry.id,
          title: entry.title,
          isDirty: false
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
  };

  const handleCloseTab = (tabId: string) => {
      const tab = tabs.find(t => t.id === tabId);
      if (tab?.isDirty) {
          if (!window.confirm(`"${tab.title}" 有未保存的修改。确认关闭吗？`)) {
              return;
          }
      }

      setTabs(prev => {
          const newTabs = prev.filter(t => t.id !== tabId);
          // If we closed the active tab, switch to the last one
          if (tabId === activeTabId) {
              const lastTab = newTabs[newTabs.length - 1];
              setActiveTabId(lastTab ? lastTab.id : null);
          }
          return newTabs;
      });
  };

  const updateTabTitle = (tabId: string, newTitle: string) => {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title: newTitle || 'Untitled' } : t));
  };

  const updateTabDirty = (tabId: string, dirty: boolean) => {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isDirty: dirty } : t));
  };

  const handleEntrySaved = (tabId: string, savedEntryId: string, savedTitle: string) => {
      setTabs(prev => prev.map(t => {
          if (t.id !== tabId) return t;
          return {
              ...t,
              mode: 'existing',
              entryId: savedEntryId,
              title: savedTitle,
              isDirty: false
          };
      }));

      // If this was linked to a term, update the term status
      const tab = tabs.find(t => t.id === tabId);
      if (tab && tab.termId) {
          const term = terms.find(tm => tm.id === tab.termId);
          // Only update if it was pending or term_only (adding entry to existing term)
          if (term && (term.status === 'pending' || term.status === 'term_only')) {
              onUpdateTerm({ ...term, status: 'with_entry', entryId: savedEntryId });
          }
      }
  };

  // Handle Term Editing
  const handleEditTermRequest = (term: Term) => {
      setEditingTerm(term);
      setIsTermModalOpen(true);
  };

  const handleTermUpdate = (updatedTerm: Term) => {
      onUpdateTerm(updatedTerm);
      // Update tabs title if a tab is creating a new entry for this term
      setTabs(prev => prev.map(tab => {
          if (tab.termId === updatedTerm.id && tab.mode === 'new') {
              return { ...tab, title: updatedTerm.name };
          }
          return tab;
      }));
  };

  // Find active tab object
  const activeTab = tabs.find(t => t.id === activeTabId);

  // Determine props for the active editor
  const activeEntry = activeTab?.entryId ? entries.find(e => e.id === activeTab.entryId) : undefined;
  const activeTerm = activeTab?.termId ? terms.find(t => t.id === activeTab.termId) : undefined;

  return (
    <div className={`relative h-screen w-screen overflow-hidden ${isLightTheme ? 'bg-[#f7f5ef]' : 'bg-obsidian'}`}>
        
        {/* Construction Animation Overlay */}
        <AnimatePresence>
            {!isReady && <ConstructionOverlay isLightTheme={isLightTheme} />}
        </AnimatePresence>

        {/* Main Workspace Content - Fades in after construction */}
        <motion.div 
            className={`flex h-full w-full transition-colors duration-500 ${isLightTheme ? 'text-stone-800' : 'text-parchment'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isReady ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            
            {/* Left Sidebar: Terms */}
            <TermSidebar 
                terms={terms}
                entries={entries}
                onCreateEntry={openNewEntryForTerm}
                onEditEntry={openExistingEntry}
                onEditTerm={handleEditTermRequest}
                onResolveTermOnly={onResolveTermOnly}
                isLightTheme={isLightTheme}
            />

            {/* Right Area: Workspace */}
            <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-500 ${isLightTheme ? 'bg-[#f7f5ef]' : 'bg-obsidian'}`}>
                
                {/* Top Bar: Tabs + Back */}
                <div className={`flex shrink-0 ${isLightTheme ? 'bg-[#e5e5e5]' : 'bg-[#0a0a0c]'}`}>
                    <div className={`w-12 h-10 border-r border-b flex items-center justify-center ${isLightTheme ? 'border-stone-300' : 'border-gold/10'}`}>
                        <button onClick={onBack} className={`transition-colors ${isLightTheme ? 'text-stone-500 hover:text-amber-600' : 'text-parchment-dim hover:text-gold'}`}>
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <EditorTabsBar 
                            tabs={tabs}
                            activeTabId={activeTabId}
                            onTabClick={setActiveTabId}
                            onCloseTab={handleCloseTab}
                            onNewTab={openNewTab}
                            isLightTheme={isLightTheme}
                        />
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 relative">
                    {activeTab ? (
                        <EditorView
                            key={activeTab.id} 
                            initialTitle={activeTab.title} 
                            initialCategory={activeTab.initialCategory}
                            existingEntry={activeEntry}
                            initialTermName={activeTerm?.name}
                            
                            onTitleChange={(t) => updateTabTitle(activeTab.id, t)}
                            onDirtyChange={(d) => updateTabDirty(activeTab.id, d)}
                            onSaveInternal={(data) => {
                                const newId = onSaveEntry(data);
                                handleEntrySaved(activeTab.id, newId, data.title);
                            }}
                            
                            isLightTheme={isLightTheme}
                            onToggleTheme={onToggleTheme}
                            entries={entries}
                            terms={terms}
                            onAddTerm={onUpdateTerm}
                            onNavigateToEditor={(cat, title) => {
                                if (title) {
                                    const term = terms.find(t => t.name === title);
                                    if (term) openNewEntryForTerm(term);
                                    else {
                                        const newTab: EditorTab = {
                                            id: generateTabId(),
                                            mode: 'new',
                                            title: title,
                                            isDirty: false,
                                            initialCategory: cat
                                        };
                                        setTabs(prev => [...prev, newTab]);
                                        setActiveTabId(newTab.id);
                                    }
                                } else if (cat) {
                                    const newTab: EditorTab = {
                                        id: generateTabId(),
                                        mode: 'new',
                                        title: '新建档案',
                                        isDirty: false,
                                        initialCategory: cat
                                    };
                                    setTabs(prev => [...prev, newTab]);
                                    setActiveTabId(newTab.id);
                                }
                            }}
                        />
                    ) : (
                        <div className={`absolute inset-0 flex flex-col items-center justify-center opacity-50 select-none ${isLightTheme ? 'text-stone-400' : 'text-parchment-dim'}`}>
                            <Layout className={`w-16 h-16 mb-6 ${isLightTheme ? 'text-stone-300' : 'text-white/10'}`} />
                            <h2 className="text-xl font-serif mb-2">Editor Workspace</h2>
                            <p className="text-sm font-mono text-center max-w-md">
                                从左侧选择术语开始撰写，或点击 "+" 创建新草稿。<br/>
                                Select a term from the left to start writing.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Term Edit Dialog */}
            <TermEditDialog 
                isOpen={isTermModalOpen}
                term={editingTerm}
                onClose={() => setIsTermModalOpen(false)}
                onSave={handleTermUpdate}
            />
        </motion.div>
    </div>
  );
};
