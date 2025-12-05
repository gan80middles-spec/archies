import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Loader2, UserPlus, UserCheck, ArrowRight } from 'lucide-react';

// --- MOCK SERVICE (Local to avoid refactoring) ---
const mockFetchUserInfo = (userId: string) => {
    return new Promise<{ bio: string; followers: number; following: number }>((resolve) => {
        setTimeout(() => {
            resolve({
                bio: "Level 4 Archivist. Specializing in anomalies.",
                followers: Math.floor(Math.random() * 500) + 10,
                following: Math.floor(Math.random() * 100) + 5
            });
        }, 600);
    });
};

interface UserHoverCardProps {
    userId: string;
    username: string;
    avatarUrl?: string;
    currentUser: User | null;
    onInspectUser: (userId: string, username: string, avatarUrl?: string) => void;
    isLightTheme: boolean;
    children: React.ReactNode;
}

export const UserHoverCard: React.FC<UserHoverCardProps> = ({ 
    userId, username, avatarUrl, currentUser, onInspectUser, isLightTheme, children 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [userInfo, setUserInfo] = useState<{ bio: string; followers: number; following: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false); // Mock local state
    
    // Delays
    const openTimeout = React.useRef<NodeJS.Timeout>(null);
    const closeTimeout = React.useRef<NodeJS.Timeout>(null);

    const handleMouseEnter = () => {
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
        openTimeout.current = setTimeout(() => {
            setIsHovered(true);
            if (!userInfo) loadData();
        }, 300); // 300ms delay before showing
    };

    const handleMouseLeave = () => {
        if (openTimeout.current) clearTimeout(openTimeout.current);
        closeTimeout.current = setTimeout(() => {
            setIsHovered(false);
        }, 300); // 300ms grace period
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await mockFetchUserInfo(userId);
            setUserInfo(data);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFollowing(!isFollowing);
        // In a real app, this would verify login and call API
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onInspectUser(userId, username, avatarUrl);
    };

    const theme = isLightTheme ? {
        card: 'bg-white border-stone-200 text-stone-800 shadow-xl',
        subText: 'text-stone-500',
        bgIcon: 'bg-stone-100',
        divider: 'border-stone-100',
        button: 'bg-amber-600 text-white hover:bg-amber-700',
        buttonOutline: 'border-stone-200 text-stone-600 hover:bg-stone-50'
    } : {
        card: 'bg-obsidian border-gold/20 text-parchment shadow-2xl',
        subText: 'text-parchment-dim',
        bgIcon: 'bg-white/5',
        divider: 'border-white/10',
        button: 'bg-gold text-obsidian hover:bg-[#c5a676]',
        buttonOutline: 'border-white/10 text-parchment-dim hover:bg-white/5'
    };

    return (
        <div 
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Trigger Element */}
            <div onClick={handleClick} className="cursor-pointer hover:underline underline-offset-4 decoration-current/30 decoration-2">
                {children}
            </div>

            {/* Hover Card Portal/Absolute */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute left-0 bottom-full mb-3 z-50 w-72 rounded-sm border p-4 cursor-default ${theme.card}`}
                        onClick={(e) => e.stopPropagation()} // Prevent click through
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-sm flex items-center justify-center overflow-hidden border ${isLightTheme ? 'border-stone-200' : 'border-gold/20'} ${theme.bgIcon}`}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-6 h-6 opacity-50" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-serif font-bold text-lg truncate leading-tight hover:text-gold cursor-pointer" onClick={handleClick}>
                                    {username}
                                </h4>
                                <div className={`text-xs font-mono mt-1 ${theme.subText}`}>ID: {userId.slice(0, 6)}</div>
                            </div>
                        </div>

                        {/* Stats / Bio */}
                        <div className="mb-4 min-h-[40px]">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-xs opacity-50">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Retrieving Data...
                                </div>
                            ) : userInfo ? (
                                <>
                                    <p className={`text-xs italic mb-3 leading-relaxed ${theme.subText}`}>
                                        "{userInfo.bio}"
                                    </p>
                                    <div className="flex gap-4 text-xs font-mono">
                                        <span><strong className={isLightTheme ? 'text-stone-800' : 'text-parchment'}>{userInfo.following}</strong> 关注</span>
                                        <span><strong className={isLightTheme ? 'text-stone-800' : 'text-parchment'}>{userInfo.followers + (isFollowing ? 1 : 0)}</strong> 粉丝</span>
                                    </div>
                                </>
                            ) : (
                                <span className="text-xs text-red-400">Connection Failed.</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className={`flex gap-2 pt-3 border-t ${theme.divider}`}>
                            <button 
                                onClick={handleFollowClick}
                                className={`flex-1 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${isFollowing ? theme.buttonOutline : theme.button}`}
                            >
                                {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                                {isFollowing ? '已关注' : '关注'}
                            </button>
                            <button 
                                onClick={handleClick}
                                className={`px-2 py-1.5 rounded-sm border transition-colors ${theme.buttonOutline}`}
                                title="查看完整档案"
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};