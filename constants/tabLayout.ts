/** All tab bars participate in layout; only the floating action overlays a scene. */
export const TAB_BAR_CONTENT_HEIGHT = 60;

export function tabBarBottomPadding(platform: string, safeBottom: number): number {
  if (platform === 'web') return Math.max(safeBottom, 8);
  return Math.max(safeBottom, platform === 'android' ? 24 : 8);
}

export function tabScrollBottomPadding(platform: string, safeBottom: number, floatingAction = false): number {
  return floatingAction ? 76 : 16;
}
