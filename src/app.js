import { filterActivities, validateActivity } from './logic.js';
import { bookingBreakdown, filterProfiles, validateProfile, validateReservation, MelbourneDate, PLATFORM_FEE_BPS } from './marketplace.js';
import { sampleProfiles, sampleActivities, weekdays, services, areas } from './data.js';
import { esc, money, options, icon, portrait } from './ui.js';
import { createCommunity } from './community.js';

const $ = selector => document.querySelector(selector);
const read = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
let ownActivities = read('mates.activities');
let activityBookings = read('mates.bookings');
let myProfiles = read('mates.profiles');
let orders = read('mates.orders');
let favorites = read('mates.favorites');
let incoming = read('mates.incoming');
let filters = { query: '', service: '全部', area: '全部区域', gender: '不限', maxRate: 200, sort: '推荐' };
let activityFilter = { category: '全部', area: '全部区域', mode: '全部方式', query: '' };
let favoritesOnly = false;
let orderTab = 'outgoing';
let editing = false;
let installPrompt;
const feePercent = PLATFORM_FEE_BPS / 100;
const profileList = () => [...myProfiles, ...sampleProfiles];
const getProfile = id => profileList().find(p => p.id === id);
const allActivities = () => [...ownActivities, ...sampleActivities];
const makeId = () => globalThis.crypto?.randomUUID?.() || `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast('保存失败：浏览器存储空间不足，请减少照片或检查设置'); return false; } };
const isOwn = p => myProfiles.some(x => x.id === p.id);
function toast(message) {
  $('.toast')?.remove();
  const node = document.createElement('div'); node.className = 'toast'; node.setAttribute('role', 'status'); node.textContent = message;
  document.body.append(node); setTimeout(() => node.remove(), 3500);
}
function route() { try { return decodeURIComponent(location.hash.slice(1) || 'discover'); } catch { return 'discover'; } }
function navigate(target) { if (route() === target) render(); else location.hash = target; }
let openEditorOnRoute = false;
function openProfileEditor() { if (route() === 'me') { editing = true; render(); } else { openEditorOnRoute = true; navigate('me'); } }
window.addEventListener('hashchange', () => { closeModal(); editing = route() === 'me' && openEditorOnRoute; openEditorOnRoute = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); });
const community = createCommunity({ navigate, toast, showModal, closeModal, profileList, getProfile, portrait, esc, money, icon, options, renderRoot: render, openActivity: publishActivity });
const navItems = [['discover', 'discover', '发现'], ['requests', 'requests', '需求'], ['publish', 'plus', '发布'], ['messages', 'messages', '消息'], ['me', 'me', '我的']];
function nav(active, mobile = false) {
  return `<nav class="${mobile ? 'bottom-nav' : 'desktop-nav'}" aria-label="${mobile ? '手机' : '主'}导航">${navItems.map(([key, glyph, title]) => `<a class="nav-item ${active === key ? 'is-active' : ''}" href="#${key}" ${active === key ? 'aria-current="page"' : ''}><span class="nav-icon">${icon(glyph)}</span><span>${title}</span></a>`).join('')}</nav>`;
}
function render() {
  const current = route();
  const active = current.startsWith('request/') ? 'requests' : current.startsWith('thread/') ? 'messages' : ['publish', 'requests', 'messages', 'me'].includes(current) ? current : current === 'orders' ? 'me' : 'discover';
  let content = community.render(current);
  if (content !== null) { /* Community routes render through the shared mobile shell. */ }
  else if (current.startsWith('profile/')) content = profilePage(current.split('/')[1]);
  else if (current === 'activities') content = activitiesPage();
  else if (current === 'orders') content = ordersPage();
  else if (current === 'me') content = mePage();
  else if (current === 'guide') content = guidePage();
  else if (current === 'verification') content = verificationPage();
  else if (current === 'companions') content = discoverPage();
  else content = '<div class="empty">找不到这个页面。<a href="#discover">返回发现</a></div>';
  $('#app').innerHTML = `<header class="app-header"><a href="#discover" class="brand"><span class="brand-mark">↗</span>碰个面<span class="header-location">${icon('pin')} 墨尔本</span></a>${nav(active)}<div class="header-actions"><a class="secondary" href="#publish">${icon('plus')} 发布</a><a class="icon-button" href="#guide" aria-label="平台指南">?</a></div></header><main class="app-main">${content}<footer class="app-footer"><span>碰个面 · 让需求找到合适的人。</span><a href="#guide">规则与费用说明</a><span>墨尔本华人社区 · 本机交互演示</span></footer></main>${nav(active, true)}`;
  bindCommon();
  community.bind(current);
  if (current === 'companions') bindDiscovery();
  if (current.startsWith('profile/')) bindProfile(getProfile(current.split('/')[1]));
  if (current === 'activities') bindActivities();
  if (current === 'orders') bindOrders();
  if (current === 'verification') bindVerification();
  if (current === 'me') { bindMe(); community.bindMyServices?.(); }
}
function bindCommon() {
  document.querySelectorAll('[data-action="listing"]').forEach(button => button.onclick = openProfileEditor);
  document.querySelectorAll('[data-favorite]').forEach(button => button.onclick = () => {
    const id = button.dataset.favorite;
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    if (!save('mates.favorites', next)) return; favorites = next;
    button.classList.toggle('selected', favorites.includes(id)); button.setAttribute('aria-pressed', String(favorites.includes(id)));
    if (favoritesOnly && $('#profile-cards')) renderProfileCards();
  });
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => navigate(`profile/${button.dataset.view}`));
  $('#install-app')?.addEventListener('click', installApp);
}
function discoverPage() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow">MEET SOMEONE · MAKE A DAY</div><h1>心动的日常，<br>找个人<span>一起过。</span></h1><p class="muted">认识墨尔本的同频新朋友。<br>从吃饭、逛街、看展开始，把时间留给喜欢的生活。</p><div class="hero-stats"><span>自己定价</span><span>按小时预约</span><span>先沟通，再见面</span></div><button class="primary" id="browse-people">看看谁能陪我 ${icon('arrow')}</button><button class="text-button" data-action="listing">我也想展示自己 ↗</button></div><div class="hero-visual" aria-label="个人展示插画"><div class="hero-portrait">${portrait(sampleProfiles[1])}<div class="hero-caption">小鹿 <span>${money(28)} / 小时</span></div></div><div class="hero-portrait">${portrait(sampleProfiles[2])}<div class="hero-caption">Lucas <span>${money(30)} / 小时</span></div></div><div class="hero-pill">✦ 一杯咖啡，开始一段相遇</div></div></section><div class="prototype-note">当前是 App 原型：示例人物使用插画，预约不扣款；你的展示与照片仅保存在当前设备。</div><section id="people"><div class="section-heading"><div><div class="eyebrow">PEOPLE, NOT PLANS</div><h2>先找到让你想见的人</h2></div><span class="muted">墨尔本 · 按兴趣认识</span></div><div class="search-box">${icon('search')}<input type="search" id="profile-search" value="${esc(filters.query)}" placeholder="搜索昵称、兴趣或自我介绍" aria-label="搜索人物"></div><div class="filter-strip">${['全部', ...services].map(s => `<button class="filter-chip ${filters.service === s ? 'selected' : ''}" data-service="${s}">${s}</button>`).join('')}<button class="filter-chip ${favoritesOnly ? 'selected' : ''}" id="favorites-only">${icon('heart')} 收藏</button></div><div class="filter-controls"><select id="profile-area" aria-label="地区">${options(['全部区域', ...areas], filters.area)}</select><select id="profile-gender" aria-label="性别">${options(['不限', '女生', '男生', '其他'], filters.gender)}</select><select id="profile-price" aria-label="最高时薪">${[200, 20, 30, 50].map(v => `<option value="${v}" ${filters.maxRate === v ? 'selected' : ''}>${v === 200 ? '不限价格' : `≤ A$${v} / 小时`}</option>`).join('')}</select><select id="profile-sort" aria-label="排序">${options(['推荐', '价格从低到高', '价格从高到低'], filters.sort)}</select></div><div class="profile-grid" id="profile-cards">${profileCards()}</div></section><div class="dashboard-banner"><div><div class="eyebrow">YOUR TIME, YOUR PRICE</div><h2>把你的个性，变成展示面。</h2><p>上传照片，写下兴趣和服务内容，设定你自己的每小时价格。</p></div><button class="primary" data-action="listing">建立我的展示 ${icon('arrow')}</button></div><div class="install-banner"><div>${icon('discover')} <strong>像 App 一样，放在手机主屏幕。</strong><p class="muted">支持添加到主屏幕。当前版本还不是 App Store / Google Play 安装包。</p></div><button class="secondary" id="install-app">添加到主屏幕</button></div>`;
}
function profileCards() {
  const items = filterProfiles(profileList(), filters).filter(p => !favoritesOnly || favorites.includes(p.id));
  return items.length ? items.map(p => `<article class="profile-card"><div class="profile-cover"><a class="profile-link" href="#profile/${esc(p.id)}" aria-label="查看${esc(p.name)}的展示">${portrait(p)}</a><span class="sample-label">${p.sample ? '示例插画' : '我的展示'}</span><button class="favorite ${favorites.includes(p.id) ? 'selected' : ''}" data-favorite="${esc(p.id)}" aria-label="收藏${esc(p.name)}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button><div class="profile-overlay"><span>${p.minHours} 小时起约</span></div></div><div class="profile-body"><div class="profile-name"><a href="#profile/${esc(p.id)}"><h3>${esc(p.name)}</h3></a><span>${p.age} · ${esc(p.gender)}</span></div><div class="profile-meta">${icon('pin')} ${esc(p.area)} · 墨尔本</div><div class="interest-tags">${p.services.slice(0, 2).map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div><p class="profile-bio">${esc(p.tagline || p.bio)}</p><div class="profile-footer"><div class="hourly-price">${money(p.rate)}<small>/ 小时</small></div><button class="primary" data-view="${esc(p.id)}">看主页 ${icon('arrow')}</button></div></div></article>`).join('') : '<div class="empty">没有找到符合条件的人。换个筛选，或建立你自己的展示。</div>';
}
function renderProfileCards() { $('#profile-cards').innerHTML = profileCards(); bindCommon(); }
function bindDiscovery() {
  $('#browse-people').onclick = () => $('#people').scrollIntoView({ behavior: 'smooth' });
  $('#profile-search').oninput = e => { filters.query = e.target.value; renderProfileCards(); };
  document.querySelectorAll('[data-service]').forEach(b => b.onclick = () => { filters.service = b.dataset.service; render(); });
  $('#favorites-only').onclick = () => { favoritesOnly = !favoritesOnly; render(); };
  for (const [id, key, numeric] of [['profile-area', 'area'], ['profile-gender', 'gender'], ['profile-price', 'maxRate', true], ['profile-sort', 'sort']]) {
    $(`#${id}`).onchange = e => { filters[key] = numeric ? Number(e.target.value) : e.target.value; renderProfileCards(); };
  }
}
function profilePage(id) {
  const p = getProfile(id);
  if (!p) return '<div class="empty">这个展示暂时不存在。<a href="#discover">返回发现</a></div>';
  const photos = Math.max(1, p.photos?.length || 0);
  return `<a href="#companions" class="back-button">${icon('back')} 返回陪伴</a><div class="detail-layout"><div class="detail-gallery"><div class="profile-cover">${portrait(p)}<span class="sample-label">${p.sample ? '示例人物 · 插画展示' : '我的展示 · 仅当前设备'}</span></div>${photos > 1 ? `<div class="photo-preview">${p.photos.slice(1).map((_, index) => portrait(p, index + 1)).join('')}</div>` : ''}</div><section class="detail-panel"><div class="eyebrow">LET’S SPEND A LITTLE TIME TOGETHER</div><div class="detail-title"><h1>${esc(p.name)}<small>${p.age} · ${esc(p.gender)}</small></h1><button class="favorite ${favorites.includes(p.id) ? 'selected' : ''}" data-favorite="${esc(p.id)}" aria-label="收藏${esc(p.name)}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div><div class="detail-stats"><span>${icon('pin')} ${esc(p.area)} · 墨尔本</span><span>${esc(p.languages || '普通话')}</span></div><p class="profile-bio">${esc(p.tagline || '期待与你，一起度过好时光。')}</p><div class="detail-block"><h3>认识一下我</h3><p>${esc(p.bio)}</p></div><div class="detail-block"><h3>可以陪你做什么</h3><div class="interest-tags">${p.services.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div></div><div class="detail-block"><h3>我的可预约日</h3><div class="slot-tags">${p.available.map(d => `<span class="tag">${esc(d)}</span>`).join('')}</div><p class="muted">具体时间以双方确认结果为准，页面不是实时空闲状态。</p></div><div class="guideline"><strong>提前说清楚，见面更自在。</strong><p>活动在公共场所进行。餐饮、门票和交通各自支付或提前约定；陪伴服务不承诺恋爱关系。</p></div><div class="booking-bar"><div class="hourly-price">${money(p.rate)}<small>/ 小时 · ${p.minHours} 小时起</small></div><button class="primary" id="book-profile" ${!isOwn(p) && !p.active ? 'disabled' : ''}>${isOwn(p) ? '编辑我的展示' : p.active ? '预约陪伴' : '暂未上架'} ${icon('arrow')}</button></div>${isOwn(p) ? '' : '<p class="prototype-note">仅模拟申请，不联系真实人物、不扣款。</p>'}</section></div>`;
}
function bindProfile(p) {
  if (!p) return;
  $('#book-profile').onclick = () => { if (isOwn(p)) { openProfileEditor(); } else bookProfile(p); };
}
let modalFocus;
function showModal(title, body) {
  closeModal(); modalFocus = document.activeElement;
  const wrapper = document.createElement('div'); wrapper.className = 'dialog-backdrop';
  wrapper.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-head"><h2 id="dialog-title">${title}</h2><button class="close" aria-label="关闭">×</button></div>${body}</section>`;
  document.body.append(wrapper);
  wrapper.querySelector('.close').onclick = closeModal;
  wrapper.onclick = e => { if (e.target === wrapper) closeModal(); };
  wrapper.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key !== 'Tab') return;
    const nodes = [...wrapper.querySelectorAll('button, input, select, textarea, a[href]')].filter(n => !n.disabled && !n.closest('[hidden]'));
    if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0].focus(); }
  });
  wrapper.querySelector('.close').focus();
}
function closeModal() { $('.dialog-backdrop')?.remove(); modalFocus?.isConnected && modalFocus.focus(); }
function nextAvailableDate(p) {
  for (let i = 1; i <= 7; i++) { const date = MelbourneDate(i); const day = new Date(`${date}T12:00:00Z`).getUTCDay(); if (p.available.includes(weekdays[(day + 6) % 7])) return date; }
  return MelbourneDate(1);
}
function bookProfile(p) {
  if (orders.some(o => o.profileId === p.id && !['已取消', '已完成', '已拒绝'].includes(o.status))) { toast('你已预约过这个人，请先在预约页查看或取消'); return; }
  showModal(`预约 ${esc(p.name)}`, `<p class="muted">${money(p.rate)} / 小时 · ${p.minHours} 小时起约</p><form id="profile-booking"><label class="field">想一起做什么<select name="service">${options(p.services)}</select></label><div class="row"><label class="field">日期（墨尔本）<input type="date" name="date" min="${MelbourneDate()}" max="${MelbourneDate(60)}" value="${nextAvailableDate(p)}" required></label><label class="field">开始时间<input type="time" name="time" value="14:00" min="09:00" max="22:00" required></label></div><label class="field">预约时长<select name="hours" id="booking-hours">${Array.from({ length: 9 - p.minHours }, (_, n) => n + p.minHours).map(h => `<option value="${h}">${h} 小时</option>`).join('')}</select></label><label class="field">我的留言<textarea name="message" minlength="1" maxlength="300" placeholder="想在哪里见面？介绍一下你的计划。" required></textarea></label><div class="price-list"><div class="price-line"><span>陪伴费</span><span id="booking-math"></span></div><div class="price-line"><span>餐饮、门票、交通</span><span>另行约定</span></div><div class="price-line total"><strong>预计合计</strong><strong id="booking-total"></strong></div></div><p class="income-note">平台佣金由接单方承担，不额外叠加到上述价格。这里是模拟申请，没有付款。</p><label class="check"><input type="checkbox" required><span>我已满 18 岁，同意见面前确认活动与费用，尊重对方意愿。</span></label><p class="error" id="booking-error" role="alert"></p><button class="primary full" type="submit">提交预约申请</button></form>`);
  const update = () => { const hours = Number($('#booking-hours').value); const breakdown = bookingBreakdown(p.rate, hours, p.minHours); $('#booking-math').textContent = `${money(p.rate)} × ${hours} 小时`; $('#booking-total').textContent = money(breakdown.total); };
  update(); $('#booking-hours').onchange = update;
  $('#profile-booking').onsubmit = e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); f.hours = Number(f.hours); f.message = f.message.trim();
    const error = validateReservation(p, f); if (error) { $('#booking-error').textContent = error; return; }
    const o = { ...f, id: makeId(), profileId: p.id, name: p.name, area: p.area, rate: p.rate, status: '待对方确认', ...bookingBreakdown(p.rate, f.hours, p.minHours), createdAt: new Date().toISOString(), sample: true };
    const next = [o, ...orders]; if (!save('mates.orders', next)) return; orders = next; orderTab = 'outgoing'; closeModal(); navigate('orders'); toast('模拟申请已保存，不会扣款或通知真实人物');
  };
}
function activitiesPage() {
  return `<div class="page-heading"><div class="eyebrow">DO SOMETHING TOGETHER</div><h1>找搭子，一起玩。</h1><p class="muted">免费结伴也有自己的位置，活动开销提前说清楚。</p></div><div class="section-heading"><h2>最近的计划</h2><button class="primary" id="publish-activity">${icon('plus')} 发布活动</button></div><div class="filter-strip">${['全部', '美食', '娱乐', '运动', '艺术', '闲逛'].map(c => `<button class="filter-chip ${c === activityFilter.category ? 'selected' : ''}" data-category="${c}">${c}</button>`).join('')}</div><div class="activity-grid" id="activity-cards">${activityCards()}</div>`;
}
function activityCards() {
  const items = filterActivities(allActivities(), activityFilter);
  return items.length ? items.map(a => `<article class="activity-card"><div class="activity-emoji">${esc(a.emoji || '☕')}</div><div><span class="tag">${esc(a.mode || '免费搭子')}${a.id.startsWith('s') ? ' · 示例' : ' · 我的发布'}</span><h3>${esc(a.title)}</h3><p class="muted">${esc(a.description)}</p><div class="activity-meta">${icon('pin')} ${esc(a.area)} · ${esc(a.date)} ${esc(a.time)}</div><p class="muted">${esc(a.cost)}</p><button class="secondary" data-activity="${esc(a.id)}">${a.id.startsWith('u') ? '管理活动' : '申请同行'} ${icon('arrow')}</button></div></article>`).join('') : '<div class="empty">暂时没有该类型的活动，发起你的第一个计划吧。</div>';
}
function bindActivities() {
  $('#publish-activity').onclick = publishActivity;
  document.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { activityFilter.category = b.dataset.category; render(); });
  document.querySelectorAll('[data-activity]').forEach(b => b.onclick = () => activityDetails(allActivities().find(a => a.id === b.dataset.activity)));
}
function activityDetails(a) {
  if (a.id.startsWith('u')) { confirmDeleteActivity(a.id); return; }
  if (activityBookings.some(b => b.activityId === a.id && b.status !== '已取消')) { toast('已申请过此活动，请在预约页查看'); return; }
  showModal(esc(a.title), `<p class="muted">${esc(a.date)} ${esc(a.time)} · ${esc(a.area)}<br>${esc(a.cost)}</p><form id="activity-join"><label class="field">给发起人的留言<textarea name="message" maxlength="300" required placeholder="简单介绍一下自己"></textarea></label><label class="check"><input type="checkbox" required><span>我已满 18 岁，尊重他人边界，并在公共场所见面。</span></label><p class="prototype-note">模拟申请，仅保存到当前设备，不通知真实人物。</p><button class="primary full" type="submit">提交同行申请</button></form>`);
  $('#activity-join').onsubmit = e => { e.preventDefault(); const message = String(new FormData(e.target).get('message')).trim(); if (!message) { toast('请填写留言'); return; } const booking = { id: makeId(), activityId: a.id, title: a.title, name: a.name, date: a.date, time: a.time, area: a.area, hours: 1, total: a.rate || 0, message, status: '待对方确认（模拟）' }; const next = [booking, ...activityBookings]; if (!save('mates.bookings', next)) return; activityBookings = next; orderTab = 'outgoing'; closeModal(); navigate('orders'); toast('同行申请已保存'); };
}
function publishActivity() {
  showModal('发起一个免费搭子活动', `<form id="activity-publish"><label class="field">昵称<input name="name" maxlength="24" required></label><label class="field">标题<input name="title" maxlength="40" required placeholder="周末找人一起喝咖啡"></label><div class="row"><label class="field">类型<select name="category">${options(['美食', '娱乐', '运动', '艺术', '闲逛'])}</select></label><label class="field">区域<select name="area">${options(areas)}</select></label></div><div class="row"><label class="field">日期<input type="date" name="date" min="${MelbourneDate()}" value="${MelbourneDate(1)}" required></label><label class="field">时间<input type="time" name="time" value="14:00" required></label></div><label class="field">活动说明<textarea name="description" maxlength="500" required></textarea></label><label class="field">费用分担<input name="cost" maxlength="150" required placeholder="餐费 AA，每人预计 A$30"></label><label class="check"><input type="checkbox" required><span>我已满 18 岁，同意在公共场所见面。</span></label><p class="error" id="activity-error" role="alert"></p><p class="prototype-note">仅保存到本机，付费服务请通过个人展示上架。</p><button class="primary full" type="submit">发布活动</button></form>`);
  $('#activity-publish').onsubmit = e => { e.preventDefault(); const a = { ...Object.fromEntries(new FormData(e.target)), id: 'u' + makeId(), mode: '免费搭子', rate: 0, emoji: '☕' }; const error = validateActivity(a); if (error) { $('#activity-error').textContent = error; return; } const next = [a, ...ownActivities]; if (!save('mates.activities', next)) return; ownActivities = next; closeModal(); render(); toast('活动已发布到当前设备'); };
}
function ordersPage() {
  const list = orderTab === 'incoming' ? incoming : orders;
  return `<div class="page-heading"><div class="eyebrow">A LITTLE PLAN TO LOOK FORWARD TO</div><h1>我的预约</h1><p class="muted">申请、确认、见面，把每一步说清楚。当前订单均为模拟。</p></div><div class="filter-strip"><button class="filter-chip ${orderTab === 'outgoing' ? 'selected' : ''}" data-order-tab="outgoing">我预约的</button><button class="filter-chip ${orderTab === 'incoming' ? 'selected' : ''}" data-order-tab="incoming">我接到的 · 演示</button></div>${list.length ? list.map(o => orderCard(o, orderTab === 'incoming')).join('') : `<div class="empty">${orderTab === 'incoming' ? '还没有接单演示。先在“我的”建立展示，再生成演示询价。' : '还没有预约。从一个想见的人开始吧。'}</div>`}${orderTab === 'outgoing' ? `<h2>搭子活动申请</h2>${activityBookings.length ? activityBookings.map(b => `<article class="order-card"><div class="status">${esc(b.status)}</div><h3>${esc(b.title)}</h3><p class="muted">${esc(b.name)} · ${esc(b.area)} · ${esc(b.date)} ${esc(b.time)}</p><p class="muted">留言：${esc(b.message)}</p>${b.total ? `<p>原有活动预计费用 ${money(b.total)} · 无真实付款</p>` : '<span class="tag">免费搭子 · 开销另计</span>'}${b.status !== '已取消' ? `<button class="secondary" data-cancel-activity="${esc(b.id)}">取消活动申请</button>` : ''}</article>`).join('') : '<p class="muted">还没有活动申请。</p>'}` : '<p class="income-note">演示询价由你主动生成，不代表真实客户或真实收入。</p>'}`;
}
function orderCard(o, provider) {
  const actions = provider ? (o.status === '待我确认' ? `<button class="primary" data-transition="accept" data-order="${o.id}">接受预约</button><button class="secondary" data-transition="decline" data-order="${o.id}">拒绝预约</button>` : o.status === '已接受，待付款' ? `<button class="secondary" data-transition="paid" data-order="${o.id}">演示客户付款</button>` : o.status === '已预约' ? `<button class="primary" data-transition="complete" data-order="${o.id}">演示完成活动</button>` : '') : (o.status === '待对方确认' ? `<button class="secondary" data-cancel-order="${o.id}">取消预约</button>` : '');
  return `<article class="order-card"><div class="status">${esc(o.status)} · 模拟订单</div><h3>${provider ? '客户：' : '预约：'}${esc(o.name)}</h3><div class="order-summary"><span>${esc(o.service)}</span><span>${esc(o.area)} · ${esc(o.date)} ${esc(o.time)}</span><span>${o.hours} 小时 · ${money(o.rate)} / 小时</span></div><p class="muted">${esc(o.message)}</p><div class="price-list"><div class="price-line"><strong>订单金额</strong><strong>${money(o.total)}</strong></div>${provider ? `<div class="price-line"><span>平台佣金（${feePercent}% 试算）</span><span>− ${money(o.platformFee)}</span></div><div class="price-line total"><strong>${o.status === '已完成' ? '模拟到手金额' : '预计到手'}</strong><strong>${money(o.providerEarnings)}</strong></div>` : ''}</div><div class="order-actions">${actions}</div></article>`;
}
function bindOrders() {
  document.querySelectorAll('[data-order-tab]').forEach(b => b.onclick = () => { orderTab = b.dataset.orderTab; render(); });
  document.querySelectorAll('[data-cancel-order]').forEach(b => b.onclick = () => confirmAction('取消这次预约？', '原型没有实际扣款或退款，取消后可以重新申请。', () => { const next = orders.map(o => o.id === b.dataset.cancelOrder && o.status === '待对方确认' ? { ...o, status: '已取消' } : o); if (save('mates.orders', next)) { orders = next; render(); } }));
  document.querySelectorAll('[data-cancel-activity]').forEach(b => b.onclick = () => confirmAction('取消同行申请？', '取消后可以重新申请。', () => { const next = activityBookings.map(o => o.id === b.dataset.cancelActivity ? { ...o, status: '已取消' } : o); if (save('mates.bookings', next)) { activityBookings = next; render(); } }));
  document.querySelectorAll('[data-transition]').forEach(b => b.onclick = () => {
    const map = { accept: ['待我确认', '已接受，待付款'], decline: ['待我确认', '已拒绝'], paid: ['已接受，待付款', '已预约'], complete: ['已预约', '已完成'] };
    const [from, to] = map[b.dataset.transition];
    const next = incoming.map(o => o.id === b.dataset.order && o.status === from ? { ...o, status: to } : o);
    if (!save('mates.incoming', next)) return; incoming = next; render(); toast(to === '已完成' ? '演示完成：收入试算已更新，无实际资金转账' : `演示订单：${to}`);
  });
}
function confirmAction(title, body, action) { showModal(title, `<p class="muted">${body}</p><button class="primary full" id="confirm-action">确认</button>`); $('#confirm-action').onclick = () => { closeModal(); action(); }; }
function confirmDeleteActivity(id) { confirmAction('删除这个活动？', '删除后将从当前设备的活动列表移除。', () => { const next = ownActivities.filter(a => a.id !== id); if (save('mates.activities', next)) { ownActivities = next; render(); } }); }
function mePage() {
  const p = myProfiles[0];
  const completed = incoming.filter(o => o.status === '已完成');
  const communityIncome = community.getIncomeSummary?.() || { completedCount: 0, total: 0, platformFee: 0, providerEarnings: 0 };
  const sum = key => completed.reduce((acc, o) => acc + Math.round(o[key] * 100), 0) / 100 + (communityIncome[key] || 0);
  return `<div class="page-heading"><div class="eyebrow">YOUR SPACE, YOUR PACE</div><h1>我的展示面</h1><p class="muted">你是什么样的人，愿意陪别人做什么，由你自己定义。</p></div><div class="c-actions"><a class="secondary" href="#messages">${icon('messages')} 消息与订单</a><a class="secondary" href="#orders">${icon('orders')} 活动与陪伴预约</a><a class="secondary" href="#verification">核验中心</a></div>${editing ? profileEditor(p) : p ? `<div class="dashboard-banner"><div><h2>${esc(p.name)} <span class="tag">${p.active ? '展示中' : '已暂停'}</span></h2><p>${esc(p.area)} · ${money(p.rate)} / 小时 · ${p.minHours} 小时起约</p><p>${esc(p.bio)}</p></div><div class="order-actions"><button class="primary" id="edit-profile">编辑展示</button><button class="secondary" data-view="${esc(p.id)}">看我的主页</button><button class="text-button" id="toggle-listing">${p.active ? '暂停上架' : '重新上架'}</button></div></div>` : `<div class="dashboard-banner"><div><h2>给自己一个展示面</h2><p>先写写你是谁，再挂出自己的服务与价格。</p></div><button class="primary" data-action="listing">建立个人展示</button></div>`}${community.renderMyServices?.() || ''}<section class="detail-block"><div class="section-heading"><div><h2>接单与收入试算</h2><p class="muted">仅已完成的演示订单计入，不含支付手续费和税费。</p></div></div><div class="metric-grid"><div class="metric-card"><span>完成订单</span><strong>${completed.length + communityIncome.completedCount}</strong></div><div class="metric-card"><span>订单金额</span><strong>${money(sum('total'))}</strong></div><div class="metric-card"><span>平台佣金 · ${feePercent}%</span><strong>${money(sum('platformFee'))}</strong></div><div class="metric-card"><span>我的模拟收入</span><strong>${money(sum('providerEarnings'))}</strong></div></div><div class="guideline"><strong>你定价，平台按完成订单抽成。</strong><p>例如 ${money(30)} / 小时 × 2 小时 = ${money(60)}，按 ${feePercent}% 试算，平台佣金 ${money(9)}，接单方到手 ${money(51)}。佣金比例可在商业验证后调整，当前不收取任何费用。</p></div>${p ? `<button class="secondary" id="generate-inquiry" ${!p.active ? 'disabled' : ''}>生成一笔演示询价</button><p class="income-note">用它体验接受预约、模拟付款和完成结算。不会联系真实用户。</p>` : '<p class="income-note">保存个人展示后，可以体验接单流程。</p>'}</section><section class="detail-block"><h2>我的活动</h2>${ownActivities.length ? ownActivities.map(a => `<div class="order-card"><h3>${esc(a.title)}</h3><p class="muted">${esc(a.date)} · ${esc(a.area)}</p><button class="text-button" data-delete-activity="${esc(a.id)}">删除活动</button></div>`).join('') : '<p class="muted">还没有发起搭子活动。</p>'}</section>`;
}
function profileEditor(p) {
  const example = p || { name: '', age: 22, gender: '女生', area: 'CBD', rate: 20, minHours: 1, bio: '', services: [], available: ['周六', '周日'], photos: [], active: true };
  return `<form class="profile-editor" id="profile-editor"><h2>${p ? '编辑我的个人展示' : '建立你的第一张个人展示'}</h2><p class="muted">头像与照片、个性介绍、服务内容、价格和时间，是别人了解你的开始。</p><label class="field">展示照片（最多 3 张）<input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><div class="photo-preview" id="photo-preview">${example.photos.length ? example.photos.map((_, i) => portrait(example, i)).join('') : '<span class="muted">可选：上传你有权使用的照片；未上传时使用示意插画。</span>'}</div><button class="text-button" id="clear-photos" type="button">清空照片</button><div class="row"><label class="field">展示昵称<input name="name" maxlength="24" required value="${esc(example.name)}" placeholder="别人怎么称呼你"></label><label class="field">年龄<input name="age" type="number" min="18" max="80" required value="${example.age}"></label></div><div class="row"><label class="field">性别<select name="gender">${options(['女生', '男生', '其他'], example.gender)}</select></label><label class="field">活动区域<select name="area">${options(areas, example.area)}</select></label></div><label class="field">一句话介绍<input name="tagline" maxlength="60" value="${esc(example.tagline || '')}" placeholder="一起发现城市里的小美好"></label><label class="field">自我介绍<textarea name="bio" minlength="10" maxlength="300" required placeholder="写写你的兴趣、相处方式和可以提供的活动陪伴">${esc(example.bio)}</textarea></label><label class="field">交流语言<input name="languages" maxlength="60" value="${esc(example.languages || '普通话')}" placeholder="普通话 · English"></label><fieldset class="detail-block"><legend>我能提供的陪伴活动（至少选一项）</legend><div class="service-options">${services.map(s => `<label class="service-option"><input type="checkbox" name="services" value="${s}" ${example.services.includes(s) ? 'checked' : ''}>${s}</label>`).join('')}</div></fieldset><div class="row"><label class="field">每小时时薪（澳元）<input name="rate" id="profile-rate" type="number" min="10" max="200" step="0.01" value="${example.rate}" required></label><label class="field">最低预约时长<select name="minHours" id="profile-min-hours">${Array.from({ length: 8 }, (_, i) => i + 1).map(n => `<option value="${n}" ${example.minHours === n ? 'selected' : ''}>${n} 小时</option>`).join('')}</select></label></div><div class="price-list"><div class="price-line"><span>最短预约金额</span><strong id="listing-total"></strong></div><div class="price-line"><span>平台佣金 · ${feePercent}% 试算</span><span id="listing-fee"></span></div><div class="price-line total"><span>预计到手</span><strong id="listing-net"></strong></div></div><fieldset class="detail-block"><legend>可以接单的日子</legend><div class="slot-tags">${weekdays.map(d => `<label class="service-option"><input type="checkbox" name="available" value="${d}" ${example.available.includes(d) ? 'checked' : ''}>${d}</label>`).join('')}</div></fieldset><label class="check"><input type="checkbox" name="active" ${example.active ? 'checked' : ''}><span>保存后上架展示（可随时暂停）</span></label><label class="check"><input type="checkbox" required><span>我已满 18 岁，照片有权使用，提供公共场所的活动陪伴，尊重双方意愿。</span></label><p class="prototype-note">展示只保存在当前设备，尚未发布给真实用户。请勿上传身份证件或填写私人住址。</p><p class="error" id="profile-error" role="alert"></p><button class="primary full" type="submit">${p ? '保存我的展示' : '保存并建立展示'}</button>${p ? '<button class="text-button full" type="button" id="cancel-edit">取消编辑</button>' : ''}</form>`;
}
async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 照片');
  if (file.size > 10 * 1024 * 1024) throw new Error('单张照片不能超过 10MB');
  const url = URL.createObjectURL(file);
  try { const img = new Image(); img.src = url; await img.decode(); const scale = Math.min(1, 900 / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', 0.8); } finally { URL.revokeObjectURL(url); }
}
function bindMe() {
  const p = myProfiles[0];
  $('#edit-profile')?.addEventListener('click', () => { editing = true; render(); });
  $('#cancel-edit')?.addEventListener('click', () => { editing = false; render(); });
  $('#toggle-listing')?.addEventListener('click', () => { const next = myProfiles.map(x => x.id === p.id ? { ...x, active: !x.active } : x); if (save('mates.profiles', next)) { myProfiles = next; render(); toast(next[0].active ? '展示已重新上架' : '展示已暂停，不再出现在发现页'); } });
  document.querySelectorAll('[data-delete-activity]').forEach(b => b.onclick = () => confirmDeleteActivity(b.dataset.deleteActivity));
  $('#generate-inquiry')?.addEventListener('click', () => {
    if (!p?.active) return;
    if (incoming.some(o => !['已完成', '已拒绝', '已取消'].includes(o.status))) { orderTab = 'incoming'; navigate('orders'); toast('先处理已有的演示询价'); return; }
    const o = { id: makeId(), profileId: p.id, name: 'Alex（演示客户）', area: p.area, service: p.services[0], hours: p.minHours, date: nextAvailableDate(p), time: '14:00', rate: p.rate, message: '想一起喝咖啡，方便的话请确认时间。（演示询价）', status: '待我确认', ...bookingBreakdown(p.rate, p.minHours, p.minHours) };
    const next = [o, ...incoming]; if (!save('mates.incoming', next)) return; incoming = next; orderTab = 'incoming'; navigate('orders');
  });
  const form = $('#profile-editor');
  if (!form) return;
  const find = selector => form.querySelector(selector);
  let photos = [...(p?.photos || [])]; let uploading = false;
  const paintPhotos = () => { if (!form.isConnected) return; find('#photo-preview').innerHTML = photos.length ? photos.map((_, i) => portrait({ name: '我的', photos }, i)).join('') : '<span class="muted">未上传照片，将使用示意插画。</span>'; };
  find('#photo-upload').onchange = async e => {
    if (uploading) return;
    const input = e.currentTarget;
    const files = [...input.files]; if (photos.length + files.length > 3) { find('#profile-error').textContent = '最多上传 3 张照片，请先清空后重选'; e.target.value = ''; return; }
    uploading = true; input.disabled = true; const submit = find('button[type="submit"]'); submit.disabled = true;
    try { const prepared = []; for (const file of files) prepared.push(await preparePhoto(file)); if (!form.isConnected) return; photos = [...photos, ...prepared]; paintPhotos(); find('#profile-error').textContent = ''; } catch (error) { if (form.isConnected) find('#profile-error').textContent = error.message; }
    finally { uploading = false; if (form.isConnected) { submit.disabled = false; input.disabled = false; input.value = ''; } }
  };
  find('#clear-photos').onclick = () => { if (uploading) return; photos = []; paintPhotos(); };
  const updateQuote = () => { try { const amounts = bookingBreakdown(Number(find('#profile-rate').value), Number(find('#profile-min-hours').value)); find('#listing-total').textContent = money(amounts.total); find('#listing-fee').textContent = '− ' + money(amounts.platformFee); find('#listing-net').textContent = money(amounts.providerEarnings); } catch { find('#listing-total').textContent = '—'; find('#listing-fee').textContent = '—'; find('#listing-net').textContent = '—'; } };
  updateQuote(); find('#profile-rate').oninput = updateQuote; find('#profile-min-hours').onchange = updateQuote;
  form.onsubmit = e => {
    e.preventDefault(); if (uploading) return; const data = new FormData(e.target);
    const profile = { ...Object.fromEntries(data), id: p?.id || 'self-' + makeId(), name: String(data.get('name')).trim(), age: Number(data.get('age')), rate: Number(data.get('rate')), minHours: Number(data.get('minHours')), bio: String(data.get('bio')).trim(), services: data.getAll('services'), available: data.getAll('available'), photos, active: data.has('active'), sample: false, style: data.get('gender') === '男生' ? 2 : 1 };
    const error = validateProfile(profile); if (error) { find('#profile-error').textContent = error; return; }
    const next = [profile]; if (!save('mates.profiles', next)) return; myProfiles = next; editing = false; render(); toast('个人展示已保存到当前设备');
  };
}
function verificationPage() {
  return `<div class="page-heading"><div class="eyebrow">TRUST STARTS WITH CLARITY</div><h1>核验中心</h1><p class="muted">知道核验过什么，才能安心选择。</p></div><div class="prototype-note">认证功能将在后续迭代接入。当前资料均未完成实际核验，请勿上传证件或人脸材料。</div><div class="c-feed-grid">${[['photo', '真人照片核验', '检查展示照片是否与本人匹配。'], ['identity', '身份与成年核验', '检查身份与平台的成年人要求。'], ['career', '职业经历核验', '检查某段工作或专业经历，并注明核验范围。']].map(([key, title, description]) => `<article class="order-card"><span class="tag">尚未接入</span><h3>${title}</h3><p>${description}</p><button class="secondary" data-verification="${key}">了解核验流程</button></article>`).join('')}</div>`;
}
function bindVerification() {
  const descriptions = { photo: '未来通过受支持的真人照片匹配流程检查照片与本人一致。现在不采集照片核验材料，也不会显示虚假的认证结果。', identity: '未来使用第三方核验流程，由后端确认身份与成年状态。证件不放在公开资料、聊天或当前浏览器。', career: '未来区分本人填写、待审核和某段经历已核验，并显示核验日期。职业经历标识不表示企业背书。' };
  document.querySelectorAll('[data-verification]').forEach(button => button.onclick = () => showModal('核验流程说明', `<p>${descriptions[button.dataset.verification]}</p><p class="prototype-note">原型仅展示规划，未接入核验服务。</p>`));
}
function guidePage() {
  const entries = [
    ['如何使用', '发现页有职业交流、活动陪伴、有偿求助和兴趣搭子。职业服务支持 30／60 分钟套餐；需求可以申请帮助或选择申请者。消息页承接模拟订单与对话。免费活动的开销另行约定。'],
    ['平台怎样盈利', `第一阶段以完成订单抽成作为收入来源，当前按 ${feePercent}% 做商业试算。比如 A$60 的订单，平台佣金 A$9，服务者预计到手 A$51。佣金从服务者订单金额扣除，不向预约者额外加价；支付手续费、税费与真实退款规则尚未接入。免费搭子不收佣金。`],
    ['你的展示，你的定价', '所有成年人都可以建立自己的展示，无论女生、男生或其他性别。填写照片、介绍、兴趣、服务和可预约日，设定每小时 A$10–200、最低 1–8 小时，并随时暂停展示。上线后需要完成账号、年龄和身份核验。'],
    ['服务与见面边界', '提供公共场所的活动陪伴，不承诺恋爱关系或性服务。双方都有权拒绝不舒服的要求，见面前确认地点、活动和费用。首次见面建议告知信任的人你的计划。'],
    ['原型与数据', '人物插画是示例，不代表真实用户或已核验身份。你的照片、展示、收藏和订单只保存在当前浏览器，不跨设备共享。所有支付与收入都是模拟。清除浏览器数据会删除这些内容。'],
    ['手机版与安装', '这是支持主屏幕安装的网页 App。Android 浏览器可使用安装或添加到主屏幕；iPhone Safari 可点击分享 → 添加到主屏幕。不是 App Store 或 Google Play 安装包，浏览器对安装支持可能不同。'],
  ];
  return `<div class="page-heading"><div class="eyebrow">CLEAR RULES, BETTER CONNECTIONS</div><h1>平台指南</h1><p class="muted">价格、流程和边界，见面之前说清楚。</p></div>${entries.map(([h, text]) => `<section class="detail-block guideline"><h2>${h}</h2><p>${text}</p></section>`).join('')}`;
}
async function installApp() {
  if (installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = undefined; return; }
  showModal('添加到手机主屏幕', '<p class="muted">iPhone：使用 Safari 打开页面，点击分享，再选“添加到主屏幕”。</p><p class="muted">Android：打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。安装需要受支持的浏览器和 HTTPS 网站。</p><p class="prototype-note">当前是网页 App 原型，尚未发布原生商店版。</p>');
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register(new URL('../sw.js', import.meta.url)).catch(() => { /* Installation support is optional in unsupported browsers. */ }));
}
render();
