export interface Lesson {
    id: string;
    title: string;
    duration: string;
    level: 'Iniciante' | 'Intermediário' | 'Avançado';
    thumbnail?: string;
}

export interface Coach {
    id: string;
    name: string;
    role: string;
    specialty: string;
    bio: string;
    image: any;
    rating: number;
    students: string;
    lessons: Lesson[];
    tags: string[];
    recommendedPrograms?: string[];
}

export const COACHES: Coach[] = [
    {
        id: 'coach-1',
        name: 'Marcos "Tank" Silva',
        role: 'Treinador de Elite',
        specialty: 'Hipertrofia & Força',
        bio: 'Especialista em musculação avançada com mais de 15 anos transformando atletas. Foco em biomecânica e resultados sólidos.',
        image: require('../assets/coaches/marcos.png'),
        rating: 4.9,
        students: '12.4k',
        tags: ['Bodybuilding', 'Força bruta', 'Elite'],
        lessons: [
            { id: 'l1', title: 'Fundamentos do Supino Pesado', duration: '12 min', level: 'Intermediário' },
            { id: 'l2', title: 'Explosão no Agachamento', duration: '15 min', level: 'Avançado' },
            { id: 'l3', title: 'Pico de Contração: Bíceps', duration: '10 min', level: 'Iniciante' }
        ],
        recommendedPrograms: ['2', 'arm-pump', '4']
    },
    {
        id: 'coach-2',
        name: 'Julia Santos', // Renamed to clarify her role as performance/functional
        role: 'Performance Coach',
        specialty: 'Mobilidade & Funcional',
        bio: 'Focada em longevidade e performance através do movimento natural. Treinamentos que unem força e flexibilidade total.',
        image: require('../assets/coaches/julia.png'),
        rating: 4.8,
        students: '8.2k',
        tags: ['Mobilidade', 'Yoga', 'Atleta'],
        lessons: [
            { id: 'l4', title: 'Mobilidade de Quadril para Atletas', duration: '20 min', level: 'Iniciante' },
            { id: 'l5', title: 'Core Funcional: Estabilidade', duration: '18 min', level: 'Intermediário' },
            { id: 'l6', title: 'Ritual de Recuperação Pós-Treino', duration: '15 min', level: 'Iniciante' }
        ],
        recommendedPrograms: ['1', 'full-body-1h']
    },
    {
        id: 'coach-3',
        name: 'Dra. Elena Costa',
        role: 'Consultora de Saúde',
        specialty: 'Longevidade & Bem-estar',
        bio: 'Médica esportiva dedicada a otimizar a saúde através do exercício inteligente. Ciência aplicada ao seu treinamento diário.',
        image: require('../assets/coaches/elena.png'),
        rating: 5.0,
        students: '5.1k',
        tags: ['Saúde', 'Ciência', 'Fisiologia'],
        lessons: [
            { id: 'l7', title: 'Fisiologia do Treino em Jejum', duration: '25 min', level: 'Avançado' },
            { id: 'l8', title: 'Gestão de Sono para Recuperação', duration: '22 min', level: 'Iniciante' },
            { id: 'l9', title: 'Suplementação Baseada em Evidências', duration: '30 min', level: 'Intermediário' }
        ],
        recommendedPrograms: ['full-body-1h', '5']
    }
];
