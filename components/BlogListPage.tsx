import React from 'react';
import { BlogCard } from './ui/AppleSection';
import { PageShell, PageHeader } from './ui/PageShell';
import { POSTS } from '../lib/posts';

interface BlogListPageProps {
    onNavigate: (view: string, id?: string) => void;
    toggleTheme: () => void;
    isDark: boolean;
}

export const BlogListPage: React.FC<BlogListPageProps> = ({ onNavigate }) => (
    <PageShell onBack={() => onNavigate('home')}>
        <PageHeader
            title="Articles"
            subtitle="Essays on interface design, system architecture, motion and software craft."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
            {POSTS.map((post, index) => (
                <BlogCard
                    key={post.id}
                    meta={`${post.date} · ${post.readTime}`}
                    title={post.title}
                    excerpt={post.excerpt}
                    onSelect={() => onNavigate('blogs', post.id)}
                />
            ))}
        </div>
    </PageShell>
);
