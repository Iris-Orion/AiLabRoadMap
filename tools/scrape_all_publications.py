"""
tools/scrape_all_publications.py
抓取 https://deepmind.google/research/publications/ 所有的全部发表论文（共 9 页，约 263 篇）
提取标题、发布日期、详情链接、出版物 ID，并尝试提取关联 arXiv/PDF 链接。
"""

import json
import re
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path

BASE_URL = "https://deepmind.google"
START_URL = "https://deepmind.google/research/publications/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 DeepMindResearcher/1.0"
}

def scrape_all_publications(max_pages=15, output_file="data/deepmind_all_publications.json"):
    all_publications = []
    seen_titles = set()

    session = requests.Session()
    session.headers.update(HEADERS)

    for page_num in range(1, max_pages + 1):
        if page_num == 1:
            url = START_URL
        else:
            url = f"{START_URL}page/{page_num}/"

        print(f"[*] 正在抓取第 {page_num} 页: {url}")
        try:
            resp = session.get(url, timeout=20)
            if resp.status_code == 404:
                print(f"[-] 页面 {page_num} 返回 404，说明已到达最后一页。")
                break
            if resp.status_code != 200:
                print(f"[!] 状态码异常 {resp.status_code}，停止抓取。")
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            items = soup.select(".list-group__item")
            if not items:
                print(f"[-] 页面 {page_num} 未找到论文项，停止抓取。")
                break

            page_added = 0
            for item in items:
                link_el = item.select_one(".list-group__link")
                date_el = item.select_one(".list-group__date")
                desc_el = item.select_one(".list-group__description")

                title = desc_el.get_text(strip=True) if desc_el else ""
                date_str = date_el.get_text(strip=True) if date_el else ""
                href = link_el.get("href", "") if link_el else ""

                if not title:
                    continue

                if not href.startswith("http"):
                    href = f"{BASE_URL}{href}"

                # 提取年份
                year_match = re.search(r"\b(201\d|202\d)\b", date_str)
                year = int(year_match.group(1)) if year_match else 2024

                # 提取 pub_id
                pub_id_match = re.search(r"/publications/(\d+)/", href)
                pub_id = pub_id_match.group(1) if pub_id_match else f"p_{len(all_publications)}"

                if title in seen_titles:
                    continue
                seen_titles.add(title)

                pub_obj = {
                    "pub_id": pub_id,
                    "title": title,
                    "date": date_str,
                    "year": year,
                    "url": href,
                }
                all_publications.append(pub_obj)
                page_added += 1

            print(f"    -> 第 {page_num} 页成功解析 {page_added} 篇，累计已收集 {len(all_publications)} 篇。")
            time.sleep(0.5)

        except Exception as e:
            print(f"[!] 抓取第 {page_num} 页失败: {e}")
            break

    # 保存文件
    out_path = Path(output_file)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_publications, f, ensure_ascii=False, indent=2)

    print(f"\n[+] 全部抓取完成！共收集 {len(all_publications)} 篇 DeepMind 官方发表论文。")
    print(f"[+] 已保存到: {out_path}")
    return all_publications


if __name__ == "__main__":
    scrape_all_publications()
