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

// One agent call, not a pipeline. The panel used to draw five stages and label
// one of them deterministic, which described an architecture this page does not
// run. What is actually true is the split below: four constraints the agent is
// asked to hold, and one the render enforces whether it holds them or not.
const stations = [
  {
    name: 'Sources',
    who: 'instruction',
    note: 'Two indexes and a closed list of every system I have shipped. Nothing else counts as knowledge.',
  },
  {
    name: 'Evidence',
    who: 'instruction',
    note: 'No invented systems, no invented numbers. A number has to come off a note or the list.',
  },
  {
    name: 'Gaps',
    who: 'instruction',
    note: 'What I have not built gets said inside the answer, never saved for the end.',
  },
  {
    name: 'Shape',
    who: 'instruction',
    note: 'A verdict, the approach, something I would refuse, then the evidence.',
  },
  {
    name: 'Citations',
    who: 'enforced in code',
    note: 'Every url is checked before it renders, and a link naming a system I have not shipped is dropped with it. The words stay; the link does not.',
  },
] as const;

export default function IntakePage() {
  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.intake} aria-labelledby="intake-heading">
        <h1 id="intake-heading" className={styles.heading}>
          Tell me what&apos;s breaking.{' '}
          <em className={styles.headingTurn}>I&apos;ll show you how I&apos;d fix it.</em>
        </h1>
        <p className={styles.lede}>
          Paste a role, or a failure you&apos;re living with. One agent reads it against my decision
          index, my writing, and a closed list of the systems I have actually shipped, then hands
          back a brief. Where I have not built the thing, it says so instead of reaching for the
          nearest project that sounds close.
        </p>
        <IntakeDesk />
      </section>

      <section className={styles.pipeline} aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading" className={styles.pipelineHeading}>
          What it is asked to do, and what it is not trusted with
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
      </section>
    </main>
  );
}
