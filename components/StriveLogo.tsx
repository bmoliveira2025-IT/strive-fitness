import React from 'react';
import { Image, View, useColorScheme } from 'react-native';

interface StriveLogoProps {
    color?: string;
    width?: number;
    height?: number;
}

export function StriveLogo({ color, width = 40, height = 40 }: StriveLogoProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Use specific assets for light/dark or override with tintColor if provided
    const source = isDark
        ? require('../assets/images/logo_transparent_white.png')
        : require('../assets/images/logo_transparent.png');

    return (
        <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
            <Image
                source={source}
                style={{
                    width: '100%',
                    height: '100%',
                    tintColor: color // Allow manual override
                }}
                resizeMode="contain"
            />
        </View>
    );
}
