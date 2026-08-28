import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { ExerciseDetailContent } from './ExerciseDetailContent';

// Import exercise data
const exercisesData = require('../assets/exercises.json');

// Category definitions with Ionicons
const CATEGORIES = [
    { id: 'all', name: 'Todos', icon: 'grid-outline' },
    { id: 'favorites', name: 'Favoritos', icon: 'heart' },
    { id: 'cardio', name: 'Cardio', icon: 'fitness' },
    { id: 'Peito', name: 'Peito', icon: 'body' },
    { id: 'Costas', name: 'Costas', icon: 'body-outline' },
    { id: 'Bíceps', name: 'Bíceps', icon: 'barbell' },
    { id: 'Tríceps', name: 'Tríceps', icon: 'barbell-outline' },
    { id: 'Quadríceps', name: 'Quadríceps', icon: 'footsteps' },
    { id: 'Isquiotibiais', name: 'Posteriores', icon: 'walk' },
    { id: 'Ombros', name: 'Ombros', icon: 'hand-left' },
    { id: 'Quadris', name: 'Quadris', icon: 'accessibility' },
    { id: 'Cintura', name: 'Cintura', icon: 'resize' },
    { id: 'Braços', name: 'Braços', icon: 'hand-right' },
    { id: 'Panturrilhas', name: 'Panturrilhas', icon: 'footsteps-outline' },
    { id: 'Antebraços', name: 'Antebraços', icon: 'hand-left-outline' },
    { id: 'Pescoço', name: 'Pescoço', icon: 'person' },
];

const BODY_PART_MAPPING: Record<string, string[]> = {
    all: [],
    favorites: [],
    cardio: ['cardio'],
    Peito: ['Peito'],
    Costas: ['Costas'], // 'Costas Superiores', 'Costas Inferiores' are implicitly handled if we search includes? No, database changed body_parts list.
    Bíceps: ['Bíceps'],
    Tríceps: ['Tríceps'],
    Quadríceps: ['Quadríceps'],
    Isquiotibiais: ['Isquiotibiais', 'Posteriores'],
    Ombros: ['Ombros'],
    Quadris: ['Quadris', 'Glúteos'],
    Cintura: ['Cintura', 'Abdômen', 'Abdominais'],
    Braços: ['Braços'],
    Panturrilhas: ['Panturrilhas'],
    Antebraços: ['Antebraços'],
    Pescoço: ['Pescoço'],
};

const BODY_PART_TRANSLATION: Record<string, string> = {
    'chest': 'Peito',
    'back': 'Costas',
    'shoulders': 'Ombros',
    'biceps': 'Bíceps',
    'triceps': 'Tríceps',
    'quadriceps': 'Quadríceps',
    'hamstrings': 'Isquiotibiais',
    'glutes': 'Glúteos',
    'calves': 'Panturrilhas',
    'abs': 'Abdômen',
    'abdominals': 'Abdominais',
    'lats': 'Dorsais',
};

const GridItem = memo(({ item, isSelected, toggleFavorite, isItemFavorite, onSelect, onInfo }: any) => {
    const { theme } = useTheme();
    return (
        <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.8}
            style={{
                flex: 1,
                backgroundColor: isSelected ? (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC') : theme.colors.card,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                borderWidth: isSelected ? 2 : 1,
                borderRadius: 20,
                marginBottom: 16,
                marginHorizontal: 4,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isSelected ? 0.2 : 0.08,
                shadowRadius: 12,
                elevation: isSelected ? 4 : 2,
                height: 256,
            }}
        >
            <View style={{ height: 160, position: 'relative', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mode === 'dark' ? '#27272a' : '#F8FAFC' }}>
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        onInfo();
                    }}
                    activeOpacity={0.7}
                    style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                    {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="contain" cachePolicy="memory-disk" />
                    ) : (
                        <Ionicons name="barbell" size={32} color={theme.colors.textMuted} />
                    )}
                </TouchableOpacity>

                {/* Action Buttons Overlay */}
                <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id?.toString());
                        }}
                        style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: theme.colors.border }}
                    >
                        <Ionicons name={isItemFavorite ? "heart" : "heart-outline"} size={18} color={isItemFavorite ? "#EF4444" : theme.colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onInfo}
                        style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: theme.colors.border }}
                    >
                        <Ionicons name="information-circle" size={18} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ padding: 16, flex: 1, justifyContent: 'center' }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15, marginBottom: 4 }} numberOfLines={2}>
                    {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary, marginRight: 6 }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                        {item.body_parts?.[0] ? (BODY_PART_TRANSLATION[item.body_parts[0].toLowerCase()] || item.body_parts[0]) : 'Geral'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity >
    );
});

