import { useEffect, useState } from 'react';
import {
  initialize,
  requestPermission,
  readRecords,
  aggregateRecord,
  getSdkStatus,
  SdkAvailabilityStatus,
  openHealthConnectSettings,
} from 'react-native-health-connect';
import type { Permission } from 'react-native-health-connect';

export function useHealthConnect() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        setIsAvailable(true);
        const initialized = await initialize();
        setIsInitialized(initialized);
      } else if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        console.warn('Health Connect precisa ser atualizado ou instalado');
        setIsAvailable(false);
      } else {
        console.warn('Health Connect is not available on this device');
        setIsAvailable(false);
      }
    } catch (e) {
      console.error('Failed to initialize Health Connect', e);
      setIsAvailable(false);
    }
  };


  const connect = async () => {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      openHealthConnectSettings();
      return false;
    }

    if (!isAvailable || !isInitialized) {
      console.warn('Health Connect not initialized');
      return false;
    }

    try {
      const permissions: Permission[] = [
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      ];

      const grantedPermissions = await requestPermission(permissions);
      return grantedPermissions.length > 0;
    } catch (e) {
      console.error('Failed to request Health Connect permissions', e);
      return false;
    }
  };

  const fetchCardioStats = async () => {
    if (!isAvailable || !isInitialized) return { todayDist: 0, weekDist: 0, todayTime: 0, weekTime: 0, steps: 0, calories: 0, bpmAvg: 0 };
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const [distTodayReq, distWeekReq, exercisesTodayReq, exercisesWeekReq, stepsReq, caloriesReq, heartRateReq] = await Promise.all([
        readRecords('Distance', { timeRangeFilter: { operator: 'after', startTime: today.toISOString() } }),
        readRecords('Distance', { timeRangeFilter: { operator: 'after', startTime: startOfWeek.toISOString() } }),
        readRecords('ExerciseSession', { timeRangeFilter: { operator: 'after', startTime: today.toISOString() } }),
        readRecords('ExerciseSession', { timeRangeFilter: { operator: 'after', startTime: startOfWeek.toISOString() } }),
        aggregateRecord({ recordType: 'Steps', timeRangeFilter: { operator: 'after', startTime: today.toISOString() } }),
        aggregateRecord({ recordType: 'TotalCaloriesBurned', timeRangeFilter: { operator: 'after', startTime: today.toISOString() } }),
        aggregateRecord({ recordType: 'HeartRate', timeRangeFilter: { operator: 'after', startTime: today.toISOString() } }),
      ]);

      const todayDist = distTodayReq.records.reduce((acc, curr) => acc + curr.distance.inMeters, 0) / 1000;
      const weekDist = distWeekReq.records.reduce((acc, curr) => acc + curr.distance.inMeters, 0) / 1000;

      const calculateTime = (records: any[]) => {
        return records.reduce((acc, curr) => {
          const start = new Date(curr.startTime).getTime();
          const end = new Date(curr.endTime).getTime();
          return acc + ((end - start) / 1000 / 60); // minutes
        }, 0);
      };

      const todayTime = calculateTime(exercisesTodayReq.records);
      const weekTime = calculateTime(exercisesWeekReq.records);

      const steps = stepsReq.COUNT_TOTAL || 0;
      const calories = caloriesReq.ENERGY_TOTAL?.inKilocalories || 0;
      const bpmAvg = heartRateReq.BPM_AVG || 0;

      return { todayDist, weekDist, todayTime, weekTime, steps, calories, bpmAvg };
    } catch (e) {
      console.error('Failed to read cardio stats from Health Connect', e);
      return { todayDist: 0, weekDist: 0, todayTime: 0, weekTime: 0, steps: 0, calories: 0, bpmAvg: 0 };
    }
  };

  return {
    isAvailable,
    isInitialized,
    connect,
    fetchCardioStats,
  };
}
