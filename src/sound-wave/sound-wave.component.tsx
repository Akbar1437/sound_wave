import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import file from "../../public/Mr Lambo-Iceberg.mp3";
import styles from "./sound-wave.styles.module.css";

export const SoundWave = () => {
  // ---------------------------------------------------------------------------
  // variables
  // ---------------------------------------------------------------------------

  const waveformRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [isReplay, setReplay] = useState(false);
  const [pausedPosition, setPausedPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ---------------------------------------------------------------------------
  // effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;
    let shouldPlay = false;

    if (!containerRef.current) return;
    // create a new WaveSurfer instance and set its configuration
    waveformRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#8592AA",
      progressColor: "#1B9FFC",
      barRadius: 2,
      height: 30,
      barHeight: 1,
      barWidth: 2,
      barGap: 1,
      cursorWidth: 0,
      minPxPerSec: 10,
      fillParent: true,
      autoplay: false,
      normalize: false,
      hideScrollbar: true,
    });

    waveformRef.current.load(file);

    // event handler for when the audio is ready
    waveformRef.current.on("ready", () => {
      if (!waveformRef.current) return;
      if (!isMounted) return;
      const currentDuration = waveformRef.current.getDuration();

      setDuration(currentDuration);

      // play the audio from the paused position
      if (shouldPlay) {
        const position = pausedPosition / currentDuration;
        setCurrentTime(position * duration);
        waveformRef.current.seekTo(position);
        waveformRef.current.play();
      }
    });

    // event handler for audio playback progress
    waveformRef.current.on("audioprocess", () => {
      if (!waveformRef.current) return;
      if (!isMounted) return;

      setCurrentTime(waveformRef.current.getCurrentTime());
    });

    // event handler for when seeking in the audio
    waveformRef.current.on("seeking", () => {
      setCurrentTime(waveformRef.current!.getCurrentTime());
      setPlaying(true);
      waveformRef.current!.play();
      setReplay(false);
    });
    // event handler for when the audio finishes playing
    waveformRef.current.on("finish", () => {
      setPlaying(false);
      setReplay(true);
      setCurrentTime(0);
      setPausedPosition(0);
    });
    // clean up the component when it is unmounted
    return () => {
      isMounted = false;
    };
  }, [file]);

  // ---------------------------------------------------------------------------
  // callbacks
  // ---------------------------------------------------------------------------

  const togglePlayback = useCallback(() => {
    if (!waveformRef.current) return;

    if (isPlaying) {
      // store the paused position
      setPausedPosition(waveformRef.current.getCurrentTime());
      waveformRef.current.pause();
    } else {
      const position = pausedPosition / waveformRef.current.getDuration();
      setCurrentTime(position * duration);
      if (isReplay) {
        // seek to the beginning if the audio has finished
        waveformRef.current.seekTo(0);
        setReplay(false);
      } else {
        // seek to the paused position
        waveformRef.current.seekTo(position);
      }
      // play the audio
      waveformRef.current.play();
    }

    setPlaying((prev) => !prev);
  }, [isPlaying, pausedPosition, duration, isReplay]);

  // ---------------------------------------------------------------------------
  // functions
  // ---------------------------------------------------------------------------

  const formatTime = (time: number) => {
    // function to format time in minutes and seconds
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    return formattedTime;
  };

  // ---------------------------------------------------------------------------
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.btnPlay} onClick={togglePlayback}>
          <i
            className={`${
              isPlaying
                ? "fal fa-pause"
                : isReplay
                ? "fal fa-undo"
                : "fal fa-play"
            } ${styles.iconPlaying}`}
          />
        </div>
        <div className={styles.waveformWrapper}>
          <div ref={containerRef}></div>
        </div>
      </div>
      <div className={styles.timesWrap}>
        <div className={styles.currentTime}>{formatTime(currentTime)}</div>
        <div className={styles.durationTime}>{formatTime(duration)}</div>
      </div>
    </div>
  );
};
