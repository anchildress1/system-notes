export interface AboutSection {
  title: string;
  subtitle?: string;
  content: string;
}

export interface AboutData {
  heroTitle: string;
  heroImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  sections: AboutSection[];
}

export const aboutData: AboutData = {
  heroTitle: "I design for the failure you haven't met yet.",
  heroImage: {
    src: '/ashley-gen-2.jpg',
    alt: 'Ashley Childress profile picture generated with AI',
    width: 600,
    height: 400,
  },
  sections: [
    {
      title: 'Ashley Childress',
      subtitle: '/ ASH-lee CHIL-dres /',
      content: `I’m a senior software engineer with roots in southwest Virginia, raised in a small coal-mining town deep in Appalachia. Isolation shaped how I see systems. The nearest Walmart was a 45-minute drive, and for a long time the biggest city I knew was Bristol. At seventeen, I moved to Georgia, where I’ve lived ever since, gradually drifting west of Atlanta and closer to Alabama. No matter where I land, the mountains still feel like home. Appalachia is the place I keep reaching for.

I came to software engineering in a practical way. During my second attempt at college, a career aptitude test offered a short list of options, which I ranked by earning potential and software engineering was at the top. I quickly fell in love with the work and what started as a pragmatic decision turned into a long-term obsession.

I don’t just build applications—I build systems. I push back when things lack coherence and I debate assumptions instinctively. I fix problems before they calcify into “the way we’ve always done it.” I love design, architecture, and testing theories in real systems. If every file in a repository changed once, it was intentional and afterwards automation takes over. I believe linters, formatters, and guardrails are necessary to keep the system stable and predictable.

These days, I write very little code by hand. Instead, I build AI-augmented systems that write code the way I used to write it myself. That doesn’t mean handing over control. My review process operates at the system level. I care about whether it works, whether it’s deterministic, whether it’s tested, whether it’s repeatable, and whether the constraints are strong enough to hold over time.

That’s how I approach AI. I’m not just using it. I’m teaching it. I design workflows that are reusable, durable, and intentionally constrained so they can operate long-term without constant intervention. The goal isn’t novelty. It’s clarity, structure, and systems that continue to function well after the initial build is done.`,
    },
    {
      title: 'Theme Song',
      content: `I’ve called "I Build Things" my theme song since the first time I heard it.

Part of that is Appalachian ingenuity. I was taught to fix what breaks, reuse what still works, and take things apart just to understand how they function. I’ve been dismantling systems and occasionally putting them back together since before I had the vocabulary to call them systems.

Another part is simpler. The song is just fun. It’s catchy, energetic, and it makes me want to build things. I don’t treat a theme song as a metaphor exercise alone. I picked this one because it’s motivating, memorable, and genuinely enjoyable.

The rest is how I build software.

I design systems by actively hunting failure points. If something can break, I assume it will and I try to find it before production does. There’s nothing I dislike more than shipping a “done” deployment and immediately needing a hotfix. If I deployed it, the failure should already have been found, understood, and addressed.

This song captures that balance. The joy of building something yourself, combined with the belief that breaking things early, loudly, and intentionally is how you end up with systems that actually ship clean and stay that way.`,
    },
  ],
};
