'use client';

import { useEffect } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { InstantSearch, Chat } from 'react-instantsearch';
import styles from './AIChat.module.css';

import { IoSparkles, IoTerminal } from 'react-icons/io5';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
);

const AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID || '';

// Custom components to enrich the chat experience
const HeaderIcon = () => <IoSparkles style={{ color: 'hsl(var(--color-accent-teal))' }} />;
const AssistantAvatar = () => (
  <div className={styles.avatar}>
    <IoTerminal />
  </div>
);
const PromptFooter = () => (
  <div className={styles.disclaimer}>Ruckus 2.0 • Querying knowledge graph...</div>
);

export default function AIChat() {
  useEffect(() => {
    // Accessibility fix: Inject aria-label into Algolia's Chat toggle button
    const observer = new MutationObserver(() => {
      const toggleBtn = document.querySelector('.ais-Chat-toggleButton');
      if (toggleBtn && !toggleBtn.getAttribute('aria-label')) {
        toggleBtn.setAttribute('aria-label', 'Open AI Chat');
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
            title: 'Ruckus',
          },
        }}
        headerTitleIconComponent={HeaderIcon}
        assistantMessageLeadingComponent={AssistantAvatar}
        promptFooterComponent={PromptFooter}
      />
    </InstantSearch>
  );
}
