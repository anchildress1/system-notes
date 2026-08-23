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

const stations = [
  { name: 'Parse', who: 'agent', note: 'Reads the problem and names the requirements.' },
  {
    name: 'Retrieve',
    who: 'agent + corpus',
    note: 'Reads every system on file and names the ones that answer it.',
  },
  {
    name: 'Verify',
    who: 'deterministic',
    note: 'Checks every cited system exists on file. Invented ones are dropped.',
  },
  {
    name: 'Cover',
    who: 'deterministic',
    note: 'Any requirement nothing answers becomes a stated gap.',
  },
  { name: 'Assemble', who: 'agent', note: 'Writes the brief from the surviving evidence only.' },
] as const;

export default function IntakePage() {
  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.intake} aria-labelledby="intake-heading">
        <h1 id="intake-heading" className={styles.heading}>
          Tell me what&apos;s breaking.
          <em className={styles.headingTurn}>I&apos;ll show you how I&apos;d fix it.</em>
        </h1>
        <p className={styles.lede}>
          Paste a role, or a failure you&apos;re living with. An agent parses it, pulls only from
          systems I have actually shipped and the decisions behind them, drops anything it
          can&apos;t source, and hands back a brief. No claim without evidence — that rule is
          enforced in the pipeline, not promised in a paragraph.
        </p>
        <IntakeDesk />
      </section>

      <section className={styles.pipeline} aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading" className={styles.pipelineHeading}>
          What runs when you ask
        </h2>
        <ol className={styles.stations}>
          {stations.map(({ name, who, note }) => (
            <li key={name} className={styles.station}>
              <p className={styles.stationName}>{name}</p>
              <p className={styles.stationNote}>{note}</p>
              <p className={styles.stationWho}>{who}</p>
            </li>
          ))}
        </ol>
        <p className={styles.pipelineNote}>
          Two of the five stations are not the model&apos;s to skip. Verify drops any citation that
          is not on file, and Cover turns anything the corpus cannot answer into a stated gap rather
          than a confident sentence.
        </p>
      </section>
    </main>
  );
}
