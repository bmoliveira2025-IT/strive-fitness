import { ResizeMode, Video } from 'expo-av';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export interface WorkoutVideoHandle {
  play(): Promise<void>;
  pause(): Promise<void>;
}

interface WorkoutVideoProps {
  sourceUrl: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  muted?: boolean;
  volume?: number;
  style?: StyleProp<ViewStyle>;
  onPlayingChange?: (playing: boolean) => void;
}

export const WorkoutVideo = forwardRef<WorkoutVideoHandle, WorkoutVideoProps>(function WorkoutVideo(
  { sourceUrl, autoPlay = false, loop = false, controls = false, muted = false, volume = 1, style, onPlayingChange },
  ref
) {
  const videoRef = useRef<Video>(null);

  useImperativeHandle(ref, () => ({
    async play() {
      await videoRef.current?.playAsync();
    },
    async pause() {
      await videoRef.current?.pauseAsync();
    },
  }), []);

  return (
    <Video
      ref={videoRef}
      source={{ uri: sourceUrl }}
      rate={1}
      volume={volume}
      isMuted={muted}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay={autoPlay}
      isLooping={loop}
      useNativeControls={controls}
      style={style}
      onPlaybackStatusUpdate={(status) => {
        if (status.isLoaded) onPlayingChange?.(status.isPlaying);
      }}
    />
  );
});
