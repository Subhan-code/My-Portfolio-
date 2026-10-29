import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * A field of dots that breathes in a slow diagonal wave and brightens around the
 * cursor. Canvas, one rAF loop, paused while off-screen. Reduced motion: still dots.
 */
export const DotField = ({ className }: { className?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reduce = useReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const GAP = 22;
        const RADIUS = 140;
        let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
        // Pointer in canvas space, eased so the glow glides instead of jumping
        const target = { x: -9999, y: -9999 };
        const pos = { x: -9999, y: -9999 };

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            const r = canvas.getBoundingClientRect();
            w = r.width; h = r.height;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const draw = (t: number) => {
            ctx.clearRect(0, 0, w, h);
            pos.x += (target.x - pos.x) * 0.12;
            pos.y += (target.y - pos.y) * 0.12;
            const cols = Math.ceil(w / GAP) + 1;
            const rows = Math.ceil(h / GAP) + 1;
            const ox = (w - (cols - 1) * GAP) / 2;
            const oy = (h - (rows - 1) * GAP) / 2;

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = ox + i * GAP;
                    const y = oy + j * GAP;
                    // Idle: a slow wave rolling across the diagonal
                    const wave = reduce ? 0.5 : 0.5 + 0.5 * Math.sin((i + j) * 0.35 - t * 0.0012);
                    let a = 0.1 + wave * 0.14;
                    let r = 1.1;
                    const d = Math.hypot(x - pos.x, y - pos.y);
                    if (d < RADIUS) {
                        const k = 1 - d / RADIUS;
                        const e = k * k * (3 - 2 * k); // smoothstep falloff
                        a += e * 0.75;
                        r += e * 0.9;
                    }
                    // Fade the field out toward the bottom so it melts into the page
                    a *= Math.min(1, (h - y) / (h * 0.45));
                    if (a <= 0.01) continue;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${a})`;
                    ctx.fill();
                }
            }
        };

        const loop = (t: number) => {
            if (visible) draw(t);
            raf = requestAnimationFrame(loop);
        };

        // mousemove fires for real pointers only (touch doesn't drag the glow around)
        const onMove = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect();
            target.x = e.clientX - r.left;
            target.y = e.clientY - r.top;
            if (pos.x < -1000) { pos.x = target.x; pos.y = target.y; }
        };
        const onLeave = () => { target.x = -9999; target.y = -9999; };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
        io.observe(canvas);
        window.addEventListener('mousemove', onMove, { passive: true });
        document.addEventListener('mouseleave', onLeave);

        if (reduce) draw(0);
        else raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
            window.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseleave', onLeave);
        };
    }, [reduce]);

    return <canvas ref={canvasRef} aria-hidden className={className} />;
};
