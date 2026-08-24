import type { Metadata } from 'next';
import IntakeDesk from '@/components/IntakeDesk/IntakeDesk';
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
        <h1 id="intake-heading" className={styles.heading}>
          Tell me what&apos;s breaking.{' '}
          <em className={styles.headingTurn}>I&apos;ll show you how I&apos;d fix it.</em>
        </h1>
        <p className={styles.lede}>Paste a role, or a failure you&apos;re living with.</p>
        <IntakeDesk />
      </section>
    </main>
  );
}
