import { getSystemDoc } from '@/lib/api';
import styles from './page.module.css';
import Header from '@/components/Header/Header';
import DocViewer from '@/components/DocViewer/DocViewer';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join('/');
  return {
    title: `System Doc: ${path}`,
  };
}

export default async function SystemDocPage({ params }: Props) {
  const { slug } = await params;
  const path = slug.join('/');
  const doc = await getSystemDoc(path);

  if (!doc || doc.error) {
    return (
      <main className={styles.container}>
        <Header />
        <div className={styles.error}>
          <p>Document not found: {path}</p>
          {doc?.error && (
            <p style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '1rem' }}>
              Details: {doc.error}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <Header />
      <div className={styles.header}>
        <h1 className={styles.title}>System Document</h1>
        <div className={styles.path}>{path}</div>
      </div>
      <DocViewer content={doc.content} />
    </main>
  );
}
