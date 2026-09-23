import assert from 'node:assert/strict';
import test from 'node:test';
import { tabBarBottomPadding, tabScrollBottomPadding } from '../constants/tabLayout.ts';

test('web/PWA content has compact clearance because its tab bar participates in layout', () => {
  assert.equal(tabBarBottomPadding('web', 0), 8);
  assert.equal(tabBarBottomPadding('web', 34), 34);
  assert.equal(tabScrollBottomPadding('web', 0), 16);
  assert.equal(tabScrollBottomPadding('web', 0, true), 76);
});

test('native tab bar owns the safe area and screens only pad their content', () => {
  assert.equal(tabBarBottomPadding('android', 48), 48);
  assert.equal(tabBarBottomPadding('android', 0), 24);
  assert.equal(tabBarBottomPadding('ios', 34), 34);
  assert.equal(tabScrollBottomPadding('android', 48), 16);
  assert.equal(tabScrollBottomPadding('ios', 34), 16);
  assert.equal(tabScrollBottomPadding('android', 48, true), 76);
});
