import { MelbourneDate } from './marketplace.js';

export const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const services = ['吃饭探店', '咖啡聊天', '逛街漫步', '看展拍照', '运动健身', '桌游电影'];
export const areas = ['CBD', 'Carlton', 'Clayton'];
// Fictional Chinese-speaking community profiles; photos do not establish identity.
// Inactive previous examples remain available for existing local booking references.
export const sampleProfiles = [
  { id: 'p1', name: '小棠', age: 24, gender: '女生', area: 'CBD', rate: 35, minHours: 2, services: ['吃饭探店', '看展拍照', '咖啡聊天'], bio: '演示自述：住在墨尔本 CBD，平时喜欢探中餐馆、看 NGV 展览，也会去河边散步。欢迎用中文聊留学生活或下班后的日常，一起把周末安排得有趣一点。', tagline: '下班后，一起探家好吃的。', available: weekdays, languages: '普通话 · English', color: '#ddccbf', style: 0, active: true, sample: true, photos: [] },
  { id: 'p2', name: '小鹿', age: 23, gender: '女生', area: 'Carlton', rate: 28, minHours: 1, services: ['逛街漫步', '咖啡聊天', '看展拍照'], bio: '演示自述：在墨尔本读设计，常在 Carlton 的咖啡馆画画，喜欢逛旧书店和 Queen Victoria Market。刚到这里也不用担心没话聊，我们可以从一杯咖啡和家乡美食聊起。', tagline: '从 Carlton 的一杯咖啡开始。', available: weekdays, languages: '普通话 · English', color: '#ccd6bb', style: 1, active: false, sample: true, photos: [] },
  { id: 'p3', name: '阿泽', age: 26, gender: '男生', area: 'CBD', rate: 30, minHours: 2, services: ['运动健身', '逛街漫步', '吃饭探店'], bio: '演示自述：在 CBD 工作，周末喜欢打球、沿 Yarra River 散步，再找家店吃碗面。可以用普通话聊工作和电影，活动强度提前商量，轻松相处、尊重彼此节奏。', tagline: '有人同行，墨尔本周末不空着。', available: weekdays, languages: '普通话 · English', color: '#c5d3cf', style: 2, active: true, sample: true, photos: [] },
  { id: 'p4', name: '圆圆', age: 25, gender: '女生', area: 'Clayton', rate: 20, minHours: 1, services: ['桌游电影', '吃饭探店', '咖啡聊天'], bio: '演示自述：住在 Clayton，喜欢中文桌游局和周末电影，性格慢热但熟了话很多。新来墨尔本、想找人吃饭聊生活也欢迎，活动地点和各项费用提前说清楚。', tagline: '慢热没关系，先约一局桌游。', available: weekdays, languages: '普通话', color: '#d9c7d4', style: 3, active: false, sample: true, photos: [] },
  { id: 'p5', name: '阿哲', age: 27, gender: '男生', area: 'Clayton', rate: 25, minHours: 1, services: ['运动健身', '桌游电影', '吃饭探店'], bio: '演示自述：住在 Clayton，喜欢羽毛球和休闲桌游，普通话、粤语都能聊。欢迎新手一起练球，结束后可以去附近吃饭，不追求输赢，场地费和餐费提前约定。', tagline: '打完羽毛球，再吃一顿家乡味。', available: weekdays, languages: '普通话 · 粤语', color: '#e0d4b7', style: 4, active: true, sample: true, photos: [] },
  { id: 'p6', name: '小禾', age: 24, gender: '女生', area: 'CBD', rate: 32, minHours: 2, services: ['看展拍照', '逛街漫步', '咖啡聊天'], bio: '演示自述：喜欢摄影和艺术，常逛 NGV、Fitzroy 和市中心的小巷。可以一起看展、用中文聊喜欢的作品，也可以互相拍几张生活照；拍照是活动的一部分，不是专业摄影服务。', tagline: '一起看展，留下墨尔本的日常。', available: weekdays, languages: '普通话 · English', color: '#ced2dc', style: 5, active: false, sample: true, photos: [] },
];

export const sampleActivities = [
  { id: 's1', title: '周末火锅局，就差一个你', category: '美食', area: 'CBD', mode: '免费搭子', name: '小林', emoji: '🍲', description: '演示活动：在 CBD 一起吃火锅，用中文聊聊留学、工作和墨尔本生活。欢迎刚来的朋友，具体餐厅在群里商量。', date: MelbourneDate(2), time: '18:30', rate: 0, cost: '餐费 AA，每人预计 A$35–50' },
  { id: 's3', title: '羽毛球双打，快乐出汗', category: '运动', area: 'Clayton', mode: '免费搭子', name: '阿哲', emoji: '🏸', description: '演示活动：Clayton 休闲双打，普通话、粤语都可以聊，新手也欢迎。场馆确认后再约，带上自己的球拍。', date: MelbourneDate(1), time: '19:00', rate: 0, cost: '场地费 AA，每人预计 A$12–18' },
  { id: 's5', title: '桌游新手局，一起破冰', category: '娱乐', area: 'CBD', mode: '免费搭子', name: '圆圆', emoji: '🎲', description: '演示活动：CBD 中文桌游新手局，规则有人教，先玩轻松的破冰游戏。欢迎一个人报名，也欢迎带朋友来。', date: MelbourneDate(4), time: '16:00', rate: 0, cost: '入场费各自支付，预计 A$15' },
];
