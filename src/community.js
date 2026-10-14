import { demoServices as seedServices, demoProviders, demoRequests as seedRequests } from './community-data.js';
import { serviceQuote as quoteNative, validateServiceReservation as validateReservationNative, validateRequest as validateRequestNative, filterServices as filterNative, transitionDemoOrder as transitionNative } from './community-logic.js';
import { MelbourneDate } from './marketplace.js';

const demoServices = seedServices.map(s => ({ ...s, pricing: s.priceType === 'hour' ? 'hourly' : 'package', mode: s.format, topics: s.tags || [] }));
const demoRequests = seedRequests.map(r => ({ ...r, domain: r.domain === 'life' ? 'help' : r.domain === 'activity' ? 'companion' : r.domain, mode: r.format }));
const nativeService = s => ({ ...s, priceType: s.pricing === 'hourly' ? 'hour' : 'session', format: s.mode, tags: s.topics });
const serviceQuote = (s, r) => quoteNative(nativeService(s), r);
const validateServiceReservation = (s, r) => !r.adult ? '请确认已满 18 岁并理解这是演示预约' : validateReservationNative(nativeService(s), r);
const validateRequest = r => !r.adult ? '请确认已满 18 岁' : validateRequestNative({ ...r, domain: r.domain === 'help' ? 'life' : r.domain === 'companion' ? 'activity' : r.domain, format: r.mode });
const filterServices = (items, f) => filterNative(items.map(nativeService), { ...f, domain: f.domain === '全部' ? 'all' : f.domain }).map(s => ({ ...s, pricing: s.priceType === 'hour' ? 'hourly' : 'package', mode: s.format, topics: s.tags }));
const nativeStatuses = { pending: '待确认', accepted: '待付款', paid: '已预约', completed: '已完成', cancelled: '已取消', rejected: '已拒绝' };
const transitionDemoOrder = (order, action) => { const next = transitionNative({ ...order, status: nativeStatuses[order.status] }, action); return { ...next, status: Object.keys(nativeStatuses).find(k => nativeStatuses[k] === next.status) }; };

