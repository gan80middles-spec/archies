

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Entry, Category, EditorBlockNode, BlockType, REALISM_DESCRIPTIONS, RISK_DESCRIPTIONS, ANOMALOUS_DESCRIPTIONS } from '../types';
import { 
  Save, Plus, X, Type, Heading1, Heading2, Heading3, Quote, Code, ArrowLeft, Eye, Upload, Image as ImageIcon, ListPlus,
  List, ListOrdered, CheckSquare, Minus, Bold, Italic, Link as LinkIcon, Table, FileText, PenTool, AlertTriangle, Activity, Brain
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useOutlineTree, createSiblingNode, generateId } from '../hooks/useOutlineTree';

// --- CONFIG & UTILS ---

const getChildBlockType = (parentType: BlockType): BlockType => {
  switch (parentType) {
    case 'h1': return 'h2';
    case 'h2': return 'h3';
    case 'h3': return 'paragraph';
    case 'li': return 'li'; 
    default: return 'paragraph';
  }
};

interface BlockRenderConfig {
    prefix?: (node: EditorBlockNode, index: number, onUpdate: (id: string, u: Partial<EditorBlockNode>) => void) => React.ReactNode;
    input: (
        node: EditorBlockNode, 
        commonProps: any, 
        onUpdate: (id: string, u: Partial<EditorBlockNode>) => void
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
        input: (node, props) => <textarea {...props} placeholder="撰写档案内容..." className={`${props.className} text-base text-parchment-dim resize-none overflow-hidden leading-relaxed font-sans placeholder:text-parchment/5`} rows={calculateRows(node.content)} />
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
    }
};

// --- COMPONENTS ---

interface BlockTreeProps {
  nodes: EditorBlockNode[];
  depth: number;
  activeMenuId: string | null;
  onSetActiveMenuId: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<EditorBlockNode>) => void;
  onAddSibling: (targetId: string, newNode: EditorBlockNode) => void;
  onAddChild: (parentId: string, type: BlockType, extra?: Partial<EditorBlockNode>) => void;
  onRemove: (id: string) => void;
  blockRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onNavigate: (id: string, direction: 'up' | 'down') => void;
}

