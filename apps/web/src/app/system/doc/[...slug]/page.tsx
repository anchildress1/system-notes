import Header from '@/components/Header/Header';
import { getSystemDoc } from '@/lib/api';
import styles from './page.module.css';
import DocViewer from './DocViewer';

interface Props {
  params: {
    slug: string[];
  };
}

export default async function SystemDocPage({ params }: Props) {
  // Reconstruct path from slug array
  const docPath = params.slug.join('/');
  const doc = await getSystemDoc(docPath);

  if (!doc || doc.error) {
    return (
      <main>
        <Header />
        <div className="p-8 text-red-500">Error: {doc?.error || 'Document not found'}</div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.title}>System Document: {params.slug.join('/')}</h1>

        <div className={styles.viewer}>
          <div className={styles.codeBlock}>
            <DocViewer content={doc.content} />
          </div>
        </div>
      </div>
    </main>
  );
}
