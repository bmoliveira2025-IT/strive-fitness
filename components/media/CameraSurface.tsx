import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { forwardRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export type CameraSurfaceHandle = CameraView;

type CameraSurfaceProps = {
    children?: React.ReactNode;
    facing?: 'front' | 'back';
    style?: StyleProp<ViewStyle>;
};

export const CameraSurface = forwardRef<CameraSurfaceHandle, CameraSurfaceProps>(function CameraSurface(
    { children, facing = 'front', style },
    ref,
) {
    return (
        <CameraView ref={ref} facing={facing} style={style}>
            {children}
        </CameraView>
    );
});

export { useCameraPermissions };

