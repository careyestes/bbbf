import type { Metadata } from "next";
import Image from "next/image";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FARM } from "@/lib/config";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Us",
  description: `Meet ${FARM.name} — pure raw honey from Shaw, Mississippi, harvested from our hives and never heated or pasteurized.`,
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.heroBand}>
        <div className={styles.bg}>
          <Image
            src="/images/IMG_8741.jpeg"
            alt="Hives at Big Blue Barn Farm"
            fill
            className={styles.bgImg}
            sizes="100vw"
            priority
          />
          <div className={styles.overlay} />
        </div>
        <div className={styles.heroContent}>
          <h1>About us</h1>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.prose}>
            <h2>Who we are</h2>
            <p>
              <strong>{FARM.name}</strong> is a small farm in Shaw,
              Mississippi. We keep bees, harvest when the flow allows, and jar
              pure raw honey straight from the comb: extracted, gently strained,
              and never heated or pasteurized.
            </p>
            <p>
              Every jar we ship comes from our yards in the Delta. When the
              bloom is strong and the supers are heavy, we want our neighbors
              and regulars to know first.
            </p>
            <p>
              Reach us anytime at{" "}
              <a href={`mailto:${FARM.email}`}>{FARM.email}</a>.
            </p>
          </div>

          <section
            id="waitlist"
            className={styles.waitlist}
            aria-labelledby="about-waitlist-heading"
          >
            <h2 id="about-waitlist-heading">Honey flow alerts</h2>
            <p>
              Join the list and we&apos;ll email you when jars are ready.
            </p>
            <WaitlistForm />
          </section>
        </div>
      </div>
    </div>
  );
}
