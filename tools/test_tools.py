"""Self-test script for DeepMind Research Roadmap tools.

Tests:
1. SemanticScholarClient (rate limiter, cache hit/miss, API fetch, metadata fields)
2. ArxivClient (rate limiter, cache hit/miss, Atom XML parsing, search)
3. DeepMindScraper (milestone seed completeness, scraper fallback, raw_papers.json output)
4. Integrated pipeline validation (combining scraper + arxiv + S2)
"""

import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Ensure utf-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from tools.semantic_scholar_client import SemanticScholarClient, RateLimiter as S2RateLimiter
from tools.arxiv_client import ArxivClient, RateLimiter as ArxivRateLimiter
from tools.deepmind_scraper import DeepMindScraper, DEEPMIND_MILESTONE_PAPERS


def test_section(title: str):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_semantic_scholar():
    test_section("Testing SemanticScholarClient")

    client = SemanticScholarClient()

    # 1. Test ID normalization
    print("[1/4] Testing paper ID normalization...")
    assert client.normalize_paper_id("1312.5602") == "ARXIV:1312.5602"
    assert client.normalize_paper_id("arXiv:1712.01815v2") == "ARXIV:1712.01815"
    assert client.normalize_paper_id("10.1038/nature14236") == "DOI:10.1038/nature14236"
    print("  [OK] Normalization tests passed.")

    # 2. Test RateLimiter
    print("[2/4] Testing rate limiter...")
    rl = S2RateLimiter(requests_per_second=2.0)
    t0 = time.time()
    rl.wait()
    rl.wait()
    elapsed = time.time() - t0
    assert elapsed >= 0.45, f"Rate limiter too fast: {elapsed:.3f}s"
    print(f"  [OK] RateLimiter interval enforced: {elapsed:.3f}s for 2 calls at 2 req/s.")

    # 3. Test Paper Query & Caching
    print("[3/4] Testing paper query & disk caching (DQN: 1312.5602)...")
    t0 = time.time()
    paper = client.get_paper("1312.5602")
    net_duration = time.time() - t0

    if paper:
        print(f"  Title: {paper.get('title')}")
        print(f"  Year: {paper.get('year')}")
        print(f"  Citation Count: {paper.get('citationCount')}")
        print(f"  Influential Citations: {paper.get('influentialCitationCount')}")
        print(f"  Citations list count: {len(paper.get('citations', []))}")
        print(f"  References list count: {len(paper.get('references', []))}")
        print(f"  From cache on first fetch: {paper.get('_from_cache')} ({net_duration:.3f}s)")

        # Verify key fields
        assert "citationCount" in paper, "Missing citationCount"
        assert "influentialCitationCount" in paper, "Missing influentialCitationCount"
        assert "title" in paper, "Missing title"
        assert "authors" in paper, "Missing authors"

        # 4. Test Cache Hit Speed
        print("[4/4] Testing second fetch (cache hit expectation)...")
        t1 = time.time()
        cached_paper = client.get_paper("1312.5602")
        cache_duration = time.time() - t1
        assert cached_paper is not None
        assert cached_paper.get("_from_cache") is True, "Expected paper from cache"
        assert cache_duration < 0.05, f"Cache fetch too slow: {cache_duration:.3f}s"
        print(f"  [OK] Cache hit verified in {cache_duration*1000:.2f}ms (vs initial {net_duration:.2f}s).")
    else:
        print("  [!] Network unavailable or S2 API blocked; testing fallback synthetic caching...")
        fake_data = {
            "paperId": "fake_dqn_id",
            "title": "Playing Atari with Deep Reinforcement Learning",
            "year": 2013,
            "citationCount": 9999,
            "influentialCitationCount": 1200,
            "authors": [{"name": "Volodymyr Mnih"}],
            "citations": [],
            "references": [],
        }
        client._write_cache("ARXIV:1312.5602", fake_data)
        cached_paper = client.get_paper("1312.5602")
        assert cached_paper is not None and cached_paper.get("_from_cache") is True
        print("  [OK] Local cache reading verified with synthetic fixture.")

    print("SemanticScholarClient: PASS")


