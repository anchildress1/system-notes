import type { Metadata } from 'next';
import Link from 'next/link';
import IntakeDesk from '@/components/IntakeDesk/IntakeDesk';
import { profile } from '@/data/profile';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: "Ashley's System Notes",
  description:
    'Ask how the work holds up. The answer cites only systems Ashley Childress has actually shipped, and states the gaps it cannot fill.',
  path: '/',
});

export default function IntakePage() {
  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.intake} aria-labelledby="intake-heading">
        <div className="page-head">
          <h1 id="intake-heading">
            What do you want to know?
            <br />
            <span>I&rsquo;ll answer, or tell you where the gap is.</span>
          </h1>
        </div>
        <div className="page-column">
          <p className={styles.proof}>
            <strong>{profile.role}.</strong> I build {profile.trackRecord.summary}, and have since{' '}
            {profile.trackRecord.since}. The agent below cites only systems I&rsquo;ve actually
            shipped.{' '}
            <Link className="marked-link" href="/projects">
              See the evidence.
            </Link>
          </p>
          <IntakeDesk />
        </div>
      </section>
    </main>
  );
}
