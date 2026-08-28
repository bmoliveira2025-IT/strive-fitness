import { Dimensions, Platform, useWindowDimensions } from 'react-native';

// Padrão de design: iPhone 11 (375x812) ou iPhone 14 Pro
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Largura / Altura menor = fallback para quando o dispositivo estiver virado (Landscape)
const getDimensions = () => {
    const { width, height } = Dimensions.get('window');
    return {
        shortDimension: Math.min(width, height),
        longDimension: Math.max(width, height),
    };
};

/**
 * Escala linear de largura (Ex: width, marginHorizontal, paddingHorizontal)
 */
export const scale = (size: number) => (getDimensions().shortDimension / guidelineBaseWidth) * size;

/**
 * Escala linear de altura (Ex: height, marginVertical, paddingVertical)
 */
export const verticalScale = (size: number) => (getDimensions().longDimension / guidelineBaseHeight) * size;

/**
 * Escala moderada (Garante que a tela grande cresça, mas não fique gigante desproporcional)
 * Padrão para: Fontes, borderRadius e botões.
 * @param factor Fator de escalonamento (0.5 padrão - cresce metade da proporção linear)
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Helper para pegar o padding ideal dependendo se é web/ipad ou mobile
 */
export const getResponsivePadding = () => {
    const { shortDimension } = getDimensions();
    if (Platform.OS === 'web' || shortDimension > 768) {
        return 32;
    }
    return moderateScale(16);
};

/** Reactive values for components that must update on rotation or window resizing. */
export const useResponsiveLayout = () => {
    const { width, height } = useWindowDimensions();
    const shortDimension = Math.min(width, height);
    const longDimension = Math.max(width, height);

    return {
        width,
        height,
        isCompact: shortDimension < 360,
        isTablet: shortDimension >= 768,
        scale: (size: number) => (shortDimension / guidelineBaseWidth) * size,
        verticalScale: (size: number) => (longDimension / guidelineBaseHeight) * size,
        moderateScale: (size: number, factor = 0.5) => {
            const scaled = (shortDimension / guidelineBaseWidth) * size;
            return size + (scaled - size) * factor;
        },
    };
};
