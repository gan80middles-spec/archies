import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellOff, Check, CheckCircle2, Clock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface NotificationItem {
  id: string;
  title: string;
  content?: string;
  createdAt: string;   // ISO String
  isRead: boolean;
  linkUrl?: string;    // Optional deep link
  type: 'system' | 'reply' | 'alert' | 'update';
}

interface NotificationsViewProps {
  onBack: () => void;
  isLightTheme: boolean;
}

// --- Mock Data Generator ---
const MOCK_NOTIFICATIONS: NotificationItem[] = [
    {
        id: 'n-1',
        title: '系统警告：异常能级波动',
        content: '第九扇区监测到未记录的以太频率震荡，建议查阅 [A-902] 档案更新。',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        isRead: false,
        type: 'alert'
    },
    {
        id: 'n-2',
        title: '档案评议回复',
        content: 'Archivist_Zero 回复了您关于 "低语真菌" 的评议。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        isRead: false,
        type: 'reply'
    },
    {
        id: 'n-3',
        title: '版本更新日志 V.2.2',
        content: '新增了 "术语中心" 侧边栏与关联编辑功能。系统稳定性提升。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        isRead: true,
        type: 'update'
    },
    {
        id: 'n-4',
        title: '访问权限提升',
        content: '您的安全许可已由 LEVEL 3 提升至 LEVEL 4。现在可以访问绝密档案。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        isRead: true,
        type: 'system'
    }
];

// --- Mock API ---
const fetchNotifications = async (): Promise<NotificationItem[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...MOCK_NOTIFICATIONS]), 800));
};

// --- Component ---
export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack, isLightTheme }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchNotifications();
                setNotifications(data);
            } catch (e) {
                console.error("Failed to load notifications");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const displayedNotifications = filter === 'ALL' 
        ? notifications 
        : notifications.filter(n => !n.isRead);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Theme Variables
    const theme = isLightTheme ? {
        bg: 'bg-[#f7f5ef]',
        headerBg: 'bg-[#e5e5e5]',
        cardBg: 'bg-white',
        cardBgRead: 'bg-stone-50',
        border: 'border-stone-200',
        textPrimary: 'text-stone-800',
        textSecondary: 'text-stone-500',
        highlight: 'text-amber-600',
        cardHighlight: 'border-amber-500',
        button: 'hover:bg-black/5 text-stone-600',
        buttonPrimary: 'bg-amber-600 text-white hover:bg-amber-700'
    } : {
        bg: 'bg-obsidian',
        headerBg: 'bg-obsidian-light',
        cardBg: 'bg-white/5',
        cardBgRead: 'bg-white/[0.02]',
        border: 'border-white/10',
        textPrimary: 'text-parchment',
        textSecondary: 'text-parchment-dim',
        highlight: 'text-gold',
        cardHighlight: 'border-gold',
        button: 'hover:bg-white/10 text-parchment-dim hover:text-parchment',
        buttonPrimary: 'bg-gold text-obsidian hover:bg-[#c5a676]'
    };

    const getIcon = (type: NotificationItem['type']) => {
        switch(type) {
            case 'alert': return <div className={`w-2 h-2 rounded-full ${isLightTheme ? 'bg-red-500' : 'bg-red-400'}`}></div>;
            case 'reply': return <Mail className="w-3 h-3 opacity-70" />;
            case 'update': return <CheckCircle2 className="w-3 h-3 opacity-70" />;
            default: return <Bell className="w-3 h-3 opacity-70" />;
        }
    };

    return (
        <div className={`relative h-screen w-screen overflow-hidden flex flex-col transition-colors duration-500 ${theme.bg}`}>
            <div className="bg-noise z-50"></div>

            {/* Header */}
            <div className={`shrink-0 h-16 border-b flex items-center justify-between px-6 z-10 ${theme.headerBg} ${theme.border}`}>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className={`p-2 rounded-sm transition-colors ${theme.button}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className={`text-lg font-serif font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                            通知中心
                            {unreadCount > 0 && <span className="text-xs font-mono bg-red-500 text-white px-1.5 rounded-sm">{unreadCount}</span>}
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className={`text-xs font-mono uppercase tracking-widest hidden md:block ${theme.textSecondary}`}>
                        SYSTEM_NOTIFICATIONS
                    </div>
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllAsRead}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${theme.buttonPrimary}`}
                        >
                            <Check className="w-3 h-3" /> 全部已读
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={`px-6 pt-6 pb-2 border-b ${theme.border}`}>
                <div className="flex gap-6">
                    <button 
                        onClick={() => setFilter('ALL')}
                        className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all relative ${filter === 'ALL' ? theme.highlight : theme.textSecondary}`}
                    >
                        全部通知
                        {filter === 'ALL' && <motion.div layoutId="notifTab" className={`absolute bottom-0 left-0 w-full h-[2px] ${isLightTheme ? 'bg-amber-600' : 'bg-gold'}`} />}
                    </button>
                    <button 
                        onClick={() => setFilter('UNREAD')}
                        className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all relative ${filter === 'UNREAD' ? theme.highlight : theme.textSecondary}`}
                    >
                        未读消息
                        {filter === 'UNREAD' && <motion.div layoutId="notifTab" className={`absolute bottom-0 left-0 w-full h-[2px] ${isLightTheme ? 'bg-amber-600' : 'bg-gold'}`} />}
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    {isLoading ? (
                        <div className={`text-center py-20 animate-pulse font-mono text-xs ${theme.textSecondary}`}>
                            LOADING_DATA_STREAM...
                        </div>
                    ) : displayedNotifications.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-24 opacity-50 border border-dashed rounded-sm ${theme.border}`}>
                            <BellOff className={`w-12 h-12 mb-4 ${theme.textSecondary}`} />
                            <p className={`font-serif italic ${theme.textSecondary}`}>暂无相关通知。</p>
                        </div>
                    ) : (
                        <AnimatePresence mode='popLayout'>
                            {displayedNotifications.map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    className={`
                                        group relative p-5 border rounded-sm cursor-pointer transition-all duration-300
                                        ${notif.isRead ? `${theme.cardBgRead} border-transparent` : `${theme.cardBg} ${theme.border} shadow-lg`}
                                        ${!notif.isRead && !isLightTheme ? 'hover:bg-white/10' : ''}
                                        ${!notif.isRead && isLightTheme ? 'hover:bg-white hover:shadow-md' : ''}
                                    `}
                                >
                                    {!notif.isRead && (
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLightTheme ? 'bg-amber-500' : 'bg-gold'}`}></div>
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-sm border ${theme.border} ${isLightTheme ? 'bg-white' : 'bg-white/5'}`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 ${theme.textSecondary}`}>
                                                {notif.type}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-[10px] font-mono opacity-50 ${theme.textSecondary}`}>
                                            <Clock className="w-3 h-3" />
                                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>

                                    <h3 className={`text-base font-serif font-bold mb-1 transition-colors ${notif.isRead ? theme.textSecondary : theme.textPrimary} ${!notif.isRead ? 'group-hover:translate-x-1' : ''}`}>
                                        {notif.title}
                                    </h3>
                                    
                                    {notif.content && (
                                        <p className={`text-sm leading-relaxed ${theme.textSecondary} ${notif.isRead ? 'opacity-70' : ''}`}>
                                            {notif.content}
                                        </p>
                                    )}

                                    {/* Decoration for Unread */}
                                    {!notif.isRead && (
                                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isLightTheme ? 'bg-amber-500' : 'bg-gold'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};