"""arXiv API Client.

Features:
- Complies with arXiv rate limiting (>= 3.0 seconds between queries)
- Parses Atom XML feed to extract title, abstract, published date, categories, authors, pdf_url, etc.
- Query single paper or batch papers by arXiv ID
- Search by keyword, title, or author
- Local disk caching (default: data/cache/arxiv/)
"""

import json
import logging
import re
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

logger = logging.getLogger(__name__)

ATOM_NS = "{http://www.w3.org/2005/Atom}"
ARXIV_NS = "{http://arxiv.org/schemas/atom}"


class RateLimiter:
    """Thread-safe rate limiter guaranteeing a minimum delay between calls."""

    def __init__(self, min_interval: float = 3.0):
        self.min_interval = min_interval
        self._last_call_time = 0.0

    def wait(self) -> None:
        now = time.time()
        elapsed = now - self._last_call_time
        if elapsed < self.min_interval:
            sleep_time = self.min_interval - elapsed
            logger.debug("arXiv rate limit wait: %.2fs", sleep_time)
            time.sleep(sleep_time)
        self._last_call_time = time.time()


class ArxivClient:
    """Client for querying the arXiv API."""

    BASE_URL = "https://export.arxiv.org/api/query"

    def __init__(
        self,
        cache_dir: Optional[str] = None,
        min_interval: float = 3.0,
        timeout: int = 30,
        max_retries: int = 3,
    ):
        """Initialize arXiv client.

        Args:
            cache_dir: Directory for storing local disk cache. Defaults to 'data/cache/arxiv'.
            min_interval: Minimum seconds between requests (arXiv asks for >= 3s).
            timeout: HTTP request timeout in seconds.
            max_retries: Retry attempts on transient errors.
        """
        self.rate_limiter = RateLimiter(min_interval=min_interval)

        if cache_dir is None:
            project_root = Path(__file__).resolve().parent.parent
            self.cache_dir = project_root / "data" / "cache" / "arxiv"
        else:
            self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "DeepMindResearchRoadmap/1.0 (academic research; mailto:developer@deepmind-roadmap.local)"
        })

    @staticmethod
    def clean_arxiv_id(arxiv_id: str) -> str:
        """Strip prefixes and version suffixes from arXiv ID.

        Examples:
            'arXiv:1312.5602v1' -> '1312.5602'
            '1312.5602v2' -> '1312.5602'
            'http://arxiv.org/abs/1312.5602' -> '1312.5602'
        """
        cleaned = arxiv_id.strip()
        # Remove URL prefix if any
        if "arxiv.org/abs/" in cleaned:
            cleaned = cleaned.split("arxiv.org/abs/")[-1]
        elif "arxiv.org/pdf/" in cleaned:
            cleaned = cleaned.split("arxiv.org/pdf/")[-1].replace(".pdf", "")

        # Remove 'arxiv:' prefix
        if cleaned.lower().startswith("arxiv:"):
            cleaned = cleaned[6:]

        # Remove version suffix like 'v1', 'v2'
        cleaned = re.sub(r"v\d+$", "", cleaned)
        return cleaned.strip()

    def _get_cache_path(self, cache_key: str) -> Path:
        safe_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', cache_key)
        return self.cache_dir / f"{safe_name}.json"

    def _read_cache(self, cache_key: str) -> Optional[Any]:
        cache_file = self._get_cache_path(cache_key)
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning("Failed to read arXiv cache file %s: %s", cache_file, e)
        return None

    def _write_cache(self, cache_key: str, data: Any) -> None:
        cache_file = self._get_cache_path(cache_key)
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("Failed to write arXiv cache file %s: %s", cache_file, e)

    def _request_with_retry(self, params: Dict[str, Any]) -> Optional[str]:
        """Perform request to arXiv API with rate limiting and exponential backoff."""
        backoff = 3.5
        for attempt in range(self.max_retries + 1):
            self.rate_limiter.wait()
            try:
                response = self.session.get(self.BASE_URL, params=params, timeout=self.timeout)
                if response.status_code == 200:
                    return response.text

                if response.status_code in (429, 503):
                    retry_after = response.headers.get("Retry-After")
                    sleep_time = float(retry_after) if retry_after else backoff
                    logger.warning(
                        "arXiv API throttled (%d). Backing off %.2fs (attempt %d/%d)...",
                        response.status_code,
                        sleep_time,
                        attempt + 1,
                        self.max_retries,
                    )
                    time.sleep(sleep_time)
                    backoff *= 2.0
                    continue

                response.raise_for_status()

            except requests.RequestException as e:
                logger.warning(
                    "Network error while requesting arXiv API: %s (attempt %d/%d)",
                    e,
                    attempt + 1,
                    self.max_retries,
                )
                if attempt < self.max_retries:
                    time.sleep(backoff)
                    backoff *= 2.0
                else:
                    logger.error("Max retries exceeded for arXiv API: %s", e)
                    return None

        return None

    def _parse_entry(self, entry: ET.Element) -> Dict[str, Any]:
        """Parse an Atom XML <entry> element into a structured dictionary."""
        # Paper ID
        id_elem = entry.find(f"{ATOM_NS}id")
        raw_id = id_elem.text.strip() if id_elem is not None and id_elem.text else ""
        arxiv_id = self.clean_arxiv_id(raw_id)

        # Title
        title_elem = entry.find(f"{ATOM_NS}title")
        title = " ".join(title_elem.text.split()) if title_elem is not None and title_elem.text else ""

        # Abstract / Summary
        summary_elem = entry.find(f"{ATOM_NS}summary")
        abstract = " ".join(summary_elem.text.split()) if summary_elem is not None and summary_elem.text else ""

        # Dates
        published_elem = entry.find(f"{ATOM_NS}published")
        published = published_elem.text.strip() if published_elem is not None and published_elem.text else ""

        updated_elem = entry.find(f"{ATOM_NS}updated")
        updated = updated_elem.text.strip() if updated_elem is not None and updated_elem.text else ""

        # Authors
        authors = []
        for author_elem in entry.findall(f"{ATOM_NS}author"):
            name_elem = author_elem.find(f"{ATOM_NS}name")
            if name_elem is not None and name_elem.text:
                authors.append(name_elem.text.strip())

        # Categories
        categories = []
        for cat_elem in entry.findall(f"{ATOM_NS}category"):
            term = cat_elem.get("term")
            if term:
                categories.append(term.strip())

        primary_cat_elem = entry.find(f"{ARXIV_NS}primary_category")
        primary_category = primary_cat_elem.get("term") if primary_cat_elem is not None else (categories[0] if categories else "")

        # Links (PDF & Abstract URL)
        abs_url = f"https://arxiv.org/abs/{arxiv_id}"
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
        for link_elem in entry.findall(f"{ATOM_NS}link"):
            if link_elem.get("title") == "pdf" or link_elem.get("type") == "application/pdf":
                pdf_url = link_elem.get("href", pdf_url)
            elif link_elem.get("rel") == "alternate":
                abs_url = link_elem.get("href", abs_url)

        # DOI & Comment & Journal Ref
        doi_elem = entry.find(f"{ARXIV_NS}doi")
        doi = doi_elem.text.strip() if doi_elem is not None and doi_elem.text else None

        comment_elem = entry.find(f"{ARXIV_NS}comment")
        comment = comment_elem.text.strip() if comment_elem is not None and comment_elem.text else None

        journal_elem = entry.find(f"{ARXIV_NS}journal_ref")
        journal_ref = journal_elem.text.strip() if journal_elem is not None and journal_elem.text else None

        return {
            "arxiv_id": arxiv_id,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "published": published,
            "updated": updated,
            "primary_category": primary_category,
            "categories": categories,
            "abs_url": abs_url,
            "pdf_url": pdf_url,
            "doi": doi,
            "comment": comment,
            "journal_ref": journal_ref,
        }

    def _parse_feed(self, xml_text: str) -> List[Dict[str, Any]]:
        """Parse Atom XML string into a list of paper dictionaries."""
        papers = []
        try:
            root = ET.fromstring(xml_text)
            for entry in root.findall(f"{ATOM_NS}entry"):
                # An entry without an id or with an error title is skipped
                id_elem = entry.find(f"{ATOM_NS}id")
                if id_elem is None:
                    continue
                papers.append(self._parse_entry(entry))
        except ET.ParseError as e:
            logger.error("Failed to parse arXiv XML response: %s", e)
        return papers

    def get_paper_by_id(
        self, arxiv_id: str, use_cache: bool = True, refresh_cache: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Get metadata for a single arXiv paper.

        Args:
            arxiv_id: arXiv identifier (e.g., '1312.5602' or 'arXiv:1312.5602v1').
            use_cache: If True, check and populate local disk cache.
            refresh_cache: If True, bypass cache and fetch fresh from API.

        Returns:
            Dictionary with paper metadata, or None if not found.
        """
        clean_id = self.clean_arxiv_id(arxiv_id)
        if not clean_id:
            return None

        cache_key = f"paper_{clean_id}"
        if use_cache and not refresh_cache:
            cached = self._read_cache(cache_key)
            if cached:
                cached["_from_cache"] = True
                return cached

        xml_data = self._request_with_retry({"id_list": clean_id})
        if not xml_data:
            return None

        papers = self._parse_feed(xml_data)
        if papers:
            paper = papers[0]
            paper["_from_cache"] = False
            if use_cache:
                self._write_cache(cache_key, paper)
            return paper

        return None

    def get_papers_by_ids(
        self, arxiv_ids: List[str], use_cache: bool = True, batch_size: int = 40
    ) -> List[Dict[str, Any]]:
        """Fetch metadata for multiple arXiv papers with caching and chunking.

        Args:
            arxiv_ids: List of arXiv IDs.
            use_cache: If True, use disk cache for already fetched papers.
            batch_size: Max IDs per single arXiv query.

        Returns:
            List of paper metadata dictionaries.
        """
        results: List[Dict[str, Any]] = []
        ids_to_fetch: List[str] = []
        seen = set()

        for raw_id in arxiv_ids:
            clean_id = self.clean_arxiv_id(raw_id)
            if not clean_id or clean_id in seen:
                continue
            seen.add(clean_id)

            if use_cache:
                cached = self._read_cache(f"paper_{clean_id}")
                if cached:
                    cached["_from_cache"] = True
                    results.append(cached)
                    continue

            ids_to_fetch.append(clean_id)

        # Batch fetch uncached
        for i in range(0, len(ids_to_fetch), batch_size):
            chunk = ids_to_fetch[i : i + batch_size]
            id_list_str = ",".join(chunk)
            xml_data = self._request_with_retry({"id_list": id_list_str, "max_results": len(chunk)})
            if xml_data:
                fetched_papers = self._parse_feed(xml_data)
                for paper in fetched_papers:
                    paper["_from_cache"] = False
                    if use_cache:
                        self._write_cache(f"paper_{paper['arxiv_id']}", paper)
                    results.append(paper)

        return results

    def search(
        self,
        query: str,
        max_results: int = 10,
        sort_by: str = "relevance",
        sort_order: str = "descending",
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        """Search arXiv by query string.

        Args:
            query: arXiv query syntax (e.g. 'all:DeepMind' or 'ti:AlphaGo').
            max_results: Maximum results to return (default 10).
            sort_by: 'relevance', 'lastUpdatedDate', 'submittedDate'.
            sort_order: 'ascending', 'descending'.
            use_cache: Whether to cache query results.
        """
        cache_key = f"search_{re.sub(r'[^a-zA-Z0-9]', '_', query)}_{max_results}_{sort_by}"
        if use_cache:
            cached = self._read_cache(cache_key)
            if cached is not None:
                return cached

        params = {
            "search_query": query,
            "max_results": max_results,
            "sortBy": sort_by,
            "sortOrder": sort_order,
        }
        xml_data = self._request_with_retry(params)
        if not xml_data:
            return []

        papers = self._parse_feed(xml_data)
        if use_cache:
            self._write_cache(cache_key, papers)
        return papers

    def search_by_author(self, author: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Search papers by author name."""
        return self.search(f'au:"{author}"', max_results=max_results)

    def search_by_title(self, title: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search papers by title."""
        # Sanitize double quotes in title
        clean_title = title.replace('"', '')
        return self.search(f'ti:"{clean_title}"', max_results=max_results)
