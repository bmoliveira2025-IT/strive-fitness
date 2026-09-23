/** Shared, shadow-free surface for dense mobile screens. */
export function lightSurface(colors: { backgroundTertiary: string }, radius = 18) {
    return { backgroundColor: colors.backgroundTertiary, borderRadius: radius } as const;
}
