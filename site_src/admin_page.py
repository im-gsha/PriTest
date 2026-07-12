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

    <div class="field-row-block">
      <label data-i18n="scenario_select_label"></label>
      <select id="scenario-select"></select>
    </div>
    <div class="actions">
      <button id="btn-add-game" type="button" class="primary-btn" data-i18n="add_game_button"></button>
    </div>

    <ul id="game-list" class="game-list"></ul>

    <div id="share-modal" class="modal" hidden>
      <div class="modal-box share-modal-box">
        <h2 data-i18n="share_title"></h2>
        <p id="share-oversize-note" class="threat-ref-body" hidden data-i18n="share_qr_too_large"></p>
        <canvas id="share-qr-canvas"></canvas>
        <div class="field-row-block">
          <label data-i18n="share_link_label"></label>
          <input type="text" id="share-url-input" readonly>
        </div>
        <div class="actions">
          <button id="btn-share-copy" type="button" class="primary-btn" data-i18n="share_copy_button"></button>
          <button id="btn-share-close" type="button" data-i18n="close_button"></button>
        </div>
      </div>
    </div>
"""


def build_admin_html() -> str:
    return page_shell(
        title="Admin - PriTest",
        body=BODY,
        static_prefix="../static/",
        home_href="../index.html",
        extra_scripts=("games.js", "scenarios.js", "night_bosses.js", "qrcode.js", "admin.js"),
    )
