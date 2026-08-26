import type { Metadata } from 'next';
import Link from 'next/link';
import IntakeDesk from '@/components/IntakeDesk/IntakeDesk';
import { profile } from '@/data/profile';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: "Ashley's System Notes",
  description:
    'Describe a failure you are living with. The answer cites only systems Ashley Childress has actually shipped, and states the gaps it cannot fill.',
  path: '/',
});

export default function IntakePage() {
  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.intake} aria-labelledby="intake-heading">
        <div className="page-head">
          <h1 id="intake-heading">
            Tell me what&rsquo;s breaking.
            <br />
            <span>I&rsquo;ll show you how I&rsquo;d fix it.</span>
          </h1>
        </div>
        <div className="page-column">
          <p className={styles.proof}>
            <strong>{profile.role}.</strong> The agent below cites only systems I&rsquo;ve actually
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
