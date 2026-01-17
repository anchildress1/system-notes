'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AIChat.module.css';

export default function AIChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.chatWrapper}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.chatWindow}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <div className={styles.header}>
                            <div>
                                <span className={styles.statusDot}></span>
                                System A.I.
                            </div>
                        </div>
                        <div className={styles.messages}>
                            <div className={styles.message + ' ' + styles.botMessage}>
                                I&apos;m here. I&apos;m listening. I&apos;m not judging (much).
                            </div>
                            <div className={styles.message + ' ' + styles.botMessage}>
                                Ask me about the architecture, or why Ashley chose this font.
                            </div>
                        </div>
                        <div className={styles.inputArea}>
                            <input type="text" placeholder="Type a message..." className={styles.input} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button className={styles.toggleButton} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : '?'}
            </button>
        </div>
    );
}
