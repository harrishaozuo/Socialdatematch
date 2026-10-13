// Prototype pricing in AUD. Production orders must calculate and store cents on the server.
export const PLATFORM_FEE_BPS = 1500;

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MELBOURNE = 'Australia/Melbourne';
const textLength = value => typeof value === 'string' ? [...value.trim()].length : 0;
const validRate = rate => Number.isFinite(rate) && rate >= 0 && rate <= 200
  && Math.abs(rate * 100 - Math.round(rate * 100)) < 1e-8;

function localClock() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MELBOURNE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

/** Melbourne's calendar date, offset by whole days (independent of DST and host timezone). */
export function MelbourneDate(offset = 0) {
  if (!Number.isInteger(offset)) throw new Error('日期偏移须为整数天');
  const { year, month, day } = localClock();
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/** Customer pays total; platform fee is deducted from the provider's earnings. */
export function bookingBreakdown(rate, hours, minHours = 1, feeBps = PLATFORM_FEE_BPS) {
  if (!validRate(rate)) throw new Error('时薪须为 A$0–200，最多两位小数');
  if (!Number.isInteger(minHours) || minHours < 1 || minHours > 8
      || !Number.isInteger(hours) || hours < minHours || hours > 8) {
    throw new Error(`请选择 ${Number.isInteger(minHours) && minHours >= 1 && minHours <= 8 ? minHours : 1}–8 小时`);
  }
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10000) throw new Error('平台费率须为 0–10000 基点');
  const totalCents = Math.round(rate * 100) * hours;
  const feeCents = Math.round(totalCents * feeBps / 10000);
  return { total: totalCents / 100, platformFee: feeCents / 100, providerEarnings: (totalCents - feeCents) / 100 };
}

export function filterProfiles(items, {
  query = '', service = '全部', area = '全部区域', gender = '不限', maxRate = 200, sort = '推荐',
} = {}) {
  const search = String(query).trim().toLowerCase();
  const profiles = items.filter(profile => profile.active !== false
    && (service === '全部' || profile.services?.includes(service))
    && (area === '全部区域' || profile.area === area)
    && (gender === '不限' || profile.gender === gender)
    && Number.isFinite(profile.rate) && profile.rate <= maxRate
    && [profile.name, profile.bio, profile.area, ...(profile.services || [])].join(' ').toLowerCase().includes(search));
  if (sort === '价格从低到高') profiles.sort((a, b) => a.rate - b.rate);
  if (sort === '价格从高到低') profiles.sort((a, b) => b.rate - a.rate);
  return profiles;
}

export function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') return '请填写展示资料';
  if (textLength(profile.name) < 1 || textLength(profile.name) > 24) return '昵称须为 1–24 字';
  if (!Number.isInteger(profile.age) || profile.age < 18 || profile.age > 80) return '年龄须为 18–80 岁';
  if (!['女生', '男生', '其他'].includes(profile.gender)) return '请选择性别';
  if (textLength(profile.area) < 1 || textLength(profile.area) > 40) return '请填写服务区域，最多 40 字';
  if (textLength(profile.bio) < 10 || textLength(profile.bio) > 300) return '个人介绍须为 10–300 字';
  if (!Array.isArray(profile.services) || profile.services.length < 1 || profile.services.length > 6
      || profile.services.some(service => textLength(service) < 1 || textLength(service) > 20)
      || new Set(profile.services.map(service => service.trim())).size !== profile.services.length) {
    return '请选择 1–6 个不同的活动服务';
  }
  if (!validRate(profile.rate) || profile.rate < 10) return '时薪须为 A$10–200，最多两位小数';
  if (!Number.isInteger(profile.minHours) || profile.minHours < 1 || profile.minHours > 8) return '最低预约时长须为 1–8 小时';
  if (!Array.isArray(profile.available) || profile.available.length < 1 || profile.available.length > 7
      || profile.available.some(day => !WEEKDAYS.includes(day))
      || new Set(profile.available).size !== profile.available.length) return '请选择至少一个可预约的星期';
  if (profile.active !== undefined && typeof profile.active !== 'boolean') return '展示状态无效';
  return '';
}

export function validateReservation(profile, reservation) {
  if (!profile || profile.active === false) return '该资料暂未开放预约';
  if (!validRate(profile.rate) || profile.rate < 10
      || !Number.isInteger(profile.minHours) || profile.minHours < 1 || profile.minHours > 8
      || !Array.isArray(profile.available)) return '该资料的预约设置无效';
  const { date, time, hours, message } = reservation || {};
  const parsed = parseDate(date);
  if (!parsed || date < MelbourneDate() || date > MelbourneDate(60)) return '请选择今天起 60 天内的有效日期';
  if (!profile.available.includes(WEEKDAYS[parsed.getUTCDay()])) return '对方在这一天未开放预约，请选择其他日期';
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return '请选择 09:00–22:00 的开始时间';
  const [hour, minute] = time.split(':').map(Number);
  const startMinutes = hour * 60 + minute;
  if (hour > 23 || minute > 59 || startMinutes < 540 || startMinutes > 1320) return '请选择 09:00–22:00 的开始时间';
  if (!Number.isInteger(hours) || hours < profile.minHours || hours > 8) return `预约时长须为 ${profile.minHours}–8 小时`;
  if (startMinutes + hours * 60 >= 1440) return '活动须在当天午夜前结束，请调整时间或时长';
  if (date === MelbourneDate()) {
    const now = localClock();
    if (startMinutes <= Number(now.hour) * 60 + Number(now.minute)) return '请选择尚未开始的墨尔本当地时间';
  }
  if (textLength(message) < 1 || textLength(message) > 300) return '预约留言须为 1–300 字';
  return '';
}
