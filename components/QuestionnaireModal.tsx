import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { hapticLight, hapticSelection, hapticSuccess } from '../utils/haptics';

export interface Question {
    id: string;
    type: 'select' | 'scale' | 'text' | 'boolean';
    text: string;
    options?: { label: string; value: any }[];
    placeholder?: string;
    subtitle?: string;
}

interface QuestionnaireModalProps {
    visible: boolean;
    title: string;
    description?: string;
    questions: Question[];
    onComplete: (answers: Record<string, any>) => void;
    onClose: () => void;
}

export function QuestionnaireModal({
    visible,
    title,
    description,
    questions,
    onComplete,
    onClose,
}: QuestionnaireModalProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [answers, setAnswers] = useState<Record<string, any>>({});

    useEffect(() => {
        if (visible) setAnswers({});
    }, [visible]);

    const requiredQuestions = useMemo(
        () => questions.filter(question => question.type !== 'text' || question.id === 'name'),
        [questions]
    );

    const answeredCount = questions.filter(question => {
        const value = answers[question.id];
        return value !== undefined && value !== '';
    }).length;

    const canComplete = requiredQuestions.every(question => {
        const value = answers[question.id];
        return question.id === 'name' ? String(value ?? '').trim().length > 2 : value !== undefined;
    });

    const handleAnswer = (questionId: string, value: any) => {
        hapticSelection();
        setAnswers(previous => ({ ...previous, [questionId]: value }));
    };

    const handleComplete = () => {
        if (!canComplete) return;
        hapticSuccess();
        onComplete(answers);
    };

    const optionStyle = (selected: boolean) => ({
        backgroundColor: selected ? theme.colors.primary + '20' : theme.colors.background,
        borderColor: selected ? theme.colors.primaryDark : theme.colors.cardBorder,
        borderWidth: 1,
    });

    const renderInput = (question: Question) => {
        const value = answers[question.id];

        if (question.type === 'text') {
            return (
                <TextInput
                    value={value ?? ''}
                    onChangeText={text => handleAnswer(question.id, text)}
                    placeholder={question.placeholder || 'Digite sua resposta'}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType={question.id.toLowerCase().includes('weight') || question.text.toLowerCase().includes('peso') ? 'decimal-pad' : 'default'}
                    style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 14,
                        minHeight: 52,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        color: theme.colors.text,
                        fontSize: 16,
                        fontWeight: '600',
                    }}
                />
            );
        }

        if (question.type === 'scale') {
            return (
                <View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(item => {
                            const selected = value === item;
                            return (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() => handleAnswer(question.id, item)}
                                    activeOpacity={0.75}
                                    style={{ ...optionStyle(selected), flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: selected ? theme.colors.primaryDark : theme.colors.textSecondary, fontSize: 16, fontWeight: '800' }}>{item}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Baixo</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Alto</Text>
                    </View>
                </View>
            );
        }

        const options = question.type === 'boolean'
            ? [{ label: 'Sim', value: true }, { label: 'Não', value: false }]
            : question.options ?? [];

        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {options.map(option => {
                    const selected = value === option.value;
                    return (
                        <TouchableOpacity
                            key={String(option.value)}
                            onPress={() => handleAnswer(question.id, option.value)}
                            activeOpacity={0.75}
                            style={{ ...optionStyle(selected), minHeight: 46, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
                        >
                            {selected && <Ionicons name="checkmark-circle" size={17} color={theme.colors.primaryDark} style={{ marginRight: 6 }} />}
                            <Text style={{ color: selected ? theme.colors.primaryDark : theme.colors.textSecondary, fontSize: 14, fontWeight: selected ? '800' : '600' }}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1, backgroundColor: theme.colors.background }}
            >
                <View style={{ paddingTop: Math.max(insets.top, 16), paddingHorizontal: 20, paddingBottom: 14, backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => { hapticLight(); onClose(); }}
                            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Ionicons name="close" size={22} color={theme.colors.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{title}</Text>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>{answeredCount} de {questions.length} respondidas</Text>
                        </View>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
                >
                    {description && (
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>{description}</Text>
                    )}

                    {questions.map((question, index) => (
                        <View
                            key={question.id}
                            style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: theme.colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    <Text style={{ color: theme.colors.primaryDark, fontSize: 12, fontWeight: '800' }}>{index + 1}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700', lineHeight: 22 }}>{question.text}</Text>
                                    {question.subtitle && <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 }}>{question.subtitle}</Text>}
                                </View>
                            </View>
                            {renderInput(question)}
                        </View>
                    ))}
                </ScrollView>

                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 24) + 28, backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.cardBorder }}>
                    <TouchableOpacity
                        onPress={handleComplete}
                        disabled={!canComplete}
                        activeOpacity={0.8}
                        style={{ height: 54, borderRadius: 16, backgroundColor: canComplete ? theme.colors.primary : theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: canComplete ? 1 : 0.7 }}
                    >
                        <Text style={{ color: canComplete ? '#052E16' : theme.colors.textMuted, fontSize: 15, fontWeight: '800' }}>Concluir acompanhamento</Text>
                        <Ionicons name="checkmark" size={20} color={canComplete ? '#052E16' : theme.colors.textMuted} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
