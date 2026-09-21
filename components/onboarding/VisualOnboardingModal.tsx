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

const exercisesData = require('../../assets/exercises.json');

const getNativeExercise = (id: string, fallbackName?: string, bodyParts?: string[]): SavedExercise => {
    const found = exercisesData.find((e: any) => e.id.toString() === id.toString());
    if (found) {
        return {
            id: found.id.toString(),
            name: found.name,
            image_url: found.image_url,
            video_url: found.video_url,
            body_parts: found.body_parts || [],
            equipment: found.equipment || [],
        };
    }
    return {
        id,
        name: fallbackName || 'Exercício',
        image_url: 'https://apilyfta.com/static/GymvisualPNG/00251101-Barbell-Bench-Press_Chest-FIX_small.png',
        body_parts: bodyParts || [],
    };
};

// 9 Planos Masculinos com exercícios nativos do aplicativo e imagens reais
const MALE_PLANS = [
    {
        id: 'male-musculacao-geral',
        title: 'Musculação geral',
        subtitle: 'Hipertrofia e força completa',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('2', 'Supino Reto'),
            getNativeExercise('105', 'Remada Baixa Sentada'),
            getNativeExercise('18', 'Agachamento Livre'),
            getNativeExercise('176', 'Desenvolvimento com Halteres'),
        ],
    },
    {
        id: 'male-bracos-fortes',
        title: 'Braços fortes',
        subtitle: 'Foco em bíceps massivos e tríceps em ferradura',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('6', 'Rosca Direta'),
            getNativeExercise('107', 'Tríceps Pulley'),
            getNativeExercise('134', 'Rosca Martelo'),
            getNativeExercise('1511', 'Tríceps Testa'),
        ],
    },
    {
        id: 'male-peito-poderoso',
        title: 'Peito poderoso',
        subtitle: 'Volume peitoral e densidade superior',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('136', 'Supino Inclinado'),
            getNativeExercise('2', 'Supino Reto'),
            getNativeExercise('230', 'Flexão de Braço'),
            getNativeExercise('4673', 'Mergulho Paralelas'),
        ],
    },
    {
        id: 'male-costas-largas',
        title: 'Costas largas',
        subtitle: 'Construção do shape em V clássico',
        image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('4', 'Remada Curvada com Barra'),
            getNativeExercise('105', 'Remada Baixa Sentada'),
            getNativeExercise('120', 'Remada Unilateral com Halter'),
            getNativeExercise('7', 'Levantamento Terra'),
        ],
    },
    {
        id: 'male-ombros-grandes',
        title: 'Ombros grandes',
        subtitle: 'Deltoides 3D e aspecto imponente',
        image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('176', 'Desenvolvimento Halteres'),
            getNativeExercise('145', 'Elevação Lateral'),
            getNativeExercise('371', 'Desenvolvimento na Máquina'),
            getNativeExercise('120', 'Crucifixo Invertido'),
        ],
    },
    {
        id: 'male-pernas-enormes',
        title: 'Pernas enormes',
        subtitle: 'Membros inferiores densos e cortados',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('18', 'Agachamento Livre'),
            getNativeExercise('235', 'Leg Press 45°'),
            getNativeExercise('212', 'Cadeira Extensora'),
            getNativeExercise('222', 'Mesa Flexora'),
        ],
    },
    {
        id: 'male-perda-peso',
        title: 'Perda de peso',
        subtitle: 'Queima máxima de gordura e condicionamento',
        image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('3439', 'Corrida na Esteira'),
            getNativeExercise('293', 'Burpee'),
            getNativeExercise('18', 'Agachamento Livre'),
            getNativeExercise('1916', 'Prancha Frontal'),
        ],
    },
    {
        id: 'male-corpo-esculpido',
        title: 'Corpo esculpido',
        subtitle: 'Definição atlética e simetria muscular',
        image: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('136', 'Supino Inclinado'),
            getNativeExercise('105', 'Remada Baixa Sentada'),
            getNativeExercise('18', 'Agachamento Livre'),
            getNativeExercise('145', 'Elevação Lateral'),
        ],
    },
    {
        id: 'male-abdomen-definido',
        title: 'Abdômen definido',
        subtitle: 'Core blindado e gominhos destacados',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('1725', 'Abdominal no Solo'),
            getNativeExercise('1916', 'Prancha Frontal'),
            getNativeExercise('2138', 'Russian Twist'),
            getNativeExercise('3144', 'Abdominal na Máquina'),
        ],
    },
];

// Planos Femininos com exercícios nativos do aplicativo e imagens reais
const FEMALE_PLANS = [
    {
        id: 'female-perda-peso',
        title: 'Perda de peso',
        subtitle: 'Queima de gordura e definição sem perder massa magra',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('3439', 'Corrida na Esteira'),
            getNativeExercise('293', 'Burpee'),
            getNativeExercise('18', 'Agachamento Livre'),
            getNativeExercise('1916', 'Prancha Frontal'),
        ],
    },
    {
        id: 'female-corpo-esculpido',
        title: 'Corpo esculpido',
        subtitle: 'Curvas atléticas, postura elegante e firmeza',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('36', 'Stiff com Barra'),
            getNativeExercise('235', 'Leg Press 45°'),
            getNativeExercise('105', 'Remada Baixa Sentada'),
            getNativeExercise('145', 'Elevação Lateral'),
        ],
    },
    {
        id: 'female-gluteos-perfeitos',
        title: 'Glúteos perfeitos',
        subtitle: 'Volume, contorno e projeção dos glúteos',
        image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('36', 'Stiff com Barra'),
            getNativeExercise('235', 'Leg Press 45°'),
            getNativeExercise('18', 'Agachamento Livre'),
            getNativeExercise('222', 'Mesa Flexora'),
        ],
    },
    {
        id: 'female-abdomen-sarado',
        title: 'Abdômen sarado',
        subtitle: 'Cintura fina, abdômen reto e ativação de transverso',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('1916', 'Prancha Frontal'),
            getNativeExercise('1725', 'Abdominal no Solo'),
            getNativeExercise('2138', 'Russian Twist'),
            getNativeExercise('3144', 'Abdominal na Máquina'),
        ],
    },
    {
        id: 'female-musculacao-geral',
        title: 'Musculação geral',
        subtitle: 'Fortalecimento harmonioso de todo o corpo',
        image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
        exercises: [
            getNativeExercise('235', 'Leg Press 45°'),
            getNativeExercise('105', 'Remada Baixa Sentada'),
            getNativeExercise('136', 'Supino Inclinado com Halteres'),
            getNativeExercise('212', 'Cadeira Extensora'),
        ],
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
