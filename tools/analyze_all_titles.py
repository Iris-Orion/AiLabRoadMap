import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open("data/deepmind_all_publications.json", "r", encoding="utf-8") as f:
    pubs = json.load(f)

print(f"Total publications: {len(pubs)}")

# Print sample by year
years = {}
for p in pubs:
    y = p["year"]
    years[y] = years.get(y, 0) + 1
print("Publications by year:", sorted(years.items(), key=lambda x: x[0], reverse=True))

# Print all 2026 and 2025 titles
print("\n--- Prominent Milestones in Scraped Data ---")
keywords = ["gemini", "alpha", "gemma", "veo", "video", "autort", "robocat", "table tennis", "thought", "overthinking", "asi", "tokamak", "funsearch", "graphcast", "chinchilla", "gato", "flamingo", "world model", "superintelligence", "scheming", "turing"]
found = []
for p in pubs:
    t = p["title"].lower()
    for k in keywords:
        if k in t:
            found.append(p)
            break

print(f"Total prominent milestone candidates: {len(found)}")
for p in found:
    print(f"[{p['year']}] [{p['date']}] {p['title']}")
