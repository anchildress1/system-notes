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
        <div className="page-head">
          <p className="page-head-slug">
            <span>Intake</span>
            <span>Answers cite shipped work</span>
          </p>
          <h1 id="intake-heading">
            Tell me what&rsquo;s breaking.
            <br />
            <span>I&rsquo;ll show you how I&rsquo;d fix it.</span>
          </h1>
        </div>
        <div className="page-column">
          <IntakeDesk />
        </div>
      </section>
    </main>
  );
}
