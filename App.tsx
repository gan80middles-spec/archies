import React, { useState, useEffect } from 'react';
import { ArchiveView } from './components/ArchiveView';
import { EditorWorkspace } from './components/EditorWorkspace';
import { LoginView } from './components/LoginView';
import { ProfileView } from './components/ProfileView';
import { NotificationsView } from './components/NotificationsView';
import { INITIAL_ENTRIES, INITIAL_TERMS } from './constants';
import { Entry, User, Category, Term } from './types';

type ViewState = 'ARCHIVE' | 'EDITOR' | 'PROFILE' | 'NOTIFICATIONS';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  
  // New state to track which user profile is being viewed
  const [viewedUser, setViewedUser] = useState<User | null>(null);

  const [currentView, setCurrentView] = useState<ViewState>('ARCHIVE');
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [terms, setTerms] = useState<Term[]>(INITIAL_TERMS);
  const [isLightTheme, setIsLightTheme] = useState(false);
  
  // Workspace specific state triggers
  const [initialOpenEntryId, setInitialOpenEntryId] = useState<string | undefined>(undefined);
  const [initialOpenTermName, setInitialOpenTermName] = useState<string | undefined>(undefined);

  const toggleTheme = () => {
      setIsLightTheme(prev => {
          if (!prev) document.body.classList.add('light-theme');
          else document.body.classList.remove('light-theme');
          return !prev;
      });
  };

  const handleLogin = (user: User) => {
    setUser(user);
    setCurrentView('ARCHIVE');
  };

  const handleNavigateToEditor = (category?: Category, title?: string) => {
    setInitialOpenEntryId(undefined);
    setInitialOpenTermName(undefined);
    setCurrentView('EDITOR');
  };

  const handleNavigateToProfile = () => {
    // Navigate to own profile
    setViewedUser(null); 
    setCurrentView('PROFILE');
  };

  // Logic to view any user's profile
  const handleInspectUser = (userId: string, username: string, avatarUrl?: string) => {
      // Create a temporary User object for the view since we don't have a backend to fetch full user details by ID immediately.
      // In a real app, ProfileView would fetch data by ID. Here we pass what we know.
      const mockViewedUser: User = {
          id: userId,
          username: username,
          email: 'restricted@omni.net',
          joinDate: Date.now() - 10000000,
          likedEntries: [],
          bookmarks: [],
          avatar: avatarUrl,
          bio: 'Data redacted. Accessing public record.' // Default bio for visited profiles
      };
      
      // If inspecting self, just clear viewedUser to use 'user' state
      if (user && userId === user.id) {
          setViewedUser(null);
      } else {
          setViewedUser(mockViewedUser);
      }
      setCurrentView('PROFILE');
  };

  const handleNavigateToNotifications = () => {
    setCurrentView('NOTIFICATIONS');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('ARCHIVE');
  };

  const handleSaveEntry = (newEntryData: Omit<Entry, 'id' | 'createdAt' | 'likes' | 'author'>) => {
      const newEntry: Entry = {
          ...newEntryData,
          id: Date.now().toString(),
          createdAt: Date.now(),
          likes: 0,
          author: user ? user.username : 'Anonymous',
          authorId: user ? user.id : 'unknown'
      };
      setEntries(prev => [newEntry, ...prev]);
      return newEntry.id;
  };

  const handleUpdateProfile = (data: Partial<User>) => {
      if (!user) return;
      // If we are updating our own profile
      setUser({ ...user, ...data });
  };

  const handleLike = (id: string) => {
      if (!user) return;
      // Use likedEntries instead of favorites
      const isLiked = user.likedEntries.includes(id);
      
      // Update User State
      setUser(prev => prev ? ({
          ...prev,
          likedEntries: isLiked 
            ? prev.likedEntries.filter(fid => fid !== id)
            : [...prev.likedEntries, id]
      }) : null);

      // Update Entry State (optimistic UI)
      setEntries(prev => prev.map(e => {
          if (e.id === id) {
              return { ...e, likes: isLiked ? e.likes - 1 : e.likes + 1 };
          }
          return e;
      }));
  };

  const handleBookmark = (id: string) => {
      if (!user) return;
      const isBookmarked = user.bookmarks.includes(id);
      
      setUser(prev => prev ? ({
          ...prev,
          bookmarks: isBookmarked
            ? prev.bookmarks.filter(bid => bid !== id)
            : [...prev.bookmarks, id]
      }) : null);
  };

  const handleUpdateTerm = (updatedTerm: Term) => {
      setTerms(prev => {
          // If ID exists, update
          if (prev.find(t => t.id === updatedTerm.id)) {
              return prev.map(t => t.id === updatedTerm.id ? updatedTerm : t);
          }
          // Else add new
          return [...prev, updatedTerm];
      });
  };
  
  const handleResolveTermOnly = (term: Term) => {
      // Force object recreation to ensure state update
      const updated: Term = {
          ...term,
          status: 'term_only'
      };
      handleUpdateTerm(updated);
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} isLightTheme={isLightTheme} onToggleTheme={toggleTheme} />;
  }

  return (
    <>
      {currentView === 'ARCHIVE' && (
        <ArchiveView 
            entries={entries} 
            user={user} 
            onNavigateToEditor={handleNavigateToEditor} 
            onNavigateToProfile={handleNavigateToProfile}
            onNavigateToNotifications={handleNavigateToNotifications}
            onLike={handleLike}
            onBookmark={handleBookmark}
            isLightTheme={isLightTheme}
            onToggleTheme={toggleTheme}
            onInspectUser={handleInspectUser}
        />
      )}
      
      {currentView === 'EDITOR' && (
        <EditorWorkspace 
            entries={entries}
            terms={terms}
            onBack={() => setCurrentView('ARCHIVE')}
            onSaveEntry={handleSaveEntry}
            onUpdateTerm={handleUpdateTerm}
            onResolveTermOnly={handleResolveTermOnly}
            isLightTheme={isLightTheme}
            onToggleTheme={toggleTheme}
            initialOpenEntryId={initialOpenEntryId}
            initialOpenTermName={initialOpenTermName}
        />
      )}

      {currentView === 'PROFILE' && (
        <ProfileView 
            user={viewedUser || user} // Display inspected user or current user
            currentUser={user} // Always pass the logged in user as currentUser
            entries={entries} 
            onBack={() => setCurrentView('ARCHIVE')} 
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            onLike={handleLike}
            onBookmark={handleBookmark}
            isLightTheme={isLightTheme}
            onToggleTheme={toggleTheme}
            onNavigateToEditor={handleNavigateToEditor}
            onInspectUser={handleInspectUser}
        />
      )}

      {currentView === 'NOTIFICATIONS' && (
        <NotificationsView 
            onBack={() => setCurrentView('ARCHIVE')}
            isLightTheme={isLightTheme}
        />
      )}
    </>
  );
}