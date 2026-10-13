import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLATFORM_FEE_BPS, bookingBreakdown, filterProfiles, MelbourneDate,
  validateProfile, validateReservation,
} from './marketplace.js';

const profile = {
  id: 'person-1', name: '小雨', age: 24, gender: '女生', area: 'CBD',
  bio: '喜欢探店、逛展和摄影，可以一起探索墨尔本。',
  services: ['探店', '看展'], rate: 25, minHours: 2,
  available: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], active: true,
};
const futureReservation = () => ({ date: MelbourneDate(2), time: '14:00', hours: 2, message: '想一起去看展，门票各自支付。' });

test('completed paid service splits cents without adding a customer surcharge', () => {
  assert.equal(PLATFORM_FEE_BPS, 1500);
  assert.deepEqual(bookingBreakdown(25, 2, 2), { total: 50, platformFee: 7.5, providerEarnings: 42.5 });
  assert.deepEqual(bookingBreakdown(19.99, 3), { total: 59.97, platformFee: 9, providerEarnings: 50.97 });
  assert.deepEqual(bookingBreakdown(10.1, 1), { total: 10.1, platformFee: 1.52, providerEarnings: 8.58 });
  assert.deepEqual(bookingBreakdown(0, 1), { total: 0, platformFee: 0, providerEarnings: 0 });
  assert.deepEqual(bookingBreakdown(25, 2, 1, 0), { total: 50, platformFee: 0, providerEarnings: 50 });
});

test('quotes reject amounts and durations that cannot become valid orders', () => {
  for (const rate of [-1, NaN, Infinity, 201, 10.001, '20']) assert.throws(() => bookingBreakdown(rate, 2));
  for (const hours of [0, 1.5, 9, NaN, '2']) assert.throws(() => bookingBreakdown(25, hours));
  assert.throws(() => bookingBreakdown(25, 1, 2));
  assert.throws(() => bookingBreakdown(25, 2, 0));
  for (const fee of [-1, 10001, 12.5]) assert.throws(() => bookingBreakdown(25, 2, 1, fee));
});

test('discovery combines public availability, price and personal preferences', () => {
  const items = [profile,
    { ...profile, id: 'person-2', name: 'Lucas', gender: '男生', area: 'Carlton', rate: 18, services: ['咖啡'] },
    { ...profile, id: 'person-3', name: '暂停接单', active: false, rate: 12 },
    { ...profile, id: 'person-4', name: 'Jess', rate: 40 },
  ];
  assert.deepEqual(filterProfiles(items, { service: '看展', gender: '女生', area: 'CBD', maxRate: 30, query: ' 探索 ' }).map(item => item.id), ['person-1']);
  assert.deepEqual(filterProfiles(items, { query: 'LUCAS' }).map(item => item.id), ['person-2']);
  assert.deepEqual(filterProfiles(items, { sort: '价格从低到高' }).map(item => item.rate), [18, 25, 40]);
  assert.deepEqual(filterProfiles(items, { sort: '价格从高到低' }).map(item => item.rate), [40, 25, 18]);
  assert.deepEqual(filterProfiles(items).map(item => item.id), ['person-1', 'person-2', 'person-4']);
  assert.equal(items[0], profile, 'sorting must not reorder the source list');
  assert.deepEqual(filterProfiles(items, { maxRate: 10 }), []);
});

test('profiles require adult age, a clear service offer and repeatable availability', () => {
  assert.equal(validateProfile(profile), '');
  assert.equal(validateProfile({ ...profile, age: 18, rate: 10, minHours: 1 }), '');
  assert.equal(validateProfile({ ...profile, age: 80, rate: 200, minHours: 8 }), '');
  for (const invalid of [null, { ...profile, age: 17 }, { ...profile, age: 81 }, { ...profile, age: 18.5 },
    { ...profile, name: ' ' }, { ...profile, bio: '太短' }, { ...profile, rate: 0 },
    { ...profile, rate: 20.001 }, { ...profile, minHours: 9 }, { ...profile, available: [] },
    { ...profile, available: ['Monday'] }, { ...profile, available: ['周一', '周一'] },
    { ...profile, services: [] }, { ...profile, services: ['看展', '看展'] }, { ...profile, active: 'true' },
  ]) assert.ok(validateProfile(invalid));
});

test('reservation enforces date horizon, weekday coverage and message limits', () => {
  const reservation = futureReservation();
  assert.equal(validateReservation(profile, reservation), '');
  assert.equal(validateReservation(profile, { ...reservation, date: MelbourneDate(60) }), '');
  for (const invalid of [
    { ...reservation, date: MelbourneDate(-1) }, { ...reservation, date: MelbourneDate(61) },
    { ...reservation, date: '2026-02-30' }, { ...reservation, date: '2030-1-01' },
    { ...reservation, time: '08:59' }, { ...reservation, time: '22:01' },
    { ...reservation, time: '15:60' }, { ...reservation, time: '24:00' }, { ...reservation, time: '9:00' },
    { ...reservation, hours: 1 }, { ...reservation, hours: 2.5 }, { ...reservation, hours: 9 },
    { ...reservation, message: ' ' }, { ...reservation, message: '字'.repeat(301) },
  ]) assert.ok(validateReservation(profile, invalid));
  assert.ok(validateReservation({ ...profile, active: false }, reservation));
  assert.ok(validateReservation({ ...profile, available: [] }, reservation));
});

test('reservation cannot extend past midnight, even when the start is allowed', () => {
  const reservation = futureReservation();
  assert.equal(validateReservation({ ...profile, minHours: 1 }, { ...reservation, time: '22:00', hours: 1 }), '');
  assert.ok(validateReservation(profile, { ...reservation, time: '22:00', hours: 2 }));
  assert.equal(validateReservation(profile, { ...reservation, time: '15:30', hours: 8 }), '');
  assert.ok(validateReservation(profile, { ...reservation, time: '16:00', hours: 8 }));
});

test('Melbourne dates use the city clock and whole calendar days through daylight saving', context => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-03T15:30:00Z').getTime() });
  assert.equal(MelbourneDate(), '2026-10-04');
  assert.equal(MelbourneDate(1), '2026-10-05');
  assert.equal(MelbourneDate(-1), '2026-10-03');
  assert.throws(() => MelbourneDate(0.5));
});

test('booking today rejects a start that has already passed in Melbourne', context => {
  // 15:30 AEDT, regardless of the execution host's timezone.
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T04:30:00Z').getTime() });
  const reservation = { date: '2026-10-13', time: '16:00', hours: 2, message: '今天一起喝咖啡。' };
  assert.equal(validateReservation(profile, reservation), '');
  assert.ok(validateReservation(profile, { ...reservation, time: '15:30' }));
  assert.ok(validateReservation(profile, { ...reservation, time: '10:00' }));
  assert.ok(validateReservation({ ...profile, available: ['周一'] }, reservation));
  assert.equal(validateReservation({ ...profile, available: ['周二'] }, reservation), '');
});
