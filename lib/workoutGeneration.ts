/** Deterministic rules shared by the app fallback and the Supabase function. */
export type Focus = 'legs' | 'upper' | 'full_body' | 'push' | 'pull';
export type Goal = 'hypertrophy' | 'strength' | 'weight_loss' | 'definition';
export type Split = 'full_body' | 'AB' | 'ABC' | 'ABCD' | 'ABCDE';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Gender = 'female' | 'male' | 'other' | 'unspecified';
export type Movement = 'hip_dominant' | 'knee_dominant' | 'push_horizontal' | 'push_vertical' | 'pull_horizontal' | 'pull_vertical' | 'isolation' | 'core';

export interface ExerciseRecord {
  id: string;
  name: string;
  body_parts: string[];
  equipment: string[];
}

export interface WorkoutRequest {
  focus: Focus;
  goal: Goal;
  level: Level;
  gender: Gender;
  equipment: string[];
  glute_priority: boolean;
}

export interface WeeklyWorkoutRequest extends Omit<WorkoutRequest, 'focus'> {
  days_per_week: 2 | 3 | 4 | 5 | 6;
  split: Split;
  priority_focus: 'balanced' | 'legs' | 'upper';
}

export interface WeeklySessionTemplate {
  session_id: string;
  label: string;
  focus: Focus;
  slots: Slot[];
}

export const allowedSplits: Record<WeeklyWorkoutRequest['days_per_week'], Split[]> = {
  2: ['full_body', 'AB'], 3: ['full_body', 'ABC'], 4: ['AB', 'ABCD'],
  5: ['ABCDE'], 6: ['ABC'],
};

export function buildWeeklyTemplate(catalog: ExerciseRecord[], request: WeeklyWorkoutRequest): WeeklySessionTemplate[] {
  if (!allowedSplits[request.days_per_week]?.includes(request.split)) throw new Error('Divisão incompatível com a frequência semanal.');
  const patterns: Record<Split, Focus[]> = {
    full_body: ['full_body'], AB: ['upper', 'legs'], ABC: ['push', 'pull', 'legs'],
    ABCD: ['upper', 'legs', 'upper', 'legs'], ABCDE: ['push', 'pull', 'legs', 'upper', 'legs'],
  };
  const pattern = [...patterns[request.split]];
  if (request.priority_focus === 'legs' && request.split === 'AB') pattern.reverse();
  if (request.priority_focus === 'legs' && request.split === 'ABCD') pattern.splice(0, 4, 'legs', 'upper', 'legs', 'upper');
  return Array.from({ length: request.days_per_week }, (_, index) => {
    const focus = pattern[index % pattern.length];
    const label = request.split === 'full_body' ? `Dia ${index + 1}` : `${String.fromCharCode(65 + index % pattern.length)}${index >= pattern.length ? '2' : ''}`;
    const slots = buildSlots(catalog, { ...request, focus }).map(slot => ({ ...slot, slot_id: `day_${index + 1}_${slot.slot_id}` }));
    return { session_id: `day_${index + 1}`, label, focus, slots };
  });
}

export interface TaggedExercise extends ExerciseRecord {
  movements: Movement[];
  muscle: string;
  primary: boolean;
  glute_score: number;
}

export interface Slot {
  slot_id: string;
  movement: Movement;
  muscle?: string;
  candidates: TaggedExercise[];
}

