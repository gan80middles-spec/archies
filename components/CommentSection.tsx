import React, { useState, useEffect } from 'react';
import { Send, User as UserIcon, Loader2, AlertCircle, MessageSquare, Trash2, LogIn } from 'lucide-react';
import { User } from '../types';
import { UserHoverCard } from './UserHoverCard';

// --- TYPES ---

export interface Comment {
  id: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string; // ISO String
}

interface CommentSectionProps {
  entryId: string;
  currentUser?: User | null;
  onLoginClick?: () => void;
  isLightTheme?: boolean; // Optional: for theme adaptation
  onInspectUser: (userId: string, username: string, avatarUrl?: string) => void;
}

// --- MOCK API HELPERS ---

const MOCK_DELAY = 800;

const mockFetchComments = async (entryId: string): Promise<Comment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate some existing comments
      resolve([
        {
          id: 'c-1',
          author: { id: 'u-1', username: 'Archivist_Zero' },
          content: '这个条目的异象等级评定似乎偏低了，建议重新评估风险指数。',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
          id: 'c-2',
          author: { id: 'u-2', username: 'Explorer_Kai' },
          content: '我在第七扇区见过类似的生物结构，它们对高频声波非常敏感。',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        }
      ]);
    }, MOCK_DELAY);
  });
};

const mockCreateComment = async (entryId: string, content: string, user: User): Promise<Comment> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `c-${Date.now()}`,
        author: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatar,
        },
        content: content,
        createdAt: new Date().toISOString(),
      });
    }, MOCK_DELAY);
  });
};

// --- UTILS ---

const getRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} 天前`;
  return date.toLocaleDateString();
};

// --- COMPONENT ---

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  entryId, 
  currentUser, 
  onLoginClick,
  isLightTheme = false,
  onInspectUser
}) => {
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Theme Classes
  const theme = isLightTheme ? {
    card: 'bg-stone-50 border-stone-200',
    textPrimary: 'text-stone-800',
    textSecondary: 'text-stone-500',
    border: 'border-stone-200',
    inputBg: 'bg-white',
    buttonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
    buttonSecondary: 'text-stone-500 hover:bg-stone-200',
    accent: 'text-amber-600',
    highlight: 'bg-amber-50'
  } : {
    card: 'bg-white/5 border-white/10',
    textPrimary: 'text-parchment',
    textSecondary: 'text-parchment-dim',
    border: 'border-white/10',
    inputBg: 'bg-black/20',
    buttonPrimary: 'bg-gold hover:bg-[#c5a676] text-obsidian',
    buttonSecondary: 'text-parchment-dim hover:bg-white/10',
    accent: 'text-gold',
    highlight: 'bg-gold/5'
  };

  // Load Comments
  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchComments(entryId);
      // Sort: Newest first
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(sorted);
    } catch (err) {
      setError('无法连接到档案神经节点，数据读取失败。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [entryId]);

  // Handle Submit
  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const createdComment = await mockCreateComment(entryId, newComment, currentUser);
      // Optimistic Update: Add to top
      setComments(prev => [createdComment, ...prev]);
      setNewComment('');
    } catch (err) {
      setSubmitError('发送失败，请检查连接后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const MAX_CHARS = 500;
  const isOverLimit = newComment.length > MAX_CHARS;

  return (
    <div className={`rounded-sm border p-6 md:p-8 backdrop-blur-sm shadow-xl transition-colors duration-500 ${theme.card}`}>
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-dashed border-opacity-20" style={{ borderColor: isLightTheme ? '#d6d3d1' : 'rgba(255,255,255,0.1)' }}>
        <MessageSquare className={`w-5 h-5 ${theme.accent}`} />
        <h3 className={`text-lg font-serif font-bold ${theme.textPrimary}`}>
          档案评议 / COMMENTS <span className={`ml-2 text-xs font-mono opacity-60`}>({comments.length})</span>
        </h3>
      </div>

      {/* Input Area */}
      <div className="mb-10">
        {currentUser ? (
          <div className="flex gap-4">
            {/* Avatar */}
            <div className={`shrink-0 w-10 h-10 rounded-sm overflow-hidden border flex items-center justify-center ${theme.border} ${theme.inputBg}`}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className={`w-5 h-5 opacity-50 ${theme.textPrimary}`} />
              )}
            </div>

            {/* Text Box */}
            <div className="flex-1">
              <div className={`relative border rounded-sm transition-colors focus-within:border-opacity-100 ${theme.inputBg} ${isOverLimit ? 'border-red-500/50' : 'border-opacity-50'} ${theme.border}`}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="在此输入您的见解与补充..."
                  disabled={isSubmitting}
                  className={`w-full bg-transparent p-4 min-h-[100px] outline-none text-sm font-sans resize-y placeholder-opacity-30 ${theme.textPrimary} ${isLightTheme ? 'placeholder-stone-400' : 'placeholder-parchment'}`}
                />
                <div className={`absolute bottom-2 right-3 text-[10px] font-mono transition-colors ${
                  isOverLimit ? 'text-red-400 font-bold' : 'opacity-40'
                } ${theme.textSecondary}`}>
                  {newComment.length} / {MAX_CHARS}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-3">
                <div className="text-xs text-red-400 min-h-[20px]">
                  {submitError && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {submitError}</span>}
                </div>
                <div className="flex gap-3">
                  {newComment.length > 0 && (
                    <button 
                      onClick={() => setNewComment('')}
                      disabled={isSubmitting}
                      className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors uppercase tracking-wider flex items-center gap-1 opacity-60 hover:opacity-100 ${theme.buttonSecondary}`}
                    >
                      <Trash2 className="w-3 h-3" /> 清空
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !newComment.trim() || isOverLimit}
                    className={`px-6 py-1.5 text-xs font-bold rounded-sm transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${theme.buttonPrimary}`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    {isSubmitting ? '发送中...' : '发布评议'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Logged Out State
          <div className={`flex flex-col items-center justify-center py-8 border border-dashed rounded-sm ${theme.border} ${theme.highlight}`}>
            <p className={`text-sm font-serif italic mb-4 ${theme.textSecondary}`}>您需要拥有访问权限才能发表评议。</p>
            <button 
              onClick={onLoginClick}
              className={`px-6 py-2 border rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/10 ${isLightTheme ? 'border-amber-600 text-amber-700' : 'border-gold text-gold'}`}
            >
              <LogIn className="w-3 h-3" /> 接入系统 (登录)
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          // Skeleton Loading
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full ${theme.highlight}`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-32 rounded ${theme.highlight}`}></div>
                  <div className={`h-16 w-full rounded ${theme.highlight}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-3 font-mono">{error}</p>
            <button 
              onClick={loadComments}
              className={`text-xs underline underline-offset-4 hover:opacity-80 ${theme.textSecondary}`}
            >
              尝试重新连接
            </button>
          </div>
        ) : comments.length === 0 ? (
          // Empty State
          <div className={`text-center py-12 opacity-50 border border-transparent`}>
             <MessageSquare className={`w-8 h-8 mx-auto mb-3 opacity-30 ${theme.textSecondary}`} />
             <p className={`font-serif italic ${theme.textSecondary}`}>暂无评议记录。成为第一个留下痕迹的观察者吧。</p>
          </div>
        ) : (
          // List
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group animate-fade-in">
              {/* Avatar */}
              <div className={`shrink-0 w-8 h-8 mt-1 rounded-sm overflow-hidden border flex items-center justify-center ${theme.border} ${theme.inputBg}`}>
                 <UserHoverCard userId={comment.author.id} username={comment.author.username} avatarUrl={comment.author.avatarUrl} currentUser={currentUser || null} onInspectUser={onInspectUser} isLightTheme={isLightTheme}>
                     <div className="w-full h-full">
                        {comment.author.avatarUrl ? (
                            <img src={comment.author.avatarUrl} alt={comment.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className={`text-xs font-bold font-mono ${theme.textSecondary}`}>{comment.author.username.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                     </div>
                 </UserHoverCard>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                 <div className="flex items-baseline justify-between mb-1">
                    <span className={`text-xs font-bold font-mono tracking-wide ${theme.textPrimary}`}>
                      <UserHoverCard userId={comment.author.id} username={comment.author.username} avatarUrl={comment.author.avatarUrl} currentUser={currentUser || null} onInspectUser={onInspectUser} isLightTheme={isLightTheme}>
                          <span className="hover:text-gold cursor-pointer">{comment.author.username}</span>
                      </UserHoverCard>
                      {currentUser?.id === comment.author.id && <span className={`ml-2 text-[9px] px-1 rounded-sm border opacity-60 ${theme.border}`}>YOU</span>}
                    </span>
                    <span className={`text-[10px] font-mono opacity-50 ${theme.textSecondary}`}>
                      {getRelativeTime(comment.createdAt)}
                    </span>
                 </div>
                 <div className={`text-sm leading-relaxed font-serif ${theme.textSecondary}`}>
                   {comment.content}
                 </div>
                 <div className={`h-px w-full mt-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-current to-transparent ${isLightTheme ? 'text-stone-200' : 'text-white/5'}`}></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};