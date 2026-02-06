# Algolia Upload Workflow

The Single Source of Truth for indexing is the **Python Script** (`apps/api/scripts/index_algolia.py`).
We do not use manual dashboard uploads or MCP tools for production data to ensure graph consistency.

```mermaid
graph TD
    accTitle: Algolia Upload Workflow
    accDescr: The automated workflow using the Python indexing script

    Trigger["Deploy / Update Trigger"]:::trigger

    %% Script path
<<<<<<< HEAD
    Script["Indexing Script<br/>(index_algolia.py)"]:::method

    %% Steps
    Validation{"Env Vars Set?<br/>(API Keys)"}:::decision
    LoadData["Load sources/index.json"]:::step
    IndexSync["Atomic Replace<br/>(system-notes)"]:::step
=======
    Script["Deploy Script<br/>(algolia_upload.sh)"]:::method

    %% Steps
    Validation{"Env Vars Set?<br/>(API Keys)"}:::decision
    IndexSync["Index Data<br/>(system-notes)"]:::step
>>>>>>> main
    SynonymSync["Synonym Sync<br/>(system-notes)"]:::step

    %% Outcomes
    Success["Graph Index Live"]:::success
    Fail["Error Logged"]:::fail

    %% Flow
    Trigger --> Script
    Script --> Validation
<<<<<<< HEAD
    Validation -->|yes| LoadData
    Validation -->|no| Fail

    LoadData --> IndexSync
=======
    Validation -->|yes| IndexSync
    Validation -->|no| Fail

>>>>>>> main
    IndexSync --> SynonymSync
    SynonymSync --> Success

    %% Styles
    classDef trigger fill:#6b7280,stroke:#4b5563,stroke-width:3px,color:#f9fafb
    classDef method fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#f0f9ff
    classDef decision fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fef2f2
    classDef step fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#faf5ff
    classDef success fill:#059669,stroke:#047857,stroke-width:2px,color:#f0fdf4
    classDef fail fill:#b91c1c,stroke:#991b1b,stroke-width:2px,color:#fef2f2
```
