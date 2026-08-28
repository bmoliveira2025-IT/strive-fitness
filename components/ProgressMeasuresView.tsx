import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Circle, Path, Svg } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { BodyMeasurements, useUserStore } from '../store/useUserStore';
import { GradientButton } from './ui/GradientButton';

type MeasurementField = Exclude<keyof BodyMeasurements, 'updatedAt'> | 'weight';

interface MeasurementItem {
    id: MeasurementField;
    label: string;
    icon: string;
    iconSet: 'Ionicons' | 'MaterialCommunityIcons';
    unit: string;
}

interface MeasurementGroup {
    label: string;
    color: string;
    icon: string;
    items: MeasurementItem[];
}

const GROUPS: MeasurementGroup[] = [
    {
        label: 'Composição Corporal',
        color: '#10B981',
        icon: 'scale-bathroom',
        items: [
            { id: 'weight', label: 'Peso Corporal', icon: 'scale-bathroom', iconSet: 'MaterialCommunityIcons', unit: 'kg' },
            { id: 'fatPercentage', label: 'Gordura Corporal', icon: 'percent', iconSet: 'MaterialCommunityIcons', unit: '%' },
            { id: 'caloricIntake', label: 'Ingestão Calórica', icon: 'food-apple-outline', iconSet: 'MaterialCommunityIcons', unit: 'kcal' },
        ]
    },
    {
        label: 'Tronco Superior',
        color: '#8B5CF6',
        icon: 'human-male',
        items: [
            { id: 'neck', label: 'Pescoço', icon: 'human-male-height', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'shoulders', label: 'Ombros', icon: 'human-male-board', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'chest', label: 'Peito', icon: 'human-male', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'leftArm', label: 'Braço Esquerdo', icon: 'arm-flex', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'rightArm', label: 'Braço Direito', icon: 'arm-flex', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'leftForearm', label: 'Antebraço Esquerdo', icon: 'arm-flex-outline', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'rightForearm', label: 'Antebraço Direito', icon: 'arm-flex-outline', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
        ]
    },
    {
        label: 'Core & Cintura',
        color: '#F59E0B',
        icon: 'human-male-height-variant',
        items: [
            { id: 'abdomen', label: 'Abdômen', icon: 'human-male-height-variant', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'waist', label: 'Cintura', icon: 'human-male-height-variant', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'hips', label: 'Quadril', icon: 'human-male-height-variant', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
        ]
    },
    {
        label: 'Membros Inferiores',
        color: '#EF4444',
        icon: 'human',
        items: [
            { id: 'leftThigh', label: 'Coxa Esquerda', icon: 'human', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'rightThigh', label: 'Coxa Direita', icon: 'human', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'leftCalf', label: 'Panturrilha Esquerda', icon: 'human', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
            { id: 'rightCalf', label: 'Panturrilha Direita', icon: 'human', iconSet: 'MaterialCommunityIcons', unit: 'cm' },
        ]
    },
];

const MiniSparkLine = ({ data, color }: { data: number[], color: string }) => {
    const W = 56, H = 28;
    if (data.length < 2) return <View style={{ width: W, height: H }} />;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 4;
    const aH = H - pad * 2;

    const points = data.map((v, i) => ({
        x: (i / (data.length - 1)) * W,
        y: (aH + pad) - ((v - min) / range) * aH,
    }));

    const d = `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
    const last = points[points.length - 1];

    return (
        <Svg width={W} height={H}>
            <Path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.6} />
            <Circle cx={last.x} cy={last.y} r="3" fill={color} />
        </Svg>
    );
};

export function ProgressMeasuresView() {
    const { theme } = useTheme();
    const { profile, updateProfile } = useUserStore();

    const [selectedItem, setSelectedItem] = useState<MeasurementItem | null>(null);
    const [newValue, setNewValue] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Composição Corporal']));

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });
    };

    const getCurrentValue = useCallback((id: MeasurementField): number | undefined => {
        if (id === 'weight') return profile?.weight;
        return (profile?.measurements as any)?.[id];
    }, [profile]);

    const getMeasurementHistory = useCallback((id: MeasurementField): number[] => {
        if (id === 'weight') {
            return (profile?.weightHistory || [])
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(w => w.value);
        }
        return (profile?.periodicAssessments || [])
            .filter(a => a.measurements && typeof (a.measurements as any)[id] === 'number')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(a => (a.measurements as any)[id] as number);
    }, [profile]);

    const filledCount = useMemo(() => {
        return GROUPS.flatMap(g => g.items).filter(item => getCurrentValue(item.id) !== undefined).length;
    }, [getCurrentValue]);

    const totalCount = GROUPS.flatMap(g => g.items).length;

    const handleItemPress = (item: MeasurementItem) => {
        setSelectedItem(item);
        const val = getCurrentValue(item.id);
        setNewValue(val ? val.toString() : '');
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        if (!selectedItem) return;
        const num = parseFloat(newValue.replace(',', '.'));
        if (isNaN(num)) { setIsModalVisible(false); return; }

        if (selectedItem.id === 'weight') {
            const newEntry = { date: new Date().toISOString(), value: num };
            const weightHistory = [...(profile?.weightHistory || []), newEntry];
            await updateProfile({ weight: num, weightHistory });
        } else {
            const base = profile?.measurements || { updatedAt: new Date().toISOString() };
            await updateProfile({
                measurements: { ...base, [selectedItem.id]: num, updatedAt: new Date().toISOString() }
            });
        }
        setIsModalVisible(false);
    };

    const RenderIcon = ({ item, color, size = 22 }: { item: MeasurementItem, color: string, size?: number }) => {
        if (item.iconSet === 'Ionicons') return <Ionicons name={item.icon as any} size={size} color={color} />;
        return <MaterialCommunityIcons name={item.icon as any} size={size} color={color} />;
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150, paddingTop: 16 }}>

                {/* Header + progress bar */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ backgroundColor: theme.colors.primary + '20', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <MaterialCommunityIcons name="tape-measure" size={22} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Suas Medidas</Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                                {filledCount}/{totalCount} preenchidas
                            </Text>
                        </View>
                    </View>

                    {/* Completion bar */}
                    <View style={{ height: 5, backgroundColor: theme.colors.backgroundTertiary, borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${(filledCount / totalCount) * 100}%`, backgroundColor: theme.colors.primary, borderRadius: 3 }} />
                    </View>
                </Animated.View>

                {/* Groups */}
                {GROUPS.map((group, groupIdx) => {
                    const isExpanded = expandedGroups.has(group.label);
                    const groupFilled = group.items.filter(i => getCurrentValue(i.id) !== undefined).length;

                    return (
                        <Animated.View key={group.label} entering={FadeInDown.delay(150 + groupIdx * 80).springify()} style={{ marginBottom: 16, paddingHorizontal: 24 }}>
                            {/* Group header */}
                            <TouchableOpacity
                                onPress={() => toggleGroup(group.label)}
                                activeOpacity={0.8}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme.colors.card,
                                    borderRadius: isExpanded ? 20 : 20,
                                    borderBottomLeftRadius: isExpanded ? 0 : 20,
                                    borderBottomRightRadius: isExpanded ? 0 : 20,
                                    borderWidth: 1.5,
                                    borderColor: isExpanded ? group.color + '40' : theme.colors.cardBorder,
                                    borderBottomWidth: isExpanded ? 0 : 1.5,
                                    padding: 16,
                                    overflow: 'hidden',
                                }}
                            >
                                <LinearGradient
                                    colors={[group.color + '12', 'transparent']}
                                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                                    style={{ position: 'absolute', inset: 0 }}
                                />
                                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: group.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                    <MaterialCommunityIcons name={group.icon as any} size={20} color={group.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }}>{group.label}</Text>
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '600' }}>
                                        {groupFilled}/{group.items.length} preenchidas
                                    </Text>
                                </View>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={16}
                                    color={theme.colors.textMuted}
                                />
                            </TouchableOpacity>

                            {/* Group items */}
                            {isExpanded && (
                                <View style={{
                                    backgroundColor: theme.colors.card,
                                    borderWidth: 1.5,
                                    borderTopWidth: 0,
                                    borderColor: group.color + '40',
                                    borderBottomLeftRadius: 20,
                                    borderBottomRightRadius: 20,
                                    overflow: 'hidden',
                                }}>
                                    {group.items.map((item, itemIdx) => {
                                        const currentVal = getCurrentValue(item.id);
                                        const historyArr = getMeasurementHistory(item.id);
                                        const hasValue = currentVal !== undefined;
                                        const prevVal = historyArr.length >= 2 ? historyArr[historyArr.length - 2] : null;
                                        const delta = (hasValue && prevVal !== null) ? currentVal! - prevVal : null;
                                        const isLast = itemIdx === group.items.length - 1;

                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                onPress={() => handleItemPress(item)}
                                                activeOpacity={0.75}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 14,
                                                    borderBottomWidth: isLast ? 0 : 1,
                                                    borderBottomColor: theme.colors.border,
                                                }}
                                            >
                                                {/* Icon */}
                                                <View style={{
                                                    width: 36, height: 36, borderRadius: 11,
                                                    backgroundColor: hasValue ? group.color + '18' : theme.colors.backgroundTertiary,
                                                    alignItems: 'center', justifyContent: 'center',
                                                    marginRight: 12,
                                                }}>
                                                    <RenderIcon item={item} color={hasValue ? group.color : theme.colors.textMuted} size={18} />
                                                </View>

                                                {/* Label + delta */}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{item.label}</Text>
                                                    {delta !== null && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                                            <Ionicons
                                                                name={delta > 0 ? 'trending-up' : 'trending-down'}
                                                                size={10}
                                                                color={delta > 0 ? '#22C55E' : '#EF4444'}
                                                            />
                                                            <Text style={{ color: delta > 0 ? '#22C55E' : '#EF4444', fontSize: 10, fontWeight: '700', marginLeft: 3 }}>
                                                                {delta > 0 ? '+' : ''}{delta.toFixed(1)}{item.unit} vs anterior
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Sparkline (when has history) */}
                                                {historyArr.length >= 2 && (
                                                    <View style={{ marginRight: 10 }}>
                                                        <MiniSparkLine data={historyArr} color={group.color} />
                                                    </View>
                                                )}

                                                {/* Value */}
                                                <View style={{
                                                    backgroundColor: hasValue ? group.color + '15' : theme.colors.backgroundTertiary,
                                                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
                                                    minWidth: 56, alignItems: 'center',
                                                }}>
                                                    <Text style={{
                                                        color: hasValue ? group.color : theme.colors.textMuted,
                                                        fontSize: 14, fontWeight: '900',
                                                        opacity: hasValue ? 1 : 0.4,
                                                    }}>
                                                        {hasValue ? `${currentVal}` : '--'}
                                                    </Text>
                                                    <Text style={{ color: theme.colors.textMuted, fontSize: 8, fontWeight: '700' }}>{item.unit}</Text>
                                                </View>

                                                <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} style={{ marginLeft: 6 }} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </Animated.View>
                    );
                })}
            </ScrollView>

            {/* Update Modal */}
            <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <Animated.View
                        entering={FadeInDown.springify()}
                        style={{
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.cardBorder,
                            borderWidth: 1.5,
                            borderRadius: 28,
                            padding: 28,
                            width: '100%',
                        }}
                    >
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <View style={{ backgroundColor: theme.colors.primary + '20', width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                {selectedItem && <RenderIcon item={selectedItem} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} size={28} />}
                            </View>
                            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center' }}>{selectedItem?.label}</Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                                Em {selectedItem?.unit}
                            </Text>
                        </View>

                        <View style={{ backgroundColor: theme.colors.backgroundTertiary, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <TextInput
                                    style={{ color: theme.colors.text, fontSize: 44, fontWeight: '900', textAlign: 'center', minWidth: 100 }}
                                    value={newValue}
                                    onChangeText={setNewValue}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    placeholderTextColor={theme.colors.textMuted}
                                    autoFocus
                                />
                                <Text style={{ color: theme.colors.textMuted, fontSize: 18, fontWeight: '700', marginLeft: 8 }}>{selectedItem?.unit}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(false)}
                                activeOpacity={0.75}
                                style={{ flex: 1, backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                            >
                                <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 13 }}>Cancelar</Text>
                            </TouchableOpacity>
                            <GradientButton
                                onPress={handleSave}
                                activeOpacity={0.8}
                                style={{ flex: 1, borderRadius: 16 }}
                                gradientStyle={{ paddingVertical: 16, alignItems: 'center' }}
                            >
                                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Salvar</Text>
                            </GradientButton>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}
