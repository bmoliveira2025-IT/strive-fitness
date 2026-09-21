import { Ionicons } from '@expo/vector-icons';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily, Radius } from '../../constants/theme';
import { SavedExercise, useSavedWorkouts } from '../../context/SavedWorkoutsContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';

interface VisualOnboardingModalProps {
    visible: boolean;
    onClose: () => void;
}

// 9 Planos Masculinos (idênticos aos prints)
const MALE_PLANS = [
    {
        id: 'male-musculacao-geral',
        title: 'Musculação geral',
        subtitle: 'Hipertrofia e força completa',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '1', name: 'Supino Reto com Barra', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', body_parts: ['chest', 'triceps'] },
            { id: '2', name: 'Puxada Frontal Aberta', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['back', 'biceps'] },
            { id: '3', name: 'Agachamento Livre', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['quadriceps', 'glutes'] },
            { id: '4', name: 'Desenvolvimento Militar', image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', body_parts: ['shoulders', 'triceps'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-bracos-fortes',
        title: 'Braços fortes',
        subtitle: 'Foco em bíceps massivos e tríceps em ferradura',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '5', name: 'Rosca Direta com Barra W', image_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', body_parts: ['biceps'] },
            { id: '6', name: 'Tríceps Corda no Pulley', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['triceps'] },
            { id: '7', name: 'Rosca Martelo com Halteres', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', body_parts: ['biceps', 'forearms'] },
            { id: '8', name: 'Tríceps Testa com Halteres', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', body_parts: ['triceps'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-peito-poderoso',
        title: 'Peito poderoso',
        subtitle: 'Volume peitoral e densidade superior',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '9', name: 'Supino Inclinado com Halteres', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', body_parts: ['chest'] },
            { id: '10', name: 'Supino Reto', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', body_parts: ['chest'] },
            { id: '11', name: 'Crucifixo no Crossover', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['chest'] },
            { id: '12', name: 'Paralelas com foco Peitoral', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', body_parts: ['chest', 'triceps'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-costas-largas',
        title: 'Costas largas',
        subtitle: 'Construção do shape em V clássico',
        image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '13', name: 'Barra Fixa Pronada', image_url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400', body_parts: ['back'] },
            { id: '14', name: 'Remada Curvada com Barra', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['back'] },
            { id: '15', name: 'Puxada Alta Triângulo', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', body_parts: ['back'] },
            { id: '16', name: 'Remada Unilateral com Halter', image_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', body_parts: ['back'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-ombros-grandes',
        title: 'Ombros grandes',
        subtitle: 'Deltoides 3D e aspecto imponente',
        image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '17', name: 'Desenvolvimento Halteres', image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', body_parts: ['shoulders'] },
            { id: '18', name: 'Elevação Lateral na Polia', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', body_parts: ['shoulders'] },
            { id: '19', name: 'Crucifixo Invertido', image_url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400', body_parts: ['shoulders'] },
            { id: '20', name: 'Encolhimento com Barra', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['shoulders', 'back'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-pernas-enormes',
        title: 'Pernas enormes',
        subtitle: 'Membros inferiores densos e cortados',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '21', name: 'Agachamento Hack', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['quadriceps'] },
            { id: '22', name: 'Leg Press 45°', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['quadriceps', 'glutes'] },
            { id: '23', name: 'Mesa Flexora', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['isquiotibiais'] },
            { id: '24', name: 'Gêmeos Sentado', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', body_parts: ['panturrilhas'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-perda-peso',
        title: 'Perda de peso',
        subtitle: 'Queima máxima de gordura e condicionamento',
        image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '25', name: 'HIIT na Esteira', image_url: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400', body_parts: ['cardio'] },
            { id: '26', name: 'Burpees & Polichinelos', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', body_parts: ['full_body'] },
            { id: '27', name: 'Kettlebell Swing', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['glutes', 'back'] },
            { id: '28', name: 'Remo Seco Cardio', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', body_parts: ['back', 'cardio'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-corpo-esculpido',
        title: 'Corpo esculpido',
        subtitle: 'Definição atlética e simetria muscular',
        image: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '29', name: 'Supino Declinado Halteres', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', body_parts: ['chest'] },
            { id: '30', name: 'Puxada Articulada', image_url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400', body_parts: ['back'] },
            { id: '31', name: 'Afundo Búlgaro', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['quadriceps', 'glutes'] },
            { id: '32', name: 'Elevação Frontal Cabo', image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', body_parts: ['shoulders'] },
        ] as SavedExercise[],
    },
    {
        id: 'male-abdomen-definido',
        title: 'Abdômen definido',
        subtitle: 'Core blindado e gominhos destacados',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '33', name: 'Abdominal Infra na Paralela', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', body_parts: ['abs'] },
            { id: '34', name: 'Prancha Isométrica com Carga', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', body_parts: ['abs'] },
            { id: '35', name: 'Abdominal Supra na Polia (Cable Crunch)', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', body_parts: ['abs'] },
            { id: '36', name: 'Russian Twist com Anilha', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', body_parts: ['abs'] },
        ] as SavedExercise[],
    },
];

// Planos Femininos (idênticos aos prints)
const FEMALE_PLANS = [
    {
        id: 'female-perda-peso',
        title: 'Perda de peso',
        subtitle: 'Queima de gordura e definição sem perder massa magra',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '37', name: 'Tiro na Esteira Inclinada', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400', body_parts: ['cardio'] },
            { id: '38', name: 'Agachamento com Salto', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', body_parts: ['quadriceps', 'glutes'] },
            { id: '39', name: 'Mountain Climbers', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', body_parts: ['abs'] },
            { id: '40', name: 'Step Up no Banco', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['glutes'] },
        ] as SavedExercise[],
    },
    {
        id: 'female-corpo-esculpido',
        title: 'Corpo esculpido',
        subtitle: 'Curvas atléticas, postura elegante e firmeza',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '41', name: 'Stiff com Barra', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['isquiotibiais', 'glutes'] },
            { id: '42', name: 'Elevação Pélvica', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', body_parts: ['glutes'] },
            { id: '43', name: 'Puxador Frontal Aberto', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['back'] },
            { id: '44', name: 'Elevação Lateral Halteres', image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', body_parts: ['shoulders'] },
        ] as SavedExercise[],
    },
    {
        id: 'female-gluteos-perfeitos',
        title: 'Glúteos perfeitos',
        subtitle: 'Volume, contorno e projeção dos glúteos',
        image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '45', name: 'Elevação Pélvica com Barra', image_url: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400', body_parts: ['glutes'] },
            { id: '46', name: 'Agachamento Búlgaro', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['glutes', 'quadriceps'] },
            { id: '47', name: 'Cadeira Abdutora Inclinada', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', body_parts: ['glutes'] },
            { id: '48', name: 'Glúteo no Cabo 4 Apoios', image_url: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400', body_parts: ['glutes'] },
        ] as SavedExercise[],
    },
    {
        id: 'female-abdomen-sarado',
        title: 'Abdômen sarado',
        subtitle: 'Cintura fina, abdômen reto e ativação de transverso',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '49', name: 'Prancha Frontal com Vacuum', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', body_parts: ['abs'] },
            { id: '50', name: 'Abdominal Bicicleta', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', body_parts: ['abs'] },
            { id: '51', name: 'Elevação de Pernas Deitada', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', body_parts: ['abs'] },
            { id: '52', name: 'Prancha Lateral Estática', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', body_parts: ['abs'] },
        ] as SavedExercise[],
    },
    {
        id: 'female-musculacao-geral',
        title: 'Musculação geral',
        subtitle: 'Fortalecimento harmonioso de todo o corpo',
        image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
        exercises: [
            { id: '53', name: 'Leg Press 45° com pés médios', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['quadriceps', 'glutes'] },
            { id: '54', name: 'Remada Baixa Triângulo', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', body_parts: ['back'] },
            { id: '55', name: 'Supino Reto com Halteres', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', body_parts: ['chest', 'triceps'] },
            { id: '56', name: 'Cadeira Extensora', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', body_parts: ['quadriceps'] },
        ] as SavedExercise[],
    },
];

export function VisualOnboardingModal({ visible, onClose }: VisualOnboardingModalProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { updateProfile, profile } = useUserStore();
    const { saveWorkout } = useSavedWorkouts();

    // 1. Current Step: 1 (Gender), 2 (Measurements/Age), 3 (Workout Plan)
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Form states
    const [gender, setGender] = useState<'masculino' | 'feminino'>('masculino');
    const [age, setAge] = useState<number>(profile?.age || 25);
    const [weight, setWeight] = useState<string>(profile?.weight ? String(profile.weight) : '70');
    const [height, setHeight] = useState<string>(profile?.height ? String(profile.height) : '175');
    const [groupByObjective, setGroupByObjective] = useState(true);

    const handleSelectGender = (selected: 'masculino' | 'feminino') => {
        setGender(selected);
        // Se a idade já foi informada (no cadastro ou perfil), pula a tela de idade e vai direto para a escolha do treino!
        if (profile?.age) {
            setStep(3);
        } else {
            setStep(2);
        }
    };

    const handleContinueMeasurements = () => {
        setStep(3);
    };

    const handleSelectPlan = (plan: typeof MALE_PLANS[0]) => {
        // 1. Save Plan to user's savedWorkouts
        saveWorkout(plan.title, plan.exercises, 'Onboarding', false);

        const finalAge = profile?.age || age;

        // 2. Persist Profile
        updateProfile({
            hasOnboarded: true,
            gender,
            age: finalAge,
            weight: parseFloat(weight) || profile?.weight || 70,
            height: parseFloat(height) || profile?.height || 175,
            objective: gender === 'masculino' ? 'hipertrofia' : 'cutting',
        });
        if (finalAge) {
            AsyncStorage.setItem('@strive_user_age', String(finalAge)).catch(() => {});
        }
        AsyncStorage.setItem('@strive_has_onboarded', 'true').catch(() => {});

        // 3. Complete
        onClose();
    };

    const currentPlans = gender === 'masculino' ? MALE_PLANS : FEMALE_PLANS;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            statusBarTranslucent
        >
            <View style={{
                flex: 1,
                backgroundColor: '#090B0E',
                paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 20),
                paddingBottom: insets.bottom + 12,
            }}>
                <StatusBar style="light" />

                {/* Top close / skip action */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 4 }}>
                    <TouchableOpacity
                        onPress={() => {
                            updateProfile({ hasOnboarded: true });
                            AsyncStorage.setItem('@strive_has_onboarded', 'true').catch(() => {});
                            onClose();
                        }}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={{ color: '#94A3B8', fontSize: 13, fontFamily: FontFamily.sansMedium }}>
                            Pular
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ────────────────── STEP 1: Selecionar gênero ────────────────── */}
                {step === 1 && (
                    <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
                        <Text style={{
                            color: '#FFFFFF',
                            fontSize: 26,
                            fontFamily: FontFamily.display,
                            textAlign: 'center',
                            marginBottom: 28,
                            letterSpacing: -0.4,
                        }}>
                            Selecionar gênero.
                        </Text>

                        {/* Card Masculino */}
                        <TouchableOpacity
                            onPress={() => handleSelectGender('masculino')}
                            activeOpacity={0.88}
                            style={{
                                height: 160,
                                borderRadius: Radius.lg,
                                overflow: 'hidden',
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.12)',
                            }}
                        >
                            <ImageBackground
                                source={{ uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80' }}
                                style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                contentFit="cover"
                            >
                                <LinearGradient
                                    colors={['rgba(9, 24, 38, 0.92)', 'rgba(9, 24, 38, 0.65)', 'transparent']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={{ position: 'absolute', inset: 0 }}
                                />
                                <Text style={{
                                    color: '#FFFFFF',
                                    fontSize: 24,
                                    fontFamily: FontFamily.display,
                                    marginLeft: 24,
                                    letterSpacing: -0.2,
                                }}>
                                    Masculino
                                </Text>
                            </ImageBackground>
                        </TouchableOpacity>

                        {/* Card Feminino */}
                        <TouchableOpacity
                            onPress={() => handleSelectGender('feminino')}
                            activeOpacity={0.88}
                            style={{
                                height: 160,
                                borderRadius: Radius.lg,
                                overflow: 'hidden',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.12)',
                            }}
                        >
                            <ImageBackground
                                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80' }}
                                style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                contentFit="cover"
                            >
                                <LinearGradient
                                    colors={['rgba(9, 24, 38, 0.92)', 'rgba(9, 24, 38, 0.65)', 'transparent']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={{ position: 'absolute', inset: 0 }}
                                />
                                <Text style={{
                                    color: '#FFFFFF',
                                    fontSize: 24,
                                    fontFamily: FontFamily.display,
                                    marginLeft: 24,
                                    letterSpacing: -0.2,
                                }}>
                                    Feminino
                                </Text>
                            </ImageBackground>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ────────────────── STEP 2: Medidas corporais ────────────────── */}
                {step === 2 && (
                    <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' }}>
                        <View>
                            <TouchableOpacity
                                onPress={() => setStep(1)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}
                            >
                                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: FontFamily.sansMedium }}>Voltar</Text>
                            </TouchableOpacity>

                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 24,
                                fontFamily: FontFamily.display,
                                textAlign: 'center',
                                letterSpacing: -0.4,
                                marginBottom: 8,
                            }}>
                                Medidas corporais
                            </Text>

                            <Text style={{
                                color: '#A0AEC0',
                                fontSize: 14,
                                fontFamily: FontFamily.sans,
                                textAlign: 'center',
                                paddingHorizontal: 12,
                                marginBottom: 32,
                                lineHeight: 20,
                            }}>
                                Para a seleção inteligente dos pesos, preencha as seguintes informações:
                            </Text>

                            {/* Age Picker Card (conforme a imagem de referência com números 24, 25, 26) */}
                            <View style={{
                                backgroundColor: 'rgba(25, 33, 44, 0.75)',
                                borderRadius: Radius.lg,
                                padding: 20,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                marginBottom: 20,
                            }}>
                                <Text style={{ color: '#E2E8F0', fontSize: 16, fontFamily: FontFamily.sansBold, marginBottom: 16 }}>
                                    Sua idade
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28, marginVertical: 8 }}>
                                    <TouchableOpacity onPress={() => setAge(prev => Math.max(14, prev - 1))}>
                                        <Text style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: 18, fontFamily: FontFamily.sansBold }}>
                                            {age - 1}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 8,
                                        borderRadius: Radius.md,
                                        backgroundColor: 'rgba(0, 181, 181, 0.15)',
                                        borderWidth: 1,
                                        borderColor: '#00B5B5',
                                    }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 32, fontFamily: FontFamily.display, fontWeight: '700' }}>
                                            {age}
                                        </Text>
                                    </View>

                                    <TouchableOpacity onPress={() => setAge(prev => Math.min(90, prev + 1))}>
                                        <Text style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: 18, fontFamily: FontFamily.sansBold }}>
                                            {age + 1}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ color: '#94A3B8', fontSize: 13, fontFamily: FontFamily.sansMedium, marginTop: 6 }}>
                                    anos
                                </Text>
                            </View>

                            {/* Weight and Height inputs */}
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1, backgroundColor: 'rgba(25, 33, 44, 0.75)', borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                    <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: FontFamily.sansMedium, marginBottom: 6 }}>
                                        Peso (kg)
                                    </Text>
                                    <TextInput
                                        value={weight}
                                        onChangeText={setWeight}
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#64748B"
                                        style={{ color: '#FFFFFF', fontSize: 18, fontFamily: FontFamily.displaySemiBold }}
                                    />
                                </View>

                                <View style={{ flex: 1, backgroundColor: 'rgba(25, 33, 44, 0.75)', borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                    <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: FontFamily.sansMedium, marginBottom: 6 }}>
                                        Altura (cm)
                                    </Text>
                                    <TextInput
                                        value={height}
                                        onChangeText={setHeight}
                                        keyboardType="numeric"
                                        placeholderTextColor="#64748B"
                                        style={{ color: '#FFFFFF', fontSize: 18, fontFamily: FontFamily.displaySemiBold }}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Botão CONTINUAR ciano fixo */}
                        <TouchableOpacity
                            onPress={handleContinueMeasurements}
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: '#00B5B5',
                                paddingVertical: 16,
                                borderRadius: Radius.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#00B5B5',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 16,
                                fontFamily: FontFamily.sansBold,
                                letterSpacing: 0.8,
                            }}>
                                CONTINUAR
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ────────────────── STEP 3: Selecione seu plano de treino ────────────────── */}
                {step === 3 && (
                    <View style={{ flex: 1, paddingHorizontal: 20 }}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <TouchableOpacity
                                onPress={() => setStep(2)}
                                style={{ padding: 4, marginRight: 8 }}
                            >
                                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 20,
                                fontFamily: FontFamily.display,
                                letterSpacing: -0.3,
                            }}>
                                Selecione seu plano de treino
                            </Text>
                        </View>

                        {/* Switch: Agrupar por objetivo */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 10,
                            marginBottom: 8,
                        }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: FontFamily.sansBold }}>
                                Agrupar por objetivo
                            </Text>
                            <Switch
                                value={groupByObjective}
                                onValueChange={setGroupByObjective}
                                trackColor={{ false: '#334155', true: '#00B5B5' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        {/* Radio options: [x] Para homens   [ ] Para mulheres */}
                        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>
                            <TouchableOpacity
                                onPress={() => setGender('masculino')}
                                activeOpacity={0.8}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <Ionicons
                                    name={gender === 'masculino' ? 'radio-button-on' : 'radio-button-off'}
                                    size={20}
                                    color={gender === 'masculino' ? '#00B5B5' : '#64748B'}
                                />
                                <Text style={{
                                    color: gender === 'masculino' ? '#FFFFFF' : '#94A3B8',
                                    fontSize: 15,
                                    fontFamily: FontFamily.sansBold,
                                }}>
                                    Para homens
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setGender('feminino')}
                                activeOpacity={0.8}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <Ionicons
                                    name={gender === 'feminino' ? 'radio-button-on' : 'radio-button-off'}
                                    size={20}
                                    color={gender === 'feminino' ? '#00B5B5' : '#64748B'}
                                />
                                <Text style={{
                                    color: gender === 'feminino' ? '#FFFFFF' : '#94A3B8',
                                    fontSize: 15,
                                    fontFamily: FontFamily.sansBold,
                                }}>
                                    Para mulheres
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Plans List Scroll */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        >
                            {currentPlans.map((plan) => (
                                <TouchableOpacity
                                    key={plan.id}
                                    onPress={() => handleSelectPlan(plan)}
                                    activeOpacity={0.85}
                                    style={{
                                        height: 120,
                                        borderRadius: Radius.lg,
                                        overflow: 'hidden',
                                        marginBottom: 14,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <ImageBackground
                                        source={{ uri: plan.image }}
                                        style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                                        contentFit="cover"
                                    >
                                        <LinearGradient
                                            colors={['rgba(9, 26, 42, 0.95)', 'rgba(9, 26, 42, 0.72)', 'rgba(9, 26, 42, 0.2)']}
                                            start={{ x: 0, y: 0.5 }}
                                            end={{ x: 1, y: 0.5 }}
                                            style={{ position: 'absolute', inset: 0 }}
                                        />

                                        <View style={{ paddingHorizontal: 20 }}>
                                            <Text style={{
                                                color: '#FFFFFF',
                                                fontSize: 20,
                                                fontFamily: FontFamily.display,
                                                letterSpacing: -0.2,
                                                marginBottom: 4,
                                            }}>
                                                {plan.title}
                                            </Text>
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    color: '#94A3B8',
                                                    fontSize: 12,
                                                    fontFamily: FontFamily.sans,
                                                    maxWidth: '75%',
                                                }}
                                            >
                                                {plan.subtitle}
                                            </Text>
                                        </View>
                                    </ImageBackground>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </Modal>
    );
}
