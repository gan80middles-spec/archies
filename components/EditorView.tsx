

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Entry, Category, EditorBlockNode, BlockType, TextBlock, ListBlock, CalloutBlock, ReferenceEntryBlock, CATEGORY_COLORS, Term, TermType, TermStatus } from '../types';
import { 
  Save, Plus, X, Type, Heading1, Heading2, Heading3, Quote, Code, Eye, Upload, Image as ImageIcon, ListPlus,
  List, ListOrdered, CheckSquare, Minus, Bold, Italic, Link as LinkIcon, Table, FileText, PenTool, AlertTriangle, Activity, Brain, Sun, Moon, ArrowUp, ArrowDown, Settings2, ShieldAlert, Sparkles, Hash, ScanEye, Terminal, Zap, Command, Keyboard, Link2, Search, BookOpen, ExternalLink, HelpCircle, CheckCircle2, Edit3, Check, FolderOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useOutlineTree, createSiblingNode, generateId } from '../hooks/useOutlineTree';

// --- CONFIG & UTILS (Kept same as before) ---

const getChildBlockType = (parentType: BlockType): BlockType => {
  switch (parentType) {
    case 'h1': return 'h2';
    case 'h2': return 'h3';
    case 'h3': return 'paragraph';
    case 'li': return 'li'; 
    case 'callout': return 'paragraph';
    default: return 'paragraph';
  }
};

interface BlockRenderConfig {
    prefix?: (node: EditorBlockNode, index: number, onUpdate: (id: string, u: Partial<EditorBlockNode>) => void) => React.ReactNode;
    input: (
        node: EditorBlockNode, 
        commonProps: any, 
        onUpdate: (id: string, u: Partial<EditorBlockNode>) => void,
        entries?: Entry[] // Added for reference lookups
    ) => React.ReactNode;
}

const calculateRows = (content: string | undefined) => {
    const text = content || '';
    const newlines = text.split('\n').length;
    const estimatedWrap = Math.ceil(text.length / 60);
    return Math.max(1, newlines, estimatedWrap);
};

// Styling updated for "Scriptorium" feel
const BLOCK_RENDER_CONFIG: Record<string, BlockRenderConfig> = {
    h1: {
        prefix: () => <span className="text-gold font-serif font-bold mr-4 select-none text-2xl w-6 text-center opacity-50">§</span>,
        input: (node, props) => <input {...props} placeholder="一级标题" className={`${props.className} text-3xl font-serif text-parchment font-bold border-b border-white/5 pb-2 placeholder:text-parchment/10`} />
    },
    h2: {
        prefix: () => <span className="text-parchment-dim font-serif font-bold mr-4 select-none text-xl w-6 text-center opacity-30">¶</span>,
        input: (node, props) => <input {...props} placeholder="二级标题" className={`${props.className} text-2xl font-serif text-parchment/90 font-medium placeholder:text-parchment/10`} />
    },
    h3: {
        prefix: () => <span className="text-parchment-dim/50 font-serif font-bold mr-4 select-none text-lg w-6 text-center opacity-20">¶</span>,
        input: (node, props) => <input {...props} placeholder="三级标题" className={`${props.className} text-xl font-serif text-parchment/80 placeholder:text-parchment/10`} />
    },
    paragraph: {
        prefix: () => <div className="w-6 mr-4"></div>,
        input: (node, props) => <textarea {...props} placeholder="撰写档案内容... (输入 [[ 插入术语)" className={`${props.className} text-base text-parchment-dim resize-none overflow-hidden leading-relaxed font-sans placeholder:text-parchment/5`} rows={calculateRows(node.content)} />
    },
    quote: {
        prefix: () => <div className="w-1 h-full bg-gold/50 mx-auto mr-4"></div>,
        input: (node, props) => <textarea {...props} placeholder="引用文献..." className={`${props.className} text-lg italic text-gold/80 resize-none font-serif bg-gold/5 p-2 rounded-sm`} rows={calculateRows(node.content)} />
    },
    code: {
        prefix: () => <span className="text-gold/50 font-mono mr-4 select-none w-6 text-center text-xs">{'<>'}</span>,
        input: (node, props) => <div className="bg-charcoal/20 border border-gold/10 rounded-sm p-3 w-full shadow-inner"><textarea {...props} placeholder="代码片段..." className={`${props.className} text-gold/90 font-mono text-sm resize-none`} rows={Math.max(2, (node.content?.split('\n').length || 1))} /></div>
    },
    li: {
        prefix: (node, index, onUpdate) => {
            const listNode = node as any; 
            if (listNode.listStyle === 'number') return <span className="text-gold font-mono mr-4 select-none w-6 text-center text-sm">{index}.</span>;
            if (listNode.listStyle === 'task') return (
                <div className="w-6 flex justify-center mr-4">
                    <button 
                        onClick={() => onUpdate(node.id, { checked: !listNode.checked })}
                        className={`w-3.5 h-3.5 rounded-sm border ${listNode.checked ? 'bg-gold border-gold' : 'border-white/10 hover:border-gold'} flex items-center justify-center transition-colors`}
                    >
                        {listNode.checked && <CheckSquare className="w-3 h-3 text-obsidian" />}
                    </button>
                </div>
            );
            return <span className="text-parchment-dim font-bold mr-4 select-none w-6 text-center">•</span>;
        },
        input: (node, props) => <textarea {...props} placeholder="列表项..." className={`${props.className} text-base text-parchment-dim resize-none overflow-hidden leading-relaxed font-sans ${(node as any).checked ? 'line-through opacity-40' : ''}`} rows={calculateRows(node.content)} />
    },
    hr: {
        prefix: () => <span className="text-white/10 font-bold mr-4 select-none w-6 text-center">—</span>,
        input: () => <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-4"></div>
    },
    image: {
        prefix: () => <ImageIcon className="w-4 h-4 text-parchment-dim mr-4 mx-auto" />,
        input: (node, props, onUpdate) => (
            <div className="bg-charcoal/20 border border-dashed border-white/10 rounded-sm p-3 w-full space-y-2 hover:border-gold/30 transition-colors">
                <input 
                    value={node.src || ''}
                    onChange={(e) => onUpdate(node.id, { src: e.target.value })}
                    placeholder="图片链接 URL..."
                    className="w-full bg-transparent text-gold text-sm font-mono placeholder-white/10 outline-none"
                    onKeyDown={(e) => e.stopPropagation()} 
                />
                <input 
                    value={node.alt || ''}
                    onChange={(e) => onUpdate(node.id, { alt: e.target.value })}
                    placeholder="图片描述 (Alt)..."
                    className="w-full bg-transparent text-parchment-dim/50 text-xs italic outline-none font-serif"
                    onKeyDown={(e) => e.stopPropagation()}
                />
            </div>
        )
    },
    callout: {
        prefix: () => <Terminal className="w-4 h-4 text-gold/50 mr-4 mx-auto" />,
        input: (node, props, onUpdate) => {
            const variant = (node as CalloutBlock).variant || 'info';
            const colors = {
                info: 'border-blue-500/50 bg-blue-500/5 text-blue-200',
                warning: 'border-amber-500/50 bg-amber-500/5 text-amber-200',
                danger: 'border-red-500/50 bg-red-500/5 text-red-200',
                success: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-200',
            };
            return (
                <div className={`w-full rounded-sm border-l-2 p-3 ${colors[variant]} transition-colors relative group/callout`}>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/callout:opacity-100 transition-opacity">
                        <button onClick={() => onUpdate(node.id, { variant: 'info' })} className={`w-3 h-3 rounded-full bg-blue-500 ${variant === 'info' ? 'ring-1 ring-white' : 'opacity-40'}`} />
                        <button onClick={() => onUpdate(node.id, { variant: 'warning' })} className={`w-3 h-3 rounded-full bg-amber-500 ${variant === 'warning' ? 'ring-1 ring-white' : 'opacity-40'}`} />
                        <button onClick={() => onUpdate(node.id, { variant: 'danger' })} className={`w-3 h-3 rounded-full bg-red-500 ${variant === 'danger' ? 'ring-1 ring-white' : 'opacity-40'}`} />
                        <button onClick={() => onUpdate(node.id, { variant: 'success' })} className={`w-3 h-3 rounded-full bg-emerald-500 ${variant === 'success' ? 'ring-1 ring-white' : 'opacity-40'}`} />
                    </div>
                    <textarea 
                        {...props} 
                        placeholder="系统提示信息..." 
                        className={`${props.className} bg-transparent text-sm font-mono resize-none outline-none`} 
                        rows={calculateRows(node.content)} 
                    />
                </div>
            );
        }
    },
    'reference-entry': {
        prefix: () => <Link2 className="w-4 h-4 text-gold/80 mr-4 mx-auto" />,
        input: (node, props, onUpdate, entries) => {
            const refNode = node as ReferenceEntryBlock;
            const referencedEntry = entries?.find(e => e.id === refNode.entryId);

            if (!referencedEntry) {
                return (
                    <div className="w-full p-4 border border-dashed border-red-500/30 bg-red-900/10 rounded-sm flex items-center gap-3 text-red-300/60 font-mono text-xs">
                        <AlertTriangle className="w-4 h-4" /> 
                        <span>关联档案不存在 (ID: {refNode.entryId})</span>
                         <input
                            className="hidden"
                            onKeyDown={props.onKeyDown}
                            data-block-id={props['data-block-id']}
                            ref={props.ref as any}
                         />
                    </div>
                );
            }

            return (
                <div className="w-full my-2 select-none group/ref-block">
                     <ReferenceCard entry={referencedEntry} isPreview={false} />
                     <input 
                        value={refNode.note || ''} 
                        onChange={(e) => onUpdate(node.id, { note: e.target.value })}
                        onKeyDown={props.onKeyDown}
                        ref={props.ref as any}
                        data-block-id={props['data-block-id']}
                        placeholder="添加引用备注 (可选)..." 
                        className="w-full bg-transparent text-[10px] text-parchment-dim/50 font-mono mt-1 outline-none border-none placeholder-white/10 focus:placeholder-white/20"
                     />
                </div>
            );
        }
    }
};