export interface WorkoutSelection {
  selections: { slot_id: string; exercise_id: string }[];
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function tagExercise(exercise: ExerciseRecord): TaggedExercise {
  const name = normalize(exercise.name);
  const parts = normalize(exercise.body_parts.join(' '));
  const movements: Movement[] = [];
  const add = (movement: Movement) => { if (!movements.includes(movement)) movements.push(movement); };
  const glute = /glute|quadril|hip thrust|elevacao pelvica|ponte/.test(name);
  const squat = /agach|squat|leg press|afundo|lunge|passada|step.?up|extensora/.test(name);
  const hinge = /terra|deadlift|romeno|stiff|hip thrust|elevacao pelvica|ponte|flexora|leg curl/.test(name);
  const chest = /peito/.test(parts);
  const back = /costas/.test(parts);
  const shoulder = /ombros/.test(parts);
  const legs = /coxas|quadriceps|isquiotibiais|quadris|glute|panturrilhas/.test(parts);
  const arms = /biceps|triceps|antebracos/.test(parts);
  const core = /cintura|abd[oô]m/.test(parts);

  if (hinge || (glute && !squat)) add('hip_dominant');
  if (squat || (legs && /quadriceps/.test(parts))) add('knee_dominant');
  if (chest && /supino|press|flexao|crucifixo|peck|fly/.test(name)) add('push_horizontal');
  if (shoulder && /desenvolvimento|shoulder press|militar|overhead/.test(name)) add('push_vertical');
  if (back && /remada|row/.test(name)) add('pull_horizontal');
  if (back && /puxada|pulldown|pull.?up|barra fixa/.test(name)) add('pull_vertical');
  if (core) add('core');
  if (arms || /elevacao lateral|rosca|curl|extensora|flexora|panturrilha|abduc|aduc|crucifixo|fly/.test(name)) add('isolation');
  if (!movements.length && legs) add('knee_dominant');
  if (!movements.length && chest) add('push_horizontal');
  if (!movements.length && back) add('pull_horizontal');
  if (!movements.length && shoulder) add('push_vertical');
  const primary = movements.some(m => m !== 'isolation' && m !== 'core') && !movements.includes('isolation') && !/unilateral|alternad/.test(name);
  const muscle = glute ? 'glutes' : /quadriceps/.test(parts) ? 'quads' : /isquiotibiais/.test(parts) ? 'hamstrings' : /panturrilhas/.test(parts) ? 'calves' : chest ? 'chest' : back ? 'back' : shoulder ? 'shoulders' : /triceps/.test(parts) ? 'triceps' : /biceps/.test(parts) ? 'biceps' : arms ? 'arms' : core ? 'core' : legs ? 'legs' : 'other';
  return { ...exercise, movements, muscle, primary, glute_score: glute ? 3 : /quadris/.test(parts) ? 2 : 0 };
}

const templates: Record<Focus, Movement[]> = {
  legs: ['hip_dominant', 'knee_dominant', 'hip_dominant', 'knee_dominant', 'isolation'],
  upper: ['push_horizontal', 'pull_horizontal', 'push_vertical', 'pull_vertical', 'isolation'],
  full_body: ['knee_dominant', 'push_horizontal', 'pull_horizontal', 'hip_dominant', 'core'],
  push: ['push_horizontal', 'push_vertical', 'push_horizontal', 'isolation', 'isolation'],
  pull: ['pull_horizontal', 'pull_vertical', 'pull_horizontal', 'isolation', 'core'],
};

const substitutes: Partial<Record<Movement, Movement>> = {
  pull_vertical: 'pull_horizontal',
  pull_horizontal: 'pull_vertical',
  push_vertical: 'push_horizontal',
  push_horizontal: 'push_vertical',
  hip_dominant: 'knee_dominant',
  knee_dominant: 'hip_dominant',
  core: 'isolation',
};

export function buildSlots(catalog: ExerciseRecord[], request: WorkoutRequest): Slot[] {
  const allowed = new Set(request.equipment.map(normalize));
  const tagged = catalog.map(tagExercise).filter(ex => ex.movements.length &&
    (allowed.size === 0 || ex.equipment.some(eq => allowed.has(normalize(eq)))));
  const priority = request.glute_priority;

  return templates[request.focus].map((requestedMovement, index) => {
    const movement = tagged.some(ex => ex.movements.includes(requestedMovement))
      ? requestedMovement : (substitutes[requestedMovement] || requestedMovement);
    const candidates = tagged.filter(ex => {
      if (!ex.movements.includes(movement)) return false;
      if (movement !== 'isolation') return true;
      if (request.focus === 'legs') return ['glutes', 'quads', 'hamstrings', 'calves', 'legs'].includes(ex.muscle);
      if (request.focus === 'push') return ['chest', 'shoulders', 'triceps'].includes(ex.muscle);
      if (request.focus === 'pull') return ['back', 'biceps', 'arms'].includes(ex.muscle);
      return true;
    })
      .sort((a, b) => {
        const score = (ex: TaggedExercise) =>
          (ex.primary && index < 2 ? 5 : 0) +
          (priority && movement === 'hip_dominant' ? ex.glute_score * 3 : 0) +
          (request.goal === 'strength' && /barbell|dumbbell/i.test(ex.equipment.join(' ')) ? 2 : 0);
        return score(b) - score(a) || a.id.localeCompare(b.id, undefined, { numeric: true });
      }).slice(0, 12);
    return { slot_id: `slot_${index + 1}`, movement, candidates };
  }).filter(slot => slot.candidates.length > 0);
}

export function fillSlots(slots: Slot[], proposed?: WorkoutSelection, rotation = 0): { slot_id: string; exercise_id: string }[] {
  const used = new Set<string>();
  return slots.flatMap(slot => {
    const suggestion = proposed?.selections.find(item => item.slot_id === slot.slot_id)?.exercise_id;
    const rotated = [...slot.candidates.slice(rotation % slot.candidates.length), ...slot.candidates.slice(0, rotation % slot.candidates.length)];
    const selected = slot.candidates.find(ex => ex.id === suggestion && !used.has(ex.id))
      || rotated.find(ex => !used.has(ex.id));
    if (!selected) return [];
    used.add(selected.id);
    return [{ slot_id: slot.slot_id, exercise_id: selected.id }];
  });
}

export function selectionJsonSchema(slots: Slot[]) {
  return {
    type: 'object', additionalProperties: false,
    properties: { selections: { type: 'array', minItems: slots.length, maxItems: slots.length,
      items: { type: 'object', additionalProperties: false,
        properties: { slot_id: { type: 'string', enum: slots.map(s => s.slot_id) }, exercise_id: { type: 'string', enum: [...new Set(slots.flatMap(s => s.candidates.map(ex => ex.id)))] } },
        required: ['slot_id', 'exercise_id'] } } },
    required: ['selections'],
  } as const;
}
