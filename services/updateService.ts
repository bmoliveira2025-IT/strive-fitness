import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

const LAST_UPDATE_DISMISS_KEY = '@strive_last_update_dismissed_version';

export interface AppUpdateInfo {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseNotes: string[];
    downloadUrl: string;
    isMandatory?: boolean;
}

// Compare semantic versions (e.g., '1.0.1' > '1.0.0')
export function isVersionNewer(latest: string, current: string): boolean {
    if (!latest || !current) return false;

    const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const l = parse(latest);
    const c = parse(current);

    for (let i = 0; i < Math.max(l.length, c.length); i++) {
        const lv = l[i] || 0;
        const cv = c[i] || 0;
        if (lv > cv) return true;
        if (lv < cv) return false;
    }
    return false;
}

export async function checkForAppUpdates(): Promise<AppUpdateInfo | null> {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';

    try {
        // 1. Try fetching remote version config from Supabase app_versions or config
        const { data, error } = await supabase
            .from('app_versions')
            .select('*')
            .eq('platform', 'android')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!error && data?.version) {
            const hasUpdate = isVersionNewer(data.version, currentVersion);
            const dismissed = await AsyncStorage.getItem(LAST_UPDATE_DISMISS_KEY);

            if (hasUpdate) {
                // If user dismissed this exact version and it's not mandatory, skip prompt
                if (dismissed === data.version && !data.is_mandatory) {
                    return null;
                }

                return {
                    hasUpdate: true,
                    currentVersion,
                    latestVersion: data.version,
                    releaseNotes: Array.isArray(data.release_notes)
                        ? data.release_notes
                        : (data.release_notes ? [data.release_notes] : ['Melhorias de desempenho e estabilidade.']),
                    downloadUrl: data.download_url || 'https://github.com',
                    isMandatory: Boolean(data.is_mandatory),
                };
            }
        }
    } catch {
        // Fallback / offline silent check
    }

    return null;
}

export async function dismissUpdateVersion(version: string) {
    await AsyncStorage.setItem(LAST_UPDATE_DISMISS_KEY, version);
}
