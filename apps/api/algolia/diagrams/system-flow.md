# Algolia System Data Flow

<<<<<<< HEAD
End-to-end flow from the Unified JSON source through the Indexing Script to Algolia and the Agent.
=======
End-to-end flow from JSON source files through the **Graph Enrichment Script** to Algolia and the Agent.

> > > > > > > main

```mermaid
graph TB
    accTitle: Algolia System Data Flow
<<<<<<< HEAD
    accDescr: Data flow showing how the Python script indexes the unified JSON data
=======
    accDescr: Data flow showing how the Python script enriches JSON data with graph context before indexing
>>>>>>> main

    %% Data sources
    UnifiedJSON["sources/index.json<br/>(Unified Knowledge Graph)"]:::source

<<<<<<< HEAD
    %% Process
    Script["index_algolia.py<br/>(Validation & Indexing)"]:::process

=======
>>>>>>> main
    %% Algolia indices
    UnifiedIndex[("system-notes index<br/>(Unified)")]:::index

    %% Retrieval
    Ruckus["Ruckus Agent<br/>(RAG Retrieval)"]:::agent
<<<<<<< HEAD
    Web["Search UI<br/>(Fact Cards)"]:::agent
=======
>>>>>>> main

    %% Link generation
    Links["Deterministic Links"]:::output

    %% Flow
<<<<<<< HEAD
    UnifiedJSON --> Script
    Script --> UnifiedIndex
    UnifiedIndex -->|retrieve| Ruckus
    UnifiedIndex -->|search| Web
=======
    UnifiedJSON --> UnifiedIndex
    UnifiedIndex -->|retrieve| Ruckus
>>>>>>> main

    Ruckus --> Links
    Links --> User

    %% Styles
    classDef source fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:#f9fafb
    classDef process fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#faf5ff
    classDef index fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#f0f9ff
    classDef agent fill:#059669,stroke:#047857,stroke-width:2px,color:#f0fdf4
    classDef output fill:#0891b2,stroke:#0e7490,stroke-width:2px,color:#ecfeff
```
