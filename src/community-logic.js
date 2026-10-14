import { PLATFORM_FEE_BPS, bookingBreakdown, MelbourneDate } from './marketplace.js';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const length = value => typeof value === 'string' ? [...value.trim()].length : 0;
const validMoney = (value, max = 2000) => Number.isFinite(value) && value >= 10 && value <= max
  && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;
const money = value => `A$${value.toLocaleString('en-AU', { maximumFractionDigits: 2 })}`;

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

function MelbourneClockMinutes() {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

/** Monetary outputs are AUD; multiplication and fee rounding use integer cents. */
export function serviceQuote(service, { hours = 1, packageId = null } = {}) {
  if (!service || typeof service !== 'object') throw new Error('请选择有效的服务');
  if (service.priceType === 'hour') {
    if (!validMoney(service.rate, 200)) throw new Error('时薪须为 A$10–200，最多两位小数');
    const breakdown = bookingBreakdown(service.rate, hours, service.minHours ?? 1);
    return { ...breakdown, durationMinutes: hours * 60, priceLabel: `${money(service.rate)}／小时` };
  }
  if (service.priceType !== 'session') throw new Error('该服务的计价方式无效');
  const selected = service.packages?.find(item => item.id === packageId);
  if (!selected) throw new Error('请选择一个交流套餐');
  if (!validMoney(selected.price)) throw new Error('套餐价格须为 A$10–2,000，最多两位小数');
  if (!Number.isInteger(selected.minutes) || selected.minutes < 15 || selected.minutes > 480) {
    throw new Error('套餐时长须为 15–480 分钟');
  }
  const cents = Math.round(selected.price * 100);
  const feeCents = Math.round(cents * PLATFORM_FEE_BPS / 10000);
  return {
    total: cents / 100,
    platformFee: feeCents / 100,
    providerEarnings: (cents - feeCents) / 100,
    durationMinutes: selected.minutes,
    priceLabel: `${money(selected.price)}／${selected.minutes} 分钟`,
  };
}

export function validateServiceReservation(service, reservation, available = WEEKDAYS) {
  if (!service || service.active === false) return '该服务暂未开放预约';
  let quote;
  try { quote = serviceQuote(service, reservation || {}); } catch (error) { return error.message; }
  const { date, time, message } = reservation || {};
  const parsed = parseDate(date);
  if (!parsed || date < MelbourneDate() || date > MelbourneDate(60)) return '请选择今天起 60 天内的有效日期';
  if (!Array.isArray(available) || !available.includes(WEEKDAYS[parsed.getUTCDay()])) {
    return '对方在这一天未开放预约，请选择其他日期';
  }
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return '请选择 09:00–22:00 的开始时间';
  const [hour, minute] = time.split(':').map(Number);
  const start = hour * 60 + minute;
  if (hour > 23 || minute > 59 || start < 540 || start > 1320) return '请选择 09:00–22:00 的开始时间';
  if (start + quote.durationMinutes >= 1440) return '服务须在当天午夜前结束，请调整时间或时长';
  if (date === MelbourneDate() && start <= MelbourneClockMinutes()) return '请选择尚未开始的墨尔本当地时间';
  if (length(message) < 1 || length(message) > 300) return '预约留言须为 1–300 字';
  return '';
}

export function validateRequest(request) {
  if (!request || typeof request !== 'object') return '请填写需求内容';
  if (length(request.title) < 1 || length(request.title) > 60) return '需求标题须为 1–60 字';
  if (length(request.description) < 10 || length(request.description) > 800) return '需求说明须为 10–800 字';
  if (!['career', 'life', 'activity'].includes(request.domain)) return '请选择需求分类';
  if (!validMoney(request.budget)) return '预算须为 A$10–2,000，最多两位小数';
  if (!Number.isInteger(request.durationMinutes) || request.durationMinutes < 15 || request.durationMinutes > 480) {
    return '预计时长须为 15–480 分钟';
  }
  if (!['线上', '线下'].includes(request.format)) return '请选择线上或线下';
  if ((request.format === '线下' && length(request.area) < 1) || length(request.area) > 40
      || (request.area !== undefined && typeof request.area !== 'string')) return '请填写服务区域，最多 40 字';
  if (!parseDate(request.date) || request.date < MelbourneDate() || request.date > MelbourneDate(60)) {
    return '请选择今天起 60 天内的有效日期';
  }
  return '';
}

export function filterServices(items, {
  domain = 'all', query = '', area = 'all', format = 'all', sort = '推荐',
} = {}) {
  const search = String(query).trim().toLowerCase();
  const results = items.filter(service => service.active !== false
    && (domain === 'all' || service.domain === domain)
    && (area === 'all' || service.area === area)
    && (format === 'all' || service.format === format)
    && [service.title, service.description, service.providerName, service.area, ...(service.tags || [])]
      .join(' ').toLowerCase().includes(search));
  const price = service => service.priceType === 'hour' ? service.rate
    : Math.min(...(service.packages || []).map(item => item.price));
  if (sort === '价格从低到高') results.sort((a, b) => price(a) - price(b));
  if (sort === '价格从高到低') results.sort((a, b) => price(b) - price(a));
  return results;
}

/** The prototype makes role simulation explicit; a server must enforce participants in production. */
export function transitionDemoOrder(order, action) {
  const next = {
    '待确认': { accept: '待付款', reject: '已拒绝', cancel: '已取消' },
    '待付款': { pay: '已预约', cancel: '已取消' },
    '已预约': { complete: '已完成', cancel: '已取消' },
  }[order?.status]?.[action];
  if (!next) throw new Error('当前订单状态不能执行此操作');
  return { ...order, status: next };
}
