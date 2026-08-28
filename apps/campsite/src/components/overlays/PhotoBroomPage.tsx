import { Badge, Button, Link, Text } from "@jordanscamp/ds";
import { useState, type ReactNode } from "react";

import { asset } from "../../utils/assetPath";

const REPO = "https://github.com/TheDuckGoesQuark/CampingTrip";
const EXT_DIR = "extensions/photobroom";
const COFFEE_URL = "https://buymeacoffee.com/jordanmackie";

import styles from "./PhotoBroomPage.module.css";

/**
 * PhotoBroom's landing, folded into the CatOS blog as the project page
 * (`/blog/photobroom`). Content-only — the CatOS window supplies the frame and
 * title bar; there's no external subdomain any more.
 */
export default function PhotoBroomPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <Badge tone="accent">Chrome extension</Badge>
        <Text variant="title-1">Sweep your Google Photos clutter into the bin.</Text>
        <Text variant="body-lg" tone="muted" as="p">
          <span className={styles.lede}>
            PhotoBroom overlays a fast, keyboard-driven review on top of Google Photos search
            results. Flick through photos — keep, skip, or bin — then send the binned ones to
            Google's bin in one go. Nothing is deleted until you confirm, and the bin is recoverable
            for 60 days.
          </span>
        </Text>
      </div>

      <Section title="See it in action">
        <div className={styles.shotGrid}>
          <Shot
            src="images/screenshots/sweep.webp"
            caption="1. Search a date, then hit “Sweep this search”."
          />
          <Shot
            src="images/screenshots/review.webp"
            caption="2. Review each photo with the arrow keys — bin, skip, or keep."
          />
          <Shot
            src="images/screenshots/confirm.webp"
            caption="3. Check the tally, then move the binned ones in one go."
          />
          <Shot
            src="images/screenshots/done.webp"
            caption="4. Done — and re-reviewed photos are remembered next time."
          />
        </div>
      </Section>

      <Section title="Why a browser extension?">
        <Text tone="muted" as="p">
          Google Photos has no bulk "delete everything from this search" button, and its API can't
          delete photos at all. So PhotoBroom works the only way that's actually possible: as an
          extension that drives the Google Photos web page itself — using Google's own multi-select
          and "Move to bin", just faster and with a nicer review UI.
        </Text>
        <div className={styles.card}>
          <div className={styles.note}>
            <Text>🔒</Text>
            <Text variant="body-sm" tone="muted" as="p">
              It runs entirely in your browser, on{" "}
              <code className={styles.code}>photos.google.com</code>, while you're logged in. No
              photos, tokens, or data are ever sent anywhere — there's no PhotoBroom server.
            </Text>
          </div>
        </div>
      </Section>

      <Section title="Install it (load unpacked)">
        <Text tone="muted" as="p">
          PhotoBroom isn't on the Chrome Web Store (see below), so you load it yourself — a
          one-time, two-minute setup.
        </Text>
        <div className={styles.steps}>
          <Step n={1}>
            <Text as="p">Clone the repo and build the extension bundle:</Text>
            <pre
              className={styles.codeBlock}
            >{`git clone ${REPO}\ncd CampingTrip\npnpm install\npnpm --filter photobroom build:overlay`}</pre>
          </Step>
          <Step n={2}>
            <Text as="p">
              Open <code className={styles.code}>chrome://extensions</code> and turn on{" "}
              <b>Developer mode</b> (top-right toggle).
            </Text>
          </Step>
          <Step n={3}>
            <Text as="p">
              Click <b>Load unpacked</b> and select the{" "}
              <code className={styles.code}>{EXT_DIR}</code> folder from the repo.
            </Text>
          </Step>
          <Step n={4}>
            <Text as="p">
              That's it — PhotoBroom is now active on Google Photos. After pulling updates, re-run
              the build command and hit <b>reload</b> ↻ on the extension.
            </Text>
          </Step>
        </div>
      </Section>

      <Section title="How to use it">
        <div className={styles.steps}>
          <Step n={1}>
            <Text as="p">
              Go to{" "}
              <Link href="https://photos.google.com" target="_blank" rel="noopener noreferrer">
                photos.google.com
              </Link>{" "}
              and search for what you want to thin out — a date like{" "}
              <code className={styles.code}>June 29</code>, a place, or anything else.
            </Text>
          </Step>
          <Step n={2}>
            <Text as="p">
              In the <b>🧹 PhotoBroom</b> panel (bottom-right), click <b>Sweep this search</b>. It
              scans the whole result set.
            </Text>
          </Step>
          <Step n={3}>
            <Text as="p">Review each photo with your keyboard (or the buttons):</Text>
            <div className={styles.badgeRow}>
              <Badge tone="danger">← Bin</Badge>
              <Badge tone="neutral">↑ Skip</Badge>
              <Badge tone="brand">→ Keep</Badge>
              <Badge tone="neutral">⌫ Undo</Badge>
            </div>
          </Step>
          <Step n={4}>
            <Text as="p">
              Hit <b>Review →</b>, check the counts, then <b>Move N to bin</b>. PhotoBroom selects
              exactly those photos and moves them to Google's bin.
            </Text>
          </Step>
          <Step n={5}>
            <Text as="p">
              Changed your mind mid-run? The red <b>■ Stop</b> button aborts instantly and clears
              the selection. Binned photos sit in Google's bin for 60 days, so nothing is gone for
              good.
            </Text>
          </Step>
        </div>
      </Section>

      <Section title="How it works">
        <ul className={styles.list}>
          <li>
            <Text variant="body-sm" tone="muted" as="span">
              A content script injects the review UI into a <b>shadow root</b> on the Google Photos
              tab, so its styles stay isolated from Google's page.
            </Text>
          </li>
          <li>
            <Text variant="body-sm" tone="muted" as="span">
              It reads the photo grid directly and scrolls it to load every result, then drives
              Google's <b>native multi-select</b> and the built-in <b>Move to bin</b> action.
            </Text>
          </li>
          <li>
            <Text variant="body-sm" tone="muted" as="span">
              All the Google-Photos-specific selectors live in one place, so if Google changes their
              markup it's a quick, single-spot fix — with a test suite guarding the contract.
            </Text>
          </li>
          <li>
            <Text variant="body-sm" tone="muted" as="span">
              Nothing leaves your browser, and nothing is deleted until you press <b>Move to bin</b>
              .
            </Text>
          </li>
        </ul>
      </Section>

      <Section title="Why it's not on the Chrome Web Store">
        <Text tone="muted" as="p">
          Automating another site's interface almost certainly runs against Google's Terms of
          Service, and the Web Store wouldn't accept it. PhotoBroom is a personal tool: you run it
          on your own account, at your own discretion. Because Google's "Move to bin" is fully
          reversible for 60 days, the blast radius of a mistake is small — but treat it as the
          unofficial, use-at-your-own-risk helper that it is.
        </Text>
      </Section>

      <div className={styles.coffeeCard}>
        <div>
          <Text variant="title-4">Found this useful?</Text>
          <Text variant="body-sm" tone="muted" as="p">
            PhotoBroom is free and ad-free. A coffee keeps the tinkering going.
          </Text>
        </div>
        <Button render={<a href={COFFEE_URL} target="_blank" rel="noopener noreferrer" />}>
          ☕ Buy me a coffee
        </Button>
      </div>

      <div className={styles.footer}>
        <Text variant="body-sm" tone="muted" as="span">
          Part of jordanscamp.site
        </Text>
        <Link href={REPO} target="_blank" rel="noopener noreferrer">
          View source on GitHub →
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <Text variant="title-3">{title}</Text>
      {children}
    </section>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className={styles.step}>
      <span className={styles.stepNum} aria-hidden>
        {n}
      </span>
      <div className={styles.stepBody}>{children}</div>
    </div>
  );
}

function Shot({ src, caption }: { src: string; caption: string }) {
  const [ok, setOk] = useState(true);
  return (
    <div className={styles.shot}>
      <div className={styles.shotFrame}>
        {ok ? (
          <img
            className={styles.shotImg}
            src={asset(src)}
            alt={caption}
            loading="lazy"
            decoding="async"
            onError={() => setOk(false)}
          />
        ) : (
          <div className={styles.shotPlaceholder}>
            <Text variant="body-sm" tone="muted" align="center">
              Screenshot coming soon
            </Text>
          </div>
        )}
      </div>
      <div className={styles.shotCaption}>
        <Text variant="body-sm" tone="muted">
          {caption}
        </Text>
      </div>
    </div>
  );
}
