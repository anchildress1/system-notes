'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './SocialBanner.module.css';

export default function SocialBanner() {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className={styles.bannerWrapper}>
            <motion.div style={{ y, opacity }} className={styles.gridBackground} />

            <motion.div
                className={styles.content}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
            >
                <div className={styles.floatingIcon}>🦄</div>
                <h1 className={styles.title}>System Notes</h1>
                <div className={styles.subtitle}>// The Meta-Portfolio</div>

                <p className={styles.description}>
                    A portfolio presented as a <span className={styles.highlight}>living system.</span><br />
                    Intentionally unfinished. Like my laundry, but public.
                    Replacing the static "Hire Me" site with a dynamic map of what I&apos;m actually breaking right now.
                </p>
            </motion.div>
        </div>
    );
}
