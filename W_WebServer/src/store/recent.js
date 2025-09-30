export const recent = [];
const MAX = 100;
export function pushRecent(doc){ recent.unshift(doc); if(recent.length>MAX) recent.pop(); }
