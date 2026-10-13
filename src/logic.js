export function quote(rate, hours) {
  if (!Number.isFinite(rate) || rate < 0 || !Number.isFinite(hours) || hours < 1 || hours > 8) throw new Error('请选择 1–8 小时');
  return Math.round(rate * hours * 100) / 100;
}
export function filterActivities(items, { category = '全部', area = '全部区域', mode = '全部方式', query = '' } = {}) {
  return items.filter(a => (category === '全部' || a.category === category) && (area === '全部区域' || a.area === area) && (mode === '全部方式' || a.mode === mode) && `${a.title} ${a.name} ${a.description} ${a.area}`.toLowerCase().includes(query.trim().toLowerCase()));
}
export function validateActivity(a) {
  if (!a.title.trim() || !a.description.trim()) return '请填写活动标题和说明';
  if (!a.date || a.date < new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })) return '请选择今天或之后的日期';
  if (!a.time) return '请选择活动时间';
  if (a.mode === '付费陪伴' && (!Number.isFinite(a.rate) || a.rate < 10 || a.rate > 200)) return '时薪须为 A$10–200';
  return '';
}
