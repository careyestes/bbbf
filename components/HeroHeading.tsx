import type { CSSProperties } from "react";
import styles from "./Hero.module.css";

const HEADING_LINES = ["OH,", "HONEY!", "IT'S", "READY."] as const;
const LAYER_COUNT = 4;

export function HeroHeading() {
  return (
    <div className={`${styles.copy} fade-up`}>
      <h1 className={styles.honey3d}>
        <span className="sr-only">OH, HONEY! IT&apos;S READY.</span>
        <span className={styles.stack} aria-hidden="true">
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
