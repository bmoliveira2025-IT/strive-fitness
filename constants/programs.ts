import { buildWeeklyTemplate, fillSlots, type ExerciseRecord, type WeeklyWorkoutRequest } from '../lib/workoutGeneration';

const catalog = require('../assets/exercises.json') as ExerciseRecord[];

interface ProgramPreset {
  id: string;
  title: string;
  description: string;
  audience: 'Homens' | 'Mulheres' | 'Todos';
  goalLabel: string;
  icon: 'barbell-outline' | 'body-outline' | 'fitness-outline' | 'flash-outline';
  accent: string;
  request: WeeklyWorkoutRequest;
}

const presets: ProgramPreset[] = [
  { id: 'massa-homens', title: 'Ganho de massa · Homens', description: 'Quatro treinos semanais com divisão superior/inferior.', audience: 'Homens', goalLabel: 'Ganho de massa', icon: 'barbell-outline', accent: '#6BC6A6', request: { days_per_week: 4, split: 'ABCD', priority_focus: 'balanced', goal: 'hypertrophy', level: 'intermediate', gender: 'male', equipment: [], glute_priority: false } },
  { id: 'massa-mulheres', title: 'Ganho de massa · Mulheres', description: 'Quatro treinos com dois dias de inferiores e ajustes livres.', audience: 'Mulheres', goalLabel: 'Ganho de massa', icon: 'fitness-outline', accent: '#D7A9CA', request: { days_per_week: 4, split: 'ABCD', priority_focus: 'legs', goal: 'hypertrophy', level: 'intermediate', gender: 'female', equipment: [], glute_priority: false } },
  { id: 'pernas-gluteos', title: 'Ênfase pernas e glúteos', description: 'Divisão ABCD com prioridade de quadril e joelho nos dias de inferiores.', audience: 'Mulheres', goalLabel: 'Pernas e glúteos', icon: 'body-outline', accent: '#E5A786', request: { days_per_week: 4, split: 'ABCD', priority_focus: 'legs', goal: 'hypertrophy', level: 'intermediate', gender: 'female', equipment: [], glute_priority: true } },
  { id: 'definicao-homens', title: 'Definição · Homens', description: 'Três sessões de força para manter a massa muscular.', audience: 'Homens', goalLabel: 'Definição', icon: 'flash-outline', accent: '#A6C6E9', request: { days_per_week: 3, split: 'ABC', priority_focus: 'balanced', goal: 'definition', level: 'intermediate', gender: 'male', equipment: [], glute_priority: false } },
  { id: 'definicao-mulheres', title: 'Definição · Mulheres', description: 'Três sessões de resistência com ênfase ajustável em inferiores.', audience: 'Mulheres', goalLabel: 'Definição', icon: 'flash-outline', accent: '#D7B7ED', request: { days_per_week: 3, split: 'ABC', priority_focus: 'legs', goal: 'definition', level: 'intermediate', gender: 'female', equipment: [], glute_priority: true } },
  { id: 'perda-peso', title: 'Força para perda de peso', description: 'Três treinos de corpo todo. Para perda de peso, combine com hábitos adequados.', audience: 'Todos', goalLabel: 'Perda de peso', icon: 'fitness-outline', accent: '#D4CB8D', request: { days_per_week: 3, split: 'full_body', priority_focus: 'balanced', goal: 'weight_loss', level: 'beginner', gender: 'unspecified', equipment: [], glute_priority: false } },
];

export const PROGRAMS = presets.map(preset => ({
  ...preset,
  days: buildWeeklyTemplate(catalog, preset.request).map((day, index) => ({
    name: `${day.label} · ${day.focus === 'legs' ? 'Pernas' : day.focus === 'upper' ? 'Superiores' : day.focus === 'push' ? 'Empurrar' : day.focus === 'pull' ? 'Puxar' : 'Corpo todo'}`,
    exerciseIds: [...fillSlots(day.slots, undefined, index).map(item => item.exercise_id), '3499'],
  })),
}));
