"""PriTest サイト全体のビルドスクリプト。

site_src/ の Python コードがホームページと各ミニプロジェクトの HTML を
組み立て、static_src/ の CSS/JS をそのまま dist/static/ にコピーする。
GitHub Actions から実行され、dist/ がそのまま GitHub Pages に公開される。
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from site_src.i18n_data import STRINGS
from site_src.index_page import build_index_html
from site_src.night_page import build_night_html

ROOT = Path(__file__).parent
DIST_DIR = ROOT / "dist"
STATIC_SRC_DIR = ROOT / "static_src"


def build_static_assets() -> None:
    static_dist = DIST_DIR / "static"
    static_dist.mkdir(parents=True, exist_ok=True)
    shutil.copy(STATIC_SRC_DIR / "style.css", static_dist / "style.css")
    shutil.copy(STATIC_SRC_DIR / "night.js", static_dist / "night.js")

    template = (STATIC_SRC_DIR / "i18n.template.js").read_text(encoding="utf-8")
    data = json.dumps(STRINGS, ensure_ascii=False, indent=2)
    (static_dist / "i18n.js").write_text(
        template.replace("__I18N_DATA__", data), encoding="utf-8"
    )


def build_pages() -> None:
    (DIST_DIR / "index.html").write_text(build_index_html(), encoding="utf-8")

    night_dir = DIST_DIR / "night"
    night_dir.mkdir(parents=True, exist_ok=True)
    (night_dir / "index.html").write_text(build_night_html(), encoding="utf-8")


def main() -> None:
    for name in ("index.html", "night", "static"):
        target = DIST_DIR / name
        if target.is_dir():
            shutil.rmtree(target)
        elif target.exists():
            target.unlink()
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    build_static_assets()
    build_pages()
    print(f"Generated site into {DIST_DIR}")


if __name__ == "__main__":
    main()
