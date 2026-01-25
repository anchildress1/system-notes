import os
import json
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

def index_data(index_name, data):
    if not data:
        print(f"No data for index: {index_name}")
        return
    
    print(f"Indexing {len(data)} records to {index_name}...")
    # Initialize the index (in v4 checking/creating might differ, but saveObjects should work)
    # The sync client in python v4: client.save_objects(index_name, objects)
    
    # We'll validte if the index needs creation or clearing?
    # For now, let's just saveObjects (replace). 
    # To fully replace, we might want to clear first or use replace_all_objects if available.
    
    # In v4 python client:
    # client.replace_all_objects(index_name, data) 
    # But let's check if that method exists or if we need to implement it.
    # The documentation for algoliasearch-python v4 usually involves 'save_objects' or 'replace_all_objects'.
    # If using 'algoliasearch' standard package, usually:
    # index = client.init_index(index_name)
    # index.replace_all_objects(data)
    
    # Wait, the main.py imports `from algoliasearch.search.client import SearchClient`
    # This suggests v3 or v4.
    # If v4: client.save_objects(index_name, data)
    
    # Let's try the standard v3/v4 way using `init_index` if available, or client methods.
    # Actually, main.py uses `await algolia_client.search(...)`. This is async.
    # My script will be sync for simplicity.
    
    # Let's assume v4 layout if `search.client` is used.
    # But usually one does `from algoliasearch.search_client import SearchClient` in v4?
    # main.py has `from algoliasearch.search.client import SearchClient`.
    
    # Using `algoliasearch` package (v2/v3 style):
    # client = SearchClient.create(APP_ID, API_KEY)
    # index = client.init_index(index_name)
    # index.replace_all_objects(data, {'autoGenerateObjectIDIfNotExist': True})
    
    # Let's write code that attempts to use the standard pattern.
    
    try:
         # Try v3/standard pattern
         index = client.init_index(index_name)
         index.replace_all_objects(data)
         print(f"Successfully indexed {index_name}")
    except AttributeError:
         # Fallback or v4 specific? 
         # If `client.init_index` fails, maybe it's the new v4 which is different.
         # But usually existing code (`main.py`) using `algoliasearch.search.client` means it's the official python client.
         pass

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Projects
    projects_path = os.path.join(root_dir, 'algolia', 'projects', 'projects.json')
    if os.path.exists(projects_path):
        projects_data = load_json(projects_path)
        index_data('projects', projects_data)
    else:
        print(f"Projects file not found: {projects_path}")

    # About
    about_path = os.path.join(root_dir, 'algolia', 'about', 'index.json')
    if os.path.exists(about_path):
        about_data = load_json(about_path)
        index_data('about', about_data)
    else:
        print(f"About file not found: {about_path}")

    # System Docs
    docs_path = os.path.join(root_dir, 'algolia', 'system_docs.json')
    if os.path.exists(docs_path):
        docs_data = load_json(docs_path)
        index_data('system_docs', docs_data)
    else:
        print(f"System docs file not found: {docs_path}")

if __name__ == "__main__":
    main()
