import styles from './IndexWorkspace.module.css';

/* The stand-in when the manifest has nothing to show — an index outage, or a
   build with no credentials. Only ever seen by a reader whose scripts are still
   loading; anyone without scripting sees it and nothing follows, which is the
   same as before the manifest existed. */
export default function IndexLoadingShell() {
  return (
    <output className={styles.loadingShell}>
      <span>Loading the index</span>
      <span aria-hidden="true">•••</span>
    </output>
  );
}
