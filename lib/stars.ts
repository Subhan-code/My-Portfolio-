import { useEffect, useState } from 'react';

/*
 * Live GitHub star count for a repo, as "2.7K+". GitHub allows 60 unauthenticated
 * requests an hour per visitor, so the count is cached for an hour; until it arrives
 * (or if GitHub is unreachable) the last known figure shows instead.
 */

export const AMICRO_REPO = 'Subhan-code/Amicro--Micro-transitions-';
/** Last checked by hand; shown before the live count lands */
export const AMICRO_STARS = '2.7K+';

const TTL = 60 * 60 * 1000;

/** 2726 → "2.7K+", 950 → "950" */
export const formatStars = (n: number) =>
    n >= 1000 ? `${Math.floor(n / 100) / 10}K+` : String(n);

export const useGithubStars = (repo: string, fallback: string) => {
    const key = `stars:${repo}`;
    const [stars, setStars] = useState(() => {
        try {
            const c = JSON.parse(localStorage.getItem(key) || 'null');
            if (c && typeof c.n === 'number') return formatStars(c.n);
        } catch { }
        return fallback;
    });

    useEffect(() => {
        try {
            const c = JSON.parse(localStorage.getItem(key) || 'null');
            if (c && Date.now() - c.at < TTL) return;
        } catch { }
        const ctrl = new AbortController();
        fetch(`https://api.github.com/repos/${repo}`, { signal: ctrl.signal, headers: { Accept: 'application/vnd.github+json' } })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((j) => {
                if (typeof j.stargazers_count !== 'number') return;
                setStars(formatStars(j.stargazers_count));
                try { localStorage.setItem(key, JSON.stringify({ n: j.stargazers_count, at: Date.now() })); } catch { }
            })
            .catch(() => { /* keep the last known figure */ });
        return () => ctrl.abort();
    }, [key, repo]);

    return stars;
};
