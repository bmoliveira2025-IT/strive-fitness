import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';

export interface WorkoutSound {
  unload(): Promise<void>;
}

export async function configureWorkoutAudio() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    playThroughEarpieceAndroid: false,
  });
}

export async function playWorkoutAudio(url: string, volume: number): Promise<WorkoutSound> {
  const { sound } = await Audio.Sound.createAsync(
    { uri: url },
    { shouldPlay: true, volume }
  );

  return {
    async unload() {
      await sound.unloadAsync();
    },
  };
}
