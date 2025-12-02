
import React, { useState, useEffect } from 'react';
import { Term, TermType } from '../types';
import { X } from 'lucide-react';

interface TermEditDialogProps {
  term: Term | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (term: Term) => void;
}

export const TermEditDialog: React.FC<TermEditDialogProps> = ({ term, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TermType>(TermType.CONCEPT);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (term) {
        setName(term.name);
        setType(term.type);
        setDesc(term.description);
    }
  }, [term]);

  if (!isOpen || !term) return null;

  const handleSave = () => {
      onSave({
          ...term,
          name,
          type,
          description: desc
      });
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-obsidian border border-gold/30 rounded-sm w-full max-w-md shadow-2xl animate-slide-up">
             <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <h3 className="font-serif font-bold text-parchment flex items-center gap-2">
                    编辑术语
                 </h3>
                 <button onClick={onClose}><X className="w-4 h-4 text-parchment-dim hover:text-parchment"/></button>
             </div>
             <div className="p-6 space-y-4">
                 <div>
                     <label className="block text-[10px] font-bold text-parchment-dim uppercase tracking-widest mb-2 font-mono">术语名称</label>
                     <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-parchment focus:border-gold/50 outline-none font-bold" />
                 </div>
                 <div>
                     <label className="block text-[10px] font-bold text-parchment-dim uppercase tracking-widest mb-2 font-mono">术语类型</label>
                     <div className="grid grid-cols-2 gap-2">
                         {Object.values(TermType).map(t => (
                             <button key={t} onClick={() => setType(t)} className={`px-2 py-1.5 text-xs border rounded-sm transition-all text-left ${type === t ? 'bg-gold/10 border-gold text-gold' : 'border-white/10 text-parchment-dim hover:bg-white/5'}`}>
                                 {t.split('/')[0]}
                             </button>
                         ))}
                     </div>
                 </div>
                 <div>
                     <label className="block text-[10px] font-bold text-parchment-dim uppercase tracking-widest mb-2 font-mono">简短释义</label>
                     <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-parchment focus:border-gold/50 outline-none h-24 resize-none text-sm" />
                 </div>
             </div>
             <div className="p-4 border-t border-white/5 flex justify-end gap-2 bg-white/[0.02]">
                 <button onClick={onClose} className="px-4 py-2 text-xs text-parchment-dim hover:text-parchment">取消</button>
                 <button onClick={handleSave} className="px-6 py-2 bg-gold text-obsidian font-bold rounded-sm text-xs hover:bg-[#c5a676] transition-colors shadow-lg">
                    保存更改
                 </button>
             </div>
        </div>
    </div>
  );
};