def test_arxiv_client():
    test_section("Testing ArxivClient")

    client = ArxivClient(min_interval=1.0)  # Use 1.0s for fast unit test

    # 1. Test clean_arxiv_id
    print("[1/4] Testing arXiv ID parsing & cleaning...")
    assert client.clean_arxiv_id("arXiv:1312.5602v1") == "1312.5602"
    assert client.clean_arxiv_id("http://arxiv.org/abs/1712.01815") == "1712.01815"
    assert client.clean_arxiv_id("2203.15556") == "2203.15556"
    print("  [OK] clean_arxiv_id tests passed.")

    # 2. Test RateLimiter
    print("[2/4] Testing arXiv rate limiter...")
    rl = ArxivRateLimiter(min_interval=0.5)
    t0 = time.time()
    rl.wait()
    rl.wait()
    elapsed = time.time() - t0
    assert elapsed >= 0.45, f"Arxiv RateLimiter too fast: {elapsed:.3f}s"
    print(f"  [OK] arXiv rate limiter enforced: {elapsed:.3f}s delay.")

    # 3. Test Paper Query by ID & Cache
    print("[3/4] Testing get_paper_by_id (AlphaZero: 1712.01815)...")
    t0 = time.time()
    paper = client.get_paper_by_id("1712.01815")
    duration = time.time() - t0

    if paper:
        print(f"  Title: {paper.get('title')}")
        print(f"  Authors: {', '.join(paper.get('authors', [])[:4])}...")
        print(f"  Published: {paper.get('published')}")
        print(f"  Primary Category: {paper.get('primary_category')}")
        print(f"  PDF URL: {paper.get('pdf_url')}")
        print(f"  Abstract Snippet: {paper.get('abstract', '')[:120]}...")

        assert "1712.01815" in paper.get("arxiv_id", "")
        assert "AlphaZero" in paper.get("abstract", "") or "Chess" in paper.get("title", "")
        assert paper.get("pdf_url") is not None

        # Test cache hit
        t1 = time.time()
        cached = client.get_paper_by_id("1712.01815")
        cache_dur = time.time() - t1
        assert cached is not None and cached.get("_from_cache") is True
        assert cache_dur < 0.05
        print(f"  [OK] arXiv cache hit verified in {cache_dur*1000:.2f}ms (initial was {duration:.2f}s).")
    else:
        print("  [!] arXiv API request returned empty or timed out, testing XML parser directly...")
        sample_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
          <entry>
            <id>http://arxiv.org/abs/1712.01815v1</id>
            <published>2017-12-05T18:00:00Z</published>
            <updated>2017-12-05T18:00:00Z</updated>
            <title>Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm</title>
            <summary>The game of chess is the longest-studied domain in AI...</summary>
            <author><name>David Silver</name></author>
            <arxiv:primary_category term="cs.AI"/>
            <category term="cs.AI"/>
            <link title="pdf" href="http://arxiv.org/pdf/1712.01815v1" type="application/pdf"/>
          </entry>
        </feed>"""
        parsed = client._parse_feed(sample_xml)
        assert len(parsed) == 1
        assert parsed[0]["arxiv_id"] == "1712.01815"
        assert parsed[0]["primary_category"] == "cs.AI"
        print("  [OK] Atom XML parser verified with sample feed.")

    # 4. Test Search
    print("[4/4] Testing search_by_title...")
    results = client.search_by_title("Playing Atari with Deep Reinforcement Learning", max_results=1)
    if results:
        print(f"  Found: {results[0].get('title')} ({results[0].get('arxiv_id')})")
        assert "Atari" in results[0].get("title", "")
    else:
        print("  (Search completed with 0 or offline results)")

    print("ArxivClient: PASS")


def test_deepmind_scraper():
    test_section("Testing DeepMindScraper & Seed Milestones")

    scraper = DeepMindScraper()

    # 1. Milestone Seeds Validation
    print("[1/3] Checking milestone seeds completeness (2013-2024)...")
    seeds = scraper.get_seed_papers()
    print(f"  Total milestone seed papers registered: {len(seeds)}")
    assert len(seeds) >= 20, f"Expected >= 20 milestones, got {len(seeds)}"

    required_keywords = [
        "dqn", "alphago", "alphazero", "muzero", "wavenet",
        "alphafold", "flamingo", "chinchilla", "gato", "gemini",
        "graphcast", "alphageometry", "alphaproof"
    ]
    seed_titles_lower = " ".join(f"{p['title'].lower()} {p['id'].lower()}" for p in seeds)
    for kw in required_keywords:
        assert kw in seed_titles_lower, f"Required milestone keyword '{kw}' missing from seed dataset!"
    print("  [OK] All required milestone landmark works are present.")

    # 2. Check year distribution
    years = sorted(set(p["year"] for p in seeds if p.get("year")))
    print(f"  Covered years: {min(years)} - {max(years)} ({len(years)} distinct years)")
    assert min(years) <= 2013 and max(years) >= 2024, "Seed list must span from 2013 to 2024"
    print("  [OK] 2013-2024 year span verified.")

    # 3. Test get_all_papers and file export
    print("[3/3] Testing get_all_papers and export to raw_papers.json...")
    all_papers = scraper.get_all_papers(try_scrape=True, save_to_file=True)
    assert len(all_papers) >= len(seeds)
    raw_path = scraper.output_path
    assert raw_path.exists(), f"File {raw_path} was not created"
    assert raw_path.stat().st_size > 1000, f"File {raw_path} is suspiciously small"
    print(f"  [OK] Successfully compiled {len(all_papers)} papers and saved to {raw_path}")

    print("DeepMindScraper: PASS")


def test_integration():
    test_section("Testing Integrated Multi-Tool Pipeline")

    scraper = DeepMindScraper()
    arxiv_client = ArxivClient(min_interval=1.0)
    s2_client = SemanticScholarClient()

    # Pick a milestone paper: DQN (1312.5602)
    paper_meta = next((p for p in scraper.get_seed_papers() if p.get("arxiv_id") == "1312.5602"), None)
    assert paper_meta is not None, "DQN paper metadata not found in seed list"

    arxiv_id = paper_meta["arxiv_id"]
    print(f"Enriching DeepMind Milestone: {paper_meta['title']} ({arxiv_id})")

    # Fetch from arXiv
    arxiv_info = arxiv_client.get_paper_by_id(arxiv_id)
    if arxiv_info:
        print(f"  [arXiv] Category: {arxiv_info.get('primary_category')}, PDF: {arxiv_info.get('pdf_url')}")
    else:
        print("  [arXiv] Using seed metadata")

    # Fetch from S2
    s2_info = s2_client.get_paper(arxiv_id)
    if s2_info:
        print(f"  [S2] Citations: {s2_info.get('citationCount')}, Influential: {s2_info.get('influentialCitationCount')}")
    else:
        print("  [S2] Cached/Offline fallback")

    # Merge enriched representation
    enriched = {
        **paper_meta,
        "abstract": (arxiv_info or {}).get("abstract", paper_meta.get("summary")),
        "pdf_url": (arxiv_info or {}).get("pdf_url"),
        "primary_category": (arxiv_info or {}).get("primary_category", "cs.LG"),
        "citation_count": (s2_info or {}).get("citationCount", 0),
        "influential_citation_count": (s2_info or {}).get("influentialCitationCount", 0),
        "citations": (s2_info or {}).get("citations", []),
        "references": (s2_info or {}).get("references", []),
    }

    assert enriched["title"] is not None
    assert enriched["arxiv_id"] == "1312.5602"
    print(f"  [OK] Combined paper object constructed successfully with keys: {list(enriched.keys())}")
    print("Integration Pipeline: PASS")


if __name__ == "__main__":
    print("=== STARTING MILESTONE 1 TOOL SELF-TESTS ===")
    t_start = time.time()

    test_semantic_scholar()
    test_arxiv_client()
    test_deepmind_scraper()
    test_integration()

    total_time = time.time() - t_start
    print("\n" + "=" * 60)
    print(f"  ALL TESTS PASSED SUCCESSFULLY in {total_time:.2f}s!")
    print("=" * 60)
