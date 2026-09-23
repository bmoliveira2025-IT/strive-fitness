import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LibraryView } from '../../components/LibraryView';
import { MuscleCategoryGrid } from '../../components/MuscleCategoryGrid';
import { COACHES, Coach } from '../../constants/coaches';
import { PROGRAMS } from '../../constants/programs';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { FontFamily, Radius } from '../../constants/theme';

export default function ExploreScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: string, categoryId?: string, categoryName?: string, previewProgramId?: string }>();
    const { loadWorkout, setReturnPath } = useWorkoutStore();
    const [searchQuery, setSearchQuery] = useState('');
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

    // Derived state from URL params
    const activeTab = params.tab || 'Programas';
    const selectedMuscleCategory = useMemo(() => {
        if (params.categoryId && params.categoryName) {
            return { id: params.categoryId, name: params.categoryName };
        }
        return null;
    }, [params.categoryId, params.categoryName]);

    const [audienceFilter, setAudienceFilter] = useState<'Todos' | 'Homens' | 'Mulheres'>('Todos');

    const setActiveTab = (tab: string) => {
        router.setParams({ tab });
    };

    const setSelectedMuscleCategory = (category: { id: string, name: string } | null) => {
        if (category) {
            router.setParams({ categoryId: category.id, categoryName: category.name });
        } else {
            router.setParams({ categoryId: undefined, categoryName: undefined });
        }
    };

    const handleOpenPreview = (program: any) => {
        setSelectedCoach(null);
        router.push({
            pathname: '/preview',
            params: { id: program.id, type: 'program' }
        });
    };

    const handleOpenLesson = (lesson: any) => {
        if (!selectedCoach) return;
        const coachId = selectedCoach.id;
        setSelectedCoach(null);
        router.push({
            pathname: '/lesson/[id]',
            params: { id: lesson.id, coachId }
        });
    };

    useEffect(() => {
        if (params.previewProgramId) {
            router.push({
                pathname: '/preview',
                params: { id: params.previewProgramId, type: 'program' }
            });
        }
    }, [params.previewProgramId]);

    const renderProgramCard = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleOpenPreview(item)}
                style={{ width: searchQuery.trim() ? '100%' : 218, marginRight: 14 }}
            >
                <View
                    style={{
                        width: '100%',
                        height: 166,
                        borderRadius: Radius.lg,
                        overflow: 'hidden',
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.cardBorder,
                        borderWidth: 1,
                        position: 'relative',
                    }}
                >
                    <LinearGradient
                        colors={[item.accent + '32', theme.colors.card]}
                        style={{ position: 'absolute', inset: 0 }}
                    />
                    <View style={{ padding: 16, flex: 1, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: item.accent + '30' }}>
                                <Ionicons name={item.icon} size={25} color={item.accent} />
                            </View>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansBold }}>{item.audience}</Text>
                        </View>
                        <View>
                            <Text style={{ color: theme.colors.text, fontSize: 14, fontFamily: FontFamily.displaySemiBold }} numberOfLines={2}>{item.title}</Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 5 }}>{item.days.length} treinos/semana · {item.request.split === 'full_body' ? 'Corpo todo' : item.request.split}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ marginTop: 8, paddingHorizontal: 2 }}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>{item.description}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const filteredPrograms = useMemo(() => {
        const query = activeTab === 'Programas' ? searchQuery.toLowerCase().trim() : '';
        return PROGRAMS.filter(p => (audienceFilter === 'Todos' || p.audience === audienceFilter || p.audience === 'Todos') &&
            (!query || `${p.title} ${p.goalLabel} ${p.description}`.toLowerCase().includes(query)));
    }, [searchQuery, activeTab, audienceFilter]);

    const filteredCoaches = useMemo(() => {
        if (!searchQuery.trim() || activeTab !== 'Treinadores') return COACHES;
        const query = searchQuery.toLowerCase();
        return COACHES.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.specialty.toLowerCase().includes(query) ||
            c.tags.some(t => t.toLowerCase().includes(query)) ||
            c.lessons.some(lesson => lesson.title.toLowerCase().includes(query))
        );
    }, [searchQuery, activeTab]);

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            {/* Header / Search */}
            <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 14 }}>
                <View
                    style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: Radius.full,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        height: 46,
                    }}
                >
                    <Ionicons name="search" size={17} color={theme.colors.textMuted} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={activeTab === 'Exercícios' ? 'Pesquisar exercícios...' : activeTab === 'Treinadores' ? 'Pesquisar guias e temas...' : 'Pesquisar programas...'}
                        placeholderTextColor={theme.colors.textMuted}
                        style={{ color: theme.colors.text, flex: 1, marginLeft: 10, fontSize: 14, fontFamily: FontFamily.sans }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={17} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Breadcrumb for Exercises */}
                {activeTab === 'Exercícios' && selectedMuscleCategory && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                        <TouchableOpacity
                            onPress={() => setSelectedMuscleCategory(null)}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.primary, fontFamily: FontFamily.sansSemiBold, marginLeft: 4, fontSize: 13 }}>Categorias</Text>
                        </TouchableOpacity>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} style={{ marginHorizontal: 6 }} />
                        <Text style={{ color: theme.colors.text, fontFamily: FontFamily.sansSemiBold, fontSize: 13 }}>{selectedMuscleCategory.name}</Text>
                    </View>
                )}
            </View>

            {/* Tabs */}
            <View style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-around' }}>
                {[
                    { id: 'Programas', icon: 'calendar-outline' },
                    { id: 'Treinadores', icon: 'person-outline' },
                    { id: 'Exercícios', icon: 'barbell-outline' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => {
                            setActiveTab(tab.id);
                            if (tab.id !== 'Exercícios') setSelectedMuscleCategory(null);
                        }}
                        style={{ alignItems: 'center', paddingBottom: 10, paddingHorizontal: 16, position: 'relative' }}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.id ? theme.colors.text : theme.colors.textMuted}
                        />
                        <Text style={{ color: activeTab === tab.id ? theme.colors.text : theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sansSemiBold, marginTop: 4 }}>
                            {tab.id}
                        </Text>
                        {activeTab === tab.id && (
                            <View style={{ backgroundColor: theme.colors.primary, position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderTopLeftRadius: 1, borderTopRightRadius: 1 }} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'Programas' ? (
                <ScrollView
                    style={{ flex: 1, paddingTop: 16 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 66 + Math.max(insets.bottom, 10) + 44 }}
                >
                    <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 19, fontFamily: FontFamily.display, marginBottom: 4 }}>Planos semanais prontos</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 12 }}>Escolha um modelo e veja cada treino antes de começar.</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {(['Todos', 'Homens', 'Mulheres'] as const).map(audience => (
                                <TouchableOpacity key={audience} onPress={() => setAudienceFilter(audience)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full, backgroundColor: audienceFilter === audience ? theme.colors.primary : theme.colors.card }}>
                                    <Text style={{ color: audienceFilter === audience ? theme.colors.onPrimary : theme.colors.text, fontSize: 12, fontFamily: FontFamily.sansSemiBold }}>{audience}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    {searchQuery.trim() ? (
                        <View style={{ paddingHorizontal: 20 }}>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: FontFamily.caption, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
                                Resultados da busca
                            </Text>
                            {filteredPrograms.length > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    {filteredPrograms.map(program => (
                                        <View key={program.id} style={{ width: '48%', marginBottom: 16 }}>
                                            {renderProgramCard({ item: program })}
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                                    <Ionicons name="search-outline" size={40} color={theme.colors.textMuted} />
                                    <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 12, fontFamily: FontFamily.sans }}>
                                        Nenhum programa encontrado para “{searchQuery}”
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <>
                            {/* Ready-to-use weekly programs */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: FontFamily.display, paddingHorizontal: 20, marginBottom: 14 }}>
                                    Ganho de massa e pernas
                                </Text>
                                <FlatList
                                    horizontal
                                    data={filteredPrograms.filter(program => program.request.goal === 'hypertrophy')}
                                    renderItem={renderProgramCard}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={{ paddingLeft: 20 }}
                                    showsHorizontalScrollIndicator={false}
                                />
                            </View>

                            {/* Goal-specific programs */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: FontFamily.display, paddingHorizontal: 20, marginBottom: 14 }}>
                                    Definição e perda de peso
                                </Text>
                                <FlatList
                                    horizontal
                                    data={filteredPrograms.filter(program => program.request.goal !== 'hypertrophy')}
                                    renderItem={renderProgramCard}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={{ paddingLeft: 20 }}
                                    showsHorizontalScrollIndicator={false}
                                />
                            </View>
                        </>
                    )}
                </ScrollView>
            ) : activeTab === 'Exercícios' ? (
                <View style={{ flex: 1 }}>
                    {selectedMuscleCategory || searchQuery.length > 0 ? (
                        <LibraryView
                            initialCategory={selectedMuscleCategory?.id || 'all'}
                            hideHeader={true}
                            externalSearchQuery={searchQuery}
                            onCategoryChange={(catId) => {
                                router.setParams({ categoryId: catId, categoryName: catId });
                            }}
                            sourceRoute="explore"
                        />
                    ) : (
                        <MuscleCategoryGrid
                            onSelect={(id, name) => setSelectedMuscleCategory({ id, name })}
                        />
                    )}
                </View>
            ) : activeTab === 'Treinadores' ? (
                <ScrollView
                    style={{ flex: 1, paddingTop: 16, paddingHorizontal: 20 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 66 + Math.max(insets.bottom, 10) + 44 }}
                >
                    <Text style={{ color: theme.colors.text, fontSize: 19, fontFamily: FontFamily.display, marginBottom: 4 }}>
                        Guias de treino
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 18 }}>Escolha um tema, leia orientações práticas e encontre programas relacionados. Os perfis abaixo são editoriais, não treinadores disponíveis para atendimento.</Text>

                    {filteredCoaches.length > 0 ? (
                        filteredCoaches.map((coach) => (
                            <TouchableOpacity
                                key={coach.id}
                                activeOpacity={0.85}
                                onPress={() => setSelectedCoach(coach)}
                                style={{
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    borderRadius: Radius.lg,
                                    overflow: 'hidden',
                                    marginBottom: 10,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                                    <View style={{ width: 56, height: 56, borderRadius: Radius.md, overflow: 'hidden', marginRight: 14, backgroundColor: theme.colors.background }}>
                                        <Image
                                            source={coach.image}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="cover"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <View style={{ flex: 1, paddingRight: 8 }}>
                                                <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: FontFamily.displaySemiBold }}>{coach.name}</Text>
                                                <Text style={{ color: theme.colors.primary, fontSize: 10, fontFamily: FontFamily.sansBold, textTransform: 'uppercase', letterSpacing: 0.5 }}>{coach.role}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                                        </View>
                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sans, marginTop: 2 }}>{coach.specialty} · {coach.lessons.length} guias</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                            {coach.tags.slice(0, 2).map((tag, idx) => (
                                                <View key={idx} style={{ backgroundColor: theme.colors.backgroundTertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm }}>
                                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontFamily: FontFamily.sansSemiBold }}>{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                            <Ionicons name="search-outline" size={40} color={theme.colors.textMuted} />
                            <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 12, fontFamily: FontFamily.sans }}>
                                Nenhum treinador encontrado para “{searchQuery}”
                            </Text>
                        </View>
                    )}
                </ScrollView>
            ) : null}

            {/* Coach Detail Modal */}
            <Modal
                visible={!!selectedCoach}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedCoach(null)}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setSelectedCoach(null)}
                    />
                    <View
                        style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, height: '85%', overflow: 'hidden' }}
                    >
                        {selectedCoach && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Compact editorial profile header */}
                                <View style={{ height: 155, position: 'relative' }}>
                                    <Image
                                        source={selectedCoach.image}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(13,15,18,0.9)']}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setSelectedCoach(null)}
                                        style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Ionicons name="close" size={20} color="white" />
                                    </TouchableOpacity>

                                    <View style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                                        <Text style={{ color: theme.colors.onImage, fontSize: 22, fontFamily: FontFamily.display }}>{selectedCoach.name}</Text>
                                        <Text style={{ color: theme.colors.primary, fontFamily: FontFamily.sansBold, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>{selectedCoach.role}</Text>
                                    </View>
                                </View>

                                {/* Content */}
                                <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom, 20) + 20 }}>
                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 20 }}>{selectedCoach.lessons.length} guias de leitura disponíveis · perfil editorial</Text>

                                    {/* Specialty & Bio */}
                                    <View style={{ marginBottom: 24 }}>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.caption, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Especialidade</Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: FontFamily.displaySemiBold, marginBottom: 6 }}>{selectedCoach.specialty}</Text>
                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontFamily: FontFamily.sans, lineHeight: 18 }}>{selectedCoach.bio}</Text>
                                    </View>

                                    {/* Lessons/Classes */}
                                    <View style={{ marginBottom: 24 }}>
                                        <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: FontFamily.display, marginBottom: 12 }}>
                                            Guias práticos
                                        </Text>

                                        {selectedCoach.lessons.map((lesson) => (
                                            <TouchableOpacity
                                                key={lesson.id}
                                                activeOpacity={0.8}
                                                onPress={() => handleOpenLesson(lesson)}
                                                style={{
                                                    backgroundColor: theme.colors.backgroundTertiary,
                                                    borderRadius: Radius.md,
                                                    padding: 12,
                                                    marginBottom: 8,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                    <View style={{ width: 34, height: 34, borderRadius: Radius.sm, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                                        <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansSemiBold }} numberOfLines={1}>{lesson.title}</Text>
                                                        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sans }}>{lesson.duration} • {lesson.level}</Text>
                                                    </View>
                                                </View>
                                                <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {selectedCoach.recommendedPrograms && <View style={{ marginBottom: 16 }}>
                                        <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: FontFamily.display, marginBottom: 10 }}>Programas relacionados</Text>
                                        {PROGRAMS.filter(program => selectedCoach.recommendedPrograms?.includes(program.id)).map(program =>
                                            <TouchableOpacity key={program.id} onPress={() => handleOpenPreview(program)} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 54, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
                                                <Ionicons name={program.icon} size={18} color={program.accent} />
                                                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: '700', marginLeft: 10 }}>{program.title}</Text>
                                                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                                            </TouchableOpacity>)}
                                    </View>}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
