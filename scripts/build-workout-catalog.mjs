import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tagExercise } from '../lib/workoutGeneration.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(readFileSync(path.join(root, 'assets/exercises.json'), 'utf8'));
const seen = new Set();
const catalog = source.filter(ex => {
  const id = String(ex.id ?? '');
  if (!id || !ex.name || seen.has(id)) return false;
  seen.add(id);
  return true;
}).map(ex => ({
  id: String(ex.id),
  name: ex.name,
  body_parts: Array.isArray(ex.body_parts) ? ex.body_parts : [],
  equipment: Array.isArray(ex.equipment) ? ex.equipment : [],
}));

const output = path.join(root, 'supabase/functions/generate-workout/catalog.json');
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(catalog));
const shared = path.join(root, 'supabase/functions/_shared/workoutGeneration.ts');
mkdirSync(path.dirname(shared), { recursive: true });
writeFileSync(shared, readFileSync(path.join(root, 'lib/workoutGeneration.ts'), 'utf8'));
console.log(`Catalog snapshot: ${catalog.length} existing exercise IDs`);

if (process.argv.includes('--sql')) {
  const quote = value => `'${String(value).replaceAll("'", "''")}'`;
  const rows = catalog.map(tagExercise).map(ex =>
    `(${quote(ex.id)}, ARRAY[${ex.movements.map(quote).join(',')} ]::text[], ${ex.primary}, ${quote(ex.muscle)}, ${ex.glute_score})`);
  const sql = `-- Generated from assets/exercises.json. Re-runnable and non-destructive.\n` +
    `insert into public.exercise_biomechanics (exercise_id, movement_tags, primary_movement, primary_muscle, glute_priority_score) values\n` +
    rows.join(',\n') +
    `\non conflict (exercise_id) do update set movement_tags = excluded.movement_tags, primary_movement = excluded.primary_movement, primary_muscle = excluded.primary_muscle, glute_priority_score = excluded.glute_priority_score, updated_at = now()\nwhere public.exercise_biomechanics.reviewed_at is null;\n`;
  const outputDir = path.join(root, 'outputs');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'workout_biomechanics_seed.sql'), sql);
  console.log('Wrote outputs/workout_biomechanics_seed.sql (review before applying)');
}
