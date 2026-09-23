import type { SavedExercise, SavedWorkout } from '../context/SavedWorkoutsContext';
import type { WorkoutHistoryRecord } from '../context/WorkoutHistoryContext';
import type { Goal } from './workoutGeneration';

export function isCardioExercise(exercise: Pick<SavedExercise, 'body_parts'>): boolean {
  return !!exercise.body_parts?.some(part => part.toLowerCase() === 'cardio');
}

export function warmupSteps(exercises: Pick<SavedExercise, 'body_parts'>[]): string[] {
  const parts = exercises.filter(ex => !isCardioExercise(ex)).flatMap(ex => ex.body_parts || []).join(' ').toLowerCase();
  const lower = /coxas|quadriceps|isquiotibiais|quadris|glute|panturrilhas/.test(parts);
  const upper = /peito|costas|ombros|biceps|triceps/.test(parts);
  const movement = lower && !upper ? 'Mobilize quadril, joelhos e tornozelos' : upper && !lower
    ? 'Mobilize ombros e parte superior das costas' : 'Mobilize quadril, ombros e coluna de forma confortável';
  return ['3–5 min de movimento leve', movement, 'Faça 1–2 séries leves do primeiro exercício'];
}

export function cardioTargetMinutes(goal: Goal): number {
  return goal === 'weight_loss' || goal === 'definition' ? 15 : 10;
}

export function addCardioFinisher(exercises: SavedExercise[], catalog: SavedExercise[], equipment: string[], goal: Goal): SavedExercise[] {
  if (exercises.some(isCardioExercise)) return exercises;
  const allowed = new Set(equipment.map(item => item.toLowerCase()));
  const preferredIds = allowed.size === 0 || allowed.has('leverage machine') ? ['3499', '3518', '3438'] : ['3438', '1967'];
  const cardio = preferredIds.map(id => catalog.find(ex => ex.id === id && isCardioExercise(ex) &&
    (allowed.size === 0 || ex.equipment?.some(item => allowed.has(item.toLowerCase()))))).find(Boolean)
    || catalog.find(ex => ex.id === '3438' && isCardioExercise(ex)); // Sem máquina: opção sem equipamento.
  if (!cardio) return exercises;
  const minutes = cardioTargetMinutes(goal);
  return [...exercises, { ...cardio, notes: `Cardio opcional ao final · meta inicial ${minutes} min em ritmo confortável. Registre o tempo realmente realizado.`,
    sets: [{ id: Date.now() + exercises.length, previous: '', kg: '', reps: '0', completed: false, type: 'N' }], restTime: 0 }];
}

export function nextWorkoutInRoutine(workouts: SavedWorkout[], history: WorkoutHistoryRecord[]): SavedWorkout | null {
  if (!workouts.length) return null;
  const latest = [...history].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .find(record => record.workoutId && workouts.some(workout => workout.id === record.workoutId));
  const completed = latest && workouts.find(workout => workout.id === latest.workoutId);
  if (completed?.routineId) {
    const routine = workouts.filter(workout => workout.routineId === completed.routineId)
      .sort((a, b) => (a.sessionIndex ?? 0) - (b.sessionIndex ?? 0));
    return routine[((completed.sessionIndex ?? 0) + 1) % routine.length] || completed;
  }
  const newestRoutine = workouts.filter(workout => workout.routineId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]?.routineId;
  if (newestRoutine) return workouts.filter(workout => workout.routineId === newestRoutine)
    .sort((a, b) => (a.sessionIndex ?? 0) - (b.sessionIndex ?? 0))[0];
  return workouts.find(workout => workout.isFavorite) || workouts[0];
}
