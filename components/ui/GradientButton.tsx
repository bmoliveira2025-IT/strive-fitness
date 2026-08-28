import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, TouchableOpacity, TouchableOpacityProps, ViewStyle, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Radius } from '../../constants/theme';

export interface GradientButtonProps extends TouchableOpacityProps {
    colors?: readonly [string, string, ...string[]];
    gradientStyle?: StyleProp<ViewStyle>;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
    children, 
    style, 
    colors,
    gradientStyle,
    variant = 'primary',
    size = 'md',
    disabled,
    ...props 
}) => {
    const { theme } = useTheme();

    const sizePadding = {
        sm: { paddingVertical: 10, paddingHorizontal: 16 },
        md: { paddingVertical: 14, paddingHorizontal: 20 },
        lg: { paddingVertical: 18, paddingHorizontal: 24 },
    }[size];

    if (variant === 'secondary') {
        return (
            <TouchableOpacity 
                activeOpacity={0.75}
                disabled={disabled}
                style={[
                    styles.base,
                    {
                        backgroundColor: theme.colors.backgroundTertiary,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: Radius.lg,
                        opacity: disabled ? 0.5 : 1,
                    },
                    style
                ]} 
                {...props}
            >
                <View style={[styles.content, sizePadding, gradientStyle]}>
                    {children}
                </View>
            </TouchableOpacity>
        );
    }

    if (variant === 'ghost') {
        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                disabled={disabled}
                style={[
                    styles.base,
                    {
                        backgroundColor: 'transparent',
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: Radius.lg,
                        opacity: disabled ? 0.5 : 1,
                    },
                    style
                ]} 
                {...props}
            >
                <View style={[styles.content, sizePadding, gradientStyle]}>
                    {children}
                </View>
            </TouchableOpacity>
        );
    }

    // Primary Athletic Button
    const resolvedColors = colors ?? (theme.mode === 'light'
        ? [theme.colors.primary, theme.colors.primaryDark]
        : [theme.colors.primary, theme.colors.primaryDark]);

    return (
        <TouchableOpacity 
            activeOpacity={0.85}
            disabled={disabled}
            style={[
                styles.base,
                {
                    borderRadius: Radius.lg,
                    opacity: disabled ? 0.5 : 1,
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: theme.mode === 'dark' ? 0.25 : 0.15,
                    shadowRadius: 10,
                    elevation: 4,
                },
                style
            ]} 
            {...props}
        >
            <LinearGradient
                colors={resolvedColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.content, sizePadding, gradientStyle]}
            >
                {children}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
});
