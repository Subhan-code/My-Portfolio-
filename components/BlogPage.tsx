import React, { useEffect } from 'react';
import { POSTS } from '../lib/posts';
import { InterfaceDesign } from './articles/InterfaceDesign';
import { DistributedSystems } from './articles/DistributedSystems';
import { DesignSystems } from './articles/DesignSystems';
import { ScrollAnimations } from './articles/ScrollAnimations';
import { BlogListPage } from './BlogListPage';

interface BlogPageProps {
  onNavigate: (view: string, id?: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
  activeArticleId?: string | null;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onNavigate, toggleTheme, isDark, activeArticleId }) => {
  // Tab title matches the static page the build writes for this URL
  const post = POSTS.find((p) => p.id === activeArticleId);
  useEffect(() => {
    const previous = document.title;
    document.title = post ? `${post.title} | Syed Subhan` : 'Articles | Syed Subhan';
    return () => { document.title = previous; };
  }, [post]);

  // If no article ID, show the list
  if (!activeArticleId) {
    return <BlogListPage onNavigate={onNavigate} toggleTheme={toggleTheme} isDark={isDark} />;
  }

  // Router for articles
  switch (activeArticleId) {
    case 'distributed-systems':
      return <DistributedSystems onNavigate={onNavigate} toggleTheme={toggleTheme} isDark={isDark} />;
    case 'design-systems':
      return <DesignSystems onNavigate={onNavigate} toggleTheme={toggleTheme} isDark={isDark} />;
    case 'scroll-animations':
      return <ScrollAnimations onNavigate={onNavigate} toggleTheme={toggleTheme} isDark={isDark} />;
    default:
      // Default / Interface Design
      return <InterfaceDesign onNavigate={onNavigate} toggleTheme={toggleTheme} isDark={isDark} />;
  }
};