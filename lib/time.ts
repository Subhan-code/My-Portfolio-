/** Time in India, the way the site writes it: "12:40 pm" */
export const istTime = (opts: Intl.DateTimeFormatOptions = {}) =>
    new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true, ...opts }).toLowerCase();

/** Hours and minutes India is ahead of (or behind) the visitor, in words */
export const istOffsetPhrase = () => {
    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const here = new Date(now.toLocaleString('en-US'));
    const mins = Math.round((ist.getTime() - here.getTime()) / 60000);
    if (Math.abs(mins) < 1) return 'same time as you';
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    const span = [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ');
    return `${span} ${mins > 0 ? 'ahead of' : 'behind'} you`;
};

/** Hours, minutes and seconds in India, for the clock face */
export const istParts = () => {
    const [h, m, s] = new Date()
        .toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
        .split(':')
        .map(Number);
    return { h, m, s };
};
