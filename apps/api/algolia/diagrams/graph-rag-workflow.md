# Graph RAG Architecture: The Spiderweb Workflow

## The Concept: "Index Grows, Prompt Shrinks"

The skepticism about "Agents" usually stems from their non-determinism: _Will it decide to search again? Will it find the right link?_
We replaced the **Agent (Loop)** with a **Workflow (Pipeline)**.

Instead of asking the LLM to "find connections" at query time (slow, fragile), we **bake the connections into the index** at build time (fast, deterministic).

## 1. The Builder (Index Time)

This is where the magic happens. We denormalize the graph.
Each record effectively "swallows" the summaries of its neighbors.

```mermaid
graph TD
    subgraph Raw Data
        P1[Project: System Notes] -->|related_id| P2[Project: Underfoot]
        A1[Concept: Automation] -->|related_id| P3[Project: RAI Lint]
    end

    subgraph "Builder Script (index_algolia.py)"
        Map[Build & Resolve Map]
        Enrich[Enrich with 'graph_context']
    end

    subgraph Algolia Index
        Record1[Record: System Notes<br/>+ summary of Underfoot]
        Record2[Record: Automation<br/>+ summary of RAI Lint]
    end

    P1 & P2 & A1 & P3 --> Map
    Map --> Enrich
    Enrich --> Record1 & Record2
```

## 2. The Workflow (Query Time)

Because the context is pre-baked, the runtime is **O(1)** (One Search).

```mermaid
sequenceDiagram
    participant User
    participant Ruckus as Ruckus (LLM)
    participant Algolia

    User->>Ruckus: "Tell me about automation."

    %% OLD WAY (Agent Loop)
    %% Ruckus->>Algolia: Search "Automation"
    %% Algolia-->>Ruckus: Returns "Concept: Automation"
    %% Ruckus->>Ruckus: "I need examples..."
    %% Ruckus->>Algolia: Search "projects using automation"
    %% Algolia-->>Ruckus: Returns "RAI Lint"

    %% NEW WAY (Graph Workflow)
    Ruckus->>Algolia: Search "Automation"
    Algolia-->>Ruckus: Returns Record: "Automation" + graph_context: "RAI Lint Summary"

    Ruckus->>User: "Ashley values automation to ensure consistency. PROOF: She built RAI Lint to enforce this..."
```

## Why This Works (Addressing Skepticism)

### 1. Latency & Reliability

- **Old:** 2+ API calls. If the first fails or the LLM "forgets" to search again, the answer is incomplete.
- **New:** 1 API call. The context is **attached** to the result. It is impossible to get the "Concept" without also getting the "Proof".

### 2. Determinism

- **Old:** relying on the AI to _infer_ that "Underfoot" is related to "System Notes".
- **New:** You explicitly defined `related_project_ids`. The connection is **hardcoded**. The AI just summarizes what you told it.

### 3. Context Window Efficiency

- We don't dump the _entire_ database into the context.
- We only dump the **Local Neighborhood** (The Spiderweb) of the specific node the user asked about.