const BlockTree: React.FC<BlockTreeProps> = React.memo(({ 
  nodes, depth, activeMenuId, onSetActiveMenuId, onUpdate, onAddSibling, onAddChild, onRemove, blockRefs, onNavigate
}) => {
  
  const handleKeyDown = (e: React.KeyboardEvent, node: EditorBlockNode) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const newNode = createSiblingNode(node);
        onAddSibling(node.id, newNode);
    }
    if (e.key === 'Backspace' && (!node.content || node.content === '') && node.type === 'li') {
        e.preventDefault();
        onUpdate(node.id, { type: 'paragraph', listStyle: undefined } as any);
    }
    if (e.key === 'ArrowUp') {
        const target = e.target as HTMLTextAreaElement | HTMLInputElement;
        if (target.selectionStart === 0 && target.selectionEnd === 0) {
            e.preventDefault();
            onNavigate(node.id, 'up');
        }
    }
    if (e.key === 'ArrowDown') {
        const target = e.target as HTMLTextAreaElement | HTMLInputElement;
        if (target.selectionStart === (target.value || '').length) {
            e.preventDefault();
            onNavigate(node.id, 'down');
        }
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

        return (
            <div key={node.id} className="relative animate-fade-in group/block">
            
            <div 
                className={`flex items-start py-1.5 transition-all rounded-sm hover:bg-white/[0.03] relative pr-12`}
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
                        onChange: (e: any) => onUpdate(node.id, { content: e.target.value }),
                        onKeyDown: (e: any) => handleKeyDown(e, node),
                        ref: (el: HTMLElement | null) => { blockRefs.current[node.id] = el; },
                        className: "w-full bg-transparent outline-none",
                        "data-block-id": node.id
                    }, onUpdate)}
                </div>

                {/* Block Menu */}
                <div className="absolute right-2 top-1.5 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onSetActiveMenuId(activeMenuId === node.id ? null : node.id);
                            }}
                            className={`p-1 rounded-sm transition-colors ${activeMenuId === node.id ? 'bg-gold text-obsidian' : 'text-parchment-dim hover:bg-white/5 hover:text-parchment'}`}
                        >
                            <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px]">⋮</div>
                        </button>

                        {activeMenuId === node.id && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-obsidian-light border border-gold/20 rounded-sm shadow-2xl py-2 z-50 animate-fade-in flex flex-col max-h-80 overflow-y-auto custom-scrollbar">
                                <span className="px-3 py-1 text-[9px] font-bold text-parchment-dim uppercase tracking-widest font-mono">格式 / Format</span>
                                <button onClick={() => { onUpdate(node.id, { type: 'paragraph', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Type className="w-3 h-3"/> 文本</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'h1', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Heading1 className="w-3 h-3"/> 一级标题</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'h2', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Heading2 className="w-3 h-3"/> 二级标题</button>
                                
                                <div className="my-1 border-t border-white/5"></div>
                                <span className="px-3 py-1 text-[9px] font-bold text-parchment-dim uppercase tracking-widest font-mono">列表 / Lists</span>
                                <button onClick={() => { onUpdate(node.id, { type: 'li', listStyle: 'bullet' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><List className="w-3 h-3"/> 无序列表</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'li', listStyle: 'number' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><ListOrdered className="w-3 h-3"/> 有序列表</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'li', listStyle: 'task', checked: false } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><CheckSquare className="w-3 h-3"/> 任务列表</button>

                                <div className="my-1 border-t border-white/5"></div>
                                <span className="px-3 py-1 text-[9px] font-bold text-parchment-dim uppercase tracking-widest font-mono">插入 / Insert</span>
                                <button onClick={() => { onUpdate(node.id, { type: 'quote', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Quote className="w-3 h-3"/> 引用</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'code', listStyle: undefined } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Code className="w-3 h-3"/> 代码</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'hr', content: '' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><Minus className="w-3 h-3"/> 分割线</button>
                                <button onClick={() => { onUpdate(node.id, { type: 'image', src: '', alt: '' } as any); onSetActiveMenuId(null); }} className="px-4 py-2 hover:bg-white/5 text-sm flex gap-2 text-parchment"><ImageIcon className="w-3 h-3"/> 图片</button>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => onRemove(node.id)}
                        className="p-1 rounded-sm hover:bg-red-900/20 text-parchment-dim hover:text-red-400 transition-colors"
                    >
                        <X className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {/* Quick Add Child Buttons (Scriptorium Style) */}
            {['h1', 'h2', 'h3'].includes(node.type) && (
                <div className="relative mb-3 mt-1" style={{ marginLeft: `${(depth + 1) * 28}px` }}>
                    <div className="absolute left-[-14px] top-0 bottom-0 w-[1px] bg-white/5"></div>
                    <div className="flex flex-wrap items-center gap-1.5 pl-2 opacity-30 hover:opacity-100 transition-opacity duration-200">
                        {/* Text Default */}
                        <button onClick={() => onAddChild(node.id, 'paragraph')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all font-mono" title="普通文本"><Type className="w-3 h-3" /></button>
                        
                        {/* Contextual Sub-Headings */}
                        {node.type === 'h1' && <button onClick={() => onAddChild(node.id, 'h2')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="二级标题"><Heading2 className="w-3 h-3" /></button>}
                        {node.type === 'h2' && <button onClick={() => onAddChild(node.id, 'h3')} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="三级标题"><Heading3 className="w-3 h-3" /></button>}
                        
                        <div className="w-px h-3 bg-white/20 mx-1"></div>

                        {/* Lists */}
                        <button onClick={() => onAddChild(node.id, 'li', { listStyle: 'bullet' })} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="无序列表"><List className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'li', { listStyle: 'number' })} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="有序列表"><ListOrdered className="w-3 h-3" /></button>
                        <button onClick={() => onAddChild(node.id, 'li', { listStyle: 'task', checked: false })} className="flex items-center gap-1.5 hover:text-gold text-xs px-2 py-0.5 rounded-sm border border-transparent hover:border-gold/20 transition-all" title="任务列表"><CheckSquare className="w-3 h-3" /></button>

                        <div className="w-px h-3 bg-white/20 mx-1"></div>

                        {/* Extras */}
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
                        onUpdate={onUpdate}
                        onAddSibling={onAddSibling}
                        onAddChild={onAddChild}
                        onRemove={onRemove}
                        blockRefs={blockRefs}
                        onNavigate={onNavigate}
                    />
                </div>
            )}
            </div>
        );
      })}
    </>
  );
});

// Preview Components matching Scriptorium style
const markdownPreviewComponents = {
    p: ({node, ...props}: any) => <span className="font-sans leading-relaxed text-parchment-dim" {...props} />,
    a: ({node, ...props}: any) => <a className="text-gold hover:underline underline-offset-4 decoration-gold/30" target="_blank" rel="noreferrer" {...props} />,
    table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 border border-white/5 rounded-sm"><table className="min-w-full text-sm border-collapse" {...props} /></div>,
    thead: ({node, ...props}: any) => <thead className="bg-white/5 font-serif text-gold" {...props} />,
    th: ({node, ...props}: any) => <th className="px-4 py-2 text-left font-medium border-b border-r border-white/5 last:border-r-0" {...props} />,
    td: ({node, ...props}: any) => <td className="px-4 py-2 text-parchment-dim border-b border-r border-white/5 last:border-r-0" {...props} />,
    img: ({node, ...props}: any) => <img loading="lazy" className="rounded-sm max-h-80 object-contain my-4 bg-black/5 border border-white/5" {...props} />,
    input: ({node, ...props}: any) => <input type="checkbox" className="accent-gold mr-2" disabled {...props} />
};

const PreviewTree: React.FC<{ nodes: EditorBlockNode[] }> = ({ nodes }) => {
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownPreviewComponents}>
                            {node.content}
                        </ReactMarkdown>
                    </div>
                )}
                
                {node.type === 'quote' && (
                    <blockquote className="border-l-2 border-gold/40 pl-6 py-3 my-6 text-gold/80 italic bg-gold/5 rounded-r font-serif">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownPreviewComponents}>
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
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownPreviewComponents}>
                                {node.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            {node.children.length > 0 && (
            <div className="ml-4 border-l border-white/5 pl-6">
                <PreviewTree nodes={node.children} />
            </div>
            )}
          </div>
        );
      })}
    </>
  );
};