/** Browser-only community prototype. Every remote action requires an explicit demo button. */
export function createCommunity({ navigate, toast, showModal, closeModal, profileList, portrait, esc, money, icon, options, renderRoot, openActivity }) {
  const $ = selector => document.querySelector(selector);
  const read = key => { try { const data = JSON.parse(localStorage.getItem(`mates.v3.${key}`) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } };
  let ownServices = read('services'), ownRequests = read('requests'), applications = read('applications'), orders = read('orders'), threads = read('threads'), posts = read('posts');
  let filter = { query: '', domain: '全部' }, requestTab = 'all';
  const uid = () => globalThis.crypto?.randomUUID?.() || `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  const refresh = () => renderRoot ? renderRoot() : navigate(decodeURIComponent(location.hash.slice(1) || 'discover'));
  const allServices = () => [...ownServices, ...demoServices];
  const allRequests = () => [...ownRequests, ...demoRequests];
  const findService = id => allServices().find(s => s.id === id);
  const self = () => profileList().find(p => p.sample === false) || { id: 'self', name: '我的展示', style: 1, bio: '我的时间与经验', area: 'CBD', gender: '其他' };
  const provider = service => service.owner === 'self' ? { ...self(), name: service.providerName || self().name, headline: service.headline || '我的服务', sample: false } : demoProviders.find(p => p.id === service.providerId) || { name: '示例服务者', style: 2, sample: true };
  const isMine = item => item?.owner === 'self';
  const domainNames = { career: '职业交流', companion: '活动陪伴', help: '有偿求助', activity: '兴趣搭子' };
  const domainName = key => domainNames[key] || key || '有偿求助';
  const modeName = s => s.mode || '线上';
  const packageList = s => s.packages || [];
  const priceLabel = s => s.pricing === 'hourly' ? `${money(s.rate)} / 小时` : packageList(s).length ? `${money(packageList(s)[0].price)} / ${packageList(s)[0].minutes} 分钟` : money(s.price || 0);
  const splitAmount = amount => { const cents = Math.round(amount * 100), fee = Math.round(cents * 0.15); return { total: cents / 100, platformFee: fee / 100, providerEarnings: (cents - fee) / 100 }; };
  const back = (to = 'discover', text = '返回发现') => `<a href="#${esc(to)}" class="back-button">${icon('back')} ${esc(text)}</a>`;
  const note = '<p class="c-demo-note">交互演示 · 资料为虚构示例，发布和消息只保存在当前浏览器，预约不扣款。</p>';
  const empty = (text, link = 'publish', label = '发布一个需求') => `<div class="empty"><p>${esc(text)}</p><a class="primary" href="#${esc(link)}">${esc(label)} ${icon('arrow')}</a></div>`;
  function persist(changes) {
    const previous = {};
    try { for (const key of Object.keys(changes)) previous[key] = localStorage.getItem(`mates.v3.${key}`); for (const [key, value] of Object.entries(changes)) localStorage.setItem(`mates.v3.${key}`, JSON.stringify(value)); return true; }
    catch { for (const [key, value] of Object.entries(previous)) { try { value === null ? localStorage.removeItem(`mates.v3.${key}`) : localStorage.setItem(`mates.v3.${key}`, value); } catch { /* Keep the visible state intact. */ } } toast('浏览器未允许本地存储，或空间不足；内容未保存'); return false; }
  }
  function commit(changes) {
    if (!persist(changes)) return false;
    if (changes.services) ownServices = changes.services;
    if (changes.requests) ownRequests = changes.requests;
    if (changes.applications) applications = changes.applications;
    if (changes.orders) orders = changes.orders;
    if (changes.threads) threads = changes.threads;
    if (changes.posts) posts = changes.posts;
    return true;
  }
  function serviceCard(s) {
    const p = provider(s);
    const duration = s.pricing === 'hourly' ? `${s.minHours || 1} 小时起约` : packageList(s).length ? `${packageList(s)[0].minutes} 分钟套餐` : '查看服务';
    return `<a class="c-service-card" href="#service/${esc(s.id)}"><div class="c-card-art">${portrait(p)}<span class="c-pill">${esc(domainName(s.domain))}</span><span class="c-card-sample">${isMine(s) ? '我的展示' : '演示资料'}</span><span class="c-photo-price">${priceLabel(s)}</span></div><div class="c-card-content"><div class="c-card-personname">${esc(p.name)}</div><h3 class="c-card-title">${esc(s.title)}</h3><div class="c-card-meta">${esc(s.area || p.area || '墨尔本')} · ${esc(modeName(s))}</div><div class="interest-tags">${(s.topics || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div><div class="c-card-footer"><strong>${priceLabel(s)}</strong><span>${s.active === false ? '已暂停' : esc(duration)}</span></div></div></a>`;
  }
  function companionCard(p) {
    return `<a class="c-service-card c-person-card" href="#profile/${esc(p.id)}"><div class="c-card-art">${portrait(p)}<span class="c-pill">活动陪伴</span><span class="c-card-sample">${p.sample === false ? '我的展示' : '演示资料'}</span><span class="c-photo-price">${money(p.rate)} / 小时</span></div><div class="c-card-content"><div class="c-card-personname">${esc(p.name)}${p.age ? `<span>${esc(p.age)} 岁</span>` : ''}</div><h3 class="c-card-title">${esc(p.tagline || '一起探索墨尔本')}</h3><div class="c-card-meta">${esc(p.area || '墨尔本')} · 线下同行</div><div class="interest-tags">${(p.services || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div><div class="c-card-footer"><strong>${money(p.rate)} / 小时</strong><span>${p.minHours || 1} 小时起约</span></div></div></a>`;
  }
  function renderProfileServices(profileId) {
    const services = allServices().filter(s => {
      const p = provider(s);
      return s.active !== false && (p.profileId || p.id) === profileId;
    });
    if (!services.length) return '';
    return `<section class="c-profile-services"><div class="c-heading"><h2>我的服务与项目</h2></div><p class="muted">每项服务有独立的内容、时长与价格。</p><div class="c-feed">${services.map(serviceCard).join('')}</div></section>`;
  }
  function requestCard(r) {
    return `<a class="c-request-card" href="#request/${esc(r.id)}"><div class="c-kicker">需求 · ${esc(domainName(r.domain))}<span>${isMine(r) ? '我的发布' : '虚构示例'}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><div class="c-request-meta">${icon('pin')} ${esc(r.area)} · ${esc(r.mode || '线上')} ${r.date ? `· ${esc(r.date)}` : ''}</div><div class="c-card-footer"><strong>预算 ${money(r.budget)}</strong><span>${r.closed ? '已选人' : '看看能否帮忙 ↗'}</span></div></a>`;
  }
  function home(careerOnly = false) {
    const searched = filterServices(allServices(), { query: filter.query, domain: careerOnly ? 'career' : filter.domain });
    const query = filter.query.trim().toLowerCase();
    const companions = careerOnly || !['全部', 'companion'].includes(filter.domain) ? [] : profileList().filter(p => p.active !== false && `${p.name} ${p.bio || ''} ${p.tagline || ''} ${(p.services || []).join(' ')} ${p.area || ''}`.toLowerCase().includes(query));
    const requests = allRequests().filter(r => !r.closed && (careerOnly ? r.domain === 'career' : filter.domain === '全部' || r.domain === filter.domain) && `${r.title} ${r.description}`.toLowerCase().includes(filter.query.toLowerCase()));
    const teasers = filter.domain === '全部' && !query ? companions.slice(0, 2) : companions;
    const list = careerOnly ? searched.map(serviceCard).join('') : [...teasers.map(companionCard), ...searched.slice(0, 2).map(serviceCard), ...requests.slice(0, 2).map(requestCard), ...searched.slice(2).map(serviceCard)].join('');
    const heroPerson = careerOnly ? demoProviders[0] : profileList().find(p => p.id === 'p1' && p.active !== false) || profileList().find(p => p.active !== false);
    const heroPrice = careerOnly ? priceLabel(demoServices[0]) : heroPerson ? `${money(heroPerson.rate)} / 小时` : '';
    return `${careerOnly ? back() : ''}<section class="c-photo-hero"><div class="c-photo-hero-copy"><div class="eyebrow">墨尔本 · 华人社区</div><h1>${careerOnly ? '一杯咖啡，<br>聊聊下一步。' : '在墨尔本，<br>遇见同频的人。'}</h1><p>${careerOnly ? '向经历请教，为下一步找方向。' : '一起玩，聊职业，让经验被需要。'}</p><a class="c-photo-hero-link" href="#${careerOnly ? 'requests' : 'companions'}">${careerOnly ? '发布职业问题' : '找个人一起出发'} ${icon('arrow')}</a></div>${heroPerson ? `<div class="c-photo-hero-image">${portrait(heroPerson)}<div class="c-photo-hero-label"><strong>${esc(heroPerson.name)} · 示例展示</strong><span>${heroPrice}</span></div></div>` : ''}</section>${careerOnly ? '' : `<div class="c-boards"><a class="c-board" data-domain="companion" href="#companions"><span class="c-board-icon">${icon('heart')}</span><strong>活动陪伴</strong><small>有人同行的日常</small></a><a class="c-board" data-domain="career" href="#career"><span class="c-board-icon">${icon('coffee')}</span><strong>职业交流</strong><small>向经历请教</small></a><a class="c-board" data-domain="help" href="#requests"><span class="c-board-icon">${icon('sparkles')}</span><strong>有偿求助</strong><small>让难题有人接</small></a><a class="c-board" data-domain="activity" href="#activities"><span class="c-board-icon">${icon('activity')}</span><strong>兴趣搭子</strong><small>免费结伴一起玩</small></a></div>`}<div class="c-heading"><h2>${careerOnly ? '找到可以聊的人' : '发现同频的人'}</h2><a href="#${careerOnly ? 'requests' : 'companions'}" class="text-button">${careerOnly ? '需求广场' : '更多陪伴'} ↗</a></div><div class="c-search">${icon('search')}<input id="c-search" type="search" value="${esc(filter.query)}" placeholder="搜索兴趣、职业或需求" aria-label="搜索社区内容"></div>${careerOnly ? '' : `<div class="c-tabs">${[['全部', '为你推荐'], ['career', '职业交流'], ['help', '有偿求助'], ['companion', '活动陪伴']].map(([value, text]) => `<button class="filter-chip ${filter.domain === value ? 'selected' : ''}" data-c-filter="${value}">${text}</button>`).join('')}</div>`}<div class="c-feed" id="c-feed">${list || empty('暂时没有符合搜索的内容。', 'publish', '发布我的需求')}</div>${posts.length && !careerOnly ? `<div class="c-heading"><h2>社区经验</h2></div><div class="c-posts">${posts.map(p => `<article class="c-request-card"><div class="c-kicker">${esc(p.name)} · 我的分享</div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></article>`).join('')}</div>` : ''}<p class="c-demo-note">照片用于演示，示例资料与定价不代表本人。</p>${note}`;
  }
  function requestsPage() {
    const list = allRequests().filter(r => requestTab === 'mine' ? isMine(r) : !r.closed);
    return `<div class="page-heading"><div class="eyebrow">ASK FOR WHAT YOU NEED</div><h1>你的难题，<span>也许有人会。</span></h1><p>说清楚需要什么，给一个合理的预算，让合适的人来找你。</p></div><div class="c-heading"><div class="c-tabs"><button class="filter-chip ${requestTab === 'all' ? 'selected' : ''}" data-c-request-tab="all">需求广场</button><button class="filter-chip ${requestTab === 'mine' ? 'selected' : ''}" data-c-request-tab="mine">我的需求 ${ownRequests.length}</button></div><button class="primary" data-c-publish="request">${icon('plus')} 发布需求</button></div><div class="c-request-list">${list.map(requestCard).join('') || empty('还没有需求，先说说你需要什么。')}</div>${note}`;
  }
  function serviceDetail(s) {
    if (!s) return back() + empty('这个服务暂时不存在。');
    const p = provider(s);
    const profileId = p.profileId || (profileList().some(profile => profile.id === p.id) ? p.id : null);
    const avatar = profileId ? `<a class="c-avatar" href="#profile/${esc(profileId)}" aria-label="查看${esc(p.name)}的个人展示">${portrait(p)}</a>` : `<div class="c-avatar">${portrait(p)}</div>`;
    const personName = profileId ? `<a href="#profile/${esc(profileId)}">${esc(p.name)} ↗</a>` : esc(p.name);
    return `${back(s.domain === 'career' ? 'career' : 'discover', '返回服务发现')}<div class="c-detail"><div class="c-detail-cover">${portrait(p)}<span class="sample-label">${isMine(s) ? '我的服务 · 当前设备' : '虚构示例人物'}</span></div><section class="c-detail-body"><div class="c-kicker">${esc(domainName(s.domain))} · ${esc(s.area)} · ${esc(modeName(s))}</div><h1>${esc(s.title)}</h1><div class="c-provider-row">${avatar}<div><h3>${personName}</h3><p>${esc(s.headline || p.headline || p.role || '每个人都有值得分享的经历')}</p><small>${isMine(s) ? '个人资料尚未核验' : '示例经历 · 未核验'}</small></div></div><div class="detail-block"><h3>这次可以一起做什么</h3><p>${esc(s.description)}</p><div class="interest-tags">${(s.topics || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div><div class="detail-block"><h3>时间与价格</h3><div class="c-packages">${s.pricing === 'hourly' ? `<div class="c-package"><strong>${money(s.rate)} / 小时</strong><span>${s.minHours || 1} 小时起约</span></div>` : packageList(s).map(p => `<div class="c-package"><span>${esc(p.label || `${p.minutes} 分钟交流`)}</span><strong>${money(p.price)}</strong></div>`).join('')}</div></div><div class="guideline"><strong>先聊清楚，再开始。</strong><p>${s.domain === 'career' ? '交流仅分享个人经验，不代表所在公司，不承诺内推、录用或投资收益。' : '提前确认具体服务、见面地点、额外费用与双方边界。'} 预约时间以双方确认结果为准。</p></div><div class="booking-bar"><div class="hourly-price">${priceLabel(s)}</div><button class="primary" data-c-book="${esc(s.id)}" ${s.active === false ? 'disabled' : ''}>${isMine(s) ? '预览客户预约' : '预约这项服务'} ${icon('arrow')}</button></div>${isMine(s) ? `<div class="c-cta-row"><button class="secondary" data-c-inquiry="${esc(s.id)}">生成演示预约</button><button class="text-button" data-c-toggle-service="${esc(s.id)}">${s.active === false ? '重新上架' : '暂停服务'}</button></div>` : ''}${note}</section></div>`;
  }
  function requestDetail(r) {
    if (!r) return back('requests', '返回需求广场') + empty('这个需求暂时不存在。');
    const applicants = applications.filter(a => a.requestId === r.id);
    return `${back('requests', '返回需求广场')}<article class="c-request-detail"><div class="c-kicker">${esc(domainName(r.domain))} · ${isMine(r) ? '我的需求' : '虚构示例需求'}</div><h1>${esc(r.title)}</h1><div class="c-detail-meta"><span>${esc(r.name)}发布</span><span>${esc(r.area)} · ${esc(r.mode)}</span><span>${esc(r.date || '时间双方商量')}</span></div><div class="detail-block"><h3>我需要什么帮助</h3><p>${esc(r.description)}</p></div><div class="price-list"><div class="price-line total"><span>本次预算</span><strong>${money(r.budget)}</strong></div><p class="income-note">服务范围与时长确认后再模拟付款。平台佣金 15% 由接单方承担；免费活动开销另行约定。</p></div>${isMine(r) ? `<div class="c-heading"><h2>申请帮忙的人</h2>${r.closed ? '<span class="tag">已选择服务者</span>' : `<button class="secondary" data-c-generate-apply="${esc(r.id)}">生成演示申请</button>`}</div>${applicants.length ? applicants.map(a => `<article class="c-applicant"><h3>${esc(a.name)} ${a.sample ? '<span class="tag">演示申请</span>' : ''}</h3><p>${esc(a.reason)}</p>${r.closed ? `<span class="status">${r.selectedApplicant === a.id ? '已选中' : '未选中'}</span>` : `<button class="primary" data-c-select-applicant="${esc(a.id)}">选择这位帮忙的人</button>`}</article>`).join('') : '<div class="empty">还没有申请。你可以点击“生成演示申请”，体验选择服务者。</div>'}` : `<button class="primary full" data-c-apply="${esc(r.id)}" ${r.closed || applicants.some(a => a.owner === 'self') ? 'disabled' : ''}>${r.closed ? '该需求已选人' : applicants.some(a => a.owner === 'self') ? '我已提交申请' : '我可以帮忙，申请接单'} ${icon('arrow')}</button>`}${note}</article>`;
  }
  function publishPage() {
    return `<div class="page-heading"><div class="eyebrow">YOUR TIME, YOUR POSSIBILITIES</div><h1>你想把什么，<span>带给社区？</span></h1><p>既可以提供时间和经验，也可以提出一个需要帮助的问题。</p></div><div class="c-publish-grid"><button class="c-publish-card" data-c-publish="service"><span>${icon('sparkles')}</span><strong>提供服务</strong><p>设定自己的内容、时长和价格</p></button><button class="c-publish-card" data-c-publish="request"><span>${icon('orders')}</span><strong>发布需求</strong><p>说清楚问题和预算，等人来帮忙</p></button><button class="c-publish-card" data-c-publish="activity"><span>${icon('activity')}</span><strong>发起活动</strong><p>免费找搭子，约上同频的人</p></button><button class="c-publish-card" data-c-publish="post"><span>${icon('coffee')}</span><strong>分享经验</strong><p>写一点经历，让别人认识你</p></button></div><div class="c-heading"><h2>我的服务 <span class="muted">${ownServices.length}</span></h2><a href="#me" class="text-button">编辑个人展示 ↗</a></div>${ownServices.length ? `<div class="c-owned-services">${ownServices.map(s => `<article class="c-owned-service"><div><a href="#service/${esc(s.id)}"><h3>${esc(s.title)}</h3></a><p>${priceLabel(s)} · ${s.active === false ? '已暂停' : '已上架，当前设备'}</p></div><button class="secondary" data-c-toggle-service="${esc(s.id)}">${s.active === false ? '上架' : '暂停'}</button></article>`).join('')}</div>` : '<div class="empty">一份展示可以挂出多项服务。比如职业交流、简历建议和周末活动陪伴。</div>'}<div class="c-income-preview"><strong>让一小时，有自己的价格。</strong><p>完成 A$100 的模拟订单：平台佣金 A$15，服务者预计到手 A$85。未扣支付手续费与税费。</p></div>${note}`;
  }
  function statusText(status) { return ({ pending: '待确认', accepted: '已确认，待模拟付款', paid: '已模拟付款', completed: '演示已完成', cancelled: '已取消', rejected: '已拒绝' })[status] || status; }
  function orderWidget(o) {
    const action = o.status === 'pending' ? ['accept', o.kind === 'request-supply' ? '演示发布者选中我' : o.role === 'provider' ? '接受演示预约' : '演示对方接受'] : o.status === 'accepted' ? ['pay', o.role === 'provider' ? '演示客户付款' : '模拟付款'] : o.status === 'paid' ? ['complete', '演示服务完成'] : null;
    return `<section class="c-order"><div class="c-kicker">模拟订单 · ${esc(statusText(o.status))}</div><h3>${esc(o.title)}</h3><p>${esc(o.date || '时间待商量')} ${esc(o.time || '')} · ${esc(o.durationLabel || '按约定完成')}</p><div class="price-line"><span>订单金额</span><strong>${money(o.total)}</strong></div><div class="price-line"><span>平台佣金（15%）</span><span>${money(o.platformFee)}</span></div><div class="price-line"><span>服务者预计到手</span><strong>${money(o.providerEarnings)}</strong></div><div class="c-cta-row">${action ? `<button class="primary" data-c-transition="${action[0]}" data-c-order="${esc(o.id)}">${action[1]}</button>` : ''}${['pending', 'accepted', 'paid'].includes(o.status) ? `<button class="text-button" data-c-transition="cancel" data-c-order="${esc(o.id)}">取消演示订单</button>` : ''}${o.status === 'completed' && !o.review && o.role !== 'provider' ? `<button class="secondary" data-c-review="${esc(o.id)}">写一次评价</button>` : ''}${o.status === 'completed' && o.serviceId && o.role !== 'provider' ? `<button class="text-button" data-c-book="${esc(o.serviceId)}">再约一次 ↗</button>` : ''}</div>${o.review ? `<p class="c-review">我的评价 · ${'★'.repeat(o.review.rating)} ${esc(o.review.text)}</p>` : ''}<small>所有支付与收入均为模拟，不扣款、不产生真实余额。</small></section>`;
  }
  function messagesPage() {
    return `<div class="page-heading"><div class="eyebrow">A GOOD CONVERSATION STARTS HERE</div><h1>消息与预约</h1><p>先把时间、内容和费用聊清楚，再确认你的碰面。</p></div><div class="c-thread-list">${threads.length ? threads.map(t => { const o = orders.find(x => x.id === t.orderId), last = t.messages?.at(-1); return `<a class="c-thread-row" href="#thread/${esc(t.id)}"><div class="c-thread-avatar">${esc(t.name.slice(0, 1))}</div><div><h3>${esc(t.name)} ${t.unread ? '<span class="c-unread">新消息</span>' : ''}</h3><p>${esc(last?.text || t.title)}</p><small>${esc(t.title)}</small></div><span>${o ? esc(statusText(o.status)) : '演示聊天'}</span></a>`; }).join('') : empty('还没有消息，预约一项服务或申请一条需求，就可以开始沟通。', 'career', '看看职业交流')}</div><button class="secondary" id="c-demo-thread">试试消息演示</button><div class="c-heading"><h2>最近预约</h2></div><div class="c-order-list">${orders.length ? orders.map(o => `<a class="c-owned-service" href="#thread/${esc(o.threadId)}"><div><h3>${esc(o.title)}</h3><p>${esc(statusText(o.status))} · ${esc(o.role === 'provider' ? '我提供服务' : '我的预约')}</p></div><strong>${money(o.total)}</strong></a>`).join('') : '<p class="muted">提交预约后，可以在这里体验确认、模拟付款、完成和评价。</p>'}</div>${note}`;
  }
  function threadPage(t) {
    if (!t) return back('messages', '返回消息') + empty('这个会话不存在。', 'messages', '返回消息');
    const o = orders.find(x => x.id === t.orderId);
    return `${back('messages', '返回消息与预约')}<div class="c-thread-heading"><h1>${esc(t.name)}</h1><p>${esc(t.title)} · 演示会话</p></div>${o ? orderWidget(o) : ''}<div class="c-message-list" aria-label="会话消息">${(t.messages || []).map(m => `<div class="c-bubble ${m.sender === 'self' ? 'c-bubble--mine' : ''}"><small>${m.sender === 'self' ? '我' : `${esc(t.name)} · 演示回复`}</small><p>${esc(m.text)}</p></div>`).join('') || '<p class="muted">发一条消息，开始讨论内容和时间。</p>'}</div><form id="c-message-form" class="c-composer"><label class="sr-only" for="c-message-text">消息内容</label><input id="c-message-text" name="text" placeholder="说说你的需求或约定…" maxlength="500" required autocomplete="off"><button class="primary" type="submit">发送</button></form><div class="c-cta-row"><button class="secondary" data-c-reply="${esc(t.id)}">生成演示回复</button><span class="muted">点击后模拟对方回复，不联系真实用户。</span></div>${note}`;
  }
  function createThread({ name, title, order, firstMessage }) {
    const id = uid(), t = { id, name, title, orderId: order?.id, unread: false, messages: firstMessage ? [{ id: uid(), sender: 'self', text: firstMessage, createdAt: new Date().toISOString() }] : [] };
    const nextOrder = order ? { ...order, threadId: id } : null;
    if (!commit({ threads: [t, ...threads], ...(nextOrder ? { orders: [nextOrder, ...orders] } : {}) })) return;
    closeModal(); navigate(`thread/${id}`); return t;
  }
  function book(s, incoming = false) {
    if (!s || s.active === false) { toast('这个服务目前未开放预约'); return; }
    const p = provider(s), packages = packageList(s);
    if (incoming) {
      const reservation = { packageId: packages[0]?.id, hours: s.minHours || 1 }, quote = serviceQuote(s, reservation);
      createThread({ name: 'Alex（演示客户）', title: s.title, order: { id: uid(), serviceId: s.id, title: s.title, role: 'provider', date: MelbourneDate(2), time: '14:00', durationLabel: s.pricing === 'hourly' ? `${reservation.hours} 小时` : `${packages[0]?.minutes} 分钟`, status: 'pending', ...quote }, firstMessage: null }); toast('你主动生成了一条演示预约'); return;
    }
    showModal(`预约 ${esc(p.name)}`, `<form id="c-book-form"><p>${esc(s.title)}</p>${s.pricing === 'hourly' ? `<label class="field">预约时长<select name="hours" id="c-book-duration">${Array.from({ length: 9 - (s.minHours || 1) }, (_, i) => i + (s.minHours || 1)).map(h => `<option value="${h}">${h} 小时</option>`).join('')}</select></label>` : `<label class="field">选择交流套餐<select name="packageId" id="c-book-duration">${packages.map(p => `<option value="${esc(p.id)}">${esc(p.label || `${p.minutes} 分钟`)} · ${money(p.price)}</option>`).join('')}</select></label>`}<div class="row"><label class="field">日期（墨尔本）<input type="date" name="date" min="${MelbourneDate()}" max="${MelbourneDate(60)}" value="${MelbourneDate(1)}" required></label><label class="field">开始时间<input type="time" name="time" value="14:00" required></label></div><label class="field">我想聊 / 需要什么<textarea name="message" minlength="1" maxlength="300" required placeholder="介绍一下需求，也可以写下想确认的问题。"></textarea></label><div id="c-book-quote" class="price-list"></div><label class="check"><input type="checkbox" name="adult" required><span>我已满 18 岁，理解本次预约为演示，不会扣款。</span></label><p id="c-book-error" class="error" role="alert"></p><button class="primary full" type="submit">提交预约申请</button></form>`);
    const form = $('#c-book-form'), data = () => { const f = Object.fromEntries(new FormData(form)); return { ...f, hours: Number(f.hours || s.minHours || 1), adult: f.adult === 'on', message: f.message.trim() }; };
    const paint = () => { try { const q = serviceQuote(s, data()); $('#c-book-quote').innerHTML = `<div class="price-line total"><span>预计合计</span><strong>${money(q.total)}</strong></div><div class="price-line"><span>平台佣金由服务者承担</span><span>15%</span></div><p class="income-note">没有付款。时间与服务内容须双方确认。</p>`; } catch (e) { $('#c-book-quote').textContent = e.message; } };
    paint(); $('#c-book-duration').onchange = paint;
    form.onsubmit = e => { e.preventDefault(); const f = data(), error = validateServiceReservation(s, f); if (error) { $('#c-book-error').textContent = error; return; } const quote = serviceQuote(s, f), chosen = packages.find(p => p.id === f.packageId); createThread({ name: p.name, title: s.title, order: { id: uid(), serviceId: s.id, title: s.title, role: 'customer', date: f.date, time: f.time, durationLabel: s.pricing === 'hourly' ? `${f.hours} 小时` : `${chosen?.minutes} 分钟`, status: 'pending', ...quote }, firstMessage: f.message }); toast('模拟预约已保存。可继续体验确认和付款流程。'); };
  }
  function publish(type) {
    if (type === 'activity') { if (openActivity) openActivity(); else navigate('activities'); return; }
    if (type === 'service') { serviceForm(); return; }
    if (type === 'post') { postForm(); return; }
    requestForm();
  }
  const domainOptions = selected => Object.entries(domainNames).filter(([k]) => k !== 'activity').map(([k, v]) => `<option value="${k}" ${selected === k ? 'selected' : ''}>${v}</option>`).join('');
  function serviceForm() {
    showModal('挂出我的一项服务', `<form id="c-service-form"><div class="row"><label class="field">服务板块<select name="domain" id="c-service-domain">${domainOptions('career')}</select></label><label class="field">我的展示名<input name="providerName" value="${esc(self().name === '我的展示' ? '' : self().name)}" maxlength="24" required placeholder="别人怎么称呼你"></label></div><label class="field">服务标题<input name="title" maxlength="60" required placeholder="例如：30 分钟金融行业 Coffee Chat"></label><label class="field">我的经历 / 一句话介绍<input name="headline" maxlength="100" required placeholder="填写真实经历；本原型不提供经历核验"></label><label class="field">可以提供什么<textarea name="description" minlength="10" maxlength="500" required placeholder="说明交流话题、适合谁，以及这次能获得什么。"></textarea></label><label class="field">话题标签<input name="topics" maxlength="100" placeholder="求职，简历，行业经验（用逗号分隔）"></label><div class="row"><label class="field">区域<select name="area">${options(['CBD', 'Carlton', 'Clayton'])}</select></label><label class="field">形式<select name="mode">${options(['线上', '线下'])}</select></label></div><div id="c-service-price-fields"></div><div id="c-service-quote" class="price-list"></div><label class="check"><input type="checkbox" name="adult" required><span>我已满 18 岁，资料如实填写，理解只保存到当前设备。</span></label><p id="c-service-error" class="error" role="alert"></p><button class="primary full" type="submit">保存并上架这项服务</button></form>`);
    const form = $('#c-service-form');
    const paintPrice = () => { const hourly = $('#c-service-domain').value === 'companion'; $('#c-service-price-fields').innerHTML = hourly ? '<div class="row"><label class="field">每小时价格（A$）<input name="rate" type="number" min="10" max="200" step="0.01" value="30" required></label><label class="field">最短预约<select name="minHours"><option value="1">1 小时</option><option value="2">2 小时</option><option value="3">3 小时</option></select></label></div>' : '<div class="row"><label class="field">套餐时长<select name="minutes"><option value="30">30 分钟</option><option value="60">60 分钟</option></select></label><label class="field">本次价格（A$）<input name="price" type="number" min="10" max="1000" step="0.01" value="100" required></label></div>'; paintQuote(); };
    const paintQuote = () => { const f = Object.fromEntries(new FormData(form)), value = Number(f.price || Number(f.rate) * Number(f.minHours || 1)), q = splitAmount(value); $('#c-service-quote').innerHTML = `<div class="price-line"><span>最短订单金额</span><strong>${money(q.total)}</strong></div><div class="price-line"><span>平台佣金（15%）</span><span>− ${money(q.platformFee)}</span></div><div class="price-line total"><span>预计到手（未扣手续费、税费）</span><strong>${money(q.providerEarnings)}</strong></div>`; };
    $('#c-service-domain').onchange = paintPrice; form.oninput = paintQuote; paintPrice();
    form.onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(form)), hourly = f.domain === 'companion', s = { id: uid(), owner: 'self', providerId: self().id, providerName: f.providerName.trim(), domain: f.domain, title: f.title.trim(), headline: f.headline.trim(), description: f.description.trim(), topics: f.topics.split(/[,，]/).map(t => t.trim()).filter(Boolean).slice(0, 4), area: f.area, mode: f.mode, pricing: hourly ? 'hourly' : 'package', ...(hourly ? { rate: Number(f.rate), minHours: Number(f.minHours) } : { packages: [{ id: 'standard', minutes: Number(f.minutes), price: Number(f.price), label: `${f.minutes} 分钟交流` }] }), active: true, sample: false };
      if (s.description.length < 10 || s.title.length < 1 || !s.providerName) { $('#c-service-error').textContent = '请补充完整的服务内容和展示名'; return; }
      try { serviceQuote(s, { hours: s.minHours, packageId: 'standard' }); } catch (error) { $('#c-service-error').textContent = error.message; return; }
      if (!commit({ services: [s, ...ownServices] })) return; closeModal(); navigate(`service/${s.id}`); toast('服务已上架到当前设备，可以继续添加其他服务'); };
  }
  function requestForm() {
    showModal('发布一个需求', `<form id="c-request-form"><div class="row"><label class="field">需求板块<select name="domain">${domainOptions('help')}</select></label><label class="field">昵称<input name="name" maxlength="24" value="${esc(self().name === '我的展示' ? '' : self().name)}" required></label></div><label class="field">我需要什么<input name="title" maxlength="60" required placeholder="例如：想找金融从业者聊聊毕业求职"></label><label class="field">具体需求<textarea name="description" minlength="10" maxlength="500" required placeholder="说明你的问题、期望得到的帮助和预计需要的时间。"></textarea></label><div class="row"><label class="field">预算（A$）<input name="budget" type="number" min="10" max="1000" step="0.01" value="100" required></label><label class="field">希望的日期<input type="date" name="date" min="${MelbourneDate()}" max="${MelbourneDate(60)}" value="${MelbourneDate(2)}" required></label></div><div class="row"><label class="field">区域<select name="area">${options(['CBD', 'Carlton', 'Clayton'])}</select></label><label class="field">形式<select name="mode">${options(['线上', '线下'])}</select></label></div><label class="field">预计时长<select name="durationMinutes"><option value="30">30 分钟</option><option value="60">60 分钟</option><option value="120">2 小时</option></select></label><label class="check"><input type="checkbox" name="adult" required><span>我已满 18 岁。内容只保存到当前浏览器，不向真实用户发布。</span></label><p id="c-request-error" class="error" role="alert"></p><button class="primary full" type="submit">发布到我的需求广场</button></form>`);
    $('#c-request-form').onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), r = { ...f, title: f.title.trim(), description: f.description.trim(), name: f.name.trim(), budget: Number(f.budget), durationMinutes: Number(f.durationMinutes), adult: f.adult === 'on', id: uid(), owner: 'self', sample: false, closed: false }, error = validateRequest(r); if (error) { $('#c-request-error').textContent = error; return; } if (!commit({ requests: [r, ...ownRequests] })) return; closeModal(); navigate(`request/${r.id}`); toast('需求已保存在当前设备，可以生成演示申请来体验选人'); };
  }
  function postForm() {
    showModal('分享一点经验', '<form id="c-post-form"><label class="field">昵称<input name="name" maxlength="24" required></label><label class="field">标题<input name="title" maxlength="60" required placeholder="一次面试、一个周末、一点生活经验"></label><label class="field">正文<textarea name="text" minlength="10" maxlength="1000" required></textarea></label><p class="c-demo-note">分享仅保存在当前浏览器，不发布给真实用户。</p><button class="primary full">保存我的分享</button></form>');
    $('#c-post-form').onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (![f.name, f.title, f.text].every(v => v.trim())) return; if (!commit({ posts: [{ ...f, id: uid() }, ...posts] })) return; closeModal(); navigate('discover'); toast('分享已保存到当前设备'); };
  }
  function apply(r) {
    if (!r || r.closed) return;
    showModal('申请帮忙', `<form id="c-apply-form"><p>${esc(r.title)} · 预算 ${money(r.budget)}</p><label class="field">昵称<input name="name" maxlength="24" value="${esc(self().name === '我的展示' ? '' : self().name)}" required></label><label class="field">我为什么适合<textarea name="reason" minlength="10" maxlength="500" required placeholder="简要说明相关经验、能提供什么，以及哪些时间方便。"></textarea></label><label class="check"><input type="checkbox" required><span>我已满 18 岁，理解这是演示申请。</span></label><button class="primary full">提交申请</button></form>`);
    $('#c-apply-form').onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (applications.some(a => a.requestId === r.id && a.owner === 'self')) { toast('你已提交过申请'); return; } const a = { ...f, id: uid(), requestId: r.id, owner: 'self', sample: false }, orderId = uid(), threadId = uid(), t = { id: threadId, name: `${r.name}（需求示例）`, title: r.title, orderId, messages: [{ id: uid(), sender: 'self', text: f.reason.trim() }] }, order = { id: orderId, threadId, requestId: r.id, title: r.title, role: 'provider', kind: 'request-supply', status: 'pending', date: r.date, durationLabel: `${r.durationMinutes} 分钟，范围待双方确认`, ...splitAmount(r.budget) }; if (!commit({ applications: [a, ...applications], threads: [t, ...threads], orders: [order, ...orders] })) return; closeModal(); navigate(`thread/${threadId}`); toast('申请已保存。可以主动演示发布者选人，不通知真实用户。'); };
  }
  function selectApplicant(a) {
    const r = ownRequests.find(r => r.id === a?.requestId); if (!r || r.closed) return;
    showModal('确认选人', `<p>选择 <strong>${esc(a.name)}</strong> 处理“${esc(r.title)}”。</p><div class="price-list"><div class="price-line total"><span>本次预算</span><strong>${money(r.budget)}</strong></div></div><p>先在消息里确认服务范围与时长。这个演示不会扣款。</p><button class="primary full" id="c-confirm-applicant">确认选择，开始沟通</button>`);
    $('#c-confirm-applicant').onclick = () => { const updated = ownRequests.map(x => x.id === r.id ? { ...x, closed: true, selectedApplicant: a.id } : x); const order = { id: uid(), requestId: r.id, title: r.title, role: 'customer', status: 'accepted', ...splitAmount(r.budget), date: r.date, durationLabel: `${r.durationMinutes} 分钟，范围待双方确认` }, threadId = uid(), thread = { id: threadId, name: a.name, title: r.title, orderId: order.id, unread: false, messages: [{ id: uid(), sender: 'self', text: '你好，我选择了你的申请。我们先确认服务内容和时间。' }] }; if (!commit({ requests: updated, orders: [{ ...order, threadId }, ...orders], threads: [thread, ...threads] })) return; closeModal(); navigate(`thread/${threadId}`); };
  }
  function review(o) {
    showModal('记录这次体验', '<form id="c-review-form"><label class="field">评分<select name="rating"><option value="5">5 星 · 很满意</option><option value="4">4 星 · 满意</option><option value="3">3 星 · 一般</option><option value="2">2 星 · 有待改进</option><option value="1">1 星 · 不满意</option></select></label><label class="field">评价<textarea name="text" minlength="1" maxlength="300" required placeholder="这次体验怎么样？"></textarea></label><p class="c-demo-note">演示评价仅保存在当前设备，不计入真实信用。</p><button class="primary full">保存评价</button></form>');
    $('#c-review-form').onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (!f.text.trim()) return; if (!commit({ orders: orders.map(x => x.id === o.id ? { ...x, review: { rating: Number(f.rating), text: f.text.trim() } } : x) })) return; closeModal(); refresh(); toast('评价已保存'); };
  }
  function bind(route) {
    document.querySelectorAll('[data-c-filter]').forEach(b => b.onclick = () => { filter.domain = b.dataset.cFilter; refresh(); });
    $('#c-search')?.addEventListener('input', e => { filter.query = e.target.value; const focus = e.target.selectionStart; refresh(); $('#c-search')?.focus(); $('#c-search')?.setSelectionRange(focus, focus); });
    document.querySelectorAll('[data-c-request-tab]').forEach(b => b.onclick = () => { requestTab = b.dataset.cRequestTab; refresh(); });
    document.querySelectorAll('[data-c-publish]').forEach(b => b.onclick = () => publish(b.dataset.cPublish));
    document.querySelectorAll('[data-c-book]').forEach(b => b.onclick = () => book(findService(b.dataset.cBook)));
    document.querySelectorAll('[data-c-inquiry]').forEach(b => b.onclick = () => book(findService(b.dataset.cInquiry), true));
    document.querySelectorAll('[data-c-toggle-service]').forEach(b => b.onclick = () => { if (commit({ services: ownServices.map(s => s.id === b.dataset.cToggleService ? { ...s, active: !s.active } : s) })) { refresh(); toast('服务展示状态已更新'); } });
    document.querySelectorAll('[data-c-apply]').forEach(b => b.onclick = () => apply(allRequests().find(r => r.id === b.dataset.cApply)));
    document.querySelectorAll('[data-c-generate-apply]').forEach(b => b.onclick = () => { const r = ownRequests.find(x => x.id === b.dataset.cGenerateApply); if (!r || r.closed) return; const a = { id: uid(), requestId: r.id, name: ['Jamie', 'Alex', 'Chris'][applications.filter(x => x.requestId === r.id).length % 3] + '（演示申请）', reason: '我有相关经历，可以先了解你的具体需求，再约定时间和服务范围。（由你主动生成的示例）', sample: true }; if (commit({ applications: [...applications, a] })) { refresh(); toast('演示申请已生成，不代表真实用户'); } });
    document.querySelectorAll('[data-c-select-applicant]').forEach(b => b.onclick = () => selectApplicant(applications.find(a => a.id === b.dataset.cSelectApplicant)));
    document.querySelectorAll('[data-c-transition]').forEach(b => b.onclick = () => { const o = orders.find(x => x.id === b.dataset.cOrder); if (!o) return; try { const next = transitionDemoOrder(o, b.dataset.cTransition); if (commit({ orders: orders.map(x => x.id === o.id ? next : x) })) { refresh(); toast('模拟状态已更新，不产生真实付款'); } } catch (error) { toast(error.message); } });
    document.querySelectorAll('[data-c-review]').forEach(b => b.onclick = () => { const o = orders.find(x => x.id === b.dataset.cReview); if (o?.status === 'completed' && !o.review) review(o); });
    $('#c-demo-thread')?.addEventListener('click', () => createThread({ name: 'Jamie（演示伙伴）', title: '试试站内沟通', firstMessage: null }));
    document.querySelectorAll('[data-c-reply]').forEach(b => b.onclick = () => { if (commit({ threads: threads.map(t => t.id === b.dataset.cReply ? { ...t, unread: true, messages: [...(t.messages || []), { id: uid(), sender: 'other', text: '收到啦！我们可以先把具体内容、时间和费用确认好。（你主动生成的演示回复）', createdAt: new Date().toISOString() }] } : t) })) { refresh(); toast('演示回复已生成'); } });
    if (route.startsWith('thread/')) {
      const id = route.slice(7), t = threads.find(x => x.id === id);
      if (t?.unread) commit({ threads: threads.map(x => x.id === id ? { ...x, unread: false } : x) });
      $('#c-message-form')?.addEventListener('submit', e => { e.preventDefault(); const text = new FormData(e.target).get('text').trim(); if (!text || text.length > 500) return; if (commit({ threads: threads.map(x => x.id === id ? { ...x, messages: [...(x.messages || []), { id: uid(), sender: 'self', text, createdAt: new Date().toISOString() }] } : x) })) { refresh(); $('#c-message-text')?.focus(); } });
    }
  }
  function render(route) {
    if (route === 'discover') return home();
    if (route === 'career') return home(true);
    if (route === 'requests') return requestsPage();
    if (route === 'publish') return publishPage();
    if (route === 'messages') return messagesPage();
    if (route.startsWith('service/')) return serviceDetail(findService(route.slice(8)));
    if (route.startsWith('request/')) return requestDetail(allRequests().find(r => r.id === route.slice(8)));
    if (route.startsWith('thread/')) return threadPage(threads.find(t => t.id === route.slice(7)));
    return null;
  }
  function getIncomeSummary() {
    const completed = orders.filter(o => o.role === 'provider' && o.status === 'completed');
    const sum = key => completed.reduce((total, o) => total + Math.round(Number(o[key] || 0) * 100), 0) / 100;
    return { completedCount: completed.length, total: sum('total'), platformFee: sum('platformFee'), providerEarnings: sum('providerEarnings') };
  }
  function renderMyServices() {
    const income = getIncomeSummary();
    return `<section class="c-my-services"><div class="c-heading"><div><div class="eyebrow">MY TIME & EXPERIENCE</div><h2>我的服务与需求</h2></div><a href="#publish" class="primary">添加服务 ${icon('plus')}</a></div><div class="c-my-stats"><a href="#publish"><strong>${ownServices.length}</strong><span>我提供的服务</span></a><a href="#requests"><strong>${ownRequests.length}</strong><span>我发布的需求</span></a><a href="#messages"><strong>${orders.length}</strong><span>社区预约</span></a></div>${ownServices.length ? `<div class="c-owned-services">${ownServices.map(s => `<article class="c-owned-service"><a href="#service/${esc(s.id)}"><h3>${esc(s.title)}</h3><p>${priceLabel(s)} · ${s.active === false ? '已暂停' : '当前设备已上架'}</p></a><button class="secondary" data-c-toggle-service="${esc(s.id)}">${s.active === false ? '上架' : '暂停'}</button></article>`).join('')}</div>` : '<p class="muted">一份个人展示，可以提供多项服务。挂出职业交流、生活求助或活动陪伴。</p>'}<div class="c-income-preview"><span>社区服务模拟到手</span><strong>${money(income.providerEarnings)}</strong><p>${income.completedCount} 个已完成的演示接单，扣除 15% 模拟佣金。客户支出不计入收入，无真实余额。</p></div><a href="#messages" class="text-button">查看社区消息与预约 ↗</a></section>`;
  }
  return { render, bind, renderMyServices, renderProfileServices, bindMyServices: () => bind('me'), getIncomeSummary, ownServices: () => [...ownServices], stats: () => ({ services: ownServices.length, requests: ownRequests.length, orders: orders.length, unread: threads.filter(t => t.unread).length, completedIncome: getIncomeSummary().providerEarnings }) };
}
