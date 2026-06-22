import Hero from '@/components/Hero/Hero';
import AboutContent from '@/components/AboutContent/AboutContent';
import { aboutData } from '@/data/about';

export default function Human() {
  return (
    <main id="main-content">
      <Hero
        accentLead={aboutData.heroAccentLead}
        accentTone="brand"
        title={aboutData.heroTitle}
        subtitle={`${aboutData.role} · ${aboutData.specialty}`}
      />
      <AboutContent data={aboutData} />
    </main>
  );
}
