# Algolia Index Design Rationale

This diagram explains the design evolution: from strict normalization to a **Granular Fact Architecture**.
We split monolithic biographies into atomic facts to enable precise RAG retrieval without loading irrelevant context.

```mermaid
graph TD
    accTitle: Algolia Index Design Rationale
    accDescr: Decision tree showing the evolution from monolithic schema to granular fact architecture

    Start["Index Design Strategy"]:::start

    %% Phase 1: Structure
    Q1{"One index or multiple?"}:::question
    Unified["Unified Index (system-notes)<br/>pros: unified retrieval, simple config<br/>cons: single ranking strategy"]:::chosen

    %% Phase 2: Content Granularity
    Q2{"Monolithic vs Granular?"}:::question
    Granular["Granular Records<br/>pros: precise retrieval<br/>cons: requires signal balancing"]:::chosen

    %% Phase 3: The Context Problem
    Q3{"How to maintain context?"}:::problem
    OldWay["Siloed Indices<br/>(Hard to cross-reference)"]:::cons
    NewWay["Graph Linking in One Index<br/>(Shared facets & tags)"]:::solution

    %% Final decision
<<<<<<< HEAD
    Decision["CURRENT ARCHITECTURE<br/>Unified System Notes<br/>1. Facts & Narratives in one graph<br/>2. Differentiated by category"]:::final
=======
    Decision["CURRENT ARCHITECTURE<br/>Unified System Notes<br/>1. Facts & Narratives in one graph<br/>2. Differentiated by facet_domain"]:::final
>>>>>>> main

    %% Rationale
    Why1["WHY: Silos fragment the agent's<br/>understanding of the system"]:::rationale
    Why2["WHY: Unified index allows<br/>holistic retrieval"]:::rationale

    %% Flow
    Start --> Q1
    Q1 --> Unified
    Unified --> Q2
    Q2 --> Granular
    Granular --> Q3
    Q3 -->|Old: Fragmented| OldWay
    Q3 -->|New: Holistic| NewWay
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
