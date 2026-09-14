import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open("data/deepmind_publications_analysis.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total publications scraped: {data['meta']['total_publications']}")
print(f"Themes distribution: {json.dumps(data['meta']['themes_count'], indent=2, ensure_ascii=False)}")
print(f"Milestones distribution: {json.dumps(data['meta']['milestone_distribution'], indent=2, ensure_ascii=False)}")

for theme, papers in data["themes"].items():
    not_c = [p for p in papers if "Tier C" not in p["milestone"]["tier"]]
    print(f"\n==========================================")
    print(f"THEME: {theme} (Total: {len(papers)}, Milestones: {len(not_c)})")
    print(f"==========================================")
    for p in not_c:
        m = p["milestone"]
        print(f"[{m['tier']}] [{p['date']}] {p['title']}")
        print(f"   Score: {m['score']} | Reason: {m['reason']}")
        print(f"   URL: {p['url']}")