// --- MAIN EDITOR VIEW ---

interface EditorViewProps {
  onBack: () => void;
  onSave: (entry: Omit<Entry, 'id' | 'createdAt' | 'likes' | 'author'>) => void;
  isLightTheme: boolean;
  initialCategory?: Category;
}

export const EditorView: React.FC<EditorViewProps> = ({ onBack, onSave, isLightTheme, initialCategory }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(initialCategory || Category.CREATURE);
  const [tags, setTags] = useState('');
  
  // New Attributes
  const [realism, setRealism] = useState<number>(3);
  const [risk, setRisk] = useState<number>(1);
  const [anomalous, setAnomalous] = useState<number>(1);

  const { 
    rootBlocks, 
    updateNode, 
    addSibling, 
    addChild, 
    removeNode, 
    generateMarkdownContent,
  } = useOutlineTree([{ id: 'root-1', type: 'h1', content: '', children: [] } as any]);
  
  const [activeMenuBlockId, setActiveMenuBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const [focusId, setFocusId] = useState<string | null>(null);

  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3 });
  const [insertionTarget, setInsertionTarget] = useState<{ id: string, start: number, end: number } | null>(null);

  useEffect(() => {
    if (focusId && blockRefs.current[focusId]) {
        setTimeout(() => {
            blockRefs.current[focusId]?.focus();
        }, 10);
        setFocusId(null);
    }
  }, [focusId, rootBlocks]);

  const handleAddSibling = useCallback((targetId: string, newNode: EditorBlockNode) => {
      addSibling(targetId, newNode);
      setFocusId(newNode.id);
  }, [addSibling]);

  const handleAddChild = useCallback((parentId: string, type: BlockType, extra?: Partial<EditorBlockNode>) => {
      const newId = generateId();
      addChild(parentId, type, { ...extra, id: newId } as any);
      setFocusId(newId);
  }, [addChild]);

  const handleFormat = (formatType: 'bold' | 'italic' | 'link' | 'code') => {
    const activeEl = document.activeElement as HTMLTextAreaElement;
    if (!activeEl || activeEl.tagName !== 'TEXTAREA') return;

    const start = activeEl.selectionStart;
    const end = activeEl.selectionEnd;
    const text = activeEl.value;
    const selected = text.substring(start, end);

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

    const isWrapped = (wrapper: string) => {
        const before = text.substring(0, start);
        const after = text.substring(end);
        return before.endsWith(wrapper) && after.startsWith(wrapper);
    };

    let currentWrapper = '';
    if (isWrapped('**')) currentWrapper = '**';
    else if (isWrapped('*')) currentWrapper = '*';
    else if (isWrapped('`')) currentWrapper = '`';

    const targetWrapper = formatType === 'bold' ? '**' : formatType === 'italic' ? '*' : '`';

    let newText = text;
    let newStart = start;
    let newEnd = end;

    if (currentWrapper) {
        newText = text.substring(0, start - currentWrapper.length) + selected + text.substring(end + currentWrapper.length);
        newStart = start - currentWrapper.length;
        newEnd = end - currentWrapper.length;
    }

    if (currentWrapper !== targetWrapper) {
        newText = newText.substring(0, newStart) + targetWrapper + selected + targetWrapper + newText.substring(newEnd);
        newStart += targetWrapper.length;
        newEnd += targetWrapper.length;
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
          if (node.children.length > 0) {
              ids = ids.concat(flattenBlocks(node.children));
          }
      });
      return ids;
  }, []);

  const handleNavigate = useCallback((currentId: string, direction: 'up' | 'down') => {
      const allIds = flattenBlocks(rootBlocks);
      const currentIndex = allIds.indexOf(currentId);
      if (currentIndex === -1) return;

      let targetId: string | null = null;
      if (direction === 'up' && currentIndex > 0) {
          targetId = allIds[currentIndex - 1];
      } else if (direction === 'down' && currentIndex < allIds.length - 1) {
          targetId = allIds[currentIndex + 1];
      }

      if (targetId) {
          setFocusId(targetId);
      }
  }, [rootBlocks, flattenBlocks]);


  const convertTreeToMarkdown = (): string => {
    const frontMatter = `---
title: ${title}
category: ${category}
tags: [${tags.split(/[,，]/).map(t => `"${t.trim()}"`).filter(Boolean).join(', ')}]
realism: ${realism}
risk: ${risk}
anomalous: ${anomalous}
created_at: ${new Date().toISOString()}
---

`;
    return frontMatter + generateMarkdownContent();
  };

  const handlePublish = () => {
    if (!title.trim()) {
      alert("请输入档案标题。");
      return;
    }
    const content = convertTreeToMarkdown();
    const confirmed = window.confirm("确认要永久归档此条目吗？");
    if (confirmed) {
        onSave({
            title,
            category,
            content,
            tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
            realism,
            risk,
            anomalous
        });
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuBlockId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="h-screen bg-obsidian text-parchment flex flex-col overflow-hidden relative transition-colors duration-500">
      
      {/* Top Bar - Scriptorium Toolbar */}
      <div className="sticky top-0 z-40 bg-obsidian/95 backdrop-blur-sm border-b border-gold/10 shrink-0">
        <div className="w-full px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-sm transition-colors text-parchment-dim hover:text-parchment"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex flex-col">
                <h2 className="font-serif text-lg text-parchment tracking-wide">新建手稿</h2>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-1 bg-white/[0.02] rounded-sm p-1 border border-white/5">
              <PenTool className="w-3 h-3 text-gold/50 mx-2" />
              <div className="w-px h-3 bg-white/10 mx-1"></div>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('bold')} className="p-1.5 hover:bg-white/5 rounded-sm text-parchment-dim hover:text-parchment" title="加粗"><Bold className="w-3.5 h-3.5"/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('italic')} className="p-1.5 hover:bg-white/5 rounded-sm text-parchment-dim hover:text-parchment" title="斜体"><Italic className="w-3.5 h-3.5"/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => handleFormat('code')} className="p-1.5 hover:bg-white/5 rounded-sm text-parchment-dim hover:text-parchment" title="代码"><Code className="w-3.5 h-3.5"/></button>
              <div className="w-px h-3 bg-white/10 mx-1"></div>
              <button onMouseDown={e => e.preventDefault()} onClick={handleOpenTableDialog} className="p-1.5 hover:bg-white/5 rounded-sm text-parchment-dim hover:text-parchment" title="插入表格"><Table className="w-3.5 h-3.5"/></button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => alert("草稿已保存到本地。")} className="hidden md:flex items-center gap-2 bg-transparent border border-white/10 hover:border-gold/30 text-parchment-dim hover:text-gold text-xs font-medium px-4 py-1.5 rounded-sm transition-all"><Save className="w-3.5 h-3.5" /><span>保存草稿</span></button>
            <button onClick={handlePublish} className="flex items-center gap-2 bg-gold hover:bg-[#c5a676] text-obsidian font-bold px-5 py-1.5 rounded-sm transition-transform active:scale-95 text-xs uppercase tracking-wider shadow-lg"><Upload className="w-3.5 h-3.5" /><span>归档</span></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* LEFT: Tree Editor - The "Worktable" */}
        <div className={`flex-1 w-1/2 overflow-y-auto custom-scrollbar p-8 md:p-12 border-r border-gold/10 ${isLightTheme ? 'bg-[#f7f5ef]' : 'bg-[#0c0c0e]'}`}>
            <div className="max-w-3xl mx-auto animate-slide-up pb-20">
                <div className="bg-white/[0.01] border-b border-white/5 pb-8 mb-8">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="档案标题..." className="w-full bg-transparent text-4xl font-serif text-parchment placeholder-parchment-dim/20 outline-none mb-6"/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-2 font-mono">归档分类 / Classification</label>
                            <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-charcoal/40 border border-white/10 rounded-sm px-3 py-2 text-sm text-parchment focus:border-gold/50 outline-none cursor-pointer hover:bg-white/5 transition-colors font-serif">{Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-2 font-mono">索引标签 / Tags</label>
                            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="逗号分隔..." className="w-full bg-charcoal/40 border border-white/10 rounded-sm px-3 py-2 text-sm text-parchment focus:border-gold/50 outline-none font-mono placeholder:text-parchment-dim/20"/>
                        </div>
                    </div>

                    {/* New Parameter Sliders */}
                    <div className="bg-white/5 rounded-sm p-4 border border-white/5 space-y-6">
                        {/* Realism */}
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-[10px] font-bold text-gold/80 uppercase tracking-widest flex items-center gap-1.5 font-mono"><Brain className="w-3 h-3" /> 真实度 / Realism</label>
                                <span className="text-[10px] text-parchment font-mono">{realism} / 5</span>
                            </div>
                            <input type="range" min="1" max="5" value={realism} onChange={(e) => setRealism(Number(e.target.value))} className="w-full accent-gold h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer mb-2"/>
                            <div className="text-xs text-parchment-dim/80 font-serif italic border-l-2 border-gold/30 pl-2">{REALISM_DESCRIPTIONS[realism]}</div>
                        </div>

                        {/* Risk */}
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5 font-mono"><AlertTriangle className="w-3 h-3" /> 风险等级 / Risk</label>
                                <span className="text-[10px] text-parchment font-mono">{risk} / 8</span>
                            </div>
                            <input type="range" min="1" max="8" value={risk} onChange={(e) => setRisk(Number(e.target.value))} className="w-full accent-red-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer mb-2"/>
                            <div className="text-xs text-parchment-dim/80 font-serif italic border-l-2 border-red-500/30 pl-2">{RISK_DESCRIPTIONS[risk]}</div>
                        </div>

                        {/* Anomalous */}
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono"><Activity className="w-3 h-3" /> 异象刻度 / Anomalous</label>
                                <span className="text-[10px] text-parchment font-mono">{anomalous} / 7</span>
                            </div>
                            <input type="range" min="1" max="7" value={anomalous} onChange={(e) => setAnomalous(Number(e.target.value))} className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer mb-2"/>
                            <div className="text-xs text-parchment-dim/80 font-serif italic border-l-2 border-cyan-400/30 pl-2">{ANOMALOUS_DESCRIPTIONS[anomalous]}</div>
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
                        onUpdate={updateNode}
                        onAddSibling={handleAddSibling}
                        onAddChild={handleAddChild}
                        onRemove={removeNode}
                        blockRefs={blockRefs}
                        onNavigate={handleNavigate}
                    />
                    <button onClick={() => rootBlocks.length > 0 && handleAddSibling(rootBlocks[rootBlocks.length-1].id, { id: generateId(), type: 'h1', content: '', children: [] } as any)} className="w-full py-4 mt-8 border border-dashed border-white/5 rounded-sm text-parchment-dim/40 hover:text-gold hover:border-gold/30 flex items-center justify-center gap-2 transition-all group z-10 relative bg-white/[0.01]">
                        <Plus className="w-4 h-4" /> 新增章节
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT: Live Preview - The "Finished Page" */}
        <div className={`hidden lg:block w-1/2 flex-1 overflow-y-auto custom-scrollbar p-12 ${isLightTheme ? 'bg-[#fff]' : 'bg-[#0a0a0c]'}`}>
            <div className="bg-white/[0.02] border border-white/5 p-12 min-h-[800px] shadow-2xl relative">
                {/* Decorative Binding */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gold/20"></div>
                <div className="absolute top-12 right-12 text-[10px] font-mono text-gold/40 border border-gold/10 px-2 py-1 uppercase tracking-widest">预览模式</div>
                
                <h1 className="text-4xl font-serif text-parchment mb-4 mt-8 border-b border-gold/20 pb-4">{title || "未命名档案"}</h1>
                <div className="flex gap-3 mb-12 opacity-70">
                     <span className="text-[10px] font-bold text-parchment-dim uppercase border border-white/10 px-1.5 py-0.5 font-mono">{category}</span>
                     {tags && tags.split(/[,，]/).map(t => <span key={t} className="text-[10px] text-parchment-dim bg-white/5 px-1.5 py-0.5 font-mono">#{t}</span>)}
                </div>
                
                {/* Preview of new parameters */}
                <div className="flex gap-4 mb-10 border-b border-white/5 pb-6">
                    <div className="flex-1 bg-white/5 p-3 rounded-sm border border-white/5">
                         <div className="text-[9px] text-gold uppercase tracking-wider mb-1">真实度</div>
                         <div className="flex gap-1">{Array.from({length: 5}).map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-sm ${i < realism ? 'bg-gold' : 'bg-white/10'}`}></div>)}</div>
                    </div>
                    <div className="flex-1 bg-white/5 p-3 rounded-sm border border-white/5">
                         <div className="text-[9px] text-red-400 uppercase tracking-wider mb-1">风险等级</div>
                         <div className="h-1.5 w-full bg-white/10 rounded-sm overflow-hidden"><div className="h-full bg-red-500" style={{width: `${(risk/8)*100}%`}}></div></div>
                    </div>
                    <div className="flex-1 bg-white/5 p-3 rounded-sm border border-white/5">
                         <div className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1">异象刻度</div>
                         <div className="h-1.5 w-full bg-white/10 rounded-sm overflow-hidden"><div className="h-full bg-cyan-400" style={{width: `${(anomalous/7)*100}%`}}></div></div>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none">
                    <PreviewTree nodes={rootBlocks} />
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex justify-center">
                    <div className="text-[10px] text-parchment-dim/30 font-mono tracking-[0.5em] uppercase">记录结束 / End of Record</div>
                </div>
            </div>
        </div>
      </div>

      {/* Table Dialog */}
      {showTableDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-obsidian border border-gold/20 rounded-sm p-6 w-80 shadow-2xl animate-fade-in">
                  <h3 className="text-lg font-serif text-parchment mb-4 flex items-center gap-2"><Table className="w-4 h-4 text-gold" /> 插入表格</h3>
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="text-[10px] text-parchment-dim uppercase font-bold block mb-1 font-mono">行数 (Rows)</label>
                          <input type="number" min="1" max="20" value={tableConfig.rows} onChange={e => setTableConfig({...tableConfig, rows: parseInt(e.target.value)})} className="w-full bg-charcoal/40 border border-white/10 rounded-sm p-2 text-parchment outline-none focus:border-gold/50 font-mono"/>
                      </div>
                      <div>
                          <label className="text-[10px] text-parchment-dim uppercase font-bold block mb-1 font-mono">列数 (Columns)</label>
                          <input type="number" min="1" max="10" value={tableConfig.cols} onChange={e => setTableConfig({...tableConfig, cols: parseInt(e.target.value)})} className="w-full bg-charcoal/40 border border-white/10 rounded-sm p-2 text-parchment outline-none focus:border-gold/50 font-mono"/>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowTableDialog(false)} className="px-3 py-1.5 text-xs uppercase tracking-wider text-parchment-dim hover:text-white">取消</button>
                      <button onClick={insertTable} className="px-3 py-1.5 text-xs bg-gold text-obsidian font-bold rounded-sm uppercase tracking-wider hover:bg-[#c5a676]">插入</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};