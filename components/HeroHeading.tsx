"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./Hero.module.css";

const HEADING_LINES = ["OH,", "HONEY!", "IT'S", "READY."] as const;
const LAYER_COUNT = 4;

const BASE_TILT_X = 5;
const BASE_TILT_Y = 3;
const RANGE_TILT_X = 16;
const RANGE_TILT_Y = 22;
const LERP = 0.1;

export function HeroHeading() {
  const copyRef = useRef<HTMLDivElement>(null);
  const current = useRef({ x: 0.3, y: 0.4 });
  const target = useRef({ x: 0.3, y: 0.4 });
  const frame = useRef(0);

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");

    const apply = (x: number, y: number) => {
      const tiltX = BASE_TILT_X + (0.5 - y) * RANGE_TILT_X;
      const tiltY = BASE_TILT_Y + (x - 0.5) * RANGE_TILT_Y;
      copy.style.setProperty("--origin-x", `${10 + x * 80}%`);
      copy.style.setProperty("--origin-y", `${15 + y * 70}%`);
      copy.style.setProperty("--tilt-x", `${tiltX}deg`);
      copy.style.setProperty("--tilt-y", `${tiltY}deg`);
    };

    const tick = () => {
      const c = current.current;
      const t = target.current;
      c.x += (t.x - c.x) * LERP;
      c.y += (t.y - c.y) * LERP;
      apply(c.x, c.y);

      if (Math.abs(t.x - c.x) > 0.001 || Math.abs(t.y - c.y) > 0.001) {
        frame.current = requestAnimationFrame(tick);
      } else {
        frame.current = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;
      target.current = {
        x: event.clientX / innerWidth,
        y: event.clientY / innerHeight,
      };
      if (!frame.current) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    const reset = () => {
      copy.style.removeProperty("--origin-x");
      copy.style.removeProperty("--origin-y");
      copy.style.removeProperty("--tilt-x");
      copy.style.removeProperty("--tilt-y");
      current.current = { x: 0.3, y: 0.4 };
      target.current = { x: 0.3, y: 0.4 };
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
      }
      reset();
    };

    const sync = () => {
      stop();
      if (motionQuery.matches || !pointerQuery.matches) return;
      window.addEventListener("pointermove", onMove, { passive: true });
    };

    sync();
    motionQuery.addEventListener("change", sync);
    pointerQuery.addEventListener("change", sync);

    return () => {
      motionQuery.removeEventListener("change", sync);
      pointerQuery.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return (
    <div ref={copyRef} className={`${styles.copy} fade-up`}>
      <h1 id="hero-heading" className={styles.honey3d}>
        <span className="sr-only">OH, HONEY! IT&apos;S READY.</span>
        <span className={styles.stack} aria-hidden>
          {Array.from({ length: LAYER_COUNT }, (_, i) => (
            <span
              key={i}
              className={`${styles.layer} ${i === 0 ? styles.face : ""}`}
              style={{ "--i": i } as CSSProperties}
            >
              {HEADING_LINES.map((line) => (
                <span key={line} className={styles.line}>
                  {line}
                </span>
              ))}
            </span>
          ))}
        </span>
      </h1>
    </div>
  );
}
