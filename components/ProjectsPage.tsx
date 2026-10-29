import React from 'react';
import { PageShell, PageHeader } from './ui/PageShell';
import { ProjectBento, type BentoProject } from './ui/ProjectBento';
import { AmicroVisual, OxygenVisual, MonochartsVisual, CardioEnsembleVisual, AmacroVisual, AizenVerseVisual } from './ui/ProjectVisuals';
import { useGithubStars, AMICRO_REPO, AMICRO_STARS } from '../lib/stars';

interface ProjectsPageProps {
    onNavigate: (view: string) => void;
    toggleTheme: () => void;
    isDark: boolean;
}

const PROJECTS: BentoProject[] = [
    { name: 'Amicro', detail: 'Micro-interactions for React. {stars} stars, Vercel OSS ’26.', href: 'https://amicro.dev', media: <AmicroVisual /> },
    { name: 'Oxygen UI', detail: 'Solana UI primitives.', href: 'https://oxygenui.xyz', media: <OxygenVisual /> },
    { name: 'Monocharts', detail: 'Monochrome charts for React. 189 stars.', href: 'https://github.com/Subhan-code/Monocharts', media: <MonochartsVisual /> },
    { name: 'Aizen Verse', detail: 'Anime streaming with watch parties.', href: 'https://aizen-verse.vercel.app/', media: <AizenVerseVisual /> },
    { name: 'Amacro', detail: 'Page transitions for React.', href: 'https://github.com/Subhan-code/Amacro', media: <AmacroVisual /> },
    { name: 'CardioEnsemble', detail: 'Heart disease risk model.', href: 'https://github.com/Subhan-code/CardioEnsemble', media: <CardioEnsembleVisual /> },
];

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
    // Amicro's star count is live from GitHub
    const stars = useGithubStars(AMICRO_REPO, AMICRO_STARS);
    const projects = PROJECTS.map((p) => ({ ...p, detail: p.detail.replace('{stars}', stars) }));
    return (
        <PageShell onBack={() => onNavigate('home')}>
            <PageHeader title="Projects" subtitle="Open-source libraries, tools and products." />
            <div className="pb-20">
                <ProjectBento projects={projects} />
            </div>
        </PageShell>
    );
};
