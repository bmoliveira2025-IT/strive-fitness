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
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    async play() {
      await videoRef.current?.play();
    },
    async pause() {
      videoRef.current?.pause();
    },
  }), []);

  return (
    <video
      ref={videoRef}
      src={sourceUrl}
      autoPlay={autoPlay}
      loop={loop}
      controls={controls}
      muted={muted}
      playsInline
      preload="metadata"
      style={style as React.CSSProperties}
      onPlay={() => onPlayingChange?.(true)}
      onPause={() => onPlayingChange?.(false)}
      onEnded={() => onPlayingChange?.(false)}
    />
  );
});
