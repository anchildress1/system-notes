import os
import json
import glob

BASE_DIR = "apps/api/algolia"
OUTPUT_FILE = "apps/api/algolia/system_docs.json"

def get_line_numbers(file_path):
    """
    Returns a list of (start_line, end_line) for each object in the root array.
    """
    with open(file_path, "r") as f:
        lines = f.readlines()

    objects = []
    current_start = None
    brace_balance = 0
    in_array = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Detect start of array
        if not in_array:
            if "[" in stripped:
                in_array = True
            continue
        
        # Check for array end
        if stripped == "]" and brace_balance == 0:
            break

        # Count braces
        open_braces = line.count('{')
        close_braces = line.count('}')
        
        if open_braces > 0:
            if brace_balance == 0:
                current_start = i + 1 # 1-based
            brace_balance += open_braces
            
        if close_braces > 0:
            brace_balance -= close_braces
            if brace_balance == 0 and current_start is not None:
                current_end = i + 1
                objects.append({
                    "start_line": current_start,
                    "end_line": current_end
                })
                current_start = None
        
        # Safety check
        if brace_balance < 0:
            brace_balance = 0

    return objects

def process_file(file_path):
    # Load actual JSON content to get data
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        print(f"Error decoding {file_path}")
        return []
    
    if not isinstance(data, list):
        print(f"Skipping {file_path}: not a list")
        return []

    line_info = get_line_numbers(file_path)
    
    if len(data) != len(line_info):
        print(f"Warning: mismatch in {file_path}. Parsed lines: {len(line_info)}, JSON objects: {len(data)}")
        # If the file is complex (nested objects causing brace confusion), our heuristic might fail.
        # But for the standard format we saw, it should work.
        return []

    records = []
    rel_path = os.path.relpath(file_path, BASE_DIR)
    
    for obj, lines in zip(data, line_info):
        record = {
            "objectID": f"sysdoc_{obj.get('objectID', 'unknown')}",
            "node_type": "system_doc",
            "title": obj.get("title", "Untitled"),
            "doc_path": rel_path,
            "start_line": lines["start_line"],
            "end_line": lines["end_line"],
            "url": f"/system/doc/{rel_path}#L{lines['start_line']}-L{lines['end_line']}",
            "content": json.dumps(obj), 
            "tags": obj.get("tags", [])
        }
        records.append(record)
        
    return records

def main():
    all_records = []
    # Find all json files in about and projects subdirs
    search_path = os.path.join(BASE_DIR, "**/*.json")
    files = glob.glob(search_path, recursive=True)
    
    for f in files:
        if f == OUTPUT_FILE:
            continue
        if "package.json" in f:
            continue
            
        print(f"Checking {f}...")
        records = process_file(f)
        if records:
            print(f"  -> Found {len(records)} records in {f}")
            all_records.extend(records)
        else:
            print(f"  -> Skipped (not a record list)")
        
    with open(OUTPUT_FILE, "w") as f:
        json.dump(all_records, f, indent=2)
    
    print(f"Generated {len(all_records)} records in {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