// --- COMPONENTS ---

const ReferenceCard: React.FC<{ entry: Entry, isPreview: boolean }> = ({ entry, isPreview }) => {
    return (
        <div className={`relative overflow-hidden rounded-sm border bg-obsidian-light/60 backdrop-blur-sm transition-all group ${isPreview ? 'hover:bg-white/5 hover:border-gold/30 hover:shadow-lg cursor-pointer' : 'border-gold/20'}`}>
             <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${CATEGORY_COLORS[entry.category]} opacity-60`}></div>
             <div className="p-3 flex items-start gap-3">
                 <div className="mt-0.5 text-gold/60">
                     <Link2 className="w-3.5 h-3.5" />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2">
                             <h4 className="font-serif text-parchment font-bold text-sm truncate">{entry.title}</h4>
                             <span className="text-[9px] font-mono text-parchment-dim/50 border border-white/5 px-1 rounded-sm uppercase tracking-wider">{entry.category}</span>
                         </div>
                     </div>
                     
                     <div className="text-[10px] text-parchment-dim/60 line-clamp-1 mb-2 font-serif italic">{entry.content.slice(0, 60)}...</div>

                     <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2">
                         <div className="flex flex-col gap-0.5">
                             <div className="flex justify-between text-[8px] text-parchment-dim/50 font-mono"><span>REALISM</span><span>{entry.realism}</span></div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gold" style={{width: `${(entry.realism/5)*100}%`}}></div></div>
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <div className="flex justify-between text-[8px] text-parchment-dim/50 font-mono"><span>RISK</span><span>{entry.risk}</span></div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{width: `${(entry.risk/8)*100}%`}}></div></div>
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <div className="flex justify-between text-[8px] text-parchment-dim/50 font-mono"><span>ANOMALY</span><span>{entry.anomalous}</span></div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-cyan-400" style={{width: `${(entry.anomalous/7)*100}%`}}></div></div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

interface BlockTreeProps {
  nodes: EditorBlockNode[];
  depth: number;
  activeMenuId: string | null;
  onSetActiveMenuId: (id: string | null) => void;
  activeInsertMenuId: string | null;
  onSetActiveInsertMenuId: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<EditorBlockNode>) => void;
  onAddSibling: (targetId: string, newNode: EditorBlockNode, direction?: 'before' | 'after') => void;
  onAddChild: (parentId: string, type: BlockType, extra?: Partial<EditorBlockNode>) => void;
  onRemove: (id: string) => void;
  blockRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onNavigate: (id: string, direction: 'up' | 'down') => void;
  entries?: Entry[]; 
  onTriggerTermPicker?: (id: string) => void; 
}

const BlockTree: React.FC<BlockTreeProps> = React.memo(({ 
  nodes, depth, activeMenuId, onSetActiveMenuId, activeInsertMenuId, onSetActiveInsertMenuId, onUpdate, onAddSibling, onAddChild, onRemove, blockRefs, onNavigate, entries, onTriggerTermPicker
}) => {
  
  const handleKeyDown = (e: React.KeyboardEvent, node: EditorBlockNode) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const newNode = createSiblingNode(node);
        onAddSibling(node.id, newNode, 'after');
    }
    if (e.key === 'Backspace' && (!node.content || node.content === '') && node.type === 'li') {
        e.preventDefault();
        onUpdate(node.id, { type: 'paragraph', listStyle: undefined } as any);
    }
    if (e.key === 'ArrowUp') {
        const target = e.target as HTMLTextAreaElement | HTMLInputElement;
        if (target && target.selectionStart === 0 && target.selectionEnd === 0) {
            e.preventDefault();
            onNavigate(node.id, 'up');
        } else if (!target) {
            e.preventDefault();
            onNavigate(node.id, 'up');
        }
    }
    if (e.key === 'ArrowDown') {
        const target = e.target as HTMLTextAreaElement | HTMLInputElement;
        if (target && target.selectionStart === (target.value || '').length) {
            e.preventDefault();
            onNavigate(node.id, 'down');
        } else if (!target) {
            e.preventDefault();
             onNavigate(node.id, 'down');
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>, node: EditorBlockNode) => {
      const newVal = e.target.value;
      onUpdate(node.id, { content: newVal });
      if (newVal.endsWith('[[')) {
          if (onTriggerTermPicker) onTriggerTermPicker(node.id);
      }
  };

  let currentListIndex = 0;

  return (
    <>
      {nodes.map((node) => {
        const config = BLOCK_RENDER_CONFIG[node.type] || BLOCK_RENDER_CONFIG.paragraph;
        
        if (node.type === 'li' && (node as any).listStyle === 'number') {
            currentListIndex++;
        } else {
            currentListIndex = 0; 
        }
        const displayIndex = currentListIndex;
        const zIndexClass = (activeMenuId === node.id || activeInsertMenuId === node.id) ? 'z-30' : 'z-auto';

        return (
            <div key={node.id} className={`relative animate-fade-in group/block ${zIndexClass}`}>
            
            <div 
                className={`flex items-start py-1.5 transition-all rounded-sm hover:bg-white/[0.03] relative pr-20`}
                style={{ marginLeft: `${depth * 28}px` }} 
            >
                {depth > 0 && <div className="absolute left-[-14px] top-0 bottom-0 w-[1px] bg-white/5 group-hover/block:bg-white/10 transition-colors"></div>}
                {depth > 0 && <div className="absolute left-[-14px] top-5 w-[14px] h-[1px] bg-white/5 group-hover/block:bg-white/10 transition-colors"></div>}

                <div className="shrink-0 pt-0.5 opacity-40 group-hover/block:opacity-100 transition-opacity">
                    {config.prefix ? config.prefix(node, displayIndex, onUpdate) : <div className="w-6 mr-4"></div>}
                </div>

                <div className="flex-1 min-w-0">
                    {config.input(node, {
                        value: node.content || '',
                        onChange: (e: any) => handleChange(e, node),
                        onKeyDown: (e: any) => handleKeyDown(e, node),
                        ref: (el: HTMLElement | null) => { blockRefs.current[node.id] = el; },
                        className: "w-full bg-transparent outline-none",
                        "data-block-id": node.id
                    }, onUpdate, entries)}
                </div>

                {/* Block Menu */}
                <div className="absolute right-2 top-1.5 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onSetActiveInsertMenuId(activeInsertMenuId === node.id ? null : node.id);
                                onSetActiveMenuId(null);
                            }}
                            className={`p-1 rounded-sm transition-colors ${activeInsertMenuId === node.id ? 'bg-gold text-obsidian' : 'text-parchment-dim hover:bg-white/5 hover:text-parchment'}`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        {activeInsertMenuId === node.id && (
                             <div className="absolute right-0 top-full mt-2 w-40 bg-obsidian-light border border-gold/20 rounded-sm shadow-2xl py-2 z-50 animate-fade-in">
                                 <button onClick={(e) => { e.stopPropagation(); onAddSibling(node.id, createSiblingNode(node), 'before'); onSetActiveInsertMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-white/5 text-xs flex gap-2 text-parchment items-center transition-colors"><ArrowUp className="w-3 h-3 text-gold/50"/> 向上插入</button>
                                 <button onClick={(e) => { e.stopPropagation(); onAddSibling(node.id, createSiblingNode(node), 'after'); onSetActiveInsertMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-white/5 text-xs flex gap-2 text-parchment items-center transition-colors"><ArrowDown className="w-3 h-3 text-gold/50"/> 向下插入</button>
                             </div>
                        )}
                    </div>

                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onSetActiveMenuId(activeMenuId === node.id ? null : node.id);
                                onSetActiveInsertMenuId(null);
                            }}
                            className={`p-1 rounded-sm transition-colors ${activeMenuId === node.id ? 'bg-gold text-obsidian' : 'text-parchment-dim hover:bg-white/5 hover:text-parchment'}`}
                            title="更改类型"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>

                        {activeMenuId === node.id && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-obsidian-light border border-gold/20 rounded-sm shadow-2xl py-2 z-50 animate-fade-in flex flex-col max-h-80 overflow-y-auto custom-scrollbar">
                                <span className="px-3 py-1 text-[9px] font-bold text-parchment-dim uppercase tracking-widest font-mono">转换类型 / CHANGE TYPE</span>
                                <button onClick={() => { onUpdate(node.id, { type: 'paragraph', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Type className="w-3 h-3"/> 文本 (Paragraph)</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'h1', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Heading1 className="w-3 h-3"/> 一级标题</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'h2', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Heading2 className="w-3 h-3"/> 二级标题</button>
                                <div className="my-1 border-t border-white/5"></div>
                                <span className="px-3 py-1 text-[9px] font-bold text-parchment-dim uppercase tracking-widest font-mono">列表 / LISTS</span>
                                <button onClick={() => { onUpdate(node.id, { type: 'li', listStyle: 'bullet' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><List className="w-3 h-3"/> 无序列表</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'li', listStyle: 'number' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><ListOrdered className="w-3 h-3"/> 有序列表</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'li', listStyle: 'task', checked: false } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><CheckSquare className="w-3 h-3"/> 任务列表</button>
                                <div className="my-1 border-t border-white/5"></div>
                                <span className="px-3 py-1 text-[9px] font-bold text-parchment-dim uppercase tracking-widest font-mono">特殊格式 / SPECIAL</span>
                                <button onClick={() => { onUpdate(node.id, { type: 'callout', variant: 'info' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Terminal className="w-3 h-3"/> 系统提示 (Callout)</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'quote', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Quote className="w-3 h-3"/> 引用 (Quote)</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'code', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Code className="w-3 h-3"/> 代码 (Code)</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'hr', content: '' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Minus className="w-3 h-3"/> 分割线</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'image', src: '', alt: '' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><ImageIcon className="w-3 h-3"/> 图片</button>
                            </div>
                        )}
                    </div>
                    
                    <button onClick={() => onRemove(node.id)} className="p-1 rounded-sm hover:bg-red-900/20 text-parchment-dim hover:text-red-400 transition-colors"><X className="w-4 h-4"/></button>
                </div>
            </div>

            {['h1', 'h2', 'h3'].includes(node.type) && (
                <div className="relative mb-3 mt-1" style={{ marginLeft: `${(depth + 1) * 28}px` }}>
                    <div className="absolute left-[-14px] top-0 bottom-0 w-[1px] bg-white/5"></div>
                    <div className="flex flex-wrap items-center gap-1.5 pl-2 opacity-30 hover:opacity-100 transition-opacity duration-200">
                        <button onClick={() => onAddChild(node.id, 'paragraph')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all font-mono" title="普通文本"><Type className="w-3 h-3" /></button>
                        {node.type === 'h1' && <button onClick={() => onAddChild(node.id, 'h2')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="二级标题"><Heading2 className="w-3 h-3" /></button>}
                        {node.type === 'h2' && <button onClick={() => onAddChild(node.id, 'h3')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="三级标题"><Heading3 className="w-3 h-3" /></button>}
                        <div className="w-px h-3 bg-white/20 mx-1"></div>
                        <button onClick={() => onAddChild(node.id, 'li', { listStyle: 'bullet' })} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="无序列表"><List className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'li', { listStyle: 'number' })} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="有序列表"><ListOrdered className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'li', { listStyle: 'task', checked: false })} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="任务列表"><CheckSquare className="w-3 h-3" /></button>
                        <div className="w-px h-3 bg-white/20 mx-1"></div>
                        <button onClick={() => onAddChild(node.id, 'callout', { variant: 'info' })} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="系统提示"><Terminal className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'code')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="代码块"><Code className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'quote')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="引用"><Quote className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'image')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="图片"><ImageIcon className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'hr')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="分割线"><Minus className="w-3 h-3" /></button>
                    </div>
                </div>
            )}

            {node.children.length > 0 && (
                <div className="relative">
                    <div className="absolute top-0 bottom-0 w-[1px] bg-white/5" style={{ left: `${(depth + 1) * 28 - 14}px` }}></div>
                    <BlockTree 
                        nodes={node.children} 
                        depth={depth + 1} 
                        activeMenuId={activeMenuId}
                        onSetActiveMenuId={onSetActiveMenuId}
                        activeInsertMenuId={activeInsertMenuId}
                        onSetActiveInsertMenuId={onSetActiveInsertMenuId}
                        onUpdate={onUpdate}
                        onAddSibling={onAddSibling}
                        onAddChild={onAddChild}
                        onRemove={onRemove}
                        blockRefs={blockRefs}
                        onNavigate={onNavigate}
                        entries={entries}
                        onTriggerTermPicker={onTriggerTermPicker}
                    />
                </div>
            )}

            </div>
        );
      })}
    </>
  );
});

// Custom Renderer for Lore Terms and Redacted Text
const LoreTextRenderer: React.FC<{ content: string, terms?: Term[], entries?: Entry[] }> = ({ content, terms = [], entries = [] }) => {
    const parts = content.split(/(\{\{.*?\}\}|\|\|.*?\|\||%%.*?%%|::.*?::|\[\[.*?\]\]|\(\(.*?\)\))/g);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('[[') && part.endsWith(']]')) {
                    const rawText = part.slice(2, -2);
                    const termName = rawText.split('|')[0];
                    const term = terms.find(t => t.name.toLowerCase() === termName.toLowerCase());
                    const entry = entries.find(e => e.title.toLowerCase() === termName.toLowerCase() || e.id === term?.entryId);

                    return (
                        <span key={i} className="relative group/term inline-block">
                             <span className={`
                                px-1.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-help border
                                ${term && term.status !== 'pending' 
                                    ? (entry ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20')
                                    : 'bg-white/5 text-parchment-dim border-dashed border-parchment-dim/30 hover:bg-white/10'
                                }
                             `}>
                                 {termName}
                                 {!term && !entry && <span className="ml-1 text-[8px] opacity-50 align-top text-red-400">?</span>}
                             </span>

                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-obsidian-light border border-gold/20 rounded-sm shadow-xl opacity-0 group-hover/term:opacity-100 transition-opacity pointer-events-none z-50 text-left">
                                 <div className="flex justify-between items-center mb-1">
                                    <div className="font-serif font-bold text-parchment">{termName}</div>
                                    {term && <span className="text-[9px] font-mono border border-gold/20 text-gold px-1 rounded-sm">{term.type.split('/')[0]}</span>}
                                 </div>
                                 {term?.description ? (
                                     <p className="text-xs text-parchment-dim mb-2 leading-relaxed">{term.description}</p>
                                 ) : entry ? (
                                    <p className="text-xs text-parchment-dim mb-2 italic">已归档条目。点击查看详情。</p>
                                 ) : (
                                     <p className="text-xs text-parchment-dim/50 italic mb-2">未定义术语。暂无相关档案。</p>
                                 )}
                             </div>
                        </span>
                    );
                }
                if (part.startsWith('{{') && part.endsWith('}}')) {
                    const term = part.slice(2, -2);
                    return (
                        <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-sm bg-cyan-900/20 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-[0_0_5px_rgba(34,211,238,0.2)] select-none cursor-help hover:bg-cyan-900/40 transition-colors" title="术语 / Lore Term">
                            <Hash className="w-3 h-3 opacity-50" />
                            {term}
                        </span>
                    );
                }
                if (part.startsWith('||') && part.endsWith('||')) {
                    const hidden = part.slice(2, -2);
                    return (
                        <span key={i} className="relative group/redacted cursor-pointer mx-0.5 align-middle inline-block">
                             <span className="opacity-0 group-hover/redacted:opacity-100 transition-opacity bg-red-950/80 text-red-200 px-1 rounded-sm text-sm font-mono border border-red-900/50">
                                {hidden}
                             </span>
                             <span className="absolute inset-0 bg-parchment-dim/20 text-transparent flex items-center justify-center rounded-sm overflow-hidden group-hover/redacted:opacity-0 transition-opacity border border-white/10" style={{background: 'repeating-linear-gradient(45deg, #000, #000 5px, #222 5px, #222 10px)'}}>
                                <span className="text-[8px] text-white/30 font-mono font-bold tracking-widest select-none">TOP_SECRET</span>
                             </span>
                        </span>
                    );
                }
                if (part.startsWith('%%') && part.endsWith('%%')) {
                   const glitchText = part.slice(2, -2);
                   return <span key={i} className="effect-glitch mx-1" data-text={glitchText}>{glitchText}</span>;
                }
                if (part.startsWith('::') && part.endsWith('::')) {
                   const arcaneText = part.slice(2, -2);
                   return <span key={i} className="effect-arcane mx-1">{arcaneText}</span>;
                }
                if (part.startsWith('((') && part.endsWith('))')) {
                   const keyText = part.slice(2, -2);
                   return <span key={i} className="effect-terminal">{keyText}</span>;
                }

                return <ReactMarkdown key={i} components={{p: ({children}) => <>{children}</>}}>{part}</ReactMarkdown>;
            })}
        </>
    );
};

// Preview Components
const markdownPreviewComponents = (terms: Term[], entries: Entry[]) => ({
    p: ({node, children, ...props}: any) => <p className="font-sans leading-relaxed text-parchment-dim mb-3" {...props}>{children}</p>,
    a: ({node, ...props}: any) => <a className="text-gold hover:underline underline-offset-4 decoration-gold/30" target="_blank" rel="noreferrer" {...props} />,
    table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 border border-white/5 rounded-sm"><table className="min-w-full text-sm border-collapse" {...props} /></div>,
    thead: ({node, ...props}: any) => <thead className="bg-white/5 font-serif text-gold" {...props} />,
    th: ({node, ...props}: any) => <th className="px-4 py-2 text-left font-medium border-b border-r border-white/5 last:border-r-0" {...props} />,
    td: ({node, ...props}: any) => <td className="px-4 py-2 text-parchment-dim border-b border-r border-white/5 last:border-r-0" {...props} />,
    img: ({node, ...props}: any) => <img loading="lazy" className="rounded-sm max-h-80 object-contain my-4 bg-black/5 border border-white/5" {...props} />,
    input: ({node, ...props}: any) => <input type="checkbox" className="accent-gold mr-2" disabled {...props} />
});

const PreviewTree: React.FC<{ nodes: EditorBlockNode[], entries?: Entry[], terms?: Term[] }> = ({ nodes, entries, terms }) => {
  let listIndex = 0;
  return (
    <>
      {nodes.map(node => {
        let displayIndex = 0;
        if (node.type === 'li' && (node as any).listStyle === 'number') {
            listIndex++;
            displayIndex = listIndex;
        } else {
            listIndex = 0;
        }

        return (
          <div key={node.id} className="relative group/preview-block my-2">
            <div>
                {node.type === 'h1' && <div className="text-3xl font-serif font-medium text-gold mt-10 mb-6 border-b border-gold/10 pb-2 flex items-center gap-2">{node.content}</div>}
                {node.type === 'h2' && <div className="text-2xl font-serif text-parchment mt-8 mb-4">{node.content}</div>}
                {node.type === 'h3' && <div className="text-xl font-serif text-parchment/80 mt-6 mb-3 italic">{node.content}</div>}
                
                {node.type === 'paragraph' && (
                    <div className="text-parchment-dim leading-relaxed mb-3 whitespace-pre-wrap font-sans">
                        <LoreTextRenderer content={node.content} terms={terms} entries={entries} />
                    </div>
                )}
                
                {node.type === 'callout' && (
                    <div className={`my-6 border-l-2 p-4 rounded-r-sm ${(node as CalloutBlock).variant === 'danger' ? 'bg-red-950/20 border-red-500' : (node as CalloutBlock).variant === 'warning' ? 'bg-amber-950/20 border-amber-500' : (node as CalloutBlock).variant === 'success' ? 'bg-emerald-950/20 border-emerald-500' : 'bg-blue-950/20 border-blue-500'}`}>
                        <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold uppercase tracking-widest opacity-80">
                            { (node as CalloutBlock).variant === 'danger' && <><ShieldAlert className="w-4 h-4 text-red-500" /> SYSTEM_ALERT // CRITICAL</> }
                            { (node as CalloutBlock).variant === 'warning' && <><AlertTriangle className="w-4 h-4 text-amber-500" /> SYSTEM_WARNING</> }
                            { (node as CalloutBlock).variant === 'info' && <><Terminal className="w-4 h-4 text-blue-500" /> SYSTEM_LOG</> }
                            { (node as CalloutBlock).variant === 'success' && <><Activity className="w-4 h-4 text-emerald-500" /> SYSTEM_STATUS_OK</> }
                        </div>
                        <div className="text-sm font-mono opacity-90 text-parchment">
                            <LoreTextRenderer content={node.content} terms={terms} entries={entries} />
                        </div>
                    </div>
                )}

                {node.type === 'quote' && (
                    <blockquote className="border-l-2 border-gold/40 pl-6 py-3 my-6 text-gold/80 italic bg-gold/5 rounded-r font-serif">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownPreviewComponents(terms || [], entries || [])}>
                            {node.content}
                        </ReactMarkdown>
                    </blockquote>
                )}
                
                {node.type === 'code' && <pre className="bg-obsidian-light p-4 rounded-sm overflow-x-auto mb-4 border border-white/10 shadow-inner"><code className="text-gold/90 font-mono text-xs">{node.content}</code></pre>}
                {node.type === 'hr' && <hr className="my-8 border-gold/10" />}
                {node.type === 'image' && (
                    <div className="my-6">
                        {node.src ? (
                            <img src={node.src} alt={node.alt || 'image'} className="rounded-sm max-h-96 object-contain bg-black/5 border border-white/5" />
                        ) : (
                            <div className="h-24 bg-white/5 rounded-sm border border-dashed border-white/10 flex items-center justify-center text-parchment-dim/40 text-xs font-mono tracking-widest uppercase">图片占位符</div>
                        )}
                        {node.alt && <p className="text-center text-xs text-parchment-dim/50 mt-2 font-serif italic">{node.alt}</p>}
                    </div>
                )}
                {node.type === 'reference-entry' && entries && (
                     <div className="my-6 max-w-sm">
                         {(node as ReferenceEntryBlock).note && <div className="text-[10px] font-mono text-parchment-dim/60 mb-1 ml-1">引用备注: {(node as ReferenceEntryBlock).note}</div>}
                         {(() => {
                             const referencedEntry = entries.find(e => e.id === (node as ReferenceEntryBlock).entryId);
                             if (!referencedEntry) return <div className="text-xs text-red-500 border border-dashed border-red-500 p-2">引用档案丢失</div>;
                             return <ReferenceCard entry={referencedEntry} isPreview={true} />;
                         })()}
                     </div>
                )}
                {node.type === 'li' && (
                    <div className="flex gap-3 mb-1.5">
                        <div className="shrink-0 mt-1.5">
                            {(node as any).listStyle === 'bullet' && <div className="w-1.5 h-1.5 rounded-full bg-parchment-dim/50"></div>}
                            {(node as any).listStyle === 'number' && <span className="text-gold/70 text-sm font-mono">{displayIndex}.</span>} 
                            {(node as any).listStyle === 'task' && (
                                <div className={`w-3.5 h-3.5 rounded-sm border ${(node as any).checked ? 'bg-gold border-gold' : 'border-white/20'} flex items-center justify-center`}>
                                    {(node as any).checked && <CheckSquare className="w-3 h-3 text-obsidian" />}
                                </div>
                            )}
                        </div>
                        <div className={`text-parchment-dim flex-1 font-sans ${(node as any).checked ? 'line-through opacity-40' : ''}`}>
                            <LoreTextRenderer content={node.content} terms={terms} entries={entries} />
                        </div>
                    </div>
                )}
            </div>
            {node.children.length > 0 && (
            <div className="ml-4 border-l border-white/5 pl-6">
                <PreviewTree nodes={node.children} entries={entries} terms={terms} />
            </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// --- MAIN EDITOR VIEW (REFACTORED) ---

interface EditorViewProps {
  // New props for workspace integration
  initialTitle?: string;
  initialCategory?: Category;
  initialTermName?: string;
  existingEntry?: Entry;
  
  onTitleChange: (title: string) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaveInternal: (entry: Omit<Entry, 'id' | 'createdAt' | 'likes' | 'author'>) => void;
  
  // Existing props passed down
  isLightTheme: boolean;
  onToggleTheme: () => void;
  entries?: Entry[]; 
  terms?: Term[];
  onAddTerm?: (term: Term) => void;
  onNavigateToEditor?: (category?: Category, title?: string) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({ 
    initialTitle = '', initialCategory, initialTermName, existingEntry,
    onTitleChange, onDirtyChange, onSaveInternal,
    isLightTheme, onToggleTheme, entries = [], terms = [], onAddTerm, onNavigateToEditor 
}) => {
  // Initialize state based on existingEntry if available, otherwise defaults
  const [title, setTitle] = useState(existingEntry ? existingEntry.title : (initialTitle || initialTermName || ''));
  const [category, setCategory] = useState<Category>(existingEntry ? existingEntry.category : (initialCategory || Category.CREATURE));
  const [tags, setTags] = useState(existingEntry ? existingEntry.tags.join(', ') : '');
  
  // Hidden stats
  const [realism, setRealism] = useState(existingEntry ? existingEntry.realism : 3);
  const [risk, setRisk] = useState(existingEntry ? existingEntry.risk : 1);
  const [anomalous, setAnomalous] = useState(existingEntry ? existingEntry.anomalous : 1);

  // Initialize Blocks
  // This is simplified: in a real app we'd parse the markdown back to blocks, 
  // but for this demo we start fresh or with a simple H1 if new.
  // Ideally existingEntry.content would be parsed. For now, we just put it in a paragraph if it exists.
  const initialBlocks: EditorBlockNode[] = useMemo(() => {
      if (existingEntry) {
          // Rudimentary parser to avoid losing data in this demo
          // In production, a proper Markdown-to-Block parser is needed.
          return [{ 
              id: 'root-imported', 
              type: 'paragraph', 
              content: existingEntry.content, 
              children: [] 
          } as any];
      }
      return [{ id: 'root-1', type: 'h1', content: '', children: [] } as any];
  }, [existingEntry]);

  const { 
    rootBlocks, updateNode, addSibling, addChild, removeNode, generateMarkdownContent,
  } = useOutlineTree(initialBlocks);
  
  // Track dirty state
  useEffect(() => {
      // Simple dirty check: if blocks changed from initial, it's dirty. 
      // For this demo, we assume any change sets dirty to true.
      if (rootBlocks !== initialBlocks || title !== (existingEntry?.title || initialTitle)) {
          onDirtyChange(true);
      }
  }, [rootBlocks, title, onDirtyChange, initialBlocks, existingEntry, initialTitle]);

  // Sync Title change to tab
  useEffect(() => {
      onTitleChange(title);
  }, [title, onTitleChange]);

  const [activeMenuBlockId, setActiveMenuBlockId] = useState<string | null>(null);
  const [activeInsertMenuId, setActiveInsertMenuId] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const [focusId, setFocusId] = useState<string | null>(null);

  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3 });
  const [insertionTarget, setInsertionTarget] = useState<{ id: string, start: number, end: number } | null>(null);

  const [showTermPicker, setShowTermPicker] = useState(false);
  const [termSearchQuery, setTermSearchQuery] = useState('');
  const [termInsertTargetId, setTermInsertTargetId] = useState<string | null>(null);

  const [showCreateTerm, setShowCreateTerm] = useState(false);
  const [newTermName, setNewTermName] = useState('');
  const [newTermDesc, setNewTermDesc] = useState('');
  const [newTermType, setNewTermType] = useState<TermType>(TermType.CONCEPT);
  const [pendingTermStatus, setPendingTermStatus] = useState<TermStatus>('pending');

  const [showReferencePicker, setShowReferencePicker] = useState(false);
  const [referenceSearchQuery, setReferenceSearchQuery] = useState('');

  // Focus management
  useEffect(() => {
    if (focusId && blockRefs.current[focusId]) {
        setTimeout(() => {
            blockRefs.current[focusId]?.focus();
        }, 10);
        setFocusId(null);
    }
  }, [focusId, rootBlocks]);

  // Handlers (Copy-pasted logic from original EditorView, but stripped of navigation stuff)
  const handleAddSibling = useCallback((targetId: string, newNode: EditorBlockNode, direction: 'before' | 'after' = 'after') => {
      addSibling(targetId, newNode, direction);
      setFocusId(newNode.id);
  }, [addSibling]);

  const handleAddChild = useCallback((parentId: string, type: BlockType, extra?: Partial<EditorBlockNode>) => {
      const newId = generateId();
      addChild(parentId, type, { ...extra, id: newId } as any);
      setFocusId(newId);
  }, [addChild]);

  const handleFormat = (formatType: 'bold' | 'italic' | 'link' | 'code' | 'term' | 'redacted' | 'glitch' | 'arcane' | 'terminal') => {
    const activeEl = document.activeElement as HTMLTextAreaElement;
    if (!activeEl || activeEl.tagName !== 'TEXTAREA') return;

    const start = activeEl.selectionStart;
    const end = activeEl.selectionEnd;
    const text = activeEl.value;
    const selected = text.substring(start, end);

    if (formatType === 'term') {
        if (activeEl.dataset.blockId) {
             setTermInsertTargetId(activeEl.dataset.blockId);
             setTermSearchQuery(selected);
             setNewTermName(selected);
             setShowTermPicker(true);
        }
        return;
    }
    if (formatType === 'link') {
        const url = prompt("链接地址 URL:", "http://");
        if (url) {
            const label = selected || "链接";
            const newText = text.substring(0, start) + `[${label}](${url})` + text.substring(end);
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(activeEl, newText);
                activeEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        return;
    }
    const isWrapped = (wrapperStart: string, wrapperEnd: string) => {
        const before = text.substring(0, start);
        const after = text.substring(end);
        return before.endsWith(wrapperStart) && after.startsWith(wrapperEnd);
    };
    let wrapperStart = '';
    let wrapperEnd = '';
    if (formatType === 'bold') { wrapperStart = '**'; wrapperEnd = '**'; }
    else if (formatType === 'italic') { wrapperStart = '*'; wrapperEnd = '*'; }
    else if (formatType === 'code') { wrapperStart = '`'; wrapperEnd = '`'; }
    else if (formatType === 'redacted') { wrapperStart = '||'; wrapperEnd = '||'; }
    else if (formatType === 'glitch') { wrapperStart = '%%'; wrapperEnd = '%%'; }
    else if (formatType === 'arcane') { wrapperStart = '::'; wrapperEnd = '::'; }
    else if (formatType === 'terminal') { wrapperStart = '(('; wrapperEnd = '))'; }

    let newText = text;
    let newStart = start;
    let newEnd = end;
    if (isWrapped(wrapperStart, wrapperEnd)) {
        newText = text.substring(0, start - wrapperStart.length) + selected + text.substring(end + wrapperEnd.length);
        newStart = start - wrapperStart.length;
        newEnd = end - wrapperEnd.length;
    } else {
        newText = newText.substring(0, newStart) + wrapperStart + selected + wrapperEnd + newText.substring(newEnd);
        newStart += wrapperStart.length;
        newEnd += wrapperStart.length;
    }
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(activeEl, newText);
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => activeEl.setSelectionRange(newStart, newEnd), 0);
    }
  };

  const handleOpenTableDialog = () => {
    const activeEl = document.activeElement as HTMLTextAreaElement;
    if (activeEl && activeEl.tagName === 'TEXTAREA' && activeEl.dataset.blockId) {
        setInsertionTarget({
            id: activeEl.dataset.blockId,
            start: activeEl.selectionStart,
            end: activeEl.selectionEnd
        });
        setShowTableDialog(true);
    } else {
        alert("请先选择一个文本块。");
    }
  };
  const handleOpenReferencePicker = () => setShowReferencePicker(true);

  const handleInsertReferenceEntry = (entryId: string) => {
      let targetId = rootBlocks.length > 0 ? rootBlocks[rootBlocks.length - 1].id : '';
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && activeEl.dataset.blockId) targetId = activeEl.dataset.blockId;
      const targetNode = findNodeRecursive(rootBlocks, targetId);
      if (targetNode && ['h1', 'h2', 'h3'].includes(targetNode.type)) {
           handleAddChild(targetId, 'reference-entry', { entryId, children: [] });
      } else {
           const newRefBlock: ReferenceEntryBlock = {
              id: generateId(),
              type: 'reference-entry',
              entryId: entryId,
              children: []
          };
          handleAddSibling(targetId, newRefBlock as any, 'after');
      }
      setShowReferencePicker(false);
  };

  const handleTriggerTermPicker = (blockId: string) => {
      setTermInsertTargetId(blockId);
      setTermSearchQuery('');
      setShowTermPicker(true);
  };

  const insertTermAtCursor = (termName: string, id: string) => {
      const el = blockRefs.current[id] as HTMLTextAreaElement;
      if (!el) return;
      const text = el.value;
      const cursor = el.selectionStart;
      let start = cursor;
      let end = cursor;
      const precedingText = text.slice(0, cursor);
      if (precedingText.endsWith('[[')) {
          start = cursor - 2;
      }
      const insertion = `[[${termName}]]`;
      const newText = text.substring(0, start) + insertion + text.substring(end);
      updateNode(id, { content: newText });
      setTimeout(() => {
          if (blockRefs.current[id]) {
            blockRefs.current[id]?.focus();
            const newPos = start + insertion.length;
            (blockRefs.current[id] as HTMLTextAreaElement).setSelectionRange(newPos, newPos);
          }
      }, 50);
      setShowTermPicker(false);
      setShowCreateTerm(false);
      setTermInsertTargetId(null);
  };

  const handleQuickAddTerm = (termName: string) => openTermModal(termName, 'pending');

  const openTermModal = (termName: string, initialStatus: TermStatus) => {
      const existingTerm = terms.find(t => t.name.toLowerCase() === termName.toLowerCase());
      if (existingTerm) {
          setNewTermName(existingTerm.name);
          setNewTermDesc(existingTerm.description);
          setNewTermType(existingTerm.type);
          setPendingTermStatus(existingTerm.status); 
      } else {
          setNewTermName(termName);
          setNewTermDesc(''); 
          setNewTermType(TermType.CONCEPT);
          setPendingTermStatus(initialStatus); 
      }
      setShowTermPicker(false);
      setShowCreateTerm(true);
  };

  const createAndInsertTerm = () => {
      if (!newTermName) return;
      const newTerm: Term = {
          id: generateId(),
          name: newTermName,
          type: newTermType,
          description: newTermDesc,
          status: pendingTermStatus 
      };
      if (onAddTerm) onAddTerm(newTerm);
      if (termInsertTargetId) insertTermAtCursor(newTerm.name, termInsertTargetId);
      else setShowCreateTerm(false);
  };

  const filteredTerms = useMemo(() => {
      if (!termSearchQuery) return terms.slice(0, 10); 
      return terms.filter(t => 
          t.name.toLowerCase().includes(termSearchQuery.toLowerCase()) || 
          t.description?.toLowerCase().includes(termSearchQuery.toLowerCase())
      );
  }, [terms, termSearchQuery]);

  const filteredReferenceEntries = useMemo(() => {
      if (!referenceSearchQuery) return entries.slice(0, 8);
      return entries.filter(e => 
          e.title.toLowerCase().includes(referenceSearchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(referenceSearchQuery.toLowerCase())
      ).slice(0, 8);
  }, [entries, referenceSearchQuery]);

  const findNodeRecursive = (nodes: EditorBlockNode[], id: string): EditorBlockNode | null => {
      for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children.length > 0) {
              const found = findNodeRecursive(node.children, id);
              if (found) return found;
          }
      }
      return null;
  };

  const insertTable = () => {
    if (!insertionTarget) return;
    const { id, start, end } = insertionTarget;
    const node = findNodeRecursive(rootBlocks, id);
    if (!node) {
        setShowTableDialog(false);
        return;
    }
    const { rows, cols } = tableConfig;
    let tableMD = '\n|';
    for(let c=0; c<cols; c++) tableMD += ` 列 ${c+1} |`;
    tableMD += '\n|';
    for(let c=0; c<cols; c++) tableMD += ` --- |`;
    tableMD += '\n';
    for(let r=0; r<rows; r++) {
        tableMD += '|';
        for(let c=0; c<cols; c++) tableMD += `  |`;
        tableMD += '\n';
    }
    tableMD += '\n';
    const text = node.content || '';
    const newText = text.substring(0, start) + tableMD + text.substring(end);
    updateNode(id, { content: newText });
    setShowTableDialog(false);
    setInsertionTarget(null);
    setTimeout(() => {
        const el = blockRefs.current[id];
        if (el) {
            el.focus();
            const newCursor = start + tableMD.length;
            (el as HTMLTextAreaElement).setSelectionRange(newCursor, newCursor);
        }
    }, 50);
  };

  const flattenBlocks = useCallback((nodes: EditorBlockNode[]): string[] => {
      let ids: string[] = [];
      nodes.forEach(node => {
          ids.push(node.id);
          if (node.children.length > 0) ids = ids.concat(flattenBlocks(node.children));
      });
      return ids;
  }, []);

  const handleNavigate = useCallback((currentId: string, direction: 'up' | 'down') => {
      const allIds = flattenBlocks(rootBlocks);
      const currentIndex = allIds.indexOf(currentId);
      if (currentIndex === -1) return;
      let targetId: string | null = null;
      if (direction === 'up' && currentIndex > 0) targetId = allIds[currentIndex - 1];
      else if (direction === 'down' && currentIndex < allIds.length - 1) targetId = allIds[currentIndex + 1];
      if (targetId) setFocusId(targetId);
  }, [rootBlocks, flattenBlocks]);

  const convertTreeToMarkdown = (): string => {
    return generateMarkdownContent(); // Keep it clean for now, no frontmatter needed for internal save
  };

  const handlePublish = () => {
    if (!title.trim()) {
      alert("请输入档案标题。");
      return;
    }
    const content = convertTreeToMarkdown();
    onSaveInternal({
        title,
        category,
        content,
        tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        realism,
        risk,
        anomalous
    });
  };

  useEffect(() => {
    const handleClickOutside = () => {
        setActiveMenuBlockId(null);
        setActiveInsertMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-obsidian text-parchment relative overflow-hidden transition-colors duration-500">
      
      {/* Editor Toolbar (Modified to remove navigation/logo) */}
      <div className="sticky top-0 z-40 bg-obsidian/95 backdrop-blur-sm border-b border-gold/10 shrink-0">
        <div className="w-full px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white/[0.02] rounded-sm p-1 border border-white/5">
              <PenTool className="w-3 h-3 text-gold/50 mx-2" />
              <div className="w-px h-3 bg-white/10 mx-1"></div>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('bold')} className="p-1.5 hover:bg-white/5 rounded-sm text-parchment-dim hover:text-parchment" title="加粗"><Bold className="w-3.5 h-3.5"/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('italic')} className="p-1.5 hover:bg-white/5 rounded-sm text-parchment-dim hover:text-parchment" title="斜体"><Italic className="w-3.5 h-3.5"/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('code')} className="p-1.5 hover:bg-white/5 rounded-sm text-parchment-dim hover:text-parchment" title="代码"><Code className="w-3.5 h-3.5"/></button>
              <div className="w-px h-3 bg-white/10 mx-1"></div>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('term')} className="p-1.5 hover:bg-white/5 rounded-sm text-gold/80 hover:text-gold flex items-center gap-1 w-20 justify-center font-bold bg-gold/5 border border-gold/10" title="插入术语 [[...]]">
                  <BookOpen className="w-3.5 h-3.5"/>
                  <span className="text-[10px]">术语</span>
              </button>
              <button onMouseDown={e => e.preventDefault()} onClick={handleOpenReferencePicker} className="p-1.5 hover:bg-white/5 rounded-sm text-blue-300/80 hover:text-blue-300" title="插入关联档案"><Link2 className="w-3.5 h-3.5"/></button>
              <div className="w-px h-3 bg-white/10 mx-1"></div>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('redacted')} className="p-1.5 hover:bg-white/5 rounded-sm text-red-400/70 hover:text-red-400" title="绝密遮盖 ||...||"><ScanEye className="w-3.5 h-3.5"/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('glitch')} className="p-1.5 hover:bg-white/5 rounded-sm text-purple-400/70 hover:text-purple-400" title="数据损坏 %%...%%"><Zap className="w-3.5 h-3.5"/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('arcane')} className="p-1.5 hover:bg-white/5 rounded-sm text-indigo-300/70 hover:text-indigo-300" title="奥术真言 ::...::"><Command className="w-3.5 h-3.5"/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('terminal')} className="p-1.5 hover:bg-white/5 rounded-sm text-green-400/70 hover:text-green-400" title="终端指令 ((...))"><Keyboard className="w-3.5 h-3.5"/></button>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={onToggleTheme}
               className="p-2 rounded-sm text-parchment-dim hover:text-gold hover:bg-white/5 transition-colors border border-transparent hover:border-gold/10 mr-2"
               title={isLightTheme ? "切换到暗色模式" : "切换到亮色模式"}
             >
               {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>
            <button onClick={() => alert("草稿已保存到本地。")} className="hidden md:flex items-center gap-2 bg-transparent border border-white/10 hover:border-gold/30 text-parchment-dim hover:text-gold text-xs font-medium px-4 py-1.5 rounded-sm transition-all"><Save className="w-3.5 h-3.5" /><span>存草稿</span></button>
            <button onClick={handlePublish} className="flex items-center gap-2 bg-gold hover:bg-[#c5a676] text-obsidian font-bold px-5 py-1.5 rounded-sm transition-transform active:scale-95 text-xs uppercase tracking-wider shadow-lg"><Upload className="w-3.5 h-3.5" /><span>保存</span></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* LEFT: Tree Editor */}
        <div className={`flex-1 w-1/2 flex flex-col ${isLightTheme ? 'bg-[#f7f5ef]' : 'bg-[#0c0c0e]'} border-r border-gold/10`}>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                <div className="max-w-3xl mx-auto animate-slide-up">
                    <div className="bg-white/[0.01] border-b border-white/5 pb-8 mb-8">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="档案标题..." 
                            className={`w-full bg-transparent text-4xl font-serif font-bold outline-none mb-6 placeholder-opacity-30 ${isLightTheme ? 'text-obsidian placeholder-obsidian' : 'text-parchment placeholder-parchment-dim'}`}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono ${isLightTheme ? 'text-stone-500' : 'text-gold/60'}`}>归档分类 / Classification</label>
                                <div className="relative">
                                    <select 
                                        value={category} 
                                        onChange={e => setCategory(e.target.value as Category)} 
                                        className={`w-full border rounded-sm px-3 py-2 text-sm outline-none cursor-pointer transition-colors font-serif appearance-none ${
                                            isLightTheme 
                                                ? 'bg-white border-stone-300 text-stone-800 focus:border-amber-500 shadow-sm' 
                                                : 'bg-charcoal/40 border-white/10 text-parchment focus:border-gold/50'
                                        }`}
                                        style={{ colorScheme: isLightTheme ? 'light' : 'dark' }}
                                    >
                                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono ${isLightTheme ? 'text-stone-500' : 'text-gold/60'}`}>索引标签 / Tags</label>
                                <input 
                                    type="text" 
                                    value={tags} 
                                    onChange={e => setTags(e.target.value)} 
                                    placeholder="逗号分隔..." 
                                    className={`w-full border rounded-sm px-3 py-2 text-sm outline-none font-mono transition-colors ${
                                        isLightTheme 
                                            ? 'bg-white border-stone-300 text-stone-800 focus:border-amber-500 placeholder-stone-400 shadow-sm' 
                                            : 'bg-charcoal/40 border-white/10 text-parchment focus:border-gold/50 placeholder:text-parchment-dim/20'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 relative min-h-[400px]">
                        <div className="absolute left-[13px] top-0 bottom-0 w-[1px] bg-white/5 z-0 pointer-events-none"></div>
                        <BlockTree 
                            nodes={rootBlocks}
                            depth={0}
                            activeMenuId={activeMenuBlockId}
                            onSetActiveMenuId={setActiveMenuBlockId}
                            activeInsertMenuId={activeInsertMenuId}
                            onSetActiveInsertMenuId={setActiveInsertMenuId}
                            onUpdate={updateNode}
                            onAddSibling={handleAddSibling}
                            onAddChild={handleAddChild}
                            onRemove={removeNode}
                            blockRefs={blockRefs}
                            onNavigate={handleNavigate}
                            entries={entries}
                            onTriggerTermPicker={handleTriggerTermPicker}
                        />
                        <button onClick={() => rootBlocks.length > 0 && handleAddSibling(rootBlocks[rootBlocks.length-1].id, { id: generateId(), type: 'h1', content: '', children: [] } as any)} className="w-full py-4 mt-8 border border-dashed border-white/5 rounded-sm text-parchment-dim/40 hover:text-gold hover:border-gold/30 flex items-center justify-center gap-2 transition-all group z-10 relative bg-white/[0.01]">
                            <Plus className="w-4 h-4" /> 新增章节
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: Preview */}
        <div className={`flex-1 w-1/2 overflow-y-auto custom-scrollbar p-8 md:p-12 ${isLightTheme ? 'bg-[#f0ece3]' : 'bg-[#1a1b20]'}`}>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-8 opacity-50 select-none">
                    <Eye className="w-4 h-4 text-gold" />
                    <span className="text-xs font-mono uppercase tracking-widest text-parchment-dim">Live Preview Protocol</span>
                </div>
                <div className="animate-fade-in">
                    <div className="mb-6 pb-6 border-b border-gold/10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-2 py-1 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest border border-gold/20 rounded-sm font-mono">{category}</span>
                            <span className="text-xs text-parchment-dim/40 font-mono">{new Date().toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-4xl font-serif text-parchment mb-4">{title || '未命名档案'}</h1>
                        <div className="flex flex-wrap gap-2">
                            {tags.split(/[,，]/).filter(Boolean).map(tag => (
                                <span key={tag} className="text-xs text-parchment-dim/60 bg-white/5 px-2 py-1 rounded-sm font-mono">#{tag.trim()}</span>
                            ))}
                        </div>
                    </div>
                    
                    <PreviewTree nodes={rootBlocks} entries={entries} terms={terms} />
                    
                    <div className="mt-20 pt-8 border-t border-gold/10 text-center">
                        <div className="inline-flex items-center gap-2 text-[10px] text-parchment-dim/30 font-mono border border-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                            <Activity className="w-3 h-3" /> End of Record
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- MODALS (Table, Term, Ref) --- */}
      {showTableDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-obsidian border border-gold/20 rounded-sm p-6 w-full max-w-sm shadow-2xl animate-slide-up">
                  <h3 className="text-lg font-serif text-parchment mb-4">插入表格</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="block text-xs font-mono text-parchment-dim mb-1">行数</label>
                          <input type="number" min="1" max="20" value={tableConfig.rows} onChange={e => setTableConfig({...tableConfig, rows: parseInt(e.target.value) || 1})} className="w-full bg-white/5 border border-white/10 rounded-sm px-2 py-1 text-parchment" />
                      </div>
                      <div>
                          <label className="block text-xs font-mono text-parchment-dim mb-1">列数</label>
                          <input type="number" min="1" max="10" value={tableConfig.cols} onChange={e => setTableConfig({...tableConfig, cols: parseInt(e.target.value) || 1})} className="w-full bg-white/5 border border-white/10 rounded-sm px-2 py-1 text-parchment" />
                      </div>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowTableDialog(false)} className="px-3 py-1.5 text-xs text-parchment-dim hover:text-parchment">取消</button>
                      <button onClick={insertTable} className="px-3 py-1.5 bg-gold text-obsidian text-xs font-bold rounded-sm">确认插入</button>
                  </div>
              </div>
          </div>
      )}

      {showTermPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-obsidian border border-gold/20 rounded-sm w-full max-w-md shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">
                 <div className="p-4 border-b border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-gold">
                         <BookOpen className="w-4 h-4" />
                         <span className="font-serif font-bold">搜索或创建术语...</span>
                     </div>
                     <button onClick={() => { setShowTermPicker(false); setTermInsertTargetId(null); }}><X className="w-4 h-4 text-parchment-dim hover:text-parchment"/></button>
                 </div>
                 <div className="p-4 border-b border-white/5">
                     <input 
                        autoFocus
                        value={termSearchQuery}
                        onChange={e => setTermSearchQuery(e.target.value)}
                        placeholder="输入术语名称..."
                        className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-parchment outline-none focus:border-gold/30"
                     />
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                     <button onClick={() => handleQuickAddTerm(termSearchQuery)} className="w-full text-left p-2 rounded-sm hover:bg-gold/10 flex items-center gap-2 group border border-dashed border-white/10 hover:border-gold/30 mb-2">
                        <Plus className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                        <span className="text-sm text-parchment-dim group-hover:text-gold italic">创建新术语: "{termSearchQuery}"</span>
                     </button>
                     {filteredTerms.map(term => (
                         <button 
                            key={term.id}
                            onClick={() => { if (termInsertTargetId) insertTermAtCursor(term.name, termInsertTargetId); }}
                            className="w-full text-left p-3 rounded-sm hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors group"
                         >
                             <div className="flex justify-between mb-1">
                                 <span className="text-parchment font-bold group-hover:text-gold transition-colors">{term.name}</span>
                                 <span className="text-[9px] font-mono border border-white/10 px-1 rounded-sm text-parchment-dim">{term.type.split('/')[0]}</span>
                             </div>
                             <div className="text-xs text-parchment-dim/50 truncate">{term.description}</div>
                         </button>
                     ))}
                 </div>
             </div>
          </div>
      )}

      {showCreateTerm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
             <div className="bg-obsidian border border-gold/30 rounded-sm w-full max-w-md shadow-2xl animate-slide-up">
                 <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                     <h3 className="font-serif font-bold text-parchment flex items-center gap-2">
                        <Plus className="w-4 h-4 text-gold" /> 
                        {terms.some(t => t.name.toLowerCase() === newTermName.toLowerCase()) ? "编辑术语" : "新建术语"}
                     </h3>
                     {termInsertTargetId && (
                         <button onClick={() => { setShowCreateTerm(false); setShowTermPicker(true); }} className="text-xs text-parchment-dim hover:text-parchment mr-auto ml-4 underline">返回搜索</button>
                     )}
                 </div>
                 <div className="p-6 space-y-4">
                     <div>
                         <label className="block text-[10px] font-bold text-parchment-dim uppercase tracking-widest mb-2 font-mono">术语名称</label>
                         <input value={newTermName} onChange={e => setNewTermName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-parchment focus:border-gold/50 outline-none font-bold" />
                     </div>
                     <div>
                         <label className="block text-[10px] font-bold text-parchment-dim uppercase tracking-widest mb-2 font-mono">术语类型</label>
                         <div className="grid grid-cols-2 gap-2">
                             {Object.values(TermType).map(t => (
                                 <button key={t} onClick={() => setNewTermType(t)} className={`px-2 py-1.5 text-xs border rounded-sm transition-all text-left ${newTermType === t ? 'bg-gold/10 border-gold text-gold' : 'border-white/10 text-parchment-dim hover:bg-white/5'}`}>
                                     {t.split('/')[0]}
                                 </button>
                             ))}
                         </div>
                     </div>
                     <div>
                         <label className="block text-[10px] font-bold text-parchment-dim uppercase tracking-widest mb-2 font-mono">简短释义 (Tooltip 内容)</label>
                         <textarea value={newTermDesc} onChange={e => setNewTermDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-parchment focus:border-gold/50 outline-none h-24 resize-none text-sm" placeholder="一句话描述该术语的核心概念..." />
                     </div>
                 </div>
                 <div className="p-4 border-t border-white/5 flex justify-end gap-2 bg-white/[0.02]">
                     <button onClick={() => setShowCreateTerm(false)} className="px-4 py-2 text-xs text-parchment-dim hover:text-parchment">取消</button>
                     <button onClick={createAndInsertTerm} className="px-6 py-2 bg-gold text-obsidian font-bold rounded-sm text-xs hover:bg-[#c5a676] transition-colors shadow-lg">
                        {termInsertTargetId ? "创建并插入" : "保存术语"}
                     </button>
                 </div>
             </div>
          </div>
      )}

      {showReferencePicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-obsidian border border-blue-400/30 rounded-sm w-full max-w-lg shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">
                 <div className="p-4 border-b border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-blue-300">
                         <Link2 className="w-4 h-4" />
                         <span className="font-serif font-bold">关联已有档案...</span>
                     </div>
                     <button onClick={() => setShowReferencePicker(false)}><X className="w-4 h-4 text-parchment-dim hover:text-parchment"/></button>
                 </div>
                 <div className="p-4 border-b border-white/5">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-parchment-dim" />
                        <input autoFocus value={referenceSearchQuery} onChange={e => setReferenceSearchQuery(e.target.value)} placeholder="搜索档案库..." className="w-full bg-white/5 border border-white/10 rounded-sm pl-9 pr-3 py-2 text-parchment outline-none focus:border-blue-400/50" />
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                     {filteredReferenceEntries.length === 0 ? (
                         <div className="p-8 text-center text-parchment-dim/40 text-sm italic">未找到相关档案。</div>
                     ) : (
                         filteredReferenceEntries.map(entry => (
                             <div key={entry.id} onClick={() => handleInsertReferenceEntry(entry.id)} className="w-full text-left p-0 rounded-sm hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors group cursor-pointer">
                                 <ReferenceCard entry={entry} isPreview={true} />
                             </div>
                         ))
                     )}
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};
