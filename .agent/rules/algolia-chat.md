---
trigger: model_decision
description: When working with the UI integration with Algolia chat only. DO NOT USE for the search page or display results outside of the agent chat interface implementation..
---

# Algolia Chat Widget Integration

This guide provides instructions for integrating, configuring, and customizing the Algolia Chat widget within this React workspace. It is based on the official Algolia documentation.

## 1. Quick Start

Ensure you accept the `agentId` prop in your component or retrieve it from your environment variables.

```tsx
import { InstantSearch, Chat } from 'react-instantsearch';

export default function YourSearchComponent() {
  return (
    <InstantSearch searchClient={searchClient} indexName="YOUR_INDEX_NAME">
      {/* Other widgets... */}
      <Chat agentId={process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID} />
    </InstantSearch>
  );
}
```

## 2. Configuration & Props

### Essential Props

- **`agentId`** (`string`, Required): The unique identifier for your AI agent, found in the Agent Studio dashboard.

### Localization & Text

- **`translations`** (`object`): Customize text strings.
  ```tsx
  <Chat
    translations={{
      initialMessages: 'Hello! How can I help you today?',
      placeholder: 'Type your question...',
      error: 'Something went wrong. Please try again.',
    }}
  />
  ```

### Custom Styling Classes

- **`classNames`** (`object`): Override default CSS classes for granular styling control.
  ```tsx
  <Chat
    classNames={{
      root: 'my-chat-root',
      window: 'my-chat-window',
      toggleButton: 'my-chat-toggle',
      input: 'my-chat-input',
    }}
  />
  ```

## 3. Advanced Customization (Component Swapping)

You can replace specific parts of the widget UI with your own React components.

| Prop Name                          | Description                                              |
| :--------------------------------- | :------------------------------------------------------- |
| `headerCloseIconComponent`         | Custom icon for closing the chat window.                 |
| `headerMaximizeIconComponent`      | Custom icon for maximizing the window.                   |
| `headerMinimizeIconComponent`      | Custom icon for minimizing the window.                   |
| `headerTitleIconComponent`         | Custom icon displayed next to the header title.          |
| `itemComponent`                    | Custom component for rendering individual chat messages. |
| `messagesErrorComponent`           | Component to display when an error occurs.               |
| `messagesLoaderComponent`          | Component to display while loading responses.            |
| `assistantMessageLeadingComponent` | Component for the assistant's avatar or leading icon.    |
| `assistantMessageFooterComponent`  | Component for the footer of assistant messages.          |
| `promptHeaderComponent`            | Content above the input area.                            |
| `promptFooterComponent`            | Content below the input area (e.g., disclaimers).        |
| `toggleButtonIconComponent`        | Custom icon for the toggle button (open/close state).    |

### Example: Custom Header Icon & Avatar

```tsx
const HeaderIcon = () => <span className="icon">✨</span>;
const Avatar = () => <img src="/avatar.png" alt="AI" />;

<Chat headerTitleIconComponent={HeaderIcon} assistantMessageLeadingComponent={Avatar} />;
```

## 4. Styling & CSS

The widget uses standard BEM-like classes prefixed with `.ais-Chat`.

**Key Selectors:**

- `.ais-Chat-window`: The main chat container.
- `.ais-Chat-header`: The top bar of the chat window.
- `.ais-Chat-messages`: The scrollable message area.
- `.ais-Chat-input`: The input field container.
- `.ais-Chat-toggleButton`: The floating button to open/close the chat.

**Z-Index Best Practices:**

- Ensure `.ais-Chat-window` has a higher `z-index` than overlapping UI elements (e.g., footers).
- Example:
  ```css
  /* Move chat window above footer */
  :global(.ais-Chat-window) {
    z-index: 10005 !important;
  }
  ```

## 5. Event Handling & "Glitter Bomb" Prevention

If your application has global click listeners (like a "Glitter Bomb" hero effect), you must stop event propagation from the chat widget to prevent unwanted triggers.

**Solution:**
Attach a `click` listener to the chat elements that calls `e.stopPropagation()`.

```tsx
useEffect(() => {
  const observer = new MutationObserver(() => {
    const toggleBtn = document.querySelector('.ais-Chat-toggleButton');
    if (toggleBtn && !toggleBtn.hasAttribute('data-has-click-handler')) {
      toggleBtn.addEventListener('click', (e) => e.stopPropagation());
      toggleBtn.setAttribute('data-has-click-handler', 'true');
    }

    const chatWindow = document.querySelector('.ais-Chat-window');
    if (chatWindow && !chatWindow.hasAttribute('data-has-click-handler')) {
      chatWindow.addEventListener('click', (e) => e.stopPropagation());
      chatWindow.setAttribute('data-has-click-handler', 'true');
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}, []);
```

## 6. Client-Side Tools

Define tools that the AI agent can invoke on the client side.

```tsx
const tools = {
  addToCart: {
    layoutComponent: ({ message, addToolResult }) => (
      <button onClick={() => addToolResult('success')}>Add to Cart</button>
    ),
    onToolCall: (params) => {
      // Perform logic...
    },
  },
};

<Chat tools={tools} />;
```
