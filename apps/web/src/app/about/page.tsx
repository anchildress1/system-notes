import Header from '@/components/Header/Header';
import Masthead from '@/components/Masthead/Masthead';
import Hero from '@/components/Hero/Hero';
import AboutContent from '@/components/AboutContent/AboutContent';
import { aboutData } from '@/data/about';

export default function Human() {
  return (
    <main id="main-content">
      <Header />
      <Masthead />
      <Hero
        accentLead={aboutData.heroAccentLead}
        title={aboutData.heroTitle}
        subtitle={aboutData.heroSubtitle}
      />
      <AboutContent data={aboutData} />
    </main>
  );
}
