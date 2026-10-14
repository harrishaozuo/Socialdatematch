import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MelbourneDate } from './marketplace.js';
import {
  serviceQuote, validateServiceReservation, validateRequest, filterServices, transitionDemoOrder,
} from './community-logic.js';
import { demoProviders, demoServices, demoRequests } from './community-data.js';

const session = {
  id: 'coffee', providerId: 'professional', title: '金融 Coffee Chat', domain: 'career',
  priceType: 'session', active: true, format: '线上', area: 'CBD', tags: ['求职'],
  packages: [{ id: '30min', label: '半小时', minutes: 30, price: 100 },
    { id: '60min', label: '一小时', minutes: 60, price: 180 }],
};
const hourly = {
  id: 'walk', title: '一起逛街', domain: 'companion', priceType: 'hour',
  rate: 19.99, minHours: 2, format: '线下', area: 'Carlton', active: true,
};
const reservation = () => ({ packageId: '30min', date: MelbourneDate(2), time: '14:00', message: '想聊金融求职的准备方向。' });
const request = () => ({ title: '找人聊简历', description: '希望讨论简历的结构和项目经历表达。', domain: 'career',
  budget: 100, durationMinutes: 30, format: '线上', date: MelbourneDate(2) });

test('half-hour sessions have their own fixed price and preserve cent reconciliation', () => {
  assert.deepEqual(serviceQuote(session, { packageId: '30min' }), {
    total: 100, platformFee: 15, providerEarnings: 85, durationMinutes: 30, priceLabel: 'A$100／30 分钟',
  });
  assert.equal(serviceQuote(session, { packageId: '60min' }).total, 180);
  const result = serviceQuote({ ...session, packages: [{ id: 'small', minutes: 30, price: 10.1 }] }, { packageId: 'small' });
  assert.deepEqual([result.total, result.platformFee, result.providerEarnings], [10.1, 1.52, 8.58]);
  assert.equal(Math.round(result.platformFee * 100) + Math.round(result.providerEarnings * 100), Math.round(result.total * 100));
  assert.deepEqual(serviceQuote(hourly, { hours: 3 }), {
    total: 59.97, platformFee: 9, providerEarnings: 50.97, durationMinutes: 180, priceLabel: 'A$19.99／小时',
  });
});

test('pricing rejects missing packages, invalid cents and hourly minimum violations', () => {
  assert.throws(() => serviceQuote(session), /套餐/);
  assert.throws(() => serviceQuote(session, { packageId: 'missing' }), /套餐/);
  for (const price of [0, 9.99, 2000.01, 10.001, NaN, '100']) {
    assert.throws(() => serviceQuote({ ...session, packages: [{ id: 'bad', minutes: 30, price }] }, { packageId: 'bad' }));
  }
  for (const minutes of [0, 14, 481, 30.5]) {
    assert.throws(() => serviceQuote({ ...session, packages: [{ id: 'bad', minutes, price: 100 }] }, { packageId: 'bad' }));
  }
  for (const hours of [1, 2.5, 9, NaN, '2']) assert.throws(() => serviceQuote(hourly, { hours }));
  assert.throws(() => serviceQuote({ ...hourly, rate: 20.001 }, { hours: 2 }));
  assert.throws(() => serviceQuote({ ...hourly, priceType: 'unknown' }, { hours: 2 }));
});

test('reservation supports minute-based sessions and validates calendar, availability and boundaries', () => {
  assert.equal(validateServiceReservation(session, reservation()), '');
  assert.equal(validateServiceReservation(session, { ...reservation(), time: '22:00' }), '');
  assert.equal(validateServiceReservation(session, { ...reservation(), date: MelbourneDate(60) }), '');
  for (const invalid of [
    { ...reservation(), packageId: undefined }, { ...reservation(), date: MelbourneDate(-1) },
    { ...reservation(), date: MelbourneDate(61) }, { ...reservation(), date: '2026-02-30' },
    { ...reservation(), time: '24:00' }, { ...reservation(), time: '9:00' },
    { ...reservation(), time: '15:60' }, { ...reservation(), time: '08:59' },
    { ...reservation(), time: '22:01' }, { ...reservation(), message: ' ' },
    { ...reservation(), message: '字'.repeat(301) },
  ]) assert.ok(validateServiceReservation(session, invalid));
  assert.ok(validateServiceReservation({ ...session, active: false }, reservation()));
  assert.ok(validateServiceReservation(session, reservation(), []));
  const long = { ...session, packages: [{ id: 'long', minutes: 480, price: 100 }] };
  assert.equal(validateServiceReservation(long, { ...reservation(), packageId: 'long', time: '15:30' }), '');
  assert.ok(validateServiceReservation(long, { ...reservation(), packageId: 'long', time: '16:00' }));
});

