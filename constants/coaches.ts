export interface Lesson {
    id: string;
    title: string;
    duration: string;
    level: 'Iniciante' | 'Intermediário' | 'Avançado';
    thumbnail?: string;
    summary: string;
    steps: string[];
}

export interface Coach {
    id: string;
    name: string;
    role: string;
    specialty: string;
    bio: string;
    image: any;
    lessons: Lesson[];
    tags: string[];
    recommendedPrograms?: string[];
}

export const COACHES: Coach[] = [
    {
        id: 'coach-1',
        name: 'Marcos "Tank" Silva',
        role: 'Perfil-guia · força',
        specialty: 'Hipertrofia & Força',
        bio: 'Trilhas educativas sobre fundamentos de força, progressão e execução. Este é um perfil editorial, não um atendimento individual.',
        image: require('../assets/coaches/marcos.jpg'),
        tags: ['Bodybuilding', 'Força bruta', 'Elite'],
        lessons: [
            { id: 'l1', title: 'Fundamentos do Supino', duration: 'Leitura rápida', level: 'Intermediário', summary: 'Organize uma execução estável antes de aumentar a carga.', steps: ['Ajuste banco, pegada e apoie os pés no chão.', 'Desça com controle até uma amplitude confortável.', 'Empurre sem perder a estabilidade dos ombros.', 'Registre carga e repetições para progredir gradualmente.'] },
            { id: 'l2', title: 'Base do Agachamento', duration: 'Leitura rápida', level: 'Avançado', summary: 'Priorize controle, profundidade tolerável e progressão consciente.', steps: ['Escolha uma posição de pés confortável.', 'Desça mantendo o tronco estável e joelhos acompanhando os pés.', 'Suba sem perder equilíbrio.', 'Reduza a carga se a técnica se deteriorar.'] },
            { id: 'l3', title: 'Bíceps com Controle', duration: 'Leitura rápida', level: 'Iniciante', summary: 'Uma execução previsível ajuda a acompanhar a evolução.', steps: ['Mantenha o tronco estável.', 'Flexione os cotovelos sem balançar o corpo.', 'Desça de forma controlada.', 'Escolha carga que permita cumprir as repetições planejadas.'] }
        ],
        recommendedPrograms: ['massa-homens', 'definicao-homens']
    },
    {
        id: 'coach-2',
        name: 'Julia Santos', // Renamed to clarify her role as performance/functional
        role: 'Perfil-guia · mobilidade',
        specialty: 'Mobilidade & Funcional',
        bio: 'Trilhas educativas de mobilidade, estabilidade e recuperação para complementar o treino.',
        image: require('../assets/coaches/julia.jpg'),
        tags: ['Mobilidade', 'Yoga', 'Atleta'],
        lessons: [
            { id: 'l4', title: 'Mobilidade de Quadril', duration: 'Leitura rápida', level: 'Iniciante', summary: 'Prepare o quadril para movimentos do treino sem forçar a amplitude.', steps: ['Comece com movimentos lentos e confortáveis.', 'Explore flexão e rotação de forma controlada.', 'Evite compensar com a lombar.', 'Interrompa se houver dor.'] },
            { id: 'l5', title: 'Estabilidade do Core', duration: 'Leitura rápida', level: 'Intermediário', summary: 'Pratique estabilidade antes de aumentar a dificuldade.', steps: ['Adote uma posição estável e respire normalmente.', 'Mantenha o tronco alinhado sem prender o ar.', 'Faça séries curtas com boa qualidade.', 'Progrida o tempo ou a dificuldade aos poucos.'] },
            { id: 'l6', title: 'Recuperação Pós-Treino', duration: 'Leitura rápida', level: 'Iniciante', summary: 'Encerre a sessão de modo gradual.', steps: ['Reduza a intensidade progressivamente.', 'Faça movimentos leves se forem confortáveis.', 'Hidrate-se e respeite os sinais do corpo.', 'Planeje descanso suficiente antes de repetir a sessão.'] }
        ],
        recommendedPrograms: ['perda-peso', 'massa-mulheres']
    },
    {
        id: 'coach-3',
        name: 'Elena Costa',
        role: 'Perfil-guia · bem-estar',
        specialty: 'Longevidade & Bem-estar',
        bio: 'Conteúdo educativo geral sobre hábitos e recuperação. Não substitui orientação médica ou nutricional individual.',
        image: require('../assets/coaches/elena.jpg'),
        tags: ['Saúde', 'Ciência', 'Fisiologia'],
        lessons: [
            { id: 'l7', title: 'Treino em Jejum: o que considerar', duration: 'Leitura rápida', level: 'Avançado', summary: 'Treinar em jejum não é obrigatório para obter resultados.', steps: ['Observe como você se sente durante a sessão.', 'Ajuste horário e intensidade à sua rotina.', 'Priorize alimentação adequada ao longo do dia.', 'Converse com um profissional de saúde se tiver condições clínicas.'] },
            { id: 'l8', title: 'Sono e Recuperação', duration: 'Leitura rápida', level: 'Iniciante', summary: 'A recuperação faz parte da progressão do treino.', steps: ['Tente manter horários de sono consistentes.', 'Observe fadiga e desempenho ao longo da semana.', 'Ajuste o volume de treino se a recuperação estiver ruim.', 'Procure orientação se problemas de sono persistirem.'] },
            { id: 'l9', title: 'Antes de usar suplementos', duration: 'Leitura rápida', level: 'Intermediário', summary: 'Suplementos não substituem alimentação e treinamento adequados.', steps: ['Defina o objetivo antes de considerar um produto.', 'Verifique composição, procedência e contraindicações.', 'Evite promessas de resultado rápido.', 'Peça orientação individual a profissional habilitado.'] }
        ],
        recommendedPrograms: ['perda-peso', 'definicao-mulheres']
    }
];
