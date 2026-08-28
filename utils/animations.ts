import { FadeIn, FadeInDown, FadeInUp, SlideInLeft, SlideInRight, ZoomIn } from 'react-native-reanimated';

// Standard animation configs
export const animations = {
    fadeIn: FadeIn.duration(400).springify(),
    fadeInDown: FadeInDown.duration(400).springify(),
    fadeInUp: FadeInUp.duration(400).springify(),
    slideInRight: SlideInRight.duration(400).springify(),
    slideInLeft: SlideInLeft.duration(400).springify(),
    zoomIn: ZoomIn.duration(400).springify(),

    // Delayed variants for staggered animations
    fadeInDelayed: (delay: number) => FadeIn.delay(delay).duration(400).springify(),
    fadeInDownDelayed: (delay: number) => FadeInDown.delay(delay).duration(400).springify(),
    slideInRightDelayed: (delay: number) => SlideInRight.delay(delay).duration(400).springify(),
};

// Stagger delay calculator
export const staggerDelay = (index: number, baseDelay: number = 50) => index * baseDelay;
