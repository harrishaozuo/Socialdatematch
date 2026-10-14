import { MelbourneDate } from './marketplace.js';
import { weekdays } from './data.js';

// All people, experiences and demand posts below are fictional product examples.
// These cards do not imply verified employment or endorsement by any employer.
export const demoProviders = [
  {
    id: 'career-1', name: '林舟', age: 29, gender: '男生', area: 'CBD',
    role: '金融求职经验交流', experience: '金融从业经历 · 示例资料',
    bio: '可以一起梳理金融行业的求职准备，聊简历表达、面试练习和工作中的日常。交流分享个人经验，不保证面试、内推或录用结果。',
    tagline: '把你的职业问题，一起聊清楚。', services: ['金融求职', 'Coffee Chat'],
    available: weekdays, languages: '普通话 · English', color: '#c5d3cf', style: 2,
    active: true, sample: true, photos: [], verification: '资料自述 · 未核验',
  },
  {
    id: 'career-2', name: 'Iris', age: 28, gender: '女生', area: 'Carlton',
    role: '产品与科技职业交流', experience: '产品管理经历 · 示例资料',
    bio: '想了解产品经理的一天、准备转行，或者把项目经历说得更清楚？欢迎带着具体问题来聊。这里只提供经验交流，不承诺就业结果。',
    tagline: '让下一步，有一点方向。', services: ['产品经理', '转行交流'],
    available: weekdays, languages: '普通话 · English', color: '#ced2dc', style: 5,
    active: true, sample: true, photos: [], verification: '资料自述 · 未核验',
  },
  {
    id: 'career-3', name: '阿宁', age: 27, gender: '女生', area: 'CBD',
    role: '设计作品集与职业交流', experience: '设计行业经历 · 示例资料',
    bio: '一起看看作品集的讲述顺序、项目目标和你最想表达的优势。可以从一个项目开始讨论，也可以聊设计岗位与面试准备。',
    tagline: '让好作品，也有好表达。', services: ['作品集', '设计求职'],
    available: weekdays, languages: '普通话 · English', color: '#d9c7d4', style: 3,
    active: true, sample: true, photos: [], verification: '资料自述 · 未核验',
  },
];

export const demoServices = [
  {
    id: 'c1', providerId: 'career-1', providerName: '林舟', title: '金融行业 Coffee Chat', domain: 'career',
    priceType: 'session', active: true, format: '线上', area: 'CBD',
    description: '聊金融行业、求职准备与面试经验。带上你的问题，选择 30 或 60 分钟交流。',
    tags: ['金融', '求职', 'Coffee Chat'],
    packages: [{ id: 'c1-30', label: '30 分钟 · 聚焦一个问题', minutes: 30, price: 100 },
      { id: 'c1-60', label: '60 分钟 · 深入交流', minutes: 60, price: 180 }],
  },
  {
    id: 'c2', providerId: 'career-2', providerName: 'Iris', title: '转行产品经理，从哪里开始？', domain: 'career',
    priceType: 'session', active: true, format: '线上', area: 'Carlton',
    description: '围绕你的经历讨论产品岗位、项目表达和下一步准备，提供具体的交流方向。',
    tags: ['科技', '产品经理', '转行'],
    packages: [{ id: 'c2-30', label: '30 分钟 · 职业方向交流', minutes: 30, price: 60 },
      { id: 'c2-60', label: '60 分钟 · 项目经历讨论', minutes: 60, price: 110 }],
  },
  {
    id: 'c3', providerId: 'career-3', providerName: '阿宁', title: '设计作品集，一起看看表达', domain: 'career',
    priceType: 'session', active: true, format: '线下', area: 'CBD',
    description: '在 CBD 咖啡馆聊你的设计作品集，讨论项目叙事和展示重点。饮品各自支付。',
    tags: ['设计', '作品集', '职业交流'],
    packages: [{ id: 'c3-30', label: '30 分钟 · 一个项目', minutes: 30, price: 50 },
      { id: 'c3-60', label: '60 分钟 · 作品集结构', minutes: 60, price: 90 }],
  },
  {
    id: 'c4', providerId: 'career-3', providerName: '阿宁', title: '设计求职 Coffee Chat', domain: 'career',
    priceType: 'session', active: true, format: '线上', area: 'CBD',
    description: '讨论设计岗位和面试准备，分享日常工作经验。根据个人背景一起整理下一步。',
    tags: ['设计', '求职', 'Coffee Chat'],
    packages: [{ id: 'c4-30', label: '30 分钟 · 求职经验', minutes: 30, price: 45 }],
  },
];

export const demoRequests = [
  {
    id: 'r1', name: '小陈', ownerId: 'demo-requester-1', title: '想请金融从业者聊聊求职准备',
    description: '正在准备金融方向的实习申请，希望有人分享简历和面试准备经验。线上聊 30 分钟，不要求内推。',
    domain: 'career', budget: 100, durationMinutes: 30, format: '线上', area: '墨尔本',
    date: MelbourneDate(2), time: '14:00', status: '招募中', sample: true, applications: [], tags: ['金融', '求职'],
  },
  {
    id: 'r2', name: 'Lily', ownerId: 'demo-requester-2', title: '刚到墨尔本，找人陪我熟悉 CBD',
    description: '第一次来墨尔本，想请熟悉 CBD 的朋友一起走走，了解超市、交通和日常生活。交通与餐费各自支付。',
    domain: 'life', budget: 60, durationMinutes: 120, format: '线下', area: 'CBD',
    date: MelbourneDate(3), time: '14:00', status: '招募中', sample: true, applications: [], tags: ['新到墨尔本', '生活'],
  },
  {
    id: 'r3', name: 'Jason', ownerId: 'demo-requester-3', title: '周末想找羽毛球陪练，新手友好',
    description: '刚开始打羽毛球，希望找个朋友一起练习基础动作和轻松对打。不是专业课程，场地费另外 AA。',
    domain: 'activity', budget: 40, durationMinutes: 60, format: '线下', area: 'Clayton',
    date: MelbourneDate(4), time: '17:00', status: '招募中', sample: true, applications: [], tags: ['羽毛球', '运动'],
  },
];
