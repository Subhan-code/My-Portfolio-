import React, { useState, useEffect } from 'react';
import { PortfolioHome } from './components/PortfolioHome';
import { BlogPage } from './components/BlogPage';
import { BlogListPage } from './components/BlogListPage';
import { ProjectsPage } from './components/ProjectsPage';
import { ContactPage } from './components/ContactPage';
import { Footer } from './components/Footer';
import { AnimatePresence } from 'framer-motion';
import { Preloader } from './components/Preloader';
import { KanbanBoard } from './components/KanbanBoard';
import { CommandPalette } from './components/CommandPalette';
import { ExperimentsPage } from './components/ExperimentsPage';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [activeArticle, setActiveArticle] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // --- Hash Handling for Persistence ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove '#'
      if (hash) {
        if (hash.startsWith('article/')) {
          setCurrentView('blogs');
          setActiveArticle(hash.split('/')[1]);
        } else {
          setCurrentView(hash);
          setActiveArticle(undefined);
        }
      } else {
        setCurrentView('home');
        setActiveArticle(undefined);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Failsafe: auto-hide preloader after 5 seconds
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      if (isLoading) {
        console.log("Preloader failsafe triggered");
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(failsafeTimer);
  }, [isLoading]);

  // Debug: Log when app renders
  useEffect(() => {
    console.log("App rendered, isLoading:", isLoading);
  }, [isLoading]);

  // Toggle Theme
  const toggleTheme = () => {
    // Helper to switch theme state and DOM
    const switchTheme = () => {
      setIsDark((prev) => !prev);
      document.documentElement.classList.toggle('dark');
    };

    // Use View Transitions API if available
    if (document.startViewTransition) {
      document.startViewTransition(switchTheme);
    } else {
      switchTheme();
    }
  };

  const handleNavigate = (view: string, articleId?: string) => {
    // Artificial loading for view transitions
    setIsLoading(true);

    // Update hash which triggers the effect
    const newHash = view === 'home' ? '' : (view + (articleId ? `/article/${articleId}` : ''));
    if (window.location.hash.slice(1) !== newHash) {
      window.location.hash = newHash;
    } else {
      // If hash is same, just ensure state is right
      setCurrentView(view);
      setActiveArticle(articleId);
    }

    // Scroll handling
    if (view === 'home' || view === 'projects' || view === 'blogs' || view === 'contact' || view === 'kanban') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (

    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-blue-100 dark:selection:bg-white/20 transition-colors duration-300 font-sans">

      <AnimatePresence mode="wait">
        {isLoading && (
          <Preloader onComplete={() => {
            console.log("Preloader completed");
            setIsLoading(false);
          }} />
        )}
      </AnimatePresence>

      <div className="relative z-0">
        {currentView === 'home' && (
          <PortfolioHome
            onNavigate={handleNavigate}
            toggleTheme={toggleTheme}
            isDark={isDark}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsPage
            onNavigate={handleNavigate}
            toggleTheme={toggleTheme}
            isDark={isDark}
          />
        )}

        {currentView === 'blogs' && (
          <BlogPage
            onNavigate={handleNavigate}
            toggleTheme={toggleTheme}
            isDark={isDark}
            activeArticleId={activeArticle}
          />
        )}

        {currentView === 'contact' && (
          <ContactPage
            onNavigate={handleNavigate}
            toggleTheme={toggleTheme}
            isDark={isDark}
          />
        )}

        {currentView === 'kanban' && (
          <KanbanBoard onNavigate={handleNavigate} />
        )}

        {currentView === 'experiments' && (
          <ExperimentsPage onNavigate={handleNavigate} />
        )}
      </div>

      {currentView !== 'home' && <Footer />}

      {/* Bottom Blur Overlay - 10% height, progressive mask, max 80% opacity */}
      <div
        className="fixed bottom-0 left-0 w-full h-[10vh] z-50 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)'
        }}
      >
        <div className="w-full h-full bg-gradient-to-t from-white/80 to-transparent dark:from-black/80 dark:to-transparent backdrop-blur-md" />
      </div>

      <CommandPalette
        onNavigate={handleNavigate}
        toggleTheme={toggleTheme}
        isDark={isDark}
      />

    </div>

  );
}



export default App;