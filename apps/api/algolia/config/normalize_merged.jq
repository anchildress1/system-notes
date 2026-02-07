def ensure_array($value):
  if $value == null then []
  elif ($value | type) == "array" then $value
  else [$value]
  end;

def normalize_common:
  . as $in
  | {
      objectID: ($in.objectID // error("Missing objectID")),
      title: ($in.title // ""),
      blurb: ($in.blurb // ""),
      fact: ($in.fact // ""),
      "tags.lvl0": (ensure_array($in["tags.lvl0"])),
      "tags.lvl1": (ensure_array($in["tags.lvl1"])),
      projects: (ensure_array($in.projects)),
      category: ($in.category // ""),
      signal: ($in.signal // 0)
    }
  | . as $record
  | ($record["tags.lvl0"]) as $lvl0
  | ($record["tags.lvl1"]) as $lvl1
  | if ($lvl0 | length) == 1
    then .["tags.lvl1"] = ($lvl1 | map(
      if (type == "string" and (contains(" > ") | not))
      then ($lvl0[0] + " > " + (sub("^#"; "")))
      else .
      end
    ))
    else .
    end;

def normalize_with_url: . as $in | normalize_common | . + {url: ($in.url // "")};

{requests: [.[] | {action: "updateObject", body: (normalize_with_url)}]}
