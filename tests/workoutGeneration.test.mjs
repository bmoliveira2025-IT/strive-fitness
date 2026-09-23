import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import catalog from '../supabase/functions/generate-workout/catalog.json' with { type: 'json' };
import source from '../assets/exercises.json' with { type: 'json' };
import { allowedSplits, buildSlots, buildWeeklyTemplate, fillSlots, selectionJsonSchema } from '../lib/workoutGeneration.ts';

const base = { focus: 'legs', goal: 'hypertrophy', level: 'intermediate', gender: 'unspecified', equipment: ['Dumbbell'], glute_priority: true };

test('server snapshot covers every existing catalog ID', () => {
  assert.deepEqual(new Set(catalog.map(ex => ex.id)), new Set(source.map(ex => String(ex.id))));
  assert.equal(readFileSync(new URL('../supabase/functions/_shared/workoutGeneration.ts', import.meta.url), 'utf8'),
    readFileSync(new URL('../lib/workoutGeneration.ts', import.meta.url), 'utf8'));
});

test('fills biomechanical slots with unique, eligible catalog IDs', () => {
  const slots = buildSlots(catalog, base);
  assert.equal(slots.length, 5);
  const selected = fillSlots(slots);
  assert.equal(selected.length, slots.length);
  assert.equal(new Set(selected.map(item => item.exercise_id)).size, selected.length);
  for (const item of selected) {
    const slot = slots.find(candidate => candidate.slot_id === item.slot_id);
    assert.ok(slot.candidates.some(ex => ex.id === item.exercise_id && ex.equipment.includes('Dumbbell')));
  }
});

test('rejects hallucinated and wrong-slot IDs by replacing them with catalog candidates', () => {
  const slots = buildSlots(catalog, base);
  const selected = fillSlots(slots, { selections: [
    { slot_id: slots[0].slot_id, exercise_id: 'never-in-catalog' },
    { slot_id: slots[1].slot_id, exercise_id: slots[0].candidates[0].id },
  ] });
  assert.equal(selected.length, slots.length);
  for (const item of selected) {
    assert.ok(slots.find(slot => slot.slot_id === item.slot_id).candidates.some(ex => ex.id === item.exercise_id));
  }
});

test('schema only allows IDs retrieved for the request', () => {
  const slots = buildSlots(catalog, { ...base, equipment: ['Body weight'] });
  const ids = selectionJsonSchema(slots).properties.selections.items.properties.exercise_id.enum;
  assert.ok(ids.every(id => slots.some(slot => slot.candidates.some(ex => ex.id === id))));
  assert.ok(!ids.includes('never-in-catalog'));
});

test('glute priority changes ranking without restricting the catalog by gender', () => {
  const ordinary = buildSlots(catalog, { ...base, equipment: [], gender: 'female', glute_priority: false });
  const prioritized = buildSlots(catalog, { ...base, equipment: [], gender: 'female', glute_priority: true });
  assert.ok(prioritized[0].candidates[0].glute_score > ordinary[0].candidates[0].glute_score);
});

test('weekly templates contain one eligible, complete session per day', () => {
  for (const [days, splits] of Object.entries(allowedSplits)) {
    for (const split of splits) {
      const sessions = buildWeeklyTemplate(catalog, { ...base, days_per_week: Number(days), split, priority_focus: 'balanced' });
      assert.equal(sessions.length, Number(days));
      assert.equal(new Set(sessions.map(day => day.session_id)).size, sessions.length);
      for (const [index, day] of sessions.entries()) {
        assert.ok(day.slots.length >= 3);
        const selected = fillSlots(day.slots, undefined, index);
        assert.equal(selected.length, day.slots.length);
        assert.equal(new Set(selected.map(item => item.exercise_id)).size, selected.length);
        assert.ok(selected.every(item => day.slots.find(slot => slot.slot_id === item.slot_id)?.candidates.some(ex => ex.id === item.exercise_id)));
      }
    }
  }
});

test('invalid split is rejected before producing a plan', () => {
  assert.throws(() => buildWeeklyTemplate(catalog, { ...base, days_per_week: 2, split: 'ABCDE', priority_focus: 'balanced' }));
});
