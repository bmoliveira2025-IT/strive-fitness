import { SavedWorkout } from '../context/SavedWorkoutsContext';

// Map exercise names to primary muscle groups
export function inferMusclesFromExercise(exerciseName: string): string[] {
    const name = exerciseName.toLowerCase();
    const muscles: string[] = [];

    // Chest exercises
    if (name.includes('supino') || name.includes('chest') || name.includes('peito') ||
        name.includes('fly') || name.includes('crucifixo') || name.includes('press')) {
        muscles.push('Peito');
    }

    // Back exercises
    if (name.includes('puxada') || name.includes('remada') || name.includes('costas') ||
        name.includes('pull') || name.includes('barra fixa') || name.includes('levantamento terra')) {
        muscles.push('Costas');
    }

    // Legs - Quadriceps
    if (name.includes('agachamento') || name.includes('leg press') || name.includes('extensora') ||
        name.includes('squat') || name.includes('quad')) {
        muscles.push('Quadríceps');
    }

    // Legs - Hamstrings
    if (name.includes('stiff') || name.includes('mesa flexora') || name.includes('posterior') ||
        name.includes('flexora') || name.includes('romanian')) {
        muscles.push('Isquiotibiais');
    }

    // Glutes
    if (name.includes('glúteo') || name.includes('glute') || name.includes('hip thrust') ||
        name.includes('elevação pélvica')) {
        muscles.push('Glúteos');
    }

    // Shoulders
    if (name.includes('elevação') || name.includes('desenvolvimento') || name.includes('ombro') ||
        name.includes('shoulder') || name.includes('lateral')) {
        muscles.push('Ombros');
    }

    // Biceps
    if (name.includes('rosca') || name.includes('biceps') || name.includes('curl')) {
        muscles.push('Bíceps');
    }

    // Triceps
    if (name.includes('triceps') || name.includes('testa') || name.includes('polia') ||
        name.includes('tríceps') || name.includes('frances')) {
        muscles.push('Tríceps');
    }

    // Calves
    if (name.includes('panturrilha') || name.includes('calf')) {
        muscles.push('Panturrilhas');
    }

    // Abs
    if (name.includes('abdominal') || name.includes('crunch') || name.includes('prancha') ||
        name.includes('abdomen') || name.includes('plank')) {
        muscles.push('Abdômen');
    }

    // If no specific muscle found, try to infer from workout context
    // For compound movements, add multiple muscles
    if (name.includes('agachamento livre') || name.includes('squat')) {
        if (!muscles.includes('Glúteos')) muscles.push('Glúteos');
    }

    if (name.includes('levantamento terra') || name.includes('deadlift')) {
        if (!muscles.includes('Costas')) muscles.push('Costas');
        if (!muscles.includes('Glúteos')) muscles.push('Glúteos');
        if (!muscles.includes('Isquiotibiais')) muscles.push('Isquiotibiais');
    }

    return [...new Set(muscles)]; // Remove duplicates
}

export interface WorkoutMuscleAnalysis {
    workoutId: string;
    workoutName: string;
    musclesTargeted: {
        name: string;
        exerciseCount: number;
    }[];
    totalExercises: number;
    primaryFocus: string[]; // Top 2-3 muscles
}

export function analyzeWorkout(workout: SavedWorkout): WorkoutMuscleAnalysis {
    const muscleCount: Record<string, number> = {};

    // Count exercises per muscle
    workout.exercises.forEach(exercise => {
        const muscles = inferMusclesFromExercise(exercise.name);
        muscles.forEach(muscle => {
            muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
        });
    });

    // Convert to array and sort by count
    const musclesTargeted = Object.entries(muscleCount)
        .map(([name, exerciseCount]) => ({ name, exerciseCount }))
        .sort((a, b) => b.exerciseCount - a.exerciseCount);

    // Primary focus is the top muscles (those with most exercises)
    const primaryFocus = musclesTargeted
        .slice(0, 3)
        .filter(m => m.exerciseCount >= 2) // At least 2 exercises
        .map(m => m.name);

    return {
        workoutId: workout.id,
        workoutName: workout.name,
        musclesTargeted,
        totalExercises: workout.exercises.length,
        primaryFocus
    };
}

export function analyzeAllWorkouts(workouts: SavedWorkout[]): WorkoutMuscleAnalysis[] {
    return workouts.map(analyzeWorkout);
}
