import os
import json
import asyncio
from algoliasearch.search.client import SearchClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ALGOLIA_APP_ID = os.getenv("ALGOLIA_APPLICATION_ID") or os.getenv("NEXT_PUBLIC_ALGOLIA_APPLICATION_ID")
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

def transform_record(record):
    """
    Transform source record to match frontend schema.
    Maps: category -> domain, signal -> signal_level, projects -> entities
    """
    transformed = record.copy()
    
    # Rename fields
    if 'category' in transformed:
        transformed['domain'] = transformed.pop('category')
    if 'signal' in transformed:
        transformed['signal_level'] = transformed.pop('signal')
    if 'projects' in transformed:
        transformed['entities'] = transformed.pop('projects')
    
    return transformed

async def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_dir = os.path.join(root_dir, 'algolia', 'sources')
    config_dir = os.path.join(root_dir, 'algolia', 'config')
    
    # New single index setup
    index_path = os.path.join(source_dir, 'index.json')
    settings_path = os.path.join(config_dir, 'settings.json')
    
    # The new primary index name
    index_name = 'system-notes'
    
    if os.path.exists(index_path):
        raw_data = load_json(index_path)
        # Transform records to match frontend schema
        data = [transform_record(record) for record in raw_data]
        settings = load_json(settings_path) if os.path.exists(settings_path) else None
        
        await index_data(index_name, data, settings)
        
        # Check for synonyms
        synonyms_path = os.path.join(config_dir, 'synonyms.json')
        if os.path.exists(synonyms_path):
            print(f"Updating synonyms for {index_name}...")
            synonyms = load_json(synonyms_path)
            try:
                await client.save_synonyms(index_name, synonyms, replace_existing_synonyms=True)
                print(f"Synonyms updated for {index_name}")
            except Exception as e:
                print(f"Error updating synonyms: {e}")
    else:
        print(f"Index file not found: {index_path}")

    print("\nIndexing complete!")
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
