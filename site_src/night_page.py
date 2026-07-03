"""Night ミニゲーム（トランプ翻牌占い）ページを組み立てる。

画面構造:
  screen-board  ... 常時表示される盤面（3x3 + 起點/終點・ログ）。
                    localStorage に保存された状態があればそのまま復元される。
  select-drawer ... 開始/接續開始で右からスライドインするカード選択ドロワー。
  modal         ... 翻開/放回牌庫の確認ダイアログ。

実際のゲームロジックと永続化（localStorage への JSON 保存）は
static/night.js（クライアントサイド）が担当する。
"""

from __future__ import annotations

from site_src.layout import page_shell

BODY = """    <a class="back-link" href="../index.html" data-i18n="back_home"></a>
    <h1 data-i18n="project_night_name"></h1>

    <section id="screen-board" class="screen">
      <div class="board-grid" id="board-grid">
        <div class="pile pile-start" id="pile-start" data-i18n="start_point_label"></div>
        <div class="pile pile-end" id="pile-end" data-i18n="end_point_label"></div>
      </div>
      <div class="actions">
        <button id="btn-primary-action" type="button" class="primary-btn"></button>
        <button id="btn-new-game" type="button" data-i18n="new_game_button"></button>
      </div>
      <div class="log-panel">
        <div class="log-header">
          <h2 data-i18n="log_title"></h2>
          <button id="btn-log-toggle" type="button" class="icon-btn" aria-label="toggle log">👁</button>
        </div>
        <ul id="log-list"></ul>
      </div>
    </section>

    <div id="select-drawer" class="drawer">
      <div class="drawer-backdrop" id="drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 id="select-title"></h2>
        <div id="select-grid" class="card-groups"></div>
        <p id="select-count"></p>
        <div class="actions">
          <button id="btn-select-cancel" type="button" data-i18n="cancel_button"></button>
          <button id="btn-select-submit" type="button" class="primary-btn" data-i18n="submit_button"></button>
        </div>
      </div>
    </div>

    <div id="modal" class="modal" hidden>
      <div class="modal-box">
        <p id="modal-message"></p>
        <div class="actions">
          <button id="modal-no" type="button" data-i18n="no_button"></button>
          <button id="modal-yes" type="button" class="primary-btn" data-i18n="yes_button"></button>
        </div>
      </div>
    </div>
"""


def build_night_html() -> str:
    return page_shell(
        title="Night - PriTest",
        body=BODY,
        static_prefix="../static/",
        home_href="../index.html",
        extra_scripts=("night.js",),
    )
