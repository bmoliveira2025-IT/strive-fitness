export const TRACKED_MUSCLES = [
    'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen',
    'Quadríceps', 'Isquiotibiais', 'Panturrilhas', 'Glúteos',
    'Antebraços', 'Trapézio',
] as const;

export type TrackedMuscle = typeof TRACKED_MUSCLES[number];
export type MuscleActivationMap = Partial<Record<TrackedMuscle, number>>;

export interface ExerciseMuscleSource {
    id?: string | number;
    name?: string;
    body_parts?: string[];
}

type Rule = {
    terms: string[];
    activation: MuscleActivationMap;
};

const exercisesData: ExerciseMuscleSource[] = require('../assets/exercises.json');

const normalize = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const RULES: Rule[] = [
    { terms: ['levantamento terra romeno', 'romanian deadlift', 'stiff', 'rdl'], activation: { 'Isquiotibiais': 100, 'Glúteos': 85, 'Costas': 45, 'Abdômen': 35, 'Antebraços': 30 } },
    { terms: ['levantamento terra', 'deadlift'], activation: { 'Glúteos': 100, 'Isquiotibiais': 90, 'Costas': 70, 'Quadríceps': 50, 'Trapézio': 45, 'Abdômen': 40, 'Antebraços': 35 } },
    { terms: ['agachamento', 'squat', 'hack squat'], activation: { 'Quadríceps': 100, 'Glúteos': 85, 'Isquiotibiais': 45, 'Abdômen': 35 } },
    { terms: ['afundo', 'passada', 'avanco', 'lunge', 'split squat'], activation: { 'Quadríceps': 100, 'Glúteos': 85, 'Isquiotibiais': 40, 'Abdômen': 25 } },
    { terms: ['leg press'], activation: { 'Quadríceps': 100, 'Glúteos': 70, 'Isquiotibiais': 35 } },
    { terms: ['elevacao pelvica', 'hip thrust', 'glute bridge', 'ponte de gluteo'], activation: { 'Glúteos': 100, 'Isquiotibiais': 45, 'Quadríceps': 20, 'Abdômen': 20 } },
    { terms: ['flexora', 'leg curl'], activation: { 'Isquiotibiais': 100, 'Panturrilhas': 25 } },
    { terms: ['extensora', 'leg extension', 'sissy squat'], activation: { 'Quadríceps': 100 } },
    { terms: ['abducao', 'abductor'], activation: { 'Glúteos': 100 } },
    { terms: ['aducao', 'adductor'], activation: { 'Glúteos': 45, 'Isquiotibiais': 30, 'Quadríceps': 25 } },
    { terms: ['panturrilha', 'calf raise', 'calves'], activation: { 'Panturrilhas': 100 } },
    { terms: ['supino inclinado', 'incline bench', 'incline press'], activation: { 'Peito': 100, 'Ombros': 65, 'Tríceps': 60 } },
    { terms: ['supino', 'bench press', 'chest press', 'push-up', 'push up', 'flexao'], activation: { 'Peito': 100, 'Tríceps': 65, 'Ombros': 45 } },
    { terms: ['crucifixo', 'crossover', 'fly', 'peck deck', 'voador'], activation: { 'Peito': 100, 'Ombros': 25 } },
    { terms: ['desenvolvimento', 'overhead press', 'shoulder press', 'military press', 'arnold press'], activation: { 'Ombros': 100, 'Tríceps': 65, 'Trapézio': 30 } },
    { terms: ['elevacao lateral', 'lateral raise'], activation: { 'Ombros': 100, 'Trapézio': 35 } },
    { terms: ['elevacao frontal', 'front raise'], activation: { 'Ombros': 100, 'Peito': 25 } },
    { terms: ['face pull', 'reverse fly', 'crucifixo inverso', 'posterior de ombro'], activation: { 'Ombros': 100, 'Trapézio': 65, 'Costas': 45 } },
    { terms: ['remada alta', 'upright row'], activation: { 'Ombros': 100, 'Trapézio': 75, 'Bíceps': 35 } },
    { terms: ['remada', 'row', 'serrote'], activation: { 'Costas': 100, 'Bíceps': 65, 'Trapézio': 55, 'Ombros': 40, 'Antebraços': 30 } },
    { terms: ['puxada', 'pulldown', 'pull-up', 'pull up', 'chin-up', 'chin up', 'barra fixa'], activation: { 'Costas': 100, 'Bíceps': 65, 'Antebraços': 35, 'Trapézio': 30 } },
    { terms: ['pullover'], activation: { 'Costas': 100, 'Peito': 45, 'Tríceps': 30 } },
    { terms: ['encolhimento', 'shrug'], activation: { 'Trapézio': 100, 'Antebraços': 30 } },
    { terms: ['rosca inversa', 'reverse curl', 'wrist curl', 'rosca punho'], activation: { 'Antebraços': 100, 'Bíceps': 55 } },
    { terms: ['rosca', 'curl'], activation: { 'Bíceps': 100, 'Antebraços': 35 } },
    { terms: ['triceps', 'triceps', 'skull crusher', 'testa', 'frances', 'pushdown', 'pulley', 'corda', 'coice'], activation: { 'Tríceps': 100, 'Ombros': 20 } },
    { terms: ['mergulho', 'dip', 'paralela'], activation: { 'Tríceps': 100, 'Peito': 75, 'Ombros': 40 } },
    { terms: ['prancha', 'plank'], activation: { 'Abdômen': 100, 'Ombros': 35, 'Glúteos': 30 } },
    { terms: ['abdominal', 'crunch', 'sit-up', 'sit up', 'leg raise', 'elevacao de pernas'], activation: { 'Abdômen': 100 } },
    { terms: ['farmer', 'caminhada do fazendeiro'], activation: { 'Antebraços': 100, 'Trapézio': 85, 'Abdômen': 55 } },
];

