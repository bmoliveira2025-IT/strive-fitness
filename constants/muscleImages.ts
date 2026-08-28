export const MUSCLE_IMAGES = {
    'Peito': require('../assets/images/muscles/transparent/chest.png'),
    'Bíceps': require('../assets/images/muscles/transparent/biceps.png'),
    'Tríceps': require('../assets/images/muscles/transparent/triceps.png'),
    'Costas': require('../assets/images/muscles/transparent/back.png'),
    'Ombros': require('../assets/images/muscles/transparent/shoulders.png'),
    'Abdômen': require('../assets/images/muscles/transparent/abs.png'),
    'Quadríceps': require('../assets/images/muscles/transparent/quads.png'),
    'Isquiotibiais': require('../assets/images/muscles/transparent/hamstrings.png'),
    'Quadris': require('../assets/images/muscles/transparent/hips.png'),
    'Panturrilhas': require('../assets/images/muscles/transparent/calves.png'),
    'Antebraços': require('../assets/images/muscles/transparent/forearms.png'),
    'Pescoço': require('../assets/images/muscles/transparent/neck.png'),
    'Glúteos': require('../assets/images/muscles/transparent/glutes.png'),
    'Gluteos': require('../assets/images/muscles/transparent/glutes.png'),
    // Aliases for dynamic lookups
    'Abdominais': require('../assets/images/muscles/transparent/abs.png'),
    'Abs': require('../assets/images/muscles/transparent/abs.png'),
    'Core': require('../assets/images/muscles/transparent/abs.png'),
    'Cintura': require('../assets/images/muscles/transparent/abs.png'),
    'Coxas': require('../assets/images/muscles/transparent/quads.png'), // Default to Quads for generic Thighs
    'Braços': require('../assets/images/muscles/transparent/biceps.png'), // Default to Biceps for generic Arms
    'Cardio': require('../assets/images/muscles/transparent/abs.png'), // Placeholder or use specialized icon if available
};

export const MUSCLE_GROUPS_LIST = [
    { id: 'Peito', name: 'Peito', image: MUSCLE_IMAGES['Peito'] },
    { id: 'Bíceps', name: 'Bíceps', image: MUSCLE_IMAGES['Bíceps'] },
    { id: 'Tríceps', name: 'Tríceps', image: MUSCLE_IMAGES['Tríceps'] },
    { id: 'Costas', name: 'Costas', image: MUSCLE_IMAGES['Costas'] },
    { id: 'Ombros', name: 'Ombros', image: MUSCLE_IMAGES['Ombros'] },
    { id: 'Cintura', name: 'Abdômen', image: MUSCLE_IMAGES['Abdômen'] },
    { id: 'Quadríceps', name: 'Quadríceps', image: MUSCLE_IMAGES['Quadríceps'] },
    { id: 'Isquiotibiais', name: 'Isquiotibiais', image: MUSCLE_IMAGES['Isquiotibiais'] },
    { id: 'Quadris', name: 'Glúteos', image: MUSCLE_IMAGES['Glúteos'] },
    { id: 'Panturrilhas', name: 'Panturrilhas', image: MUSCLE_IMAGES['Panturrilhas'] },
    { id: 'Antebraços', name: 'Antebraços', image: MUSCLE_IMAGES['Antebraços'] },
    { id: 'Pescoço', name: 'Pescoço', image: MUSCLE_IMAGES['Pescoço'] },
];
