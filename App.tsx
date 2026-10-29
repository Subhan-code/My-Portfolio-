import React, { useState, useEffect, Suspense, lazy } from 'react';
import { PortfolioHome } from './components/PortfolioHome';
import { Footer } from './components/Footer';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { EASE_OUT, EASE_EXIT } from './lib/motion';
import { GridReveal } from './components/GridReveal';
import { Toaster } from './components/ui/Toast';
import { GridToggle } from './components/ui/GridToggle';
import { BackToTop } from './components/ui/BackToTop';

// Inner pages load on demand: the home page ships without them
const BlogPage = lazy(() => import('./components/BlogPage').then((m) => ({ default: m.BlogPage })));
const ProjectsPage = lazy(() => import('./components/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ContactPage = lazy(() => import('./components/ContactPage').then((m) => ({ default: m.ContactPage })));
const KanbanBoard = lazy(() => import('./components/KanbanBoard').then((m) => ({ default: m.KanbanBoard })));
const ExperimentsPage = lazy(() => import('./components/ExperimentsPage').then((m) => ({ default: m.ExperimentsPage })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette })));

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [activeArticle, setActiveArticle] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(true);

  // -- Init isLoading based on session/daily persistence --
  const [isLoading, setIsLoading] = useState(() => {
    // Preloader: main route only, once per session, never for reduced motion
    const isMainPage = window.location.pathname === '/' && (!window.location.hash || window.location.hash === '#');
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try { seen = sessionStorage.getItem('preloader-seen') === '1'; } catch { }
    return isMainPage && !reducedMotion && !seen;
  });

  // Easter egg: switch tabs and the title notices you left
  useEffect(() => {
    let saved = '';
    const onVisibility = () => {
      if (document.hidden) {
        saved = document.title;
        document.title = 'Still drafting… come back';
      } else if (saved) {
        document.title = saved;
        saved = '';
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Easter egg for whoever opens devtools: a hello in the console, once per load
  useEffect(() => {
    console.log(
      '%c</>%c  Hey, you opened the console. Fellow detail person.\n\nTry: press G for the layout grid, triple-click my name, long-press my photo, tap the handwritten time, tap the heart in the footer.\nSay hi at syednotion@gmail.com',
      'font: 700 14px ui-monospace, monospace; color: #fff; background: #000; padding: 4px 8px; border-radius: 999px;',
      'font: 13px/1.6 Inter, system-ui, sans-serif; color: inherit;'
    );
  }, []);

  // --- Hash Handling for Persistence ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove '#'
      if (hash) {
        if (hash.startsWith('article/')) {
          setCurrentView('blogs');
          setActiveArticle(hash.split('/')[1]);
        } else if (hash.startsWith('blogs/article/')) {
          setCurrentView('blogs');
          setActiveArticle(hash.replace('blogs/article/', ''));
        } else {
          setCurrentView(hash);
          setActiveArticle(undefined);
        }
      } else {
        setCurrentView('home');
        setActiveArticle(undefined);
      }
    };

    // Crawlable article URLs (/articles/<id>) are real static pages; open the article
    const pathArticle = window.location.pathname.match(/^\/articles\/([\w-]+)\/?$/);
    if (pathArticle && !window.location.hash) {
      setCurrentView('blogs');
      setActiveArticle(pathArticle[1]);
    } else {
      handleHashChange();
    }

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

  useEffect(() => {
    if (!isLoading) {
      try { sessionStorage.setItem('preloader-seen', '1'); } catch { }
    }
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
    // Artificial loading removed for internal navigation to keep preloader only for initial load

    // Special handling for Contact: Scroll to section instead of new page
    if (view === 'contact') {
      const scrollToContact = () => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      };

      if (currentView !== 'home') {
        setCurrentView('home');
        // Allow time for Home component to mount
        setTimeout(scrollToContact, 450);
      } else {
        // If already on home, just scroll
        scrollToContact();
      }
      // Update hash to reflect contact? Maybe just keep it as home or #contact?
      // User just said "redirect to contact section".
      // If we change hash to #contact, logic might try to update view?
      // window.location.hash = 'contact'; -> this triggers hashchange listener -> logic in useEffect?
      // The useEffect at line 20 (not shown but implied) handles hash change.
      // If I manually handle it here, I should perhaps NOT change hash to avoid loop or just return.
      return;
    }

    // Leaving a landing URL like /articles/<id>: go back to the root so a refresh lands where you are
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }

    // Update hash which triggers the effect
    const newHash = view === 'home' ? '' : (view + (articleId ? `/article/${articleId}` : ''));
    if (window.location.hash.slice(1) !== newHash) {
      window.location.hash = newHash;
    } else {
      // If hash is same, just ensure state is right
      setCurrentView(view);
      setActiveArticle(articleId || null);
    }

    // Scroll is reset in onExitComplete, while the screen is blank
  };

  return (

    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 font-sans">

      <AnimatePresence mode="wait">
      {/* Site-wide: a toast for small confirmations, and the G-key layout grid */}
      <Toaster />
      <GridToggle />

        {/* Intro plate: the page's grid draws itself, then clears to reveal the site */}
        {isLoading && (
          <GridReveal onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* Page transitions: opacity only — a transform here would break the fixed navigation */}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div
        key={currentView + (activeArticle ?? '')}
        className="relative z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_EXIT } }}
      >
        {/* Black placeholder while an inner page's chunk loads, so nothing flashes */}
        <Suspense fallback={<div className="min-h-[100dvh] bg-black" />}>
        {currentView === 'home' && (
          <PortfolioHome
            onNavigate={handleNavigate}
            toggleTheme={toggleTheme}
            isDark={isDark}
            introReady={!isLoading}
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
        </Suspense>
      </motion.div>
      </AnimatePresence>

      {/* Home and Lab carry their own footers */}
      {currentView !== 'home' && currentView !== 'experiments' && <Footer />}

      {/* Back to top everywhere; sits above the search pill where that pill exists */}
      <BackToTop raised={currentView !== 'home' && currentView !== 'experiments' && currentView !== 'kanban'} />

      {/* Home and Lab are quiet single pages, so no floating search pill there */}
      {currentView !== 'home' && currentView !== 'experiments' && currentView !== 'kanban' && (
        <Suspense fallback={null}>
          <CommandPalette
            onNavigate={handleNavigate}
            toggleTheme={toggleTheme}
            isDark={isDark}
          />
        </Suspense>
      )}

    </div>
    </MotionConfig>

  );
}



export default App;