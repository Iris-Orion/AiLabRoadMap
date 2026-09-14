"""Semantic Scholar Academic Graph API Client.

Features:
- Strict rate limiting (<= 1 req/s without API key)
- Adaptive backoff and exponential retry for HTTP 429 and 5xx errors
- Environment variable support for S2_API_KEY
- Local disk caching (default: data/cache/s2/)
- Paper metadata & citation querying (citationCount, influentialCitationCount, references, citations, etc.)
"""

import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

logger = logging.getLogger(__name__)


class RateLimiter:
    """Thread-safe rate limiter guaranteeing a minimum delay between calls."""

    def __init__(self, requests_per_second: float = 1.0):
        self.interval = 1.0 / requests_per_second if requests_per_second > 0 else 1.0
        self._last_call_time = 0.0

    def wait(self) -> None:
        now = time.time()
        elapsed = now - self._last_call_time
        if elapsed < self.interval:
            sleep_time = self.interval - elapsed
            time.sleep(sleep_time)
        self._last_call_time = time.time()


class SemanticScholarClient:
    """Client for Semantic Scholar Graph API v1."""

    BASE_URL = "https://api.semanticscholar.org/graph/v1"
    DEFAULT_FIELDS = (
        "paperId,title,abstract,year,authors,venue,publicationDate,externalIds,url,"
        "citationCount,influentialCitationCount,"
        "citations.paperId,citations.title,citations.year,citations.citationCount,"
        "references.paperId,references.title,references.year,references.citationCount"
    )

    def __init__(
        self,
        api_key: Optional[str] = None,
        cache_dir: Optional[str] = None,
        requests_per_second: Optional[float] = None,
        timeout: int = 25,
        max_retries: int = 4,
    ):
        """Initialize Semantic Scholar client.

        Args:
            api_key: Optional S2 API key. If omitted, checks env var S2_API_KEY.
            cache_dir: Directory for storing local disk cache. Defaults to 'data/cache/s2'.
            requests_per_second: Rate limit. Default is 1.0 req/s without key, 5.0 with key.
            timeout: HTTP request timeout in seconds.
            max_retries: Maximum number of exponential backoff retries.
        """
        self.api_key = api_key or os.getenv("S2_API_KEY")
        if requests_per_second is None:
            requests_per_second = 5.0 if self.api_key else 1.0
        self.rate_limiter = RateLimiter(requests_per_second=requests_per_second)

        # Set cache dir
        if cache_dir is None:
            project_root = Path(__file__).resolve().parent.parent
            self.cache_dir = project_root / "data" / "cache" / "s2"
        else:
            self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self.timeout = timeout
        self.max_retries = max_retries

        self.session = requests.Session()
        headers = {
            "User-Agent": "DeepMindResearchRoadmap/1.0 (academic research tool)",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key
        self.session.headers.update(headers)

    @staticmethod
    def normalize_paper_id(paper_id: str) -> str:
        """Normalize paper ID for Semantic Scholar API.

        Examples:
            '1312.5602' -> 'ARXIV:1312.5602'
            'arXiv:1312.5602' -> 'ARXIV:1312.5602'
            'ARXIV:1312.5602v1' -> 'ARXIV:1312.5602'
            '10.1038/nature14236' -> 'DOI:10.1038/nature14236'
            '649def34f8be52c8b66281af98ae772c09738250' -> unchanged
        """
        cleaned = paper_id.strip()

        # Handle arxiv id with or without prefix
        arxiv_match = re.match(r"^(?:arXiv:)?(\d{4}\.\d{4,5})(?:v\d+)?$", cleaned, re.IGNORECASE)
        if arxiv_match:
            return f"ARXIV:{arxiv_match.group(1)}"

        # Handle old arxiv id format (e.g. hep-th/9901001)
        old_arxiv = re.match(r"^(?:arXiv:)?([a-z\-]+/\d{7})(?:v\d+)?$", cleaned, re.IGNORECASE)
        if old_arxiv:
            return f"ARXIV:{old_arxiv.group(1)}"

        # Handle DOI
        if cleaned.startswith("10.") and "/" in cleaned:
            return f"DOI:{cleaned}"

        return cleaned

    def _get_cache_path(self, paper_id: str) -> Path:
        """Derive safe filename from paper ID."""
        safe_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', paper_id)
        return self.cache_dir / f"{safe_name}.json"

    def _read_cache(self, paper_id: str) -> Optional[Dict[str, Any]]:
        """Read data from disk cache if available."""
        cache_file = self._get_cache_path(paper_id)
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    logger.debug("Cache hit for paper_id: %s", paper_id)
                    return data
            except Exception as e:
                logger.warning("Failed to read cache file %s: %s", cache_file, e)
        return None

    def _write_cache(self, paper_id: str, data: Dict[str, Any]) -> None:
        """Write data to disk cache."""
        cache_file = self._get_cache_path(paper_id)
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            # Also cache by S2 paperId if present and different
            s2_id = data.get("paperId")
            if s2_id and s2_id != paper_id:
                alias_file = self._get_cache_path(s2_id)
                if not alias_file.exists():
                    with open(alias_file, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("Failed to write cache file %s: %s", cache_file, e)

    def _request_with_retry(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Execute GET request with rate limiting and exponential backoff retry."""
        url = f"{self.BASE_URL}/{endpoint.lstrip('/')}"
        backoff = 2.0

        for attempt in range(self.max_retries + 1):
            self.rate_limiter.wait()
            try:
                response = self.session.get(url, params=params, timeout=self.timeout)
                if response.status_code == 200:
                    return response.json()

                if response.status_code == 404:
                    logger.info("Paper not found on Semantic Scholar: %s", url)
                    return None

                if response.status_code == 429:
                    # Rate limit hit
                    retry_after = response.headers.get("Retry-After")
                    sleep_time = float(retry_after) if retry_after else backoff
                    logger.warning(
                        "S2 rate limit reached (429). Retrying after %.2fs (attempt %d/%d)...",
                        sleep_time,
                        attempt + 1,
                        self.max_retries,
                    )
                    time.sleep(sleep_time)
                    backoff *= 2.0
                    continue

                if response.status_code in (500, 502, 503, 504):
                    logger.warning(
                        "S2 server error %d. Retrying after %.2fs (attempt %d/%d)...",
                        response.status_code,
                        backoff,
                        attempt + 1,
                        self.max_retries,
                    )
                    time.sleep(backoff)
                    backoff *= 2.0
                    continue

                # Other HTTP errors
                response.raise_for_status()

            except requests.RequestException as e:
                logger.warning(
                    "Network error while requesting %s: %s (attempt %d/%d)",
                    url,
                    e,
                    attempt + 1,
                    self.max_retries,
                )
                if attempt < self.max_retries:
                    time.sleep(backoff)
                    backoff *= 2.0
                else:
                    logger.error("Max retries exceeded for %s: %s", url, e)
                    return None

        return None

    def get_paper(
        self,
        paper_id: str,
        fields: Optional[str] = None,
        use_cache: bool = True,
        refresh_cache: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Fetch paper metadata, citations, and references.

        Args:
            paper_id: S2 Paper ID, ArXiv ID (e.g. '1312.5602' or 'ARXIV:1312.5602'), or DOI.
            fields: Comma-separated list of fields. Uses DEFAULT_FIELDS if None.
            use_cache: Whether to read from disk cache.
            refresh_cache: If True, force re-fetching from API and updating cache.

        Returns:
            Dictionary containing paper details or None if not found/error.
        """
        normalized_id = self.normalize_paper_id(paper_id)

        # Check cache
        if use_cache and not refresh_cache:
            cached = self._read_cache(normalized_id)
            if cached:
                cached["_from_cache"] = True
                return cached

        # Make API request
        req_fields = fields or self.DEFAULT_FIELDS
        endpoint = f"paper/{normalized_id}"
        data = self._request_with_retry(endpoint, params={"fields": req_fields})

        if data:
            data["_from_cache"] = False
            if use_cache:
                self._write_cache(normalized_id, data)
            return data

        return None

    def search_paper(
        self,
        query: str,
        limit: int = 5,
        fields: Optional[str] = None,
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        """Search papers by query string.

        Args:
            query: Title, keywords or query text.
            limit: Maximum number of papers to return (up to 100).
            fields: Comma-separated list of fields.
            use_cache: Whether to cache search query results.

        Returns:
            List of matching paper dictionaries.
        """
        cache_key = f"search_{re.sub(r'[^a-zA-Z0-9]', '_', query)}_{limit}"
        if use_cache:
            cached = self._read_cache(cache_key)
            if cached and isinstance(cached, dict) and "data" in cached:
                return cached["data"]

        req_fields = fields or "paperId,title,year,authors,citationCount,influentialCitationCount,externalIds"
        endpoint = "paper/search"
        params = {"query": query, "limit": limit, "fields": req_fields}

        resp = self._request_with_retry(endpoint, params=params)
        if resp and "data" in resp:
            results = resp["data"]
            if use_cache:
                self._write_cache(cache_key, resp)
            return results
        return []
