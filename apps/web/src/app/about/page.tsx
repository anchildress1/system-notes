'use client';

import Header from '@/components/Header/Header';
import Masthead from '@/components/Masthead/Masthead';
import Hero from '@/components/Hero/Hero';
import AboutContent from '@/components/AboutContent/AboutContent';
import { aboutData } from '@/data/about';

export default function Human() {
  const [heroTitle, heroSubtitle] = aboutData.heroTitle.split('\n');

  return (
    <main id="main-content">
      <Header />
      <Masthead />
      <Hero title={heroTitle.trim()} subtitle={heroSubtitle?.trim()} />
      <AboutContent data={aboutData} />
    </main>
  );
}