test('same-day sessions use Melbourne time rather than the machine timezone', context => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T04:30:00Z').getTime() });
  const today = { ...reservation(), date: '2026-10-13', time: '16:00' };
  assert.equal(validateServiceReservation(session, today, ['周二']), '');
  assert.ok(validateServiceReservation(session, { ...today, time: '15:30' }));
  assert.ok(validateServiceReservation(session, { ...today, time: '10:00' }));
  assert.ok(validateServiceReservation(session, today, ['周三']));
});

test('paid requests require useful scope, a precise total budget and valid format/date', () => {
  assert.equal(validateRequest(request()), '');
  assert.equal(validateRequest({ ...request(), format: '线下', area: 'CBD', budget: 2000, durationMinutes: 480 }), '');
  assert.equal(validateRequest({ ...request(), budget: 10, durationMinutes: 15 }), '');
  for (const invalid of [null, { ...request(), title: ' ' }, { ...request(), title: '字'.repeat(61) },
    { ...request(), description: '太短' }, { ...request(), description: '字'.repeat(801) },
    { ...request(), domain: 'unknown' }, { ...request(), budget: 9.99 },
    { ...request(), budget: 100.001 }, { ...request(), budget: 2000.01 },
    { ...request(), budget: '100' }, { ...request(), durationMinutes: 30.5 },
    { ...request(), durationMinutes: 14 }, { ...request(), durationMinutes: 481 },
    { ...request(), format: '线下', area: '' }, { ...request(), format: 'unknown' },
    { ...request(), date: '2026-02-30' }, { ...request(), date: MelbourneDate(-1) },
    { ...request(), date: MelbourneDate(61) },
  ]) assert.ok(validateRequest(invalid));
});

test('discovery filters combine service domain, format, location and tags without mutating seed order', () => {
  const items = [session, hourly, { ...session, id: 'hidden', active: false },
    { ...session, id: 'designer', title: '设计交流', area: 'Carlton', tags: ['设计'], packages: [{ id: 'd', price: 50, minutes: 30 }] }];
  assert.deepEqual(filterServices(items, { domain: 'career', format: '线上', area: 'CBD', query: ' 求职 ' }).map(s => s.id), ['coffee']);
  assert.deepEqual(filterServices(items, { query: 'coffee' }).map(s => s.id), ['coffee']);
  assert.deepEqual(filterServices(items, { sort: '价格从低到高' }).map(s => s.id), ['walk', 'designer', 'coffee']);
  assert.deepEqual(filterServices(items, { sort: '价格从高到低' }).map(s => s.id), ['coffee', 'designer', 'walk']);
  assert.deepEqual(filterServices(items, { domain: 'companion' }).map(s => s.id), ['walk']);
  assert.equal(items[0], session);
});

test('only confirmation, payment and booked completion can create a completed order', () => {
  const pending = { id: 'o1', status: '待确认', total: 100 };
  const accepted = transitionDemoOrder(pending, 'accept');
  assert.equal(accepted.status, '待付款');
  assert.equal(pending.status, '待确认');
  const paid = transitionDemoOrder(accepted, 'pay');
  assert.equal(paid.status, '已预约');
  const complete = transitionDemoOrder(paid, 'complete');
  assert.equal(complete.status, '已完成');
  assert.equal(transitionDemoOrder(pending, 'reject').status, '已拒绝');
  for (const current of [pending, accepted, paid]) assert.equal(transitionDemoOrder(current, 'cancel').status, '已取消');
  for (const [current, action] of [[pending, 'pay'], [pending, 'complete'], [accepted, 'complete'],
    [paid, 'reject'], [complete, 'pay'], [complete, 'cancel'], [null, 'accept'], [pending, 'invent']]) {
    assert.throws(() => transitionDemoOrder(current, action), /状态/);
  }
});

test('fictional seed services and requests satisfy the same pricing and publishing rules', () => {
  const providerIds = new Set(demoProviders.map(provider => provider.id));
  for (const service of demoServices) {
    assert.ok(providerIds.has(service.providerId));
    for (const selected of service.packages) assert.ok(serviceQuote(service, { packageId: selected.id }).total > 0);
  }
  for (const value of demoRequests) assert.equal(validateRequest(value), '');
  for (const value of demoProviders) {
    assert.equal(value.sample, true);
    assert.match(value.verification, /未核验/);
  }
});
