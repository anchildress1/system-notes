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
    Multiple["Multiple indices (Projects, About)<br/>pros: per-type tuning<br/>cons: more config"]:::chosen

    %% Phase 2: Content Granularity
    Q2{"Monolithic vs Granular?"}:::question
    Granular["Granular Records<br/>pros: precise retrieval<br/>cons: lost context"]:::chosen

    %% Phase 3: The Context Problem
    Q3{"How to maintain context?"}:::problem
    OldWay["Load Full Bio<br/>(High token cost)"]:::cons
    NewWay["Graph Linking<br/>(Link via tags/slugs)"]:::solution

    %% Final decision
    Decision["CURRENT ARCHITECTURE<br/>Granular Facts<br/>1. Atomic 'about' records<br/>2. Narrative 'project' records"]:::final

    %% Rationale
    Why1["WHY: Monoliths waste context window<br/>and confuse retrieval ranking"]:::rationale
    Why2["WHY: Atomic facts allow the agent<br/>to compose precise answers"]:::rationale

    %% Flow
    Start --> Q1
    Q1 --> Multiple
    Multiple --> Q2
    Q2 --> Granular
    Granular --> Q3
    Q3 -->|Old: Expensive| OldWay
    Q3 -->|New: Efficient| NewWay
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
