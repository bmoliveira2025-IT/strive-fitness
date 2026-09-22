export interface WorkoutSound {
  unload(): Promise<void>;
}

export async function configureWorkoutAudio() {
  // Browsers require audio to begin from a user gesture; no global setup needed.
}

export async function playWorkoutAudio(url: string, volume: number): Promise<WorkoutSound> {
  const audio = new window.Audio(url);
  audio.volume = volume;
  await audio.play();

  return {
    async unload() {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
