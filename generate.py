"""PriTest 用の静的ページ生成スクリプト。

依存ライブラリなしで index.html を dist/ ディレクトリに書き出す。
GitHub Actions から実行され、生成結果が GitHub Pages に公開される。
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "dist"

FEATURES = [
    ("Python 製", "generate.py がページの HTML を組み立てます。"),
    ("GitHub Actions 連携", "main への push で自動ビルド・自動デプロイされます。"),
    ("GitHub Pages 公開", "ビルド結果はそのまま GitHub Pages で公開されます。"),
]

PAGE_TEMPLATE = """<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PriTest</title>
<style>
  :root {{
    color-scheme: light dark;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", sans-serif;
    max-width: 720px;
    margin: 4rem auto;
    padding: 0 1.5rem;
    line-height: 1.7;
  }}
  h1 {{
    font-size: 2rem;
    margin-bottom: 0.25rem;
  }}
  .subtitle {{
    color: #666;
    margin-top: 0;
  }}
  .card {{
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin: 1rem 0;
  }}
  .card h2 {{
    margin: 0 0 0.4rem 0;
    font-size: 1.1rem;
  }}
  footer {{
    margin-top: 3rem;
    font-size: 0.85rem;
    color: #888;
  }}
</style>
</head>
<body>
  <h1>PriTest</h1>
  <p class="subtitle">Python で生成された自動デプロイ確認用ページです。</p>

  {feature_cards}

  <footer>
    Build: {build_time} (UTC)
  </footer>
</body>
</html>
"""

CARD_TEMPLATE = """  <div class="card">
    <h2>{title}</h2>
    <p>{description}</p>
  </div>"""


def build_html() -> str:
    feature_cards = "\n".join(
        CARD_TEMPLATE.format(title=title, description=description)
        for title, description in FEATURES
    )
    build_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    return PAGE_TEMPLATE.format(feature_cards=feature_cards, build_time=build_time)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "index.html").write_text(build_html(), encoding="utf-8")
    print(f"Generated {OUTPUT_DIR / 'index.html'}")


if __name__ == "__main__":
    main()
