/** The web/PWA tab bar takes part in layout; native tab bars overlay the scene. */
export const TAB_BAR_CONTENT_HEIGHT = 52;

export function tabBarBottomPadding(platform: string, safeBottom: number): number {
  if (platform === 'web') return 8;
  return Math.max(safeBottom, platform === 'android' ? 24 : 8);
}

export function tabScrollBottomPadding(platform: string, safeBottom: number, floatingAction = false): number {
  if (platform === 'web') return floatingAction ? 76 : 16;
  return TAB_BAR_CONTENT_HEIGHT + tabBarBottomPadding(platform, safeBottom) + (floatingAction ? 64 : 12);
}