const BODY_PART_MAP: Record<string, MuscleActivationMap> = {
    peito: { 'Peito': 100 },
    costas: { 'Costas': 100 },
    ombros: { 'Ombros': 100 },
    biceps: { 'Bíceps': 100 },
    triceps: { 'Tríceps': 100 },
    bracos: { 'Bíceps': 55, 'Tríceps': 55 },
    antebracos: { 'Antebraços': 100 },
    cintura: { 'Abdômen': 100 },
    abdomen: { 'Abdômen': 100 },
    quadriceps: { 'Quadríceps': 100 },
    coxas: { 'Quadríceps': 75, 'Isquiotibiais': 55 },
    isquiotibiais: { 'Isquiotibiais': 100 },
    quadris: { 'Glúteos': 100, 'Isquiotibiais': 35 },
    gluteos: { 'Glúteos': 100 },
    panturrilhas: { 'Panturrilhas': 100 },
    pescoco: { 'Trapézio': 75 },
};

function mergeMax(target: MuscleActivationMap, source: MuscleActivationMap) {
    Object.entries(source).forEach(([muscle, intensity]) => {
        const key = muscle as TrackedMuscle;
        target[key] = Math.max(target[key] || 0, intensity || 0);
    });
}

export function getExerciseMuscleActivation(exercise: ExerciseMuscleSource): MuscleActivationMap {
    const catalog = exercisesData.find((item) =>
        (exercise.id != null && item.id?.toString() === exercise.id.toString()) ||
        (exercise.name && normalize(item.name || '') === normalize(exercise.name))
    );
    const name = normalize(exercise.name || catalog?.name || '');
    const activation: MuscleActivationMap = {};

    // Specific movement patterns take precedence over broad catalog categories.
    const specificRule = RULES.find((rule) => rule.terms.some((term) => name.includes(normalize(term))));
    if (specificRule) mergeMax(activation, specificRule.activation);

    const bodyParts = exercise.body_parts?.length ? exercise.body_parts : catalog?.body_parts || [];
    bodyParts.forEach((part) => {
        const normalizedPart = normalize(part);
        // Avoid adding an antagonist from broad catalog labels such as
        // "Braços" or "Coxas" when a specific movement rule already matched.
        if (specificRule && ['bracos', 'coxas', 'quadris'].includes(normalizedPart)) return;
        const mapped = BODY_PART_MAP[normalizedPart];
        if (mapped) {
            // Catalog groups are primary only when no movement-specific value exists.
            Object.entries(mapped).forEach(([muscle, intensity]) => {
                const key = muscle as TrackedMuscle;
                if (!activation[key]) activation[key] = intensity;
            });
        }
    });

    return activation;
}

export function getActivatedMuscles(exercise: ExerciseMuscleSource, minimumIntensity = 20): TrackedMuscle[] {
    return Object.entries(getExerciseMuscleActivation(exercise))
        .filter(([, intensity]) => (intensity || 0) >= minimumIntensity)
        .map(([muscle]) => muscle as TrackedMuscle);
}
