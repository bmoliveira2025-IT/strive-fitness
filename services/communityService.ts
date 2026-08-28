import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface CommunityComment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
}

export interface CommunityPost {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userBadge?: string;
    content: string;
    category: 'Geral' | 'Treinos' | 'Dicas & Séries' | 'Mobilidade' | 'Motivação' | 'Evolução';
    workoutTag?: string;
    workoutStats?: {
        durationMinutes?: number;
        calories?: number;
        exercisesCount?: number;
    };
    imageUrl?: string;
    likesCount: number;
    commentsCount: number;
    isLikedByMe?: boolean;
    isFictitious?: boolean;
    createdAt: string;
    comments?: CommunityComment[];
}

const COMMUNITY_POSTS_CACHE_KEY = '@strive_community_posts_cache_v3';
const COMMUNITY_LIKES_KEY = '@strive_community_user_likes';

// Fictitious personas with realistic fitness profiles
export const FICTITIOUS_PERSONAS = [
    {
        id: 'persona-lucas',
        name: 'Lucas Silva',
        badge: 'Calistenia & Força',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    {
        id: 'persona-camila',
        name: 'Camila Rocha',
        badge: 'Personal Trainer',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    },
    {
        id: 'persona-rodrigo',
        name: 'Rodrigo Lima',
        badge: 'Powerlifting',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    {
        id: 'persona-beatriz',
        name: 'Beatriz Santos',
        badge: 'Mobilidade & Yoga',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    },
    {
        id: 'persona-felipe',
        name: 'Felipe Costa',
        badge: 'Hipertrofia',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    },
    {
        id: 'persona-juliana',
        name: 'Juliana Mendes',
        badge: 'Cross Training',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    },
    {
        id: 'persona-mariana',
        name: 'Mariana Alves',
        badge: 'Atleta Ouro',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    },
    {
        id: 'persona-gabriel',
        name: 'Gabriel Souza',
        badge: 'Endurance & Corrida',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    },
];

// Rich rotational database of daily posts categorized by day themes
interface PostTemplate {
    personaId: string;
    category: CommunityPost['category'];
    workoutTag: string;
    workoutStats?: CommunityPost['workoutStats'];
    content: string;
    baseLikes: number;
    baseComments: number;
}

const POST_TEMPLATES_BY_DAY: Record<number, PostTemplate[]> = {
    // 0: Domingo (Planejamento, descanso ativo, refeições, mobilidade)
    0: [
        {
            personaId: 'persona-beatriz',
            category: 'Mobilidade',
            workoutTag: 'Alongamento & Descompressão de Domingo',
            workoutStats: { durationMinutes: 25, calories: 110, exercisesCount: 5 },
            content: 'Domingo de descanso ativo! Fiz 25 minutos focados na mobilidade de quadril e lombar. Preparar as articulações hoje garante treinos pesados e sem dores a semana inteira!',
            baseLikes: 34,
            baseComments: 6,
        },
        {
            personaId: 'persona-camila',
            category: 'Dicas & Séries',
            workoutTag: 'Planejamento da Semana',
            content: '💡 Dica para começar a semana no foco: organize suas roupas de treino e suas marmitas hoje à noite. Eliminar pequenas decisões matinais aumenta sua consistência em mais de 70%!',
            baseLikes: 48,
            baseComments: 9,
        },
        {
            personaId: 'persona-gabriel',
            category: 'Treinos',
            workoutTag: 'Longão de Domingo (Corrida Leve)',
            workoutStats: { durationMinutes: 50, calories: 460, exercisesCount: 1 },
            content: 'Rodagem leve de 8km no parque para limpar a mente. Manter a frequência cardíaca na Zona 2 aos domingos melhora incrivelmente a recuperação muscular.',
            baseLikes: 29,
            baseComments: 4,
        },
    ],

    // 1: Segunda-feira (Peito, Upper, Motivação máxima, Começo da semana)
    1: [
        {
            personaId: 'persona-lucas',
            category: 'Treinos',
            workoutTag: 'Peito & Tríceps (Super Séries)',
            workoutStats: { durationMinutes: 55, calories: 430, exercisesCount: 6 },
            content: 'Segunda-feira sagrada de peito e tríceps! Supino inclinado com halteres 4x8-10 com pico de contração no topo. Começar a semana com treino pesado dita o ritmo dos próximos dias!',
            baseLikes: 45,
            baseComments: 8,
        },
        {
            personaId: 'persona-juliana',
            category: 'Motivação',
            workoutTag: 'Mentalidade Vencedora',
            content: '🔥 Segunda-feira não é dia de reclamar, é dia de colocar as desculpas de lado e cumprir a meta diária. Você não precisa de motivação eterna, só precisa de disciplina!',
            baseLikes: 56,
            baseComments: 12,
        },
        {
            personaId: 'persona-felipe',
            category: 'Dicas & Séries',
            workoutTag: 'Dica: Conexão Mente-Músculo',
            content: 'Dica valiosa: no supino ou crucifixo, pense em aproximar os bíceps um do outro em vez de apenas empurrar a carga com as mãos. A ativação no peitoral dobra instantaneamente!',
            baseLikes: 39,
            baseComments: 7,
        },
    ],

    // 2: Terça-feira (Costas, Bíceps, Puxadas, RPE)
    2: [
        {
            personaId: 'persona-rodrigo',
            category: 'Treinos',
            workoutTag: 'Dorsal Pesada & Levantamento Terra',
            workoutStats: { durationMinutes: 62, calories: 510, exercisesCount: 6 },
            content: 'Puxada alta unilateral + remada curvada pegada pronada. O segredo para dorsais densas é puxar com os cotovelos e alongar totalmente as escápulas na descida.',
            baseLikes: 41,
            baseComments: 9,
        },
        {
            personaId: 'persona-camila',
            category: 'Dicas & Séries',
            workoutTag: 'Correção de Postura na Remada',
            content: '💡 Se você sente o antebraço fadigar antes das costas nas remadas, use straps em cargas máximas ou foque em segurar com gancho. Não deixe a pegada ser o fator limitante da sua hipertrofia dorsal!',
            baseLikes: 50,
            baseComments: 11,
        },
        {
            personaId: 'persona-mariana',
            category: 'Evolução',
            workoutTag: 'Evolução de Costas & Bíceps',
            workoutStats: { durationMinutes: 48, calories: 380, exercisesCount: 5 },
            content: 'Hoje fechei o treino de costas com rosca direta na barra W com drop-set na 4ª série. Sensação de dever cumprido!',
            baseLikes: 37,
            baseComments: 5,
        },
    ],

    // 3: Quarta-feira (Leg Day, Pernas, Mobilidade de Quadril)
    3: [
        {
            personaId: 'persona-felipe',
            category: 'Treinos',
            workoutTag: 'Leg Day Destruidor (Quadríceps & Panturrilhas)',
            workoutStats: { durationMinutes: 60, calories: 540, exercisesCount: 7 },
            content: 'Quarta de pernas! Agachamento livre 5x8 com carga progressiva, finalizando no leg press 45° com pés juntos na base. Saí do treino precisando de ajuda pra descer as escadas 🔥',
            baseLikes: 62,
            baseComments: 14,
        },
        {
            personaId: 'persona-beatriz',
            category: 'Mobilidade',
            workoutTag: 'Mobilidade Pré-Agachamento',
            workoutStats: { durationMinutes: 18, calories: 85, exercisesCount: 4 },
            content: 'Nunca agache com carga pesada sem antes soltar o tornozelo e os flexores do quadril! 10 minutinhos de mobilidade aumentam a profundidade do agachamento sem sobrecarregar a lombar.',
            baseLikes: 46,
            baseComments: 7,
        },
        {
            personaId: 'persona-mariana',
            category: 'Treinos',
            workoutTag: 'Glúteo & Posterior de Coxa',
            workoutStats: { durationMinutes: 52, calories: 420, exercisesCount: 6 },
            content: 'Elevação pélvica pesada com 140kg + Stiff com halteres mantendo a coluna 100% neutra. O estímulo no posterior foi absurdo hoje!',
            baseLikes: 53,
            baseComments: 10,
        },
    ],

    // 4: Quinta-feira (Ombros, Trapézio, Deltoides, Dicas de Lesão)
    4: [
        {
            personaId: 'persona-camila',
            category: 'Dicas & Séries',
            workoutTag: 'Ombro 3D sem Dores no Manguito',
            content: '💡 Dica de ouro para elevação lateral: incline ligeiramente o tronco para a frente (15°) e projete os cotovelos no plano escapular (levemente à frente do corpo). Zero impacto articular e foco total no deltoide lateral!',
            baseLikes: 58,
            baseComments: 13,
        },
        {
            personaId: 'persona-lucas',
            category: 'Treinos',
            workoutTag: 'Desenvolvimento Militar & Elevações',
            workoutStats: { durationMinutes: 50, calories: 390, exercisesCount: 5 },
            content: 'Desenvolvimento militar em pé com barra: 4 séries com 70kg controlando a descida. Ombros queimando do início ao fim!',
            baseLikes: 38,
            baseComments: 6,
        },
        {
            personaId: 'persona-juliana',
            category: 'Motivação',
            workoutTag: 'Consistência na Semana',
            content: 'Quinta-feira é o dia em que muitos começam a desanimar. Quem treina hoje com a mesma intensidade de segunda é quem realmente vê resultados duradouros!',
            baseLikes: 44,
            baseComments: 8,
        },
    ],

    // 5: Sexta-feira (Braços, Super Séries, PRs, Fim de Semana)
    5: [
        {
            personaId: 'persona-rodrigo',
            category: 'Evolução',
            workoutTag: 'Super Séries de Bíceps & Tríceps',
            workoutStats: { durationMinutes: 52, calories: 440, exercisesCount: 6 },
            content: 'Sextou do melhor jeito: super série de tríceps testa + rosca direta! Pump de braço no nível máximo pra fechar os treinos da semana útil com chave de ouro.',
            baseLikes: 67,
            baseComments: 15,
        },
        {
            personaId: 'persona-gabriel',
            category: 'Treinos',
            workoutTag: 'HIIT & Condicionamento Rápido',
            workoutStats: { durationMinutes: 35, calories: 380, exercisesCount: 4 },
            content: 'Treino express de 35 minutos hoje: tiros intervalados na esteira intercalados com flexões e kettlebell swings. Metabolismo acelerado pro fim de semana!',
            baseLikes: 35,
            baseComments: 5,
        },
        {
            personaId: 'persona-lucas',
            category: 'Treinos',
            workoutTag: 'Calistenia: Muscle-Ups & Barras',
            workoutStats: { durationMinutes: 45, calories: 360, exercisesCount: 5 },
            content: 'Fechando a sexta com 5x5 muscle-ups limpos na barra. A força relativa do corpo próprio é a base de tudo!',
            baseLikes: 49,
            baseComments: 9,
        },
    ],

    // 6: Sábado (Fullbody, Desafio, Treino ao ar livre, Cross)
    6: [
        {
            personaId: 'persona-juliana',
            category: 'Treinos',
            workoutTag: 'WOD de Sábado em Equipe',
            workoutStats: { durationMinutes: 55, calories: 590, exercisesCount: 5 },
            content: 'WOD em trio no sábado de manhã! 100 burpees, 200 agachamentos, 150 kettlebell swings e 1km de corrida. Energia surreal da galera hoje!',
            baseLikes: 60,
            baseComments: 14,
        },
        {
            personaId: 'persona-beatriz',
            category: 'Mobilidade',
            workoutTag: 'Yoga & Flexibilidade ao Ar Livre',
            workoutStats: { durationMinutes: 30, calories: 120, exercisesCount: 6 },
            content: 'Prática de flexibilidade no sol da manhã. Alongar grandes cadeias musculares com respiração diafragmática reduz o estresse da semana em minutos.',
            baseLikes: 42,
            baseComments: 6,
        },
        {
            personaId: 'persona-felipe',
            category: 'Motivação',
            workoutTag: 'Foco no Final de Semana',
            content: 'Sábado também é dia de treino! Não jogue fora o esforço de 5 dias comendo besteira sem limites. Equilíbrio é saber aproveitar sem perder o foco dos objetivos.',
            baseLikes: 51,
            baseComments: 11,
        },
    ],
};

// Generates dynamic daily simulated posts based on current date and day of the week
export const generateDailySimulatedPosts = (): CommunityPost[] => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0-6
    const currentHour = now.getHours();

    const todayTemplates = POST_TEMPLATES_BY_DAY[currentDayOfWeek] || POST_TEMPLATES_BY_DAY[1];
    const yesterdayDayOfWeek = (currentDayOfWeek + 6) % 7;
    const yesterdayTemplates = POST_TEMPLATES_BY_DAY[yesterdayDayOfWeek] || POST_TEMPLATES_BY_DAY[2];

    const posts: CommunityPost[] = [];

    // 1. Posts from TODAY (scaled by current hour of the day)
    todayTemplates.forEach((template, idx) => {
        const persona = FICTITIOUS_PERSONAS.find((p) => p.id === template.personaId) || FICTITIOUS_PERSONAS[0];
        
        // Distribute hours naturally: morning (1h-2h ago), midday (3h-4h ago), afternoon (5h-7h ago)
        const hourOffset = idx === 0 ? Math.max(1, currentHour > 10 ? 2 : 1) : idx === 1 ? Math.max(3, currentHour > 14 ? 4 : 2) : Math.max(6, currentHour > 18 ? 7 : 4);
        const postDate = new Date(now.getTime() - hourOffset * 60 * 60 * 1000 - idx * 17 * 60 * 1000);

        posts.push({
            id: `daily-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${persona.id}-${idx}`,
            userId: persona.id,
            userName: persona.name,
            userAvatar: persona.avatar,
            userBadge: persona.badge,
            category: template.category,
            workoutTag: template.workoutTag,
            workoutStats: template.workoutStats,
            content: template.content,
            likesCount: template.baseLikes + (now.getDate() % 7),
            commentsCount: template.baseComments + (now.getDate() % 3),
            isFictitious: true,
            createdAt: postDate.toISOString(),
        });
    });

    // 2. Posts from YESTERDAY (to keep feed full and natural)
    yesterdayTemplates.forEach((template, idx) => {
        const persona = FICTITIOUS_PERSONAS.find((p) => p.id === template.personaId) || FICTITIOUS_PERSONAS[idx % FICTITIOUS_PERSONAS.length];
        const postDate = new Date(now.getTime() - (24 + idx * 4) * 60 * 60 * 1000);

        posts.push({
            id: `yesterday-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${persona.id}-${idx}`,
            userId: persona.id,
            userName: persona.name,
            userAvatar: persona.avatar,
            userBadge: persona.badge,
            category: template.category,
            workoutTag: template.workoutTag,
            workoutStats: template.workoutStats,
            content: template.content,
            likesCount: template.baseLikes + 12,
            commentsCount: template.baseComments + 4,
            isFictitious: true,
            createdAt: postDate.toISOString(),
        });
    });

    // Sort descending by date
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const CommunityService = {
    // Get list of my liked post IDs
    getMyLikedPostIds: async (): Promise<string[]> => {
        try {
            const raw = await AsyncStorage.getItem(COMMUNITY_LIKES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    // Save my liked post IDs
    setMyLikedPostIds: async (ids: string[]): Promise<void> => {
        try {
            await AsyncStorage.setItem(COMMUNITY_LIKES_KEY, JSON.stringify(ids));
        } catch (e) {
            console.warn('Error saving liked posts:', e);
        }
    },

    // Fetch posts from Supabase or fallback/seed with local cache + personas
    getPosts: async (categoryFilter?: string): Promise<CommunityPost[]> => {
        const likedIds = await CommunityService.getMyLikedPostIds();
        const dailySimulated = generateDailySimulatedPosts();

        try {
            // Attempt to query Supabase
            let query = supabase
                .from('community_posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (categoryFilter && categoryFilter !== 'Todos' && categoryFilter !== 'Geral') {
                query = query.eq('category', categoryFilter);
            }

            const { data, error } = await query;

            if (!error && data) {
                // Map remote user posts
                const remotePosts: CommunityPost[] = data.map((item: any) => ({
                    id: item.id,
                    userId: item.user_id,
                    userName: item.user_name || 'Atleta Strive',
                    userAvatar: item.user_avatar || undefined,
                    userBadge: item.user_badge || undefined,
                    content: item.content,
                    category: item.category || 'Geral',
                    workoutTag: item.workout_tag || undefined,
                    workoutStats: item.workout_stats || undefined,
                    imageUrl: item.image_url || undefined,
                    likesCount: item.likes_count || 0,
                    commentsCount: item.comments_count || 0,
                    isFictitious: item.is_fictitious || false,
                    createdAt: item.created_at,
                    isLikedByMe: likedIds.includes(item.id),
                }));

                // Combine real user posts with the daily simulated posts
                const allPostsMap = new Map<string, CommunityPost>();
                
                // Add real remote posts first
                remotePosts.forEach((p) => allPostsMap.set(p.id, p));

                // Add dynamic daily simulated posts
                dailySimulated.forEach((p) => {
                    if (!allPostsMap.has(p.id)) {
                        allPostsMap.set(p.id, {
                            ...p,
                            isLikedByMe: likedIds.includes(p.id),
                        });
                    }
                });

                const combined = Array.from(allPostsMap.values()).sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                const filtered = categoryFilter && categoryFilter !== 'Todos'
                    ? combined.filter((p) => p.category === categoryFilter)
                    : combined;

                // Cache for offline
                await AsyncStorage.setItem(COMMUNITY_POSTS_CACHE_KEY, JSON.stringify(combined)).catch(() => {});
                return filtered;
            }
        } catch (err) {
            console.log('Supabase posts fetch note (using dynamic daily):', err);
        }

        // Fallback / offline mode
        try {
            const cachedRaw = await AsyncStorage.getItem(COMMUNITY_POSTS_CACHE_KEY);
            if (cachedRaw) {
                const cached: CommunityPost[] = JSON.parse(cachedRaw);
                const allPostsMap = new Map<string, CommunityPost>();

                cached.forEach((p) => allPostsMap.set(p.id, p));
                dailySimulated.forEach((p) => allPostsMap.set(p.id, p));

                const mapped = Array.from(allPostsMap.values())
                    .map((p) => ({
                        ...p,
                        isLikedByMe: likedIds.includes(p.id),
                    }))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                if (categoryFilter && categoryFilter !== 'Todos') {
                    return mapped.filter((p) => p.category === categoryFilter);
                }
                return mapped;
            }
        } catch {}

        const mappedSimulated = dailySimulated.map((p) => ({
            ...p,
            isLikedByMe: likedIds.includes(p.id),
        }));

        if (categoryFilter && categoryFilter !== 'Todos') {
            return mappedSimulated.filter((p) => p.category === categoryFilter);
        }
        return mappedSimulated;
    },

    // Create a new post by a user
    createPost: async (postData: {
        userId: string;
        userName: string;
        userAvatar?: string;
        content: string;
        category: CommunityPost['category'];
        workoutTag?: string;
        workoutStats?: CommunityPost['workoutStats'];
        userBadge?: string;
    }): Promise<CommunityPost> => {
        const newPost: CommunityPost = {
            id: 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            userId: postData.userId,
            userName: postData.userName,
            userAvatar: postData.userAvatar,
            userBadge: postData.userBadge || 'Atleta Strive',
            content: postData.content,
            category: postData.category || 'Geral',
            workoutTag: postData.workoutTag,
            workoutStats: postData.workoutStats,
            likesCount: 0,
            commentsCount: 0,
            isLikedByMe: false,
            isFictitious: false,
            createdAt: new Date().toISOString(),
        };

        // Try to save to Supabase
        try {
            const { data, error } = await supabase
                .from('community_posts')
                .insert({
                    user_id: newPost.userId,
                    user_name: newPost.userName,
                    user_avatar: newPost.userAvatar,
                    user_badge: newPost.userBadge,
                    content: newPost.content,
                    category: newPost.category,
                    workout_tag: newPost.workoutTag,
                    workout_stats: newPost.workoutStats,
                    likes_count: 0,
                    comments_count: 0,
                    is_fictitious: false,
                })
                .select()
                .single();

            if (!error && data) {
                newPost.id = data.id;
            }
        } catch (e) {
            console.warn('Supabase createPost error (saving locally):', e);
        }

        // Update local cache
        try {
            const cachedRaw = await AsyncStorage.getItem(COMMUNITY_POSTS_CACHE_KEY);
            const cached: CommunityPost[] = cachedRaw ? JSON.parse(cachedRaw) : [];
            const updated = [newPost, ...cached];
            await AsyncStorage.setItem(COMMUNITY_POSTS_CACHE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.warn('Error updating local cache:', e);
        }

        return newPost;
    },

    // Toggle like on a post
    toggleLike: async (postId: string, userId: string, currentLikesCount: number, wasLiked: boolean): Promise<{ likesCount: number; isLiked: boolean }> => {
        const newIsLiked = !wasLiked;
        const newLikesCount = Math.max(0, currentLikesCount + (newIsLiked ? 1 : -1));

        // Update local user likes set
        const myLikes = await CommunityService.getMyLikedPostIds();
        const updatedLikes = newIsLiked
            ? Array.from(new Set([...myLikes, postId]))
            : myLikes.filter((id) => id !== postId);
        await CommunityService.setMyLikedPostIds(updatedLikes);

        // Update local posts cache
        try {
            const cachedRaw = await AsyncStorage.getItem(COMMUNITY_POSTS_CACHE_KEY);
            if (cachedRaw) {
                const cached: CommunityPost[] = JSON.parse(cachedRaw);
                const updated = cached.map((p) =>
                    p.id === postId
                        ? { ...p, likesCount: newLikesCount, isLikedByMe: newIsLiked }
                        : p
                );
                await AsyncStorage.setItem(COMMUNITY_POSTS_CACHE_KEY, JSON.stringify(updated));
            }
        } catch {}

        // Persist to Supabase in background
        (async () => {
            try {
                if (newIsLiked) {
                    await supabase.from('community_likes').upsert({
                        post_id: postId,
                        user_id: userId,
                    });
                } else {
                    await supabase
                        .from('community_likes')
                        .delete()
                        .match({ post_id: postId, user_id: userId });
                }

                await supabase
                    .from('community_posts')
                    .update({ likes_count: newLikesCount })
                    .eq('id', postId);
            } catch (err) {
                // Ignore sync error if offline or simulated post
            }
        })();

        return { likesCount: newLikesCount, isLiked: newIsLiked };
    },

    // Fetch comments for a post
    getComments: async (postId: string): Promise<CommunityComment[]> => {
        try {
            const { data, error } = await supabase
                .from('community_comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (!error && data && data.length > 0) {
                return data.map((c: any) => ({
                    id: c.id,
                    postId: c.post_id,
                    userId: c.user_id,
                    userName: c.user_name,
                    userAvatar: c.user_avatar,
                    content: c.content,
                    createdAt: c.created_at,
                }));
            }
        } catch (e) {
            console.log('Comments fetch note:', e);
        }

        // Return contextual sample comments for simulated posts
        const now = new Date();
        return [
            {
                id: 'sample-c-1-' + postId,
                postId,
                userId: 'user-camila',
                userName: 'Camila Rocha',
                userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
                content: 'Excelente relato! Essa variação de estímulo é fundamental para hipertrofia.',
                createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
            },
            {
                id: 'sample-c-2-' + postId,
                postId,
                userId: 'user-rodrigo',
                userName: 'Rodrigo Lima',
                userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
                content: 'Muito bom! Vou aplicar essa técnica na minha próxima sessão.',
                createdAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
            },
        ];
    },

    // Add comment to post
    addComment: async (commentData: {
        postId: string;
        userId: string;
        userName: string;
        userAvatar?: string;
        content: string;
    }): Promise<CommunityComment> => {
        const newComment: CommunityComment = {
            id: 'comment-' + Date.now(),
            postId: commentData.postId,
            userId: commentData.userId,
            userName: commentData.userName,
            userAvatar: commentData.userAvatar,
            content: commentData.content,
            createdAt: new Date().toISOString(),
        };

        // Try to save in Supabase
        try {
            await supabase.from('community_comments').insert({
                post_id: newComment.postId,
                user_id: newComment.userId,
                user_name: newComment.userName,
                user_avatar: newComment.userAvatar,
                content: newComment.content,
            });

            // Increment comments_count
            const { data } = await supabase
                .from('community_posts')
                .select('comments_count')
                .eq('id', newComment.postId)
                .single();

            if (data) {
                await supabase
                    .from('community_posts')
                    .update({ comments_count: (data.comments_count || 0) + 1 })
                    .eq('id', newComment.postId);
            }
        } catch (e) {
            console.warn('Comment persist error (offline):', e);
        }

        // Update local cache
        try {
            const cachedRaw = await AsyncStorage.getItem(COMMUNITY_POSTS_CACHE_KEY);
            if (cachedRaw) {
                const cached: CommunityPost[] = JSON.parse(cachedRaw);
                const updated = cached.map((p) =>
                    p.id === commentData.postId
                        ? { ...p, commentsCount: p.commentsCount + 1 }
                        : p
                );
                await AsyncStorage.setItem(COMMUNITY_POSTS_CACHE_KEY, JSON.stringify(updated));
            }
        } catch {}

        return newComment;
    },
};
