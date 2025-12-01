import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, Key, Sun, Moon } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, isLightTheme, onToggleTheme }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请输入凭证。');
      return;
    }

    if (isRegister) {
      if (!username) {
        setError('请输入代号。');
        return;
      }
      if (password !== confirmPassword) {
        setError('密钥不匹配。');
        return;
      }
    }

    setIsLoading(true);

    // Simulation of API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        id: `user-${Date.now()}`,
        username: isRegister ? username : (email.split('@')[0] || '未知特工'),
        email: email,
        joinDate: Date.now(),
        favorites: []
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans overflow-hidden bg-obsidian transition-colors duration-500">
       <div className="bg-noise"></div>
       
       {/* Ambient Light - Subtle Gold */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Theme Toggle Button (Corner) */}
        <button 
           onClick={onToggleTheme}
           className="absolute top-6 right-6 p-2 rounded-sm text-parchment-dim hover:text-gold hover:bg-white/5 transition-colors border border-transparent hover:border-gold/10 z-50"
           title={isLightTheme ? "切换到暗色模式" : "切换到亮色模式"}
         >
           {isLightTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
         </button>

       <div className="relative z-10 w-full max-w-md animate-fade-in px-6">
         <div className="text-center mb-10">
           <div className="w-16 h-16 border border-gold/20 bg-obsidian-light/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
              <div className="absolute inset-0 rounded-full border border-gold/10 animate-pulse-slow"></div>
              <Shield className="w-6 h-6 text-gold" />
           </div>
           <h1 className="text-4xl font-serif text-parchment tracking-tight mb-2">万象档案馆</h1>
           <p className="text-xs text-gold/60 uppercase tracking-[0.3em] font-mono">世界观察局 // OmniArchive</p>
         </div>

         <div className="glass-panel rounded-sm p-8 shadow-2xl border border-gold/10 bg-obsidian-light/80">
            {/* Tabs */}
            <div className="flex mb-8 border-b border-white/5">
              <button 
                onClick={() => setIsRegister(false)}
                className={`flex-1 pb-4 text-xs uppercase tracking-widest transition-colors relative font-mono ${!isRegister ? 'text-gold' : 'text-parchment-dim hover:text-parchment'}`}
              >
                接入 (Login)
                {!isRegister && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold"></span>}
              </button>
              <button 
                onClick={() => setIsRegister(true)}
                className={`flex-1 pb-4 text-xs uppercase tracking-widest transition-colors relative font-mono ${isRegister ? 'text-gold' : 'text-parchment-dim hover:text-parchment'}`}
              >
                注册 (Register)
                {isRegister && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold"></span>}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
               {isRegister && (
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-parchment-dim uppercase tracking-wider ml-1">代号 / Codename</label>
                   <div className="relative group">
                     <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment-dim/50 group-focus-within:text-gold transition-colors" />
                     <input 
                       type="text" 
                       value={username}
                       onChange={(e) => setUsername(e.target.value)}
                       className="w-full bg-charcoal/40 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-parchment focus:border-gold/50 outline-none transition-all font-mono text-sm placeholder:text-parchment-dim/20"
                       placeholder="AGENT_ID"
                     />
                   </div>
                 </div>
               )}

               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-parchment-dim uppercase tracking-wider ml-1">频段 (邮箱)</label>
                 <div className="relative group">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment-dim/50 group-focus-within:text-gold transition-colors" />
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-charcoal/40 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-parchment focus:border-gold/50 outline-none transition-all font-mono text-sm placeholder:text-parchment-dim/20"
                     placeholder="identity@omni.net"
                   />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-parchment-dim uppercase tracking-wider ml-1">访问密钥</label>
                 <div className="relative group">
                   <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment-dim/50 group-focus-within:text-gold transition-colors" />
                   <input 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-charcoal/40 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-parchment focus:border-gold/50 outline-none transition-all font-mono text-sm tracking-widest placeholder:text-parchment-dim/20"
                     placeholder="••••••••"
                   />
                 </div>
               </div>

               {isRegister && (
                  <div className="space-y-1.5 animate-slide-up">
                    <label className="text-[10px] font-bold text-parchment-dim uppercase tracking-wider ml-1">确认密钥</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment-dim/50 group-focus-within:text-gold transition-colors" />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-charcoal/40 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-parchment focus:border-gold/50 outline-none transition-all font-mono text-sm tracking-widest placeholder:text-parchment-dim/20"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
               )}

               {error && <div className="text-danger text-xs text-center border border-danger/20 bg-danger/5 py-2 rounded-sm">{error}</div>}

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full mt-8 bg-gold hover:bg-[#c5a676] text-obsidian font-bold py-3.5 rounded-sm transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
               >
                 {isLoading ? (
                   <div className="w-5 h-5 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" />
                 ) : (
                   <>
                     <span className="uppercase tracking-widest text-xs">{isRegister ? '初始化档案' : '建立连接'}</span>
                     <ArrowRight className="w-4 h-4" />
                   </>
                 )}
               </button>
            </form>
         </div>

         <div className="mt-12 text-center">
           <p className="text-[10px] text-parchment-dim/30 font-mono">
             SECURE_CONNECTION // V.4.2.0 // OMNI_BUREAU
           </p>
         </div>
       </div>
    </div>
  );
};