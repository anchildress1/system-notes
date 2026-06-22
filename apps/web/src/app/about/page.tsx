import Hero from '@/components/Hero/Hero';
import AboutContent from '@/components/AboutContent/AboutContent';
import { aboutData } from '@/data/about';

export default function Human() {
  return (
    <main id="main-content">
      <Hero
        accentTone="brand"
        title={aboutData.heroTitle}
        titleAccent={aboutData.heroTitleAccent}
        accentWord={aboutData.heroAccentWord}
        subtitle={`${aboutData.role} · ${aboutData.specialty}`}
      />
      <AboutContent data={aboutData} />
    </main>
  );
}
