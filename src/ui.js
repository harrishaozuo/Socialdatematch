export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = value => `A$${Number(value).toLocaleString('en-AU', { minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2, maximumFractionDigits: 2 })}`;
export const options = (items, selected) => items.map(x => `<option ${x === selected ? 'selected' : ''}>${esc(x)}</option>`).join('');
const paths = {
  discover: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  activity: '<path d="M4 7h16v13H4zM7 4v6M17 4v6M4 12h16M8 16h2M14 16h2"/>',
  orders: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h6"/>',
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
  const photo = profile.photos?.[photoIndex];
  if (typeof photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(photo)) return `<img class="portrait-art" src="${esc(photo)}" alt="${esc(profile.name)}的展示照片">`;
  const i = Number(profile.style || 0) % 6;
  const backgrounds = ['#ddccbf', '#ccd6bb', '#c5d3cf', '#d9c7d4', '#e0d4b7', '#ced2dc'];
  const shirts = ['#f9f4e8', '#314c3c', '#f4ece0', '#795d76', '#334b48', '#f5f2e9'];
  const skin = ['#e5b99b', '#e8c5a6', '#c99070', '#e5b296', '#ddb291', '#eac6aa'][i];
  const longHair = profile.gender !== '男生';
  return `<svg class="portrait-art" viewBox="0 0 320 370" role="img" aria-label="${esc(profile.name)}的示例插画"><rect width="320" height="370" fill="${backgrounds[i]}"/><circle cx="262" cy="75" r="84" fill="#ffffff25"/><path d="M0 275Q150 180 320 270V370H0Z" fill="#ffffff20"/><path d="M52 370v-36c0-65 44-107 108-107s108 42 108 107v36" fill="${shirts[i]}"/>${longHair ? '<path d="M91 150c-7-83 20-115 68-115 53 0 78 37 72 117l16 123H76Z" fill="#39302a"/>' : '<path d="M91 109c0-47 31-74 69-74 43 0 71 24 70 79v54H92Z" fill="#39302a"/>'}<path d="M138 209v38q22 20 44 0v-38" fill="${skin}"/><ellipse cx="160" cy="142" rx="60" ry="79" fill="${skin}"/><path d="M96 113c-4-56 25-83 63-83 39 0 66 30 64 83-27-4-46-27-59-51-12 24-40 42-68 51Z" fill="#39302a"/><path d="M125 144h9M186 144h9" stroke="#39302a" stroke-width="4" stroke-linecap="round"/><path d="M147 183q13 12 26 0" stroke="#a26953" fill="none" stroke-width="3" stroke-linecap="round"/><path d="m144 162 4 9h-8" stroke="#bd896e" fill="none" stroke-width="2"/><circle cx="112" cy="163" r="8" fill="#e7a891" opacity=".55"/><circle cx="207" cy="163" r="8" fill="#e7a891" opacity=".55"/>${i % 2 ? '<circle cx="99" cy="168" r="4" fill="#e5d287"/><circle cx="220" cy="168" r="4" fill="#e5d287"/>' : ''}<path d="m131 239 29 40 29-40" stroke="#9caa9d" stroke-width="2" fill="none"/><path d="M0 355h320v15H0Z" fill="#19352c08"/></svg>`;
}
