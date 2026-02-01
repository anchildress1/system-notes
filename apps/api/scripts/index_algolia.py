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
    
    # Projects source data
    source_dir = os.path.join(root_dir, 'algolia', 'sources')
    projects_path = os.path.join(source_dir, 'projects.json')
    config_dir = os.path.join(root_dir, 'algolia', 'config')
    projects_settings_path = os.path.join(config_dir, 'projects_settings.json')
    
    
    # Process Projects
    if os.path.exists(projects_path):
        projects_data = load_json(projects_path)
        projects_settings = load_json(projects_settings_path) if os.path.exists(projects_settings_path) else None
        
        # Index data
        await index_data('projects', projects_data, projects_settings)
        
        if os.path.exists(projects_path):
            print("Updating synonyms for projects...")
            synonyms_path = os.path.join(config_dir, 'projects_synonyms.json')
            if os.path.exists(synonyms_path):
                synonyms = load_json(synonyms_path)
                try:
                    await client.save_synonyms('projects', synonyms, replace_existing_synonyms=True)
                    print("Synonyms updated for projects")
                except Exception as e:
                    print(f"Error updating synonyms: {e}")
    else:
        print(f"Projects file not found: {projects_path}")

    # About index
    about_path = os.path.join(source_dir, 'about.json')
    about_settings_path = os.path.join(config_dir, 'about_settings.json')
    if os.path.exists(about_path):
        about_data = load_json(about_path)
        about_settings = load_json(about_settings_path) if os.path.exists(about_settings_path) else None
        await index_data('about', about_data, about_settings)
        
        # Update synonyms for about
        print("Updating synonyms for about...")
        about_synonyms_path = os.path.join(config_dir, 'about_synonyms.json')
        if os.path.exists(about_synonyms_path):
            about_synonyms = load_json(about_synonyms_path)
            try:
                await client.save_synonyms('about', about_synonyms, replace_existing_synonyms=True)
                print("Synonyms updated for about")
            except Exception as e:
                print(f"Error updating about synonyms: {e}")
    else:
        print(f"About file not found: {about_path}")
    
    print("\nIndexing complete!")
    
    # Close the client
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
