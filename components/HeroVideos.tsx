"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Hero.module.css";

const SOURCES = ["/videos/hero-bees-1.mp4", "/videos/hero-bees-2.mp4"] as const;

export function HeroVideos() {
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const paused = reduceMotion || userPaused;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduceMotion(motion.matches);
    syncMotion();
    motion.addEventListener("change", syncMotion);
    return () => motion.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    const pauseAll = () => {
      refs.current.forEach((video) => {
        video?.pause();
      });
    };

    if (paused) {
      pauseAll();
      return pauseAll;
    }

    const video = refs.current[active];
    if (!video) return pauseAll;

    if (video.currentTime > 0.05) {
      video.currentTime = 0;
    }
    const play = video.play();
    if (play) {
      play.catch(() => {
        /* autoplay can fail without user gesture; muted should usually work */
      });
    }

    return pauseAll;
  }, [active, paused]);

  return (
    <>
      <div className={styles.media} aria-hidden>
        {SOURCES.map((src, index) => (
          <video
            key={src}
            ref={(el) => {
              refs.current[index] = el;
            }}
            className={`${styles.video} ${index === active ? styles.videoActive : ""}`}
            muted
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
            poster={index === 0 ? "/images/hero-bees-1.jpg" : undefined}
            onEnded={() => {
              if (paused) return;
              setActive((current) => (current + 1) % SOURCES.length);
            }}
          >
            <source src={src} type="video/mp4" />
          </video>
        ))}
        <div className={styles.veil} />
      </div>
      {!reduceMotion && (
        <button
          type="button"
          className={styles.videoToggle}
          onClick={() => setUserPaused((current) => !current)}
        >
          {userPaused ? "Play background video" : "Pause background video"}
        </button>
      )}
    </>
  );
}
