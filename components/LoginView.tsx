
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, ArrowRight, Key, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

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

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const fieldVariants: Variants = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden', marginBottom: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      marginBottom: 20,
      transition: { duration: 0.4, ease: "easeInOut" } 
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      marginBottom: 0,
      transition: { duration: 0.3, ease: "easeInOut" } 
    }
  };

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans overflow-hidden bg-obsidian transition-colors duration-500">
       <div className="bg-noise"></div>
       
       {/* Ambient Light - Subtle Gold Breathing */}
       <motion.div 
         animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
         transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] pointer-events-none"
       />

        {/* Theme Toggle Button (Corner) */}
        <motion.button 
           whileHover={{ scale: 1.1, rotate: 15 }}
           whileTap={{ scale: 0.9 }}
           onClick={onToggleTheme}
           className="absolute top-6 right-6 p-2 rounded-sm text-parchment-dim hover:text-gold hover:bg-white/5 transition-colors border border-transparent hover:border-gold/10 z-50"
           title={isLightTheme ? "切换到暗色模式" : "切换到亮色模式"}
         >
           {isLightTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
         </motion.button>

       <motion.div 
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="relative z-10 w-full max-w-md px-6"
       >
         <div className="text-center mb-10">
           <motion.div 
             initial={{ scale: 0, rotate: -45 }}
             animate={{ scale: 1, rotate: 0 }}
             transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
             className="w-20 h-20 border border-gold/20 bg-obsidian-light/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative"
           >
              <div className="absolute inset-0 rounded-full border border-gold/10 animate-pulse-slow"></div>
              
              {/* Animated OmniEye Logo */}
              <motion.svg 
                  viewBox="0 0 100 100" 
                  className="w-10 h-10 text-gold overflow-visible" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
              >
                  {/* 1. Outer Ring: Draws in with rotation */}
                  <motion.circle 
                    cx="50" cy="50" r="45" 
                    initial={{ pathLength: 0, opacity: 0, rotate: -90 }}
                    animate={{ pathLength: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  
                  {/* REMOVED: Middle Ring (Opacity 0.5) */}
                  
                  {/* 2. The Eye Shape: Mitosis (Split from center) - Creates the eye aperture */}
                  <motion.circle 
                    cx="41" cy="50" r="28" 
                    initial={{ cx: 50, opacity: 0 }}
                    animate={{ cx: 41, opacity: 0.8 }}
                    transition={{ duration: 1.2, delay: 0.4, type: "spring", stiffness: 120, damping: 20 }}
                  />
                  <motion.circle 
                    cx="59" cy="50" r="28" 
                    initial={{ cx: 50, opacity: 0 }}
                    animate={{ cx: 59, opacity: 0.8 }}
                    transition={{ duration: 1.2, delay: 0.4, type: "spring", stiffness: 120, damping: 20 }}
                  />
                  
                  {/* 3. Pupil: Dilates (Opens) */}
                  <motion.circle 
                    cx="50" cy="50" r="14" 
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: 14, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8, type: "spring" }}
                  />
                  
                  {/* 4. Center Core: Now a hollow ring instead of solid dot */}
                  <motion.circle 
                    cx="50" cy="50" r="5" 
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.1, type: "spring" }}
                  />
              </motion.svg>
           </motion.div>
           <motion.h1 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 1.0 }}
             className="text-4xl font-serif text-parchment tracking-tight mb-2"
           >
             万象档案馆
           </motion.h1>
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 1.2 }}
             className="text-xs text-gold/60 uppercase tracking-[0.3em] font-mono"
           >
             世界观察局 // OmniArchive
           </motion.p>
         </div>

         <motion.div 
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-panel rounded-sm p-8 shadow-2xl border border-gold/10 bg-obsidian-light/80"
         >
            {/* Tabs */}
            <div className="flex mb-8 border-b border-white/5 relative">
              {['login', 'register'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => {
                      setIsRegister(tab === 'register');
                      setError('');
                  }}
                  className={`flex-1 pb-4 text-xs uppercase tracking-widest transition-colors relative font-mono z-10 ${
                    (tab === 'register' ? isRegister : !isRegister) 
                      ? 'text-gold' 
                      : 'text-parchment-dim hover:text-parchment'
                  }`}
                >
                  {tab === 'login' ? '接入 (Login)' : '注册 (Register)'}
                  {((tab === 'register' ? isRegister : !isRegister)) && (
                    <motion.span 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 w-full h-[1px] bg-gold"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="relative">
               <AnimatePresence initial={false} mode='popLayout'>
                   {/* USERNAME FIELD (Register Only) */}
                   {isRegister && (
                     <motion.div
                       key="username-field"
                       variants={fieldVariants}
                       initial="hidden"
                       animate="visible"
                       exit="exit"
                     >
                       <label className="text-[10px] font-bold text-parchment-dim uppercase tracking-wider ml-1 mb-1.5 block">代号 / Codename</label>
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
                     </motion.div>
                   )}

                   {/* EMAIL FIELD (Always Visible) */}
                   <motion.div layout key="email-field" className="space-y-1.5 mb-5">
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
                   </motion.div>

                   {/* PASSWORD FIELD (Always Visible) */}
                   <motion.div layout key="password-field" className="space-y-1.5 mb-5">
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
                   </motion.div>

                   {/* CONFIRM PASSWORD FIELD (Register Only) */}
                   {isRegister && (
                      <motion.div 
                        key="confirm-password-field"
                        variants={fieldVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <label className="text-[10px] font-bold text-parchment-dim uppercase tracking-wider ml-1 mb-1.5 block">确认密钥</label>
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
                      </motion.div>
                   )}
               </AnimatePresence>

               <AnimatePresence>
                   {error && (
                       <motion.div 
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="text-danger text-xs text-center border border-danger/20 bg-danger/5 py-2 rounded-sm mb-4"
                       >
                           {error}
                       </motion.div>
                   )}
               </AnimatePresence>

               <motion.button 
                 layout
                 variants={buttonVariants}
                 whileHover="hover"
                 whileTap="tap"
                 type="submit" 
                 disabled={isLoading}
                 className="w-full mt-4 bg-gold hover:bg-[#c5a676] text-obsidian font-bold py-3.5 rounded-sm flex items-center justify-center gap-2 shadow-lg relative overflow-hidden group"
               >
                 <AnimatePresence mode="wait">
                     {isLoading ? (
                       <motion.div 
                         key="loading"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="w-5 h-5 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" 
                       />
                     ) : (
                       <motion.div
                         key="content"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="flex items-center gap-2"
                       >
                         <span className="uppercase tracking-widest text-xs">{isRegister ? '初始化档案' : '建立连接'}</span>
                         <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </motion.div>
                     )}
                 </AnimatePresence>
                 {/* Shiny wipe effect */}
                 <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 group-hover:animate-[shine_1s_ease-in-out_infinite]" />
               </motion.button>
            </form>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
           className="mt-12 text-center"
         >
           <p className="text-[10px] text-parchment-dim/30 font-mono">
             SECURE_CONNECTION // V.4.2.0 // OMNI_BUREAU
           </p>
         </motion.div>
       </motion.div>

       <style>{`
         @keyframes shine {
            0% { left: -100%; }
            100% { left: 200%; }
         }
       `}</style>
    </div>
  );
};
