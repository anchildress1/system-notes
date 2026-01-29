# Algolia Index Design Rationale

This diagram explains the design evolution: from strict normalization to a **Hybrid Graph Architecture**.
We maintain a clean schema but "bake" (denormalize) the graph context to enable single-shot retrieval.

```mermaid
graph TD
    accTitle: Algolia Index Design Rationale
    accDescr: Decision tree showing the evolution from normalized schema to hybrid graph denormalization

    Start["Index Design Strategy"]:::start

    %% Phase 1: Structure
    Q1{"One index or multiple?"}:::question
    Multiple["Multiple indices (Projects, About)<br/>pros: per-type tuning<br/>cons: more config"]:::chosen

    %% Phase 2: Content
    Q2{"Flatten nested 'data'?"}:::question
    Normalize["Keep 'data' opaque<br/>pros: clean search surface<br/>cons: retrieve-only specifics"]:::chosen

    %% Phase 3: The Graph Problem
    Q3{"How to handle relationships?"}:::problem
    OldWay["Agent Search Loop<br/>(Query -> Result -> Query again)"]:::cons
    NewWay["Graph Denormalization<br/>(Bake neighbors into 'graph_context')"]:::solution

    %% Final decision
    Decision["CURRENT ARCHITECTURE<br/>Hybrid Schema<br/>1. Normalized 'data' (clean)<br/>2. Denormalized 'graph_context' (smart)"]:::final

    %% Rationale
    Why1["WHY: Strict normalization prevented hallucination<br/>but broke 'discovery' queries"]:::rationale
    Why2["WHY: 'Graph Context' provides O(1) retrieval<br/>of the local semantic neighborhood"]:::rationale

    %% Flow
    Start --> Q1
    Q1 --> Multiple
    Multiple --> Q2
    Q2 --> Normalize
    Normalize --> Q3
    Q3 -->|Old: Slow/Fragile| OldWay
    Q3 -->|New: Fast/Robust| NewWay
    NewWay --> Decision
    Decision --> Why1
    Decision --> Why2

    %% Styles
    classDef start fill:#6b7280,stroke:#4b5563,stroke-width:3px,color:#f9fafb
    classDef question fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fef2f2
    classDef chosen fill:#059669,stroke:#047857,stroke-width:3px,color:#f0fdf4
    classDef problem fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#fff7ed
    classDef solution fill:#7c3aed,stroke:#6d28d9,stroke-width:3px,color:#faf5ff
    classDef cons fill:#9ca3af,stroke:#4b5563,stroke-width:1px,color:#1f2937
    classDef final fill:#10b981,stroke:#059669,stroke-width:3px,color:#064e3b
    classDef rationale fill:#0891b2,stroke:#0e7490,stroke-width:2px,color:#ecfeff
```
