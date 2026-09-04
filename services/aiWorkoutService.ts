import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedExercise, SavedWorkout } from '../context/SavedWorkoutsContext';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const CACHE_KEY = '@ai_workout_plans_cache';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

// Import exercise data to reference in AI plans
const exercisesData = require('../assets/exercises.json');

interface AIWorkoutPlan {
    id: string;
    name: string;
    description: string;
    exercises: SavedExercise[];
    difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
    duration: string;
    isAIGenerated: boolean;
}

// Mock data as fallback
const MOCK_AI_PLANS: AIWorkoutPlan[] = [
    {
        id: 'ai-plan-1',
        name: 'Treino Full Body Iniciante',
        description: 'Treino completo para iniciantes focado em todos os grupos musculares',
        difficulty: 'Iniciante',
        duration: '45 min',
        isAIGenerated: true,
        exercises: []
    },
    {
        id: 'ai-plan-2',
        name: 'Hipertrofia Peito e Costas',
        description: 'Treino focado em desenvolvimento de peito e costas com volume moderado',
        difficulty: 'Intermediário',
        duration: '60 min',
        isAIGenerated: true,
        exercises: []
    },
    {
        id: 'ai-plan-3',
        name: 'Treino de Pernas Intenso',
        description: 'Treino completo de membros inferiores para ganho de força e massa',
        difficulty: 'Avançado',
        duration: '70 min',
        isAIGenerated: true,
        exercises: []
    },
    {
        id: 'ai-plan-4',
        name: 'Upper Body Push/Pull',
        description: 'Divisão de treino para parte superior focando em Push e Pull',
        difficulty: 'Intermediário',
        duration: '55 min',
        isAIGenerated: true,
        exercises: []
    }
];

// Populate mock plans with actual exercises from the database
const getRandomExercisesByBodyPart = (bodyParts: string[], count: number): SavedExercise[] => {
    const filtered = exercisesData.filter((ex: any) =>
        ex.body_parts?.some((part: string) =>
            bodyParts.some(target => part.toLowerCase().includes(target.toLowerCase()))
        )
    );

    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((ex: any) => ({
        id: ex.id.toString(),
        name: ex.name,
        image_url: ex.image_url,
        video_url: ex.video_url,
        body_parts: ex.body_parts || [],
        equipment: ex.equipment || []
    }));
};

// Populate mock plans with exercises - using fixed IDs to ensure they always work
const getExerciseById = (id: string): SavedExercise | null => {
    const ex = exercisesData.find((e: any) => e.id === id || e.id.toString() === id);
    if (!ex) return null;
    return {
        id: ex.id.toString(),
        name: ex.name,
        image_url: ex.image_url,
        video_url: ex.video_url,
        body_parts: ex.body_parts || [],
        equipment: ex.equipment || []
    };
};

// Note: Mock plans are populated dynamically on first use via ensureMockPlansPopulated()
// to avoid issues with booting order or empty exercise data.

// Helper function to validate plans have exercises
const arePlansValid = (plans: AIWorkoutPlan[] | null): boolean => {
    if (!plans || plans.length === 0) return false;
    // At least one plan must have exercises
    return plans.some(p => p.exercises && p.exercises.length > 0);
};

let cachedPlans: AIWorkoutPlan[] | null = null;
let lastFetchTime: number = 0;
let fetchPromise: Promise<AIWorkoutPlan[]> | null = null;

// Helper function to ensure MOCK_PLANS have exercises populated
const ensureMockPlansPopulated = (): AIWorkoutPlan[] => {
    // If already populated, return
    if (MOCK_AI_PLANS[0].exercises.length > 0) {
        return MOCK_AI_PLANS;
    }

    console.log('[AI Service] Populating MOCK_PLANS exercises dynamically...');

    const getEx = (id: string) => {
        const ex = exercisesData.find((e: any) => e.id === id || e.id.toString() === id);
        if (!ex) return null;
        return {
            id: ex.id.toString(),
            name: ex.name,
            image_url: ex.image_url,
            video_url: ex.video_url,
            body_parts: ex.body_parts || [],
            equipment: ex.equipment || []
        };
    };

    // Full Body identifiers
    const fbIds = ['2', '18', '105', '145', '107', '6'];
    MOCK_AI_PLANS[0].exercises = fbIds.map(getEx).filter(Boolean) as SavedExercise[];

    // Push identifiers (Chest/Triceps/Shoulders)
    const pushIds = ['2', '136', '145', '107', '18'];
    MOCK_AI_PLANS[1].exercises = pushIds.map(getEx).filter(Boolean) as SavedExercise[];

    // Legs identifiers
    const legIds = ['105', '107', '145', '6']; // Note: IDs might need adjustment to be pure legs, kept previous logic
    MOCK_AI_PLANS[2].exercises = legIds.map(getEx).filter(Boolean) as SavedExercise[];

    // Pull identifiers
    const pullIds = ['18', '136', '2', '107'];
    MOCK_AI_PLANS[3].exercises = pullIds.map(getEx).filter(Boolean) as SavedExercise[];

    console.log('[AI Service] Populated:', MOCK_AI_PLANS.map(p => `${p.name}=${p.exercises.length}ex`).join(', '));
    return MOCK_AI_PLANS;
};

