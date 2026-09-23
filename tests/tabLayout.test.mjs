import assert from 'node:assert/strict';
import test from 'node:test';
import { tabBarBottomPadding, tabScrollBottomPadding } from '../constants/tabLayout.ts';

test('web/PWA content has compact clearance because its tab bar participates in layout', () => {
  assert.equal(tabBarBottomPadding('web', 0), 8);
  assert.equal(tabScrollBottomPadding('web', 0), 16);
  assert.equal(tabScrollBottomPadding('web', 0, true), 76);
});

test('native clearance follows the safe area and leaves the final action reachable', () => {
  assert.equal(tabScrollBottomPadding('android', 48), 112);
  assert.equal(tabScrollBottomPadding('android', 0), 88);
  assert.equal(tabScrollBottomPadding('ios', 34), 98);
});
