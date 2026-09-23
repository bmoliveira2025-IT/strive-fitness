import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCardioFinisher, cardioTargetMinutes, nextWorkoutInRoutine, warmupSteps } from '../lib/sessionFlow.ts';

test('warm-up guidance follows the actual session focus', () => {
  assert.match(warmupSteps([{ body_parts: ['Coxas', 'Quadris'] }])[1], /quadril/);
  assert.match(warmupSteps([{ body_parts: ['Peito', 'Ombros'] }])[1], /ombros/);
  assert.equal(warmupSteps([{ body_parts: ['Peito'] }]).length, 3);
});

test('cardio finisher respects available equipment and is optional', () => {
  const strength = [{ id: '18', name: 'Squat', image_url: '', body_parts: ['Coxas'], equipment: ['Barbell'] }];
  const catalog = [
    { id: '3499', name: 'Walking on Treadmill', image_url: '', body_parts: ['Cardio'], equipment: ['Leverage machine'] },
    { id: '3438', name: 'Run', image_url: '', body_parts: ['Cardio'], equipment: ['Body weight'] },
  ];
  const home = addCardioFinisher(strength, catalog, ['Body weight'], 'definition');
  assert.equal(home.at(-1).id, '3438');
  assert.match(home.at(-1).notes, /opcional/);
  assert.equal(home.at(-1).sets[0].kg, '');
  assert.equal(addCardioFinisher(home, catalog, ['Body weight'], 'definition').length, home.length);
  assert.equal(cardioTargetMinutes('definition'), 15);
});

test('home advances A to B in the most recently completed routine', () => {
  const base = { exercises: [], frequency: '3x/semana', lastDone: 'Nunca', createdAt: '2026-09-22T00:00:00Z' };
  const workouts = [
    { ...base, id: 'a', name: 'A', routineId: 'plan', sessionIndex: 0 },
    { ...base, id: 'b', name: 'B', routineId: 'plan', sessionIndex: 1 },
    { ...base, id: 'c', name: 'C', routineId: 'plan', sessionIndex: 2 },
  ];
  assert.equal(nextWorkoutInRoutine(workouts, [])?.id, 'a');
  assert.equal(nextWorkoutInRoutine(workouts, [{ workoutId: 'a', date: '2026-09-22T12:00:00Z' }])?.id, 'b');
  assert.equal(nextWorkoutInRoutine(workouts, [{ workoutId: 'c', date: '2026-09-22T12:00:00Z' }])?.id, 'a');
});