interface CacheData {
    plans: AIWorkoutPlan[];
    timestamp: number;
}

export async function generateWorkoutPlans(suggestedFocus?: string, suggestedMuscles?: string[]): Promise<AIWorkoutPlan[]> {
    // 1. Return memory cache if available and valid
    // Only use cache if no specific focus is requested
    if (!suggestedFocus && arePlansValid(cachedPlans)) {
        return cachedPlans!;
    }

    // 2. If a fetch is already in progress, wait for it
    if (fetchPromise) {
        return fetchPromise;
    }

    // Define the actual fetch logic
    const fetchAction = async (): Promise<AIWorkoutPlan[]> => {
        // 3. Try to load from AsyncStorage
        try {
            const storedCache = await AsyncStorage.getItem(CACHE_KEY);
            if (storedCache) {
                const parsedCache: CacheData = JSON.parse(storedCache);
                const now = Date.now();

                // Use cache if it's not expired and has exercises
                // Only use cache if no specific focus is requested
                if (!suggestedFocus && now - parsedCache.timestamp < CACHE_EXPIRATION && arePlansValid(parsedCache.plans)) {
                    cachedPlans = parsedCache.plans;
                    lastFetchTime = parsedCache.timestamp;
                    return cachedPlans;
                } else if (parsedCache.plans && !arePlansValid(parsedCache.plans)) {
                    console.warn('[AI Service] Persistent cache has empty plans, ignoring it.');
                }
            }
        } catch (e) {
            console.warn('Failed to load AI plans from AsyncStorage:', e);
        }

        // 4. If no Gemini API key is configured, fallback smoothly to curated plans
        if (!GEMINI_API_KEY) {
            const populated = ensureMockPlansPopulated();
            cachedPlans = populated;
            return populated;
        }

        // 5. Fetch from API if cache is missing or expired
        try {
            // Get a diverse sample of exercises from key muscle groups
            const mainGroups = ['Peito', 'Costas', 'Coxas', 'Ombros', 'Bíceps', 'Tríceps'];
            const diversePool: any[] = [];

            mainGroups.forEach(group => {
                const groupEx = exercisesData
                    .filter((ex: any) => ex.body_parts.some((p: string) => p.includes(group)))
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 8); // 8 exercises per group
                diversePool.push(...groupEx);
            });

            // Fallback to slice if pool is tight for some reason
            const finalPool = diversePool.length > 10 ? diversePool : exercisesData.slice(0, 40);

            const sampleExercises = finalPool.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                body_parts: ex.body_parts
            }));

            const prompt = `Você é um personal trainer especializado. Sua missão agora é gerar 4 planos de treino.
            
            ${suggestedFocus ? `FOCO PRINCIPAL OBRIGATÓRIO: Este treino DEVE ser focado em ${suggestedFocus} (${suggestedMuscles?.join(', ')}).` : 'Gere planos variados para diferentes níveis e objetivos.'}

            IMPORTANTE SOBRE O EQUILÍBRIO:
            - Os planos devem ser altamente específicos para o grupo muscular solicitado.
            - Se o foco for "${suggestedFocus}", PELO MENOS 3 dos 4 planos gerados devem ser focados exclusivamente nisso.
            - Treinos combinados DEVEM conter exercícios de ambos os grupos de forma equilibrada.
            - MANTENHA A VARIEDADE: Não repita os mesmos exercícios em todos os planos.

            Para cada plano, forneça:
            1. Nome do treino (criativo, motivador e que mencione o foco ${suggestedFocus || ''})
            2. Descrição breve (1 linha)
            3. Nível de dificuldade (Iniciante, Intermediário, ou Avançado)
            4. Duração estimada (Deve ser OBRIGATORIAMENTE entre "50 min" e "75 min")
            5. Lista de 8 a 10 IDs de exercícios da lista abaixo que formam um treino completo, volumoso e focado em ${suggestedFocus || 'um objetivo específico'}.

            Exercícios disponíveis (use apenas os IDs destes exercícios):
            ${JSON.stringify(sampleExercises, null, 2)}

            IMPORTANTE: Gere 4 opções para o usuário escolher, todas focadas em atingir o objetivo de ${suggestedFocus || 'desenvolvimento físico geral'}.

            Responda APENAS com um JSON válido no seguinte formato:
            {
                "plans": [
                    {
                        "name": "Nome do Treino",
                        "description": "Descrição",
                        "difficulty": "Iniciante|Intermediário|Avançado",
                        "duration": "XX min",
                        "exerciseIds": [1, 2, 3, 4, 5]
                    }
                ]
            } `;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 403) {
                    console.warn('[AI Service] Gemini API key expired/leaked. Using curated workout plans.');
                } else if (response.status === 429) {
                    console.warn('[AI Service] Gemini API rate limited (429). Using curated workout plans.');
                } else {
                    console.warn(`[AI Service] Gemini API returned status ${response.status}. Using curated workout plans.`);
                }
                const populated = ensureMockPlansPopulated();
                cachedPlans = populated;
                return populated;
            }

            const data = await response.json();
            let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                throw new Error('No response from Gemini API');
            }

            // Cleanup potential markdown formatting
            generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

            let parsedResponse;
            try {
                parsedResponse = JSON.parse(generatedText);
            } catch (e) {
                console.warn("[AI Service] Gemini response truncated or invalid. Attempting repair...");

                // Aggressive repair for truncated JSON
                let repaired = generatedText;

                // 1. If it ends inside a string/value but doesn't close it
                if (repaired.lastIndexOf('"') > repaired.lastIndexOf(':') && repaired.lastIndexOf(',') < repaired.lastIndexOf('"')) {
                    // String might be open
                }

                // Simplest repair: keep adding closing tokens until it parses or we give up
                const tokens = ['"', '}', ']', '}'];
                let success = false;
                let tempRepaired = repaired;

                // Try closing with different combinations of tokens
                // But honestly, the most reliable "repair" is just using the last valid object found
                const lastValidObject = (str: string) => {
                    let lastBrace = str.lastIndexOf('}');
                    while (lastBrace > 0) {
                        try {
                            const candidate = str.substring(0, lastBrace + 1) + ']}';
                            const p = JSON.parse(candidate);
                            if (p && p.plans) return p;
                        } catch (err) { }
                        lastBrace = str.lastIndexOf('}', lastBrace - 1);
                    }
                    return null;
                };

                parsedResponse = lastValidObject(repaired);

                if (!parsedResponse) {
                    console.error("[AI Service] Unrepairable JSON response. Falling back to Mock Plans.");
                    const populated = ensureMockPlansPopulated();
                    cachedPlans = populated;
                    return populated;
                }
            }

            // Validate the parsed response
            if (!parsedResponse || !parsedResponse.plans || !Array.isArray(parsedResponse.plans)) {
                console.warn('AI response missing valid plans array. Using mock data.');
                const populated = ensureMockPlansPopulated();
                cachedPlans = populated;
                return populated;
            }

            // Check if plans are complete
            const validPlans = parsedResponse.plans.filter((plan: any) =>
                plan && plan.exerciseIds && Array.isArray(plan.exerciseIds) && plan.exerciseIds.length > 0
            );

            if (validPlans.length === 0) {
                console.warn('All AI plans are incomplete. Using mock data.');
                const populated = ensureMockPlansPopulated();
                cachedPlans = populated;
                return populated;
            }


            const aiPlans: AIWorkoutPlan[] = parsedResponse.plans.map((plan: any, index: number) => {
                const exercises: SavedExercise[] = plan.exerciseIds
                    .map((id: any) => {
                        const ex = exercisesData.find((e: any) => e.id.toString() === id.toString());
                        if (!ex) return null;
                        return {
                            id: ex.id.toString(),
                            name: ex.name,
                            image_url: ex.image_url,
                            video_url: ex.video_url,
                            body_parts: ex.body_parts || [],
                            equipment: ex.equipment || []
                        };
                    })
                    .filter((ex: any) => ex !== null);

                return {
                    id: `ai-plan-${index + 1}`,
                    name: plan.name,
                    description: plan.description,
                    difficulty: plan.difficulty,
                    duration: plan.duration,
                    isAIGenerated: true,
                    exercises
                };
            });

            // Update memory cache and AsyncStorage
            const timestamp = Date.now();
            cachedPlans = aiPlans;
            lastFetchTime = timestamp;

            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                plans: aiPlans,
                timestamp
            }));

            return aiPlans;

        } catch (error: any) {
            if (error.message && error.message.includes('429')) {
                console.warn('Gemini API rate limited (429). Using mock data fallback.');
            } else {
                console.error('Error generating AI workout plans:', error);
            }
            // Return mock data as fallback (but don't cache locally so we try again next time)
            cachedPlans = ensureMockPlansPopulated();
            return cachedPlans;
        } finally {
            // Success or failure, reset the promise so we can try again later if needed
            fetchPromise = null;
        }
    };

    // Assign to module-level promise and execute
    fetchPromise = fetchAction();
    return fetchPromise;
}

// Clear cache (useful for refreshing plans)
export async function clearAIPlansCache(): Promise<void> {
    cachedPlans = null;
    fetchPromise = null;
    try {
        await AsyncStorage.removeItem(CACHE_KEY);
    } catch (e) {
        console.warn('Failed to clear AI plans cache from AsyncStorage:', e);
    }
}

// Convert AI plan to SavedWorkout format
export function convertAIPlanToWorkout(aiPlan: AIWorkoutPlan): Omit<SavedWorkout, 'id' | 'createdAt' | 'lastDone'> {
    return {
        name: aiPlan.name,
        exercises: aiPlan.exercises,
        frequency: 'Semanal',
        isAIGenerated: true
    };
}
