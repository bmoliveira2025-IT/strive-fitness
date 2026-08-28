import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface TimePickerModalProps {
    visible: boolean;
    initialValue?: string;
    onClose: () => void;
    onConfirm: (time: string) => void;
    title?: string;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const WINDOW_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const PickerItem = React.memo(function PickerItem({ item, isSelected, theme }: { item: number | string, isSelected: boolean, theme: any }) {
    if (item === 'EMPTY') {
        return <View style={{ height: ITEM_HEIGHT }} />;
    }

    return (
        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{
                color: isSelected ? theme.colors.primary : theme.colors.textMuted,
                fontSize: isSelected ? 24 : 18,
                fontWeight: isSelected ? 'bold' : 'normal',
                opacity: isSelected ? 1 : 0.4
            }}>
                {item.toString().padStart(2, '0')}
            </Text>
        </View>
    );
});

export function TimePickerModal({ visible, initialValue = "00:00", onClose, onConfirm, title = "Tempo" }: TimePickerModalProps) {
    const { theme } = useTheme();
    const flatListRefMinutes = React.useRef<FlatList>(null);
    const flatListRefSeconds = React.useRef<FlatList>(null);

    const [selectedMinutes, setSelectedMinutes] = useState(0);
    const [selectedSeconds, setSelectedSeconds] = useState(0);

    useEffect(() => {
        if (visible && initialValue) {
            const parts = initialValue.split(':').map(Number);
            let m = 0, s = 0;
            if (parts.length >= 2) {
                m = isNaN(parts[0]) ? 0 : parts[0];
                s = isNaN(parts[1]) ? 0 : parts[1];
            } else if (parts.length === 3) {
                m = (isNaN(parts[0]) ? 0 : parts[0]) * 60 + (isNaN(parts[1]) ? 0 : parts[1]);
                s = isNaN(parts[2]) ? 0 : parts[2];
            }
            setSelectedMinutes(m);
            setSelectedSeconds(s);

            setTimeout(() => {
                flatListRefMinutes.current?.scrollToOffset({ offset: m * ITEM_HEIGHT, animated: false });
                flatListRefSeconds.current?.scrollToOffset({ offset: s * ITEM_HEIGHT, animated: false });
            }, 100);
        }
    }, [visible, initialValue]);

    const minutesData = useMemo(() => ['EMPTY', 'EMPTY', ...Array.from({ length: 100 }, (_, i) => i), 'EMPTY', 'EMPTY'], []);
    const secondsData = useMemo(() => ['EMPTY', 'EMPTY', ...Array.from({ length: 60 }, (_, i) => i), 'EMPTY', 'EMPTY'], []);

    const renderItemMinutes = useCallback(({ item }: { item: number | string }) => {
        return <PickerItem item={item} isSelected={item === selectedMinutes} theme={theme} />;
    }, [selectedMinutes, theme]);

    const renderItemSeconds = useCallback(({ item }: { item: number | string }) => {
        return <PickerItem item={item} isSelected={item === selectedSeconds} theme={theme} />;
    }, [selectedSeconds, theme]);

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);

    const handleConfirm = () => {
        const formattedMinutes = selectedMinutes.toString().padStart(2, '0');
        const formattedSeconds = selectedSeconds.toString().padStart(2, '0');
        onConfirm(`${formattedMinutes}:${formattedSeconds}`);
    };

    const handleScrollMinutes = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
        if (index >= 0 && index < 100 && index !== selectedMinutes) {
            setSelectedMinutes(index);
        }
    };

    const handleScrollSeconds = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
        if (index >= 0 && index < 60 && index !== selectedSeconds) {
            setSelectedSeconds(index);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
                            {/* Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                                <TouchableWithoutFeedback onPress={onClose}>
                                    <View>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>Cancelar</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
                                <TouchableWithoutFeedback onPress={handleConfirm}>
                                    <View>
                                        <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' }}>Confirmar</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>

                            {/* Column Headers */}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
                                <Text style={{ width: 100, textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold' }}>min</Text>
                                <View style={{ width: 20 }} />
                                <Text style={{ width: 100, textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold' }}>seg</Text>
                            </View>

                            {/* Wheel Picker Container */}
                            <View style={{ flexDirection: 'row', height: WINDOW_HEIGHT, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                {/* Selection Indicator Line */}
                                <View style={{
                                    position: 'absolute',
                                    height: ITEM_HEIGHT,
                                    width: '90%',
                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderRadius: 10,
                                    borderColor: theme.colors.border,
                                    borderWidth: 1,
                                    zIndex: -1
                                }} />

                                {/* Minutes Wheel */}
                                <View style={{ width: 100, height: WINDOW_HEIGHT }}>
                                    <FlatList
                                        ref={flatListRefMinutes}
                                        data={minutesData}
                                        keyExtractor={(item, index) => `m-${index}`}
                                        renderItem={renderItemMinutes}
                                        showsVerticalScrollIndicator={false}
                                        snapToInterval={ITEM_HEIGHT}
                                        decelerationRate="fast"
                                        getItemLayout={getItemLayout}
                                        onMomentumScrollEnd={handleScrollMinutes}
                                        onScrollEndDrag={handleScrollMinutes}
                                        onScroll={handleScrollMinutes}
                                        scrollEventThrottle={16}
                                        initialNumToRender={20}
                                        windowSize={41}
                                        removeClippedSubviews={false}
                                        bounces={false}
                                    />
                                </View>
                                <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginHorizontal: 2, width: 16, textAlign: 'center' }}>:</Text>

                                {/* Seconds Wheel */}
                                <View style={{ width: 100, height: WINDOW_HEIGHT }}>
                                    <FlatList
                                        ref={flatListRefSeconds}
                                        data={secondsData}
                                        keyExtractor={(item, index) => `s-${index}`}
                                        renderItem={renderItemSeconds}
                                        showsVerticalScrollIndicator={false}
                                        snapToInterval={ITEM_HEIGHT}
                                        decelerationRate="fast"
                                        getItemLayout={getItemLayout}
                                        onMomentumScrollEnd={handleScrollSeconds}
                                        onScrollEndDrag={handleScrollSeconds}
                                        onScroll={handleScrollSeconds}
                                        scrollEventThrottle={16}
                                        initialNumToRender={20}
                                        windowSize={41}
                                        removeClippedSubviews={false}
                                        bounces={false}
                                    />
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
