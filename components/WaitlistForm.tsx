"use client";

import { FormEvent, useState } from "react";
import styles from "./WaitlistForm.module.css";

export function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("ok");
      setMessage("You're on the list — we'll email when honey flow is in swing.");
      setName("");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not join waitlist");
    }
  }

  if (status === "ok") {
    return (
      <p className={`${styles.message} ${styles.ok}`} role="status">
        {message}
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <label className={styles.label} htmlFor="waitlist-name">
          Name
        </label>
        <input
          id="waitlist-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          aria-invalid={status === "error" ? true : undefined}
          aria-describedby={status === "error" ? "waitlist-error" : undefined}
        />
      </div>
      <div className={styles.row}>
        <label className={styles.label} htmlFor="waitlist-email">
          Email
        </label>
        <input
          id="waitlist-email"
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-invalid={status === "error" ? true : undefined}
          aria-describedby={status === "error" ? "waitlist-error" : undefined}
        />
      </div>
      <button
        type="submit"
        className={styles.btn}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Joining…" : "Notify me"}
      </button>
      {status === "error" && message && (
        <p
          className={`${styles.message} ${styles.err}`}
          role="alert"
          id="waitlist-error"
        >
          {message}
        </p>
      )}
    </form>
  );
}