const ExerciseCardItem = memo(({ item, isSelected, isItemFavorite, onSelect, onInfo, allowMultiSelect }: any) => {
    const { theme } = useTheme();
    return (
        <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.8}
            style={{
                backgroundColor: isSelected ? (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F0F9FF') : theme.colors.card,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                borderWidth: isSelected ? 2 : 1,
                borderRadius: 20,
                marginBottom: 12,
                overflow: 'hidden',
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.15 : 0.06,
                shadowRadius: 8,
                elevation: isSelected ? 2 : 1,
                minHeight: 88,
            }}
        >
            {/* Image / Icon container */}
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation();
                    onInfo();
                }}
                activeOpacity={0.7}
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: theme.mode === 'dark' ? '#27272a' : '#F8FAFC',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    overflow: 'hidden'
                }}
            >
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                    <Ionicons name="barbell" size={24} color={theme.colors.textMuted} />
                )}
            </TouchableOpacity>

            {/* Content */}
            <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16, flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {/* Info Icon inline if needed, or handle separately */}
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {item.body_parts?.slice(0, 2).map((part: string, idx: number) => (
                        <View key={idx} style={{
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#F1F5F9',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 8,
                        }}>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                                {BODY_PART_TRANSLATION[part.toLowerCase()] || part}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Actions / Selection */}
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {allowMultiSelect ? (
                    <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        borderColor: isSelected ? theme.colors.primary : theme.colors.divider,
                        borderWidth: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {isSelected && <Ionicons name="checkmark" size={18} color="#000000" />}
                    </View>
                ) : (
                    <TouchableOpacity onPress={onInfo} style={{ padding: 4 }}>
                        <Ionicons name="information-circle-outline" size={24} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity >
    );
});

export function LibraryView({
    onExerciseSelect,
    initialCategory = 'all',
    hideHeader = false,
    externalSearchQuery = '',
    onCategoryChange,
    allowMultiSelect = false,
    onBatchSelect,
    sourceRoute = 'library'
}: {
    onExerciseSelect?: (exercise: any) => void,
    initialCategory?: string,
    hideHeader?: boolean,
    externalSearchQuery?: string,
    onCategoryChange?: (categoryId: string) => void,
    allowMultiSelect?: boolean,
    onBatchSelect?: (exercises: any[]) => void,
    sourceRoute?: string
}) {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

    // Sync prop changes (for deep linking)
    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { favorites, isFavorite, toggleFavorite } = useFavorites();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    // Debounce search so the list doesn't filter on every keystroke
    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(text), 300);
    }, []);

    useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

    const filteredExercises = useMemo(() => {
        let filtered = exercisesData;

        if (selectedCategory === 'favorites') {
            filtered = filtered.filter((ex: any) =>
                favorites.includes(ex.id?.toString())
            );
        } else if (selectedCategory !== 'all') {
            const targetBodyParts = BODY_PART_MAPPING[selectedCategory] || [];
            filtered = filtered.filter((ex: any) =>
                ex.body_parts?.some((part: string) =>
                    targetBodyParts.some(target => part.toLowerCase().includes(target.toLowerCase()))
                )
            );
        }

        const effectiveSearch = externalSearchQuery || debouncedSearch;
        if (effectiveSearch.trim()) {
            const query = effectiveSearch.toLowerCase();
            filtered = filtered.filter((ex: any) =>
                ex.name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [selectedCategory, debouncedSearch, externalSearchQuery, favorites]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleBatchAdd = () => {
        const selectedIdArray = Array.from(selectedIds);
        const selectedExercises = exercisesData.filter((ex: any) => selectedIdArray.includes(ex.id?.toString()));

        if (onBatchSelect) {
            onBatchSelect(selectedExercises);
            setSelectedIds(new Set());
        } else if (onExerciseSelect) {
            selectedExercises.forEach((ex: any) => {
                onExerciseSelect(ex);
            });
            setSelectedIds(new Set());
        }
    };

    const handleItemSelect = useCallback((item: any) => {
        if (onExerciseSelect && allowMultiSelect) {
            toggleSelection(item.id?.toString());
        } else if (onExerciseSelect) {
            onExerciseSelect(item);
        } else {
            // Default behavior: Show details in modal
            setSelectedDetailId(item.id.toString());
        }
    }, [onExerciseSelect, allowMultiSelect, router, toggleSelection, sourceRoute]);

    const handleInfo = useCallback((item: any) => {
        setSelectedDetailId(item.id.toString());
    }, []);

    const renderItem = useCallback(({ item }: { item: any }) => {
        const isItemFavorite = isFavorite(item.id?.toString());
        const isSelected = selectedIds.has(item.id?.toString());

        if (viewMode === 'grid') {
            return (
                <GridItem
                    item={item}
                    isSelected={isSelected}
                    isItemFavorite={isItemFavorite}
                    toggleFavorite={toggleFavorite}
                    onSelect={() => handleItemSelect(item)}
                    onInfo={() => handleInfo(item)}
                />
            );
        }
        return (
            <ExerciseCardItem
                item={item}
                isSelected={isSelected}
                isItemFavorite={isItemFavorite}
                onSelect={() => handleItemSelect(item)}
                onInfo={() => handleInfo(item)}
                allowMultiSelect={allowMultiSelect}
            />
        );
    }, [viewMode, selectedIds, isFavorite, toggleFavorite, handleItemSelect, handleInfo, allowMultiSelect]);

    const renderCategoryItem = useCallback(({ item }: { item: any }) => {
        const isSelected = selectedCategory === item.id;
        return (
            <TouchableOpacity
                onPress={() => {
                    setSelectedCategory(item.id);
                    if (onCategoryChange) onCategoryChange(item.id);
                }}
                activeOpacity={0.7}
                style={{
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.backgroundTertiary,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: 1.5,
                    shadowColor: isSelected ? theme.colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.3 : 0,
                    shadowRadius: 4,
                }}
                className={`mr-2 flex-row items-center px-5 h-11 rounded-full transition-smooth`}
            >
                <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={isSelected ? '#000000' : theme.colors.textMuted}
                />
                <Text style={{
                    color: isSelected ? '#000000' : theme.colors.text,
                    fontWeight: isSelected ? '700' : '500'
                }} className="ml-2 text-sm">
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    }, [selectedCategory, theme, onCategoryChange]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {!hideHeader && (
                <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                    {/* Search Bar - Premium Style */}
                    <View style={{ marginBottom: 16 }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.colors.backgroundTertiary,
                            borderRadius: 20,
                            paddingHorizontal: 16,
                            height: 52,
                            borderWidth: 1,
                            borderColor: theme.colors.border
                        }}>
                            <Ionicons name="search" size={20} color={theme.colors.textMuted} />
                            <TextInput
                                placeholder="Buscar exercícios..."
                                placeholderTextColor={theme.colors.textMuted}
                                style={{ flex: 1, marginLeft: 12, fontSize: 16, color: theme.colors.text, height: '100%' }}
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Categories - Modern Pill Style */}
                    <View style={{ height: 44 }}>
                        <FlatList
                            data={CATEGORIES}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingRight: 16, alignItems: 'center' }}
                            renderItem={renderCategoryItem}
                        />
                    </View>

                    {/* View Toggle */}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                        <TouchableOpacity
                            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            style={{ padding: 8 }}
                        >
                            <Ionicons
                                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                                size={20}
                                color={theme.colors.textMuted}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            )}



            {/* Main List */}
            <View style={{ flex: 1 }}>
                <FlashList
                    key={viewMode}
                    data={filteredExercises}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id?.toString()}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    contentContainerStyle={{
                        padding: 16,
                        paddingTop: hideHeader ? 16 : 0,
                        paddingBottom: allowMultiSelect && selectedIds.size > 0 ? 100 : 40
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    extraData={selectedIds.size}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, opacity: 0.6 }}>
                            <Ionicons name="search-outline" size={48} color={theme.colors.textMuted} />
                            <Text style={{ marginTop: 16, color: theme.colors.textMuted, textAlign: 'center' }}>
                                Nenhum exercício encontrado.
                            </Text>
                        </View>
                    }
                />
            </View>

            {/* Batch Action Button (Floating) */}
            {allowMultiSelect && selectedIds.size > 0 && (
                <View style={{
                    position: 'absolute',
                    bottom: insets.bottom + 16,
                    left: 16,
                    right: 16,
                }}>
                    <TouchableOpacity
                        onPress={handleBatchAdd}
                        style={{
                            backgroundColor: theme.colors.primary,
                            paddingVertical: 16,
                            borderRadius: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            elevation: 6
                        }}
                    >
                        <Text style={{ color: '#000000', fontSize: 18, fontWeight: 'bold', marginRight: 8 }}>
                            Adicionar ({selectedIds.size})
                        </Text>
                        <Ionicons name="arrow-forward" size={24} color="#000000" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Nested Detail Modal for "Info" */}
            <Modal
                visible={!!selectedDetailId}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedDetailId(null)}
            >
                {selectedDetailId && (
                    <ExerciseDetailContent
                        exerciseId={selectedDetailId}
                        onClose={() => setSelectedDetailId(null)}
                        isModal={true}
                    />
                )}
            </Modal>
        </View>
    );
}
