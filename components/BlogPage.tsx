import React from 'react';
import { InterfaceDesign } from './articles/InterfaceDesign';
import { DistributedSystems } from './articles/DistributedSystems';

interface BlogPageProps {
  onNavigate: (view: string, id?: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
  activeArticleId?: string | null;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onNavigate, toggleTheme, isDark, activeArticleId }) => {
  // Simple router based on ID

  if (activeArticleId === 'distributed-systems') {
    return <DistributedSystems onNavigate={onNavigate} toggleTheme={toggleTheme} isDark={isDark} />;
  }

  // Default
  return <InterfaceDesign onNavigate={onNavigate} toggleTheme={toggleTheme} isDark={isDark} />;
};