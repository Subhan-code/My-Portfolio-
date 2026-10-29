export type Post = {
    id: string;
    category: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
};

export const POSTS: Post[] = [
    {
        id: "interface-design",
        category: "Design",
        title: "The Future of Interface Design",
        excerpt: "Moving beyond screens: spatial computing, generative UI, and the shift towards intent-based interaction.",
        date: "Aug 12, 2024",
        readTime: "4 min read",
    },
    {
        id: "distributed-systems",
        category: "Engineering",
        title: "Scaling Distributed Systems",
        excerpt: "Understanding the CAP theorem, event sourcing, and strategies for global scale architecture.",
        date: "Sep 05, 2024",
        readTime: "7 min read",
    },
    {
        id: "design-systems",
        category: "Design",
        title: "Understanding Design Systems",
        excerpt: "Building a coherent visual language that scales across engineering and design teams.",
        date: "Apr 02, 2024",
        readTime: "6 min read",
    },
    {
        id: "scroll-animations",
        category: "Motion",
        title: "Mastering Scroll-Driven Animations",
        excerpt: "Using the CSS Scroll-Timeline API to create immersive storytelling experiences without JS.",
        date: "Mar 10, 2024",
        readTime: "4 min read",
    },
];
