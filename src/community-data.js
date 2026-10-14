import { MelbourneDate } from './marketplace.js';
import { weekdays } from './data.js';

// All people, experiences and demand posts below are fictional product examples.
// Chinese-speaking community self-descriptions are not verified identities.
// These cards do not imply verified employment or endorsement by any employer.
export const demoProviders = [
  {
    id: 'career-1', profileId: 'p3', name: '阿泽', age: 26, gender: '男生', area: 'CBD',
    role: '金融求职经验交流', experience: '金融求职与工作经历 · 演示自述',
    bio: '演示自述：熟悉墨尔本金融岗位的求职准备，可以用普通话聊英文简历、面试练习，以及从留学到工作的适应过程。欢迎带着具体问题来；交流分享个人经验，不保证面试、内推或录用结果。',
    tagline: '在墨尔本求职，把问题聊具体。', services: ['金融求职', 'Coffee Chat'],
    available: weekdays, languages: '普通话 · English', color: '#c5d3cf', style: 2,
    active: true, sample: true, photos: [], verification: '资料自述 · 未核验',
  },
  {
    id: 'career-2', profileId: 'p5', name: '阿哲', age: 27, gender: '男生', area: 'Clayton',
    role: '产品与科技职业交流', experience: '产品管理经历 · 演示自述',
    bio: '演示自述：在墨尔本生活，愿意用普通话聊产品经理的工作、科技岗位转行和英文项目表达。如果你是留学生或刚开始工作，可以带一个项目或一份简历来聊；这里只提供经验交流，不承诺就业结果。',
    tagline: '用熟悉的语言，聊职业下一步。', services: ['产品经理', '转行交流'],
    available: weekdays, languages: '普通话 · English', color: '#ced2dc', style: 5,
    active: true, sample: true, photos: [], verification: '资料自述 · 未核验',
  },
  {
    id: 'career-3', profileId: 'p1', name: '小棠', age: 24, gender: '女生', area: 'CBD',
    role: '设计作品集与职业交流', experience: '设计行业经历 · 演示自述',
    bio: '演示自述：在墨尔本做设计，喜欢在 CBD 咖啡馆用中文聊作品集。可以一起梳理项目的英文叙事、目标和展示顺序，也可以聊本地设计岗位与面试准备，不保证求职结果。',
    tagline: '好作品，也能讲给本地雇主听。', services: ['作品集', '设计求职'],
    available: weekdays, languages: '普通话 · English', color: '#d9c7d4', style: 3,
    active: true, sample: true, photos: [], verification: '资料自述 · 未核验',
  },
];

export const demoServices = [
  {
    id: 'c1', providerId: 'career-1', providerName: '阿泽', title: '金融行业 Coffee Chat', domain: 'career',
    priceType: 'session', active: true, format: '线上', area: 'CBD',
    description: '演示服务：用普通话聊墨尔本金融岗位、英文简历和面试准备。带上一个具体问题，选择 30 或 60 分钟交流，不承诺内推。',
    tags: ['金融', '求职', 'Coffee Chat'],
    packages: [{ id: 'c1-30', label: '30 分钟 · 聚焦一个问题', minutes: 30, price: 100 },
      { id: 'c1-60', label: '60 分钟 · 深入交流', minutes: 60, price: 180 }],
  },
  {
    id: 'c2', providerId: 'career-2', providerName: '阿哲', title: '转行产品经理，从哪里开始？', domain: 'career',
    priceType: 'session', active: true, format: '线上', area: 'Carlton',
    description: '演示服务：适合在墨尔本读书或工作、想了解产品岗位的朋友。用普通话讨论过往经历、英文项目表达和下一步准备。',
    tags: ['科技', '产品经理', '转行'],
    packages: [{ id: 'c2-30', label: '30 分钟 · 职业方向交流', minutes: 30, price: 60 },
      { id: 'c2-60', label: '60 分钟 · 项目经历讨论', minutes: 60, price: 110 }],
  },
  {
    id: 'c3', providerId: 'career-3', providerName: '小棠', title: '设计作品集，一起看看表达', domain: 'career',
    priceType: 'session', active: true, format: '线下', area: 'CBD',
    description: '演示服务：在 CBD 咖啡馆用中文聊设计作品集，讨论英文项目叙事和展示重点。可带电脑，饮品各自支付。',
    tags: ['设计', '作品集', '职业交流'],
    packages: [{ id: 'c3-30', label: '30 分钟 · 一个项目', minutes: 30, price: 50 },
      { id: 'c3-60', label: '60 分钟 · 作品集结构', minutes: 60, price: 90 }],
  },
  {
    id: 'c4', providerId: 'career-3', providerName: '小棠', title: '设计求职 Coffee Chat', domain: 'career',
    priceType: 'session', active: true, format: '线上', area: 'CBD',
    description: '演示服务：用普通话聊墨尔本设计岗位、面试准备和日常工作。结合你的留学或工作经历，一起整理下一步。',
    tags: ['设计', '求职', 'Coffee Chat'],
    packages: [{ id: 'c4-30', label: '30 分钟 · 求职经验', minutes: 30, price: 45 }],
  },
];

export const demoRequests = [
  {
    id: 'r1', name: '小陈', ownerId: 'demo-requester-1', title: '想请金融从业者聊聊求职准备',
    description: '演示需求：在墨尔本读商科，正在准备金融方向的实习申请。希望用普通话聊英文简历和面试准备，线上聊 30 分钟，不要求内推。',
    domain: 'career', budget: 100, durationMinutes: 30, format: '线上', area: '墨尔本',
    date: MelbourneDate(2), time: '14:00', status: '招募中', sample: true, applications: [], tags: ['金融', '求职'],
  },
  {
    id: 'r2', name: '小梨', ownerId: 'demo-requester-2', title: '刚到墨尔本，找人陪我熟悉 CBD',
    description: '演示需求：刚到墨尔本留学，想找能讲普通话的朋友一起熟悉 CBD，看看亚洲超市、交通站点和吃饭的地方。交通与餐费各自支付。',
    domain: 'life', budget: 60, durationMinutes: 120, format: '线下', area: 'CBD',
    date: MelbourneDate(3), time: '14:00', status: '招募中', sample: true, applications: [], tags: ['新到墨尔本', '生活'],
  },
  {
    id: 'r3', name: '嘉诚', ownerId: 'demo-requester-3', title: '周末想找羽毛球陪练，新手友好',
    description: '演示需求：住在 Clayton，周末想找能用中文交流的朋友练习羽毛球基础动作、轻松对打。不是专业课程，场地费另外 AA。',
    domain: 'activity', budget: 40, durationMinutes: 60, format: '线下', area: 'Clayton',
    date: MelbourneDate(4), time: '17:00', status: '招募中', sample: true, applications: [], tags: ['羽毛球', '运动'],
  },
];
