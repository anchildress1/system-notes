'use client';

import { useEffect } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { InstantSearch, Chat } from 'react-instantsearch';
import styles from './AIChat.module.css';

import { IoSparkles, IoClose } from 'react-icons/io5';
import { FaBrain } from 'react-icons/fa';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
);

const AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID || '';

// Custom components to enrich the chat experience
const HeaderIcon = () => <IoSparkles className={styles.headerIcon} />;
const AssistantAvatar = () => (
  <div className={styles.avatar}>
    <FaBrain />
  </div>
);
const PromptFooter = () => <div className={styles.disclaimer}>Powered by Algolia</div>;
const ToggleIcon = ({ isOpen }: { isOpen: boolean }) =>
  isOpen ? (
    <IoClose size={28} style={{ color: 'white' }} />
  ) : (
    <FaBrain size={28} style={{ color: 'white' }} />
  );

export default function AIChat() {
  useEffect(() => {
    // Accessibility fix: Inject aria-label into Algolia's Chat toggle button
    const observer = new MutationObserver(() => {
      const toggleBtn = document.querySelector('.ais-Chat-toggleButton');
      if (toggleBtn) {
        if (!toggleBtn.getAttribute('aria-label')) {
          toggleBtn.setAttribute('aria-label', 'Open AI Chat');
        }
        if (!toggleBtn.getAttribute('data-testid')) {
          toggleBtn.setAttribute('data-testid', 'ai-chat-toggle');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <InstantSearch searchClient={searchClient}>
      <Chat
        agentId={AGENT_ID}
        translations={{
          header: {
            title: 'Ruckus 2.0',
          },
        }}
        headerTitleIconComponent={HeaderIcon}
        assistantMessageLeadingComponent={AssistantAvatar}
        promptFooterComponent={PromptFooter}
        toggleButtonIconComponent={ToggleIcon}
      />
    </InstantSearch>
  );
}
