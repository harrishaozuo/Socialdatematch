import { MelbourneDate } from './marketplace.js';

export const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const services = ['吃饭探店', '咖啡聊天', '逛街漫步', '看展拍照', '运动健身', '桌游电影'];
export const areas = ['CBD', 'Carlton', 'Clayton'];
export const sampleProfiles = [
  { id: 'p1', name: 'Emma', age: 24, gender: '女生', area: 'CBD', rate: 35, minHours: 2, services: ['吃饭探店', '看展拍照', '咖啡聊天'], bio: '喜欢把普通的一天过得有趣一点。可以一起探新餐厅、看展，也可以找一家咖啡店慢慢聊。中文和英文都能交流。', tagline: '把日常，过成一点小浪漫。', available: weekdays, languages: '普通话 · English', color: '#ddccbf', style: 0, active: true, sample: true, photos: [] },
  { id: 'p2', name: '小鹿', age: 23, gender: '女生', area: 'Carlton', rate: 28, minHours: 1, services: ['逛街漫步', '咖啡聊天', '看展拍照'], bio: '在墨尔本读设计，喜欢花、旧书店和周末市集。如果你也想有人陪着逛逛，我们可以从一杯咖啡开始。', tagline: '一起发现城市里的小美好。', available: weekdays, languages: '普通话 · English', color: '#ccd6bb', style: 1, active: true, sample: true, photos: [] },
  { id: 'p3', name: 'Lucas', age: 26, gender: '男生', area: 'CBD', rate: 30, minHours: 2, services: ['运动健身', '逛街漫步', '吃饭探店'], bio: '喜欢运动和户外，也喜欢聊电影和音乐。陪你打球、一起散步，或者找家餐厅尝点新东西。轻松相处，尊重彼此节奏。', tagline: '有人同行，周末就不一样。', available: weekdays, languages: '普通话 · English', color: '#c5d3cf', style: 2, active: true, sample: true, photos: [] },
  { id: 'p4', name: '圆圆', age: 25, gender: '女生', area: 'Clayton', rate: 20, minHours: 1, services: ['桌游电影', '吃饭探店', '咖啡聊天'], bio: '桌游爱好者，性格慢热但熟了话很多。喜欢边吃饭边聊生活，也愿意陪你看一场电影。活动费用提前说清楚。', tagline: '慢热没关系，先碰个面。', available: weekdays, languages: '普通话', color: '#d9c7d4', style: 3, active: true, sample: true, photos: [] },
  { id: 'p5', name: '阿哲', age: 27, gender: '男生', area: 'Clayton', rate: 25, minHours: 1, services: ['运动健身', '桌游电影', '吃饭探店'], bio: '住在 Clayton，喜欢羽毛球和休闲桌游。可以陪你练球或参与小型聚会，不追求输赢，开心和舒服最重要。', tagline: '一起出点汗，再好好吃一顿。', available: weekdays, languages: '普通话 · 粤语', color: '#e0d4b7', style: 4, active: true, sample: true, photos: [] },
  { id: 'p6', name: 'Jess', age: 24, gender: '女生', area: 'CBD', rate: 32, minHours: 2, services: ['看展拍照', '逛街漫步', '咖啡聊天'], bio: '喜欢摄影和艺术，愿意陪你在墨尔本找一个好看的角落，留下生活的片段。拍照是活动的一部分，不是专业摄影服务。', tagline: '在城市里，留下一点好心情。', available: weekdays, languages: '普通话 · English', color: '#ced2dc', style: 5, active: true, sample: true, photos: [] },
];

export const sampleActivities = [
  { id: 's1', title: '周末火锅局，就差一个你', category: '美食', area: 'CBD', mode: '免费搭子', name: '小林', emoji: '🍲', description: '一起吃热腾腾的火锅，聊聊在墨尔本的生活。欢迎新朋友。', date: MelbourneDate(2), time: '18:30', rate: 0, cost: '餐费 AA，每人预计 A$35–50' },
  { id: 's3', title: '羽毛球双打，快乐出汗', category: '运动', area: 'Clayton', mode: '免费搭子', name: '阿哲', emoji: '🏸', description: '休闲双打，不卷水平。带上球拍，一起运动！', date: MelbourneDate(1), time: '19:00', rate: 0, cost: '场地费 AA，每人预计 A$12–18' },
  { id: 's5', title: '桌游新手局，一起破冰', category: '娱乐', area: 'CBD', mode: '免费搭子', name: '圆圆', emoji: '🎲', description: '规则有人教，新手也能玩。来一场轻松的桌游。', date: MelbourneDate(4), time: '16:00', rate: 0, cost: '入场费各自支付，预计 A$15' },
];
