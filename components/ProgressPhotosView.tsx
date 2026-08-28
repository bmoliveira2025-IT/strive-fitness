import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ProgressPhoto, useUserStore } from '../store/useUserStore';
import { GradientButton } from './ui/GradientButton';

export function ProgressPhotosView() {
    const { width } = useWindowDimensions();
    const PHOTO_SIZE = (width - 48 - 10) / 3; // 3 columns, with padding
    const { theme } = useTheme();
    const { profile, updateProfile } = useUserStore();
    const photos = profile?.progressPhotos || [];
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

    const handleAddPhoto = async () => {
        Alert.alert(
            'Adicionar Foto',
            'Escolha uma opção',
            [
                {
                    text: 'Tirar Foto',
                    onPress: pickFromCamera
                },
                {
                    text: 'Escolher da Galeria',
                    onPress: pickFromLibrary
                },
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
            ]
        );
    };

    const savePhoto = async (uri: string) => {
        const newPhoto: ProgressPhoto = {
            id: Date.now().toString(),
            uri,
            date: new Date().toISOString(),
        };

        const updatedPhotos = [newPhoto, ...photos]; // Newest first
        await updateProfile({ progressPhotos: updatedPhotos });
    };

    const pickFromCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: false,
        });

        if (!result.canceled) {
            savePhoto(result.assets[0].uri);
        }
    };

    const pickFromLibrary = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para escolher fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: false,
        });

        if (!result.canceled) {
            savePhoto(result.assets[0].uri);
        }
    };

    const handleDeletePhoto = async () => {
        if (!selectedPhoto) return;

        const updated = photos.filter(p => p.id !== selectedPhoto.id);
        await updateProfile({ progressPhotos: updated });
        setSelectedPhoto(null);
    };

    const renderItem = useCallback(({ item }: { item: ProgressPhoto }) => (
        <TouchableOpacity
            onPress={() => setSelectedPhoto(item)}
            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: 5, marginRight: 5 }}
        >
            <Image
                source={{ uri: item.uri }}
                style={{ width: '100%', height: '100%', borderRadius: 20 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={item.id}
            />
        </TouchableOpacity>
    ), [PHOTO_SIZE]);

    const addPhotoButton = (compact = false) => (
        <GradientButton
            onPress={handleAddPhoto}
            style={{ borderRadius: 16, marginTop: compact ? 0 : 24 }}
            gradientStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 22,
                height: 52,
            }}
        >
            <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 9 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 }}>
                ADICIONAR FOTO
            </Text>
        </GradientButton>
    );

    return (
        <View className="flex-1 relative">
            {photos.length === 0 ? (
                // Empty State
                <View className="flex-1 items-center justify-center px-8 pb-16">
                    <Text style={{ color: theme.colors.text }} className="text-2xl font-bold mb-4 text-center">
                        Fotos de progresso
                    </Text>
                    <Text style={{ color: theme.colors.textMuted }} className="text-center text-base">
                        Dica: Tire fotos semanalmente do mesmo ângulo.
                    </Text>
                    {addPhotoButton()}
                </View>
            ) : (
                // Grid View
                <FlatList
                    data={photos}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    numColumns={3}
                    ListHeaderComponent={<View style={{ marginBottom: 18 }}>{addPhotoButton(true)}</View>}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 130 }}
                    columnWrapperStyle={{ justifyContent: 'flex-start' }}
                    initialNumToRender={12}
                    maxToRenderPerBatch={12}
                    windowSize={5}
                    removeClippedSubviews
                />
            )}

            {/* Photo Preview Modal */}
            <Modal
                visible={!!selectedPhoto}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedPhoto(null)}
            >
                <View className="flex-1 bg-black justify-center items-center">
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}
                        onPress={() => setSelectedPhoto(null)}
                    >
                        <Ionicons name="close-circle" size={36} color="white" />
                    </TouchableOpacity>

                    {selectedPhoto && (
                        <>
                            <Image
                                source={{ uri: selectedPhoto.uri }}
                                style={{ width: width, height: width * 1.5 }}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                            />
                            <View className="absolute bottom-10 w-full flex-row justify-center gap-6">
                                <View className="bg-zinc-900/80 px-4 py-2 rounded-lg">
                                    <Text className="text-white">
                                        {new Date(selectedPhoto.date).toLocaleDateString()}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handleDeletePhoto}
                                    className="bg-red-500/80 px-4 py-2 rounded-lg"
                                >
                                    <Ionicons name="trash-outline" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
}
