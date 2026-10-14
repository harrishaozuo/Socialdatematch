import { demoPortraits } from './photos.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = value => `A$${Number(value).toLocaleString('en-AU', { minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2, maximumFractionDigits: 2 })}`;
export const options = (items, selected) => items.map(x => `<option ${x === selected ? 'selected' : ''}>${esc(x)}</option>`).join('');
const paths = {
  discover: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  activity: '<path d="M4 7h16v13H4zM7 4v6M17 4v6M4 12h16M8 16h2M14 16h2"/>',
  orders: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h6"/>',
  requests: '<path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h3"/>',
  messages: '<path d="M21 11a8 8 0 0 1-8 8H7l-5 3V11a9 9 0 0 1 19 0Z"/><path d="M7 10h10M7 14h6"/>',
  coffee: '<path d="M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM16 9h2a3 3 0 0 1 0 6h-2M7 2v3M12 2v3M2 22h18"/>',
  sparkles: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  share: '<path d="M12 16V3M7 8l5-5 5 5M5 12v8h14v-8"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4M4 5v15h16V7M20 12h-6v5h6"/>',
};
export const icon = name => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.discover}</svg>`;

export function portrait(profile, photoIndex = 0) {
  const uploaded = profile.photos?.[photoIndex];
  if (typeof uploaded === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(uploaded)) {
    return `<img class="portrait-art" src="${esc(uploaded)}" alt="${esc(profile.name)}的展示照片" decoding="async">`;
  }
  const source = profile.sample && photoIndex === 0 ? demoPortraits[profile.id] : null;
  if (source) return `<img class="portrait-art" src="${esc(source)}" alt="人物摄影素材，用于${esc(profile.name)}的虚构示例展示" decoding="async" data-demo-photo="true">`;
  return `<div class="portrait-art photo-placeholder" role="img" aria-label="尚未上传展示照片"><span>${esc(String(profile.name || '你').slice(0, 1))}</span><small>待上传照片</small></div>`;
}
