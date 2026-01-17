'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './SocialBanner.module.css';

export default function SocialBanner() {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className={styles.bannerWrapper}>
            <motion.img
                style={{ y, opacity }}
                src="https://raw.githubusercontent.com/ChecKMarKDevTools/rai-lint/main/docs/assets/rai-lint-banner.png"
                alt="RAI-Lint Banner"
                className={styles.bannerImage}
            />

            <div className={styles.overlay} />

            <motion.div
                className={styles.content}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1 className={styles.title}>RAI-Lint</h1>
                <div className={styles.subtitle}>{"// Because your AI needs a babysitter."}</div>

                <p className={styles.description}>
                    GitHub Copilot is like a brilliant, caffeinated intern. RAI-Lint is the leash.
                    Keep usage predictable, sane, and surprisingly bug-free.
                </p>

                <a href="https://github.com/CheckMarKDevTools/rai-lint" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                    View on GitHub <span>→</span>
                </a>
            </motion.div>
        </div>
    );
}
