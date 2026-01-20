export interface AboutData {
    title: string;
    bio: string;
    themeSong: string;
    image: {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
}

export const aboutData: AboutData = {
    title: "I design for the failure you haven't met yet.",
    bio: `I push back on defaults when they stop serving the system. Hotfixes happen. Standards matter. If I change every file once, it’s because the repo needed coherence. After that, it stays quiet.

I don’t write much code by hand anymore. I design systems that teach AI how I used to think when I did. I’m less interested in features than in the machinery that builds, tests, and maintains them. Projects are temporary. Systems persist.

Nothing here is accidental. Surprise is usually undocumented intent. Good software isn’t about elegance anymore. It’s about observability, testing, and how things fail.

AI is my force multiplier. Automation earns its keep only when work repeats. Anything is doable, but not everything should ship.

Off-screen fuel comes from Appalachia. Mountains, distance, time to think. If something looks typical, I stop seeing it.`,
    themeSong: `## Theme Song

I’ve called I Build Things my theme song since the first time I heard it.

Part of that is Appalachian ingenuity. I was taught to fix what breaks, reuse what still works, and take things apart just to understand how they function. I’ve been dismantling systems and occasionally putting them back together since before I had the vocabulary to call them systems.

Another part is simpler. The song is just fun. It’s catchy, energetic, and it makes me want to build things. I don’t treat a theme song as a metaphor exercise alone. I picked this one because it’s motivating, memorable, and genuinely enjoyable.

The rest is how I build software.

I design systems by actively hunting failure points. If something can break, I assume it will and I try to find it before production does. There’s nothing I dislike more than shipping a “done” deployment and immediately needing a hotfix. If I deployed it, the failure should already have been found, understood, and addressed.

This song captures that balance. The joy of building something yourself, combined with the belief that breaking things early, loudly, and intentionally is how you end up with systems that actually ship clean and stay that way.`,
    image: {
        src: "/ashley-gen-2.jpg",
        alt: "Ashley Childress",
        width: 600,
        height: 400
    }
};
