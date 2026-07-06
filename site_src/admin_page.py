"""管理員ページ（ゲームセーブの一覧・新規作成・削除）を組み立てる。

最大 5 個までのゲームセーブ（Night 盤面 + 角色欄位のセット）を
localStorage 上で管理する。実際のロジックは static/games.js と
static/admin.js（クライアントサイド）が担当する。
"""

from __future__ import annotations

from site_src.layout import page_shell

BODY = """    <a class="back-link" href="../index.html" data-i18n="back_home"></a>
    <h1 data-i18n="admin_title"></h1>
    <p data-i18n="admin_subtitle"></p>

    <div class="actions">
      <button id="btn-add-game" type="button" class="primary-btn" data-i18n="add_game_button"></button>
    </div>

    <ul id="game-list" class="game-list"></ul>
"""


def build_admin_html() -> str:
    return page_shell(
        title="Admin - PriTest",
        body=BODY,
        static_prefix="../static/",
        home_href="../index.html",
        extra_scripts=("games.js", "admin.js"),
    )
