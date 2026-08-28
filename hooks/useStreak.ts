import { useMemo } from 'react';

export function useStreak(history: any[]) {
    return useMemo(() => {
        if (!history || history.length === 0) return 0;

        const sortedDates = [...new Set(history.map(h => new Date(h.date).toDateString()))]
            .map(d => new Date(d).getTime())
            .sort((a, b) => b - a);

        let currentStreak = 0;
        const today = new Date().setHours(0, 0, 0, 0);
        let checkDate = today;

        // Check if trained today
        if (sortedDates.includes(today)) {
            currentStreak++;
            checkDate -= 86400000;
        } else {
            // If not trained today, streak is valid if trained yesterday
            checkDate -= 86400000;
        }

        while (sortedDates.includes(checkDate)) {
            currentStreak++;
            checkDate -= 86400000;
        }

        return currentStreak;
    }, [history]);
}
