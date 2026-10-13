import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote, filterActivities, validateActivity } from './logic.js';
test('booking quote uses hourly rate and bounds duration',()=>{assert.equal(quote(25,3),75);assert.equal(quote(0,1),0);assert.throws(()=>quote(25,0));assert.throws(()=>quote(25,9));});
test('discovery combines area, category, mode and search',()=>{const a={title:'一起喝咖啡',name:'Emma',description:'周末散步',area:'Carlton',category:'闲逛',mode:'付费陪伴'};assert.equal(filterActivities([a],{area:'Carlton',category:'闲逛',mode:'付费陪伴',query:'emma'}).length,1);assert.equal(filterActivities([a],{area:'CBD'}).length,0);});
test('publishing rejects missing dates and invalid paid rates',()=>{const a={title:'看展',description:'一起看展',date:'2099-01-01',time:'14:00',mode:'付费陪伴',rate:25};assert.equal(validateActivity(a),'');assert.ok(validateActivity({...a,rate:0}));assert.ok(validateActivity({...a,date:'2020-01-01'}));});
