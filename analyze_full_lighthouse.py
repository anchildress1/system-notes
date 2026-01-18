import json
import sys

def analyze(filepath):
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading file: {e}")
        return

    categories = data.get('categories', {})
    audits = data.get('audits', {})

    for cat_id, cat_val in categories.items():
        print(f"\nCategory: {cat_val.get('title')} (Score: {cat_val.get('score')})")
        
        for audit_ref in cat_val.get('auditRefs', []):
            audit_id = audit_ref.get('id')
            audit = audits.get(audit_id)
            if not audit:
                continue
            
            score = audit.get('score')
            # Score 1 is pass. Score null usually means 'informational' or 'not applicable' but can be error.
            # We are looking for things that aren't perfect.
            if score is not None and score < 1:
                print(f"  [FAIL] {audit.get('title')} (Score: {score})")
                print(f"    Description: {audit.get('description')}")
                if audit.get('displayValue'):
                    print(f"    Value: {audit.get('displayValue')}")
                
                details = audit.get('details', {})
                if details and details.get('type') == 'table':
                    items = details.get('items', [])
                    if items:
                        print(f"    Failing Items ({len(items)}):")
                        for item in items[:5]: # Show first 5
                             print(f"      - {item}") 

if __name__ == "__main__":
    analyze("lighthouse.json.tmp")
