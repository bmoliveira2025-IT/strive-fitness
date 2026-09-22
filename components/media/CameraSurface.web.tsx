import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { launchCameraAsync } from '../../services/imagePicker';

export type CameraSurfaceHandle = {
    takePictureAsync: (options?: { base64?: boolean; quality?: number }) => Promise<{ uri: string } | undefined>;
};

type CameraSurfaceProps = {
    children?: React.ReactNode;
    facing?: 'front' | 'back';
    style?: StyleProp<ViewStyle>;
};

export const CameraSurface = forwardRef<CameraSurfaceHandle, CameraSurfaceProps>(function CameraSurface(
    { children, style },
    ref,
) {
    useImperativeHandle(ref, () => ({
        async takePictureAsync(options) {
            const result = await launchCameraAsync({ quality: options?.quality });
            return result.canceled ? undefined : { uri: result.assets[0].uri };
        },
    }), []);

    return <View style={[{ flex: 1, backgroundColor: '#09090b' }, style]}>{children}</View>;
});

export function useCameraPermissions(): [
    { granted: boolean },
    () => Promise<{ granted: boolean; status: 'granted' }>,
] {
    return [
        { granted: true },
        async () => ({ granted: true, status: 'granted' }),
    ];
}

