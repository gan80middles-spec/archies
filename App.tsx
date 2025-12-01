import React, { useState, useEffect } from 'react';
import { ArchiveView } from './components/ArchiveView';
import { EditorView } from './components/EditorView';
import { LoginView } from './components/LoginView';
import { ProfileView } from './components/ProfileView';
import { INITIAL_ENTRIES } from './constants';
import { Entry, User, Category } from './types';

type ViewState = 'ARCHIVE' | 'EDITOR' | 'PROFILE';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('ARCHIVE');
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [editorInitialCategory, setEditorInitialCategory] = useState<Category | undefined>(undefined);

  // Apply theme to body
  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightTheme]);

  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
  };

  const handleNavigateToEditor = (category?: Category) => {
    setEditorInitialCategory(category);
    setCurrentView('EDITOR');
  };

  const handleUpload = (newEntryData: Omit<Entry, 'id' | 'createdAt' | 'likes' | 'author'>) => {
    const newEntry: Entry = {
      ...newEntryData,
      id: Date.now().toString(),
      createdAt: Date.now(),
      likes: 0,
      author: user?.username || '未知记录员',
      authorId: user?.id,
      tags: newEntryData.tags || []
    };
    setEntries(prev => [newEntry, ...prev]);
    setCurrentView('ARCHIVE');
  };

  const handleLike = (id: string) => {
    if (!user) return;

    const isLiked = user.favorites.includes(id);
    
    // Update Entry Like Count
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, likes: entry.likes + (isLiked ? -1 : 1) } : entry
    ));

    // Update User Favorites
    setUser(prev => {
        if (!prev) return null;
        const newFavorites = isLiked 
            ? prev.favorites.filter(favId => favId !== id)
            : [...prev.favorites, id];
        return { ...prev, favorites: newFavorites };
    });
  };

  const handleUpdateProfile = (updatedUser: Partial<User>) => {
      setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  };

  const handleLogout = () => {
      setUser(null);
      setCurrentView('ARCHIVE');
  };

  if (!user) {
    return <LoginView onLogin={setUser} isLightTheme={isLightTheme} onToggleTheme={toggleTheme} />;
  }

  return (
    <>
      {currentView === 'ARCHIVE' && (
        <ArchiveView 
          entries={entries} 
          user={user}
          onNavigateToEditor={handleNavigateToEditor}
          onNavigateToProfile={() => setCurrentView('PROFILE')}
          onLike={handleLike}
          isLightTheme={isLightTheme}
          onToggleTheme={toggleTheme}
        />
      )}
      
      {currentView === 'EDITOR' && (
        <EditorView 
          onBack={() => setCurrentView('ARCHIVE')} 
          onSave={handleUpload}
          isLightTheme={isLightTheme}
          initialCategory={editorInitialCategory}
          onToggleTheme={toggleTheme}
          entries={entries} 
        />
      )}

      {currentView === 'PROFILE' && (
        <ProfileView
            user={user}
            currentUser={user}
            entries={entries}
            onBack={() => setCurrentView('ARCHIVE')}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            onLike={handleLike}
            isLightTheme={isLightTheme}
            onToggleTheme={toggleTheme}
            onNavigateToEditor={() => handleNavigateToEditor()}
        />
      )}
    </>
  );
}