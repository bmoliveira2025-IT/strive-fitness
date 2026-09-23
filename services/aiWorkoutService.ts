import { SavedExercise } from '../context/SavedWorkoutsContext';
import { addCardioFinisher } from '../lib/sessionFlow';
import { supabase } from '../lib/supabase';
import { buildSlots, buildWeeklyTemplate, fillSlots, type ExerciseRecord, type WorkoutRequest, type WorkoutSelection, type WeeklyWorkoutRequest, type Focus } from '../lib/workoutGeneration';

const exercisesData = require('../assets/exercises.json') as (ExerciseRecord & {
  image_url?: string; video_url?: string;
})[];
const catalog: ExerciseRecord[] = exercisesData.map(ex => ({
  id: String(ex.id), name: ex.name, body_parts: ex.body_parts || [], equipment: ex.equipment || [],
}));
const byId = new Map(exercisesData.map(ex => [String(ex.id), ex]));
const cardioCatalog: SavedExercise[] = exercisesData.filter(ex => ['3499', '3518', '3438', '1967'].includes(String(ex.id))).map(ex => ({
  id: String(ex.id), name: ex.name, image_url: ex.image_url || '', video_url: ex.video_url,
  body_parts: ex.body_parts || [], equipment: ex.equipment || [],
}));

export interface GeneratedWorkout {
  name: string;
  exercises: SavedExercise[];
  source: 'model' | 'repaired' | 'catalog_fallback';
}

const names: Record<WorkoutRequest['focus'], string> = {
  legs: 'Pernas', upper: 'Superiores', full_body: 'Corpo Todo', push: 'Empurrar', pull: 'Puxar',
};

export interface GeneratedWeeklyPlan {
  name: string;
  split: WeeklyWorkoutRequest['split'];
  daysPerWeek: number;
  source: GeneratedWorkout['source'];
  sessions: (GeneratedWorkout & { sessionId: string; label: string; focus: Focus })[];
}

function toSavedExercises(selections: { exercise_id: string }[], request: Pick<WorkoutRequest, 'goal' | 'level'>, dayIndex = 0): SavedExercise[] {
  return selections.flatMap(({ exercise_id }, slotIndex) => {
    const ex = byId.get(exercise_id);
    if (!ex) return [];
    const count = request.level === 'beginner' ? 2 : request.goal === 'strength' ? 4 : 3;
    const reps = request.goal === 'strength' ? '5' : request.goal === 'weight_loss' ? '12' : '10';
    return [{
      id: exercise_id, name: ex.name, image_url: ex.image_url || '', video_url: ex.video_url,
      body_parts: ex.body_parts || [], equipment: ex.equipment || [],
      sets: Array.from({ length: count }, (_, index) => ({
        id: Date.now() + dayIndex * 1000 + slotIndex * 10 + index,
        previous: '', kg: '', reps, completed: false, type: 'N',
      })),
      restTime: request.goal === 'strength' ? 120 : 90,
    }];
  });
}

export async function generateWeeklyWorkoutPlan(request: WeeklyWorkoutRequest, options: { useModel?: boolean } = {}): Promise<GeneratedWeeklyPlan> {
  const started = Date.now();
  const templates = buildWeeklyTemplate(catalog, request);
  if (templates.some(day => day.slots.length < 3)) throw new Error('Poucos exercícios para os equipamentos selecionados. Ajuste os filtros.');
  let backend: { version?: number; source?: string; sessions?: { session_id: string; selections: WorkoutSelection['selections'] }[] } | undefined;
  if (options.useModel !== false) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('not_signed_in');
      const { data, error } = await supabase.functions.invoke('generate-workout', { body: { kind: 'weekly', ...request }, timeout: 6000 });
      if (error) throw error;
      if (data?.version !== 2 || !Array.isArray(data.sessions)) throw new Error('invalid_backend_response');
      backend = { ...data, sessions: data.sessions.filter((item: unknown): item is { session_id: string; selections: WorkoutSelection['selections'] } =>
        !!item && typeof item === 'object' && typeof (item as any).session_id === 'string' && Array.isArray((item as any).selections))
        .map((item: { session_id: string; selections: unknown[] }) => ({
          session_id: item.session_id,
          selections: item.selections.filter((choice): choice is { slot_id: string; exercise_id: string } =>
            !!choice && typeof choice === 'object' && typeof (choice as any).slot_id === 'string' && typeof (choice as any).exercise_id === 'string'),
        })) };
    } catch (error) {
      console.warn('[weekly_generation] backend unavailable; using catalog', error instanceof Error ? error.message : 'unknown');
    }
  }
  let repaired = false;
  const sessions = templates.map((day, index) => {
    const proposed = backend?.sessions?.find(item => item.session_id === day.session_id);
    const selections = fillSlots(day.slots, proposed ? { selections: proposed.selections } : undefined, index);
    if (backend && (!proposed || selections.some(item => !proposed.selections.some(choice => choice.slot_id === item.slot_id && choice.exercise_id === item.exercise_id)))) repaired = true;
    return { sessionId: day.session_id, label: day.label, focus: day.focus,
      name: `Treino ${day.label} · ${names[day.focus]}`,
      exercises: addCardioFinisher(toSavedExercises(selections, request, index), cardioCatalog, request.equipment, request.goal),
      source: 'catalog_fallback' as GeneratedWorkout['source'] };
  });
  const source: GeneratedWorkout['source'] = !backend ? 'catalog_fallback' : repaired ? 'repaired' : backend.source === 'model' ? 'model' : 'catalog_fallback';
  console.info('[weekly_generation]', { source, total_ms: Date.now() - started, days: sessions.length });
  return { name: `Plano ${request.split === 'full_body' ? 'Corpo Todo' : request.split} · ${request.days_per_week}x/semana`, split: request.split,
    daysPerWeek: request.days_per_week, source, sessions: sessions.map(day => ({ ...day, source })) };
}

export async function generatePersonalizedWorkout(request: WorkoutRequest, options: { useModel?: boolean } = {}): Promise<GeneratedWorkout> {
  const started = Date.now();
  const slots = buildSlots(catalog, request);
  if (slots.length < 3) throw new Error('Poucos exercícios para os equipamentos selecionados. Ajuste os filtros.');

  let proposed: WorkoutSelection | undefined;
  let responseSource: GeneratedWorkout['source'] = 'catalog_fallback';
  if (options.useModel !== false) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('not_signed_in');
      const { data: result, error } = await supabase.functions.invoke('generate-workout', { body: request, timeout: 4000 });
      if (error) throw error;
      if (result?.version !== 1 || !Array.isArray(result.selections)) throw new Error('invalid_backend_response');
      proposed = { selections: result.selections };
      responseSource = result.source === 'model' || result.source === 'repaired' ? result.source : 'catalog_fallback';
      const seen = new Set<string>();
      const valid = slots.every(slot => {
        const item = proposed?.selections.find(choice => choice.slot_id === slot.slot_id);
        if (!item || seen.has(item.exercise_id) || !slot.candidates.some(ex => ex.id === item.exercise_id)) return false;
        seen.add(item.exercise_id);
        return true;
      });
      if (!valid) responseSource = 'repaired';
    } catch (error) {
      console.warn('[workout_generation] backend unavailable; using catalog', error instanceof Error ? error.message : 'unknown');
    }
  }

  // Validate a second time on the device. Unknown IDs and wrong-slot IDs never
  // reach SavedWorkout, including if a stale server snapshot was deployed.
  const selections = fillSlots(slots, proposed);
  const exercises: SavedExercise[] = selections.flatMap(({ exercise_id }, slotIndex) => {
    const ex = byId.get(exercise_id);
    if (!ex) return [];
    const count = request.level === 'beginner' ? 2 : request.goal === 'strength' ? 4 : 3;
    const reps = request.goal === 'strength' ? '5' : request.goal === 'weight_loss' ? '12' : '10';
    const saved: SavedExercise = {
      id: exercise_id,
      name: ex.name,
      image_url: ex.image_url || '',
      video_url: ex.video_url,
      body_parts: ex.body_parts || [],
      equipment: ex.equipment || [],
      sets: Array.from({ length: count }, (_, index) => ({
        id: Date.now() + slotIndex * 10 + index,
        previous: '', kg: '', reps, completed: false, type: 'N',
      })),
      restTime: request.goal === 'strength' ? 120 : 90,
    };
    return [saved];
  });

  console.info('[workout_generation]', { source: responseSource, total_ms: Date.now() - started, exercises: exercises.length });
  return { name: `Treino: ${names[request.focus]}`, exercises, source: responseSource };
}
