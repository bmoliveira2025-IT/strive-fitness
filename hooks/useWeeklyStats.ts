import { useMemo } from 'react';

export function useWeeklyStats(history: any[]) {
    return useMemo(() => {
        const getStats = (daysOffset: number) => {
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1) - daysOffset;
            const start = new Date(now.setDate(diff));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 7);

            const filtered = history.filter(h => {
                const date = new Date(h.date);
                return date >= start && date < end;
            });

            return {
                count: filtered.length,
                duration: filtered.reduce((acc, curr) => acc + curr.duration, 0),
                volume: filtered.reduce((acc, curr) => acc + curr.totalVolume, 0)
            };
        };

        const current = getStats(0);
        const last = getStats(7);

        const formatDuration = (seconds: number) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            if (h > 0) return `${h}h ${m}m`;
            return `${m}m`;
        };

        const formatVolume = (v: number) => {
            if (v >= 1000) {
                return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "kg";
            }
            return `${v.toFixed(0)}kg`;
        };

        return {
            current: {
                ...current,
                durationFormatted: formatDuration(current.duration),
                volumeFormatted: formatVolume(current.volume)
            },
            diff: {
                count: current.count - last.count,
                durationFormatted: formatDuration(Math.abs(current.duration - last.duration)),
                volumeFormatted: formatVolume(Math.abs(current.volume - last.volume)),
                isCountDown: current.count < last.count,
                isDurationDown: current.duration < last.duration,
                isVolumeDown: current.volume < last.volume
            }
        };
    }, [history]);
}
