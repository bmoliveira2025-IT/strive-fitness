import { useMemo } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import AIAdvisorService from '../lib/AIAdvisorService';

export function useAIAdvisor() {
    const { history } = useWorkoutHistory();
    const { profile } = useUserStore();

    const stats = useMemo(() => {
        const goal = profile?.onboardingData?.daysPerWeek || 3;
        const monitoring = profile?.weeklyMonitoring || [];
        const assessments = profile?.periodicAssessments || [];
        return AIAdvisorService.analyze(history, monitoring, goal, assessments);
    }, [history, profile]);

    return stats;
}
