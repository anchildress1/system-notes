import Hero from '@/components/Hero/Hero';
import Portrait from '@/components/Portrait/Portrait';
import AboutContent from '@/components/AboutContent/AboutContent';
import { aboutData } from '@/data/about';

export default function Human() {
  return (
    <main id="main-content">
      <Hero
        kicker="CWD · /sys/human"
        accentLead={aboutData.heroAccentLead}
        title={aboutData.heroTitle}
        subtitle={`${aboutData.role} · ${aboutData.specialty}`}
        aside={
          <Portrait
            src={aboutData.heroImage.src}
            alt={aboutData.heroImage.alt}
            width={aboutData.heroImage.width}
            height={aboutData.heroImage.height}
          />
        }
      />
      <AboutContent data={aboutData} />
    </main>
  );
}
