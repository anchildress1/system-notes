import os
import json
import asyncio
from algoliasearch.search.client import SearchClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ALGOLIA_APP_ID = os.getenv("ALGOLIA_APPLICATION_ID")
ALGOLIA_API_KEY = os.getenv("ALGOLIA_ADMIN_API_KEY")

if not ALGOLIA_APP_ID or not ALGOLIA_API_KEY:
    print("Error: ALGOLIA_APPLICATION_ID or ALGOLIA_ADMIN_API_KEY not found in environment.")
    exit(1)

client = SearchClient(ALGOLIA_APP_ID, ALGOLIA_API_KEY)

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

async def index_data(index_name, data, settings=None):
    """
    Index data to Algolia and optionally apply settings.
    
    Args:
        index_name: Name of the Algolia index
        data: List of records to index
        settings: Optional dict of index settings
    """
    if not data:
        print(f"No data for index: {index_name}")
        return
    
    print(f"Indexing {len(data)} records to {index_name}...")
    
    try:
        # Apply settings if provided
        if settings:
            print(f"Applying settings to {index_name}...")
            response = await client.set_settings(index_name, settings)
            await client.wait_for_task(index_name, response.task_id)
            print(f"Settings applied to {index_name}")
        
        # Replace all objects in the index
        # replace_all_objects is a helper that handles batching and waiting internally
        await client.replace_all_objects(index_name, data)
        print(f"Successfully indexed {len(data)} records to {index_name}")
        
    except Exception as e:
        print(f"Error indexing {index_name}: {e}")
        raise

async def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Projects index
    projects_path = os.path.join(root_dir, 'algolia', 'projects', 'projects.json')
    projects_settings_path = os.path.join(root_dir, 'algolia', 'projects', 'settings.json')
    
    if os.path.exists(projects_path):
        projects_data = load_json(projects_path)
        projects_settings = load_json(projects_settings_path) if os.path.exists(projects_settings_path) else None
        await index_data('projects', projects_data, projects_settings)
    else:
        print(f"Projects file not found: {projects_path}")

    # About index
    about_path = os.path.join(root_dir, 'algolia', 'about', 'index.json')
    about_settings_path = os.path.join(root_dir, 'algolia', 'about', 'settings.json')
    
    if os.path.exists(about_path):
        about_data = load_json(about_path)
        about_settings = load_json(about_settings_path) if os.path.exists(about_settings_path) else None
        await index_data('about', about_data, about_settings)
    else:
        print(f"About file not found: {about_path}")

    # System Docs index
    docs_path = os.path.join(root_dir, 'algolia', 'system_docs.json')
    docs_settings_path = os.path.join(root_dir, 'algolia', 'system_docs_settings.json')
    
    if os.path.exists(docs_path):
        docs_data = load_json(docs_path)
        docs_settings = load_json(docs_settings_path) if os.path.exists(docs_settings_path) else None
        await index_data('system_docs', docs_data, docs_settings)
    else:
        print(f"System docs file not found: {docs_path}")
    
    print("\nIndexing complete!")
    
    # Close the client
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
