import type { Metadata } from 'next';
import IntakeDesk from '@/components/IntakeDesk/IntakeDesk';
import IntentLink from '@/components/IntentLink/IntentLink';
import { profile } from '@/data/profile';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: "Ashley's System Notes",
  description:
    'Ashley Childress builds backend systems in Java and Node.js on GCP. Browse the projects, read the decisions, or ask a question about the work.',
  path: '/',
});

export default function IntakePage() {
  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.intake} aria-labelledby="intake-heading">
        <div className="page-head">
          <h1 id="intake-heading">
            I build backend systems.
            <br />
            <span>Ask me how they work.</span>
          </h1>
        </div>
        <div className="page-column">
          <p className={styles.proof}>
            <strong>{profile.role}.</strong> I&rsquo;ve worked on {profile.trackRecord.summary}{' '}
            since {profile.trackRecord.coreSince}. The agent answers from my project notes, so you
            can follow its sources and check my work.
          </p>
          <p className={styles.proof}>
            Start with{' '}
            <IntentLink className="marked-link" href="/projects#metal-birds-feed">
              Metal Birds Feed
            </IntentLink>
            : I got national aircraft registers into one feed and built a Cloud Run service to look
            them up.
          </p>
          <IntakeDesk />
        </div>
      </section>
    </main>
  );
}
