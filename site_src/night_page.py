"""Night ミニゲーム（トランプ翻牌占い）ページを組み立てる。

画面構造は3つ:
  screen-start  ... 開始ボタンのみ
  screen-select ... 52枚から個別にカードを選ぶ画面（初回・接續開始で共用）
  screen-board  ... 3x3 + 起點/終點 の盤面とログ

実際のゲームロジックは static/night.js（クライアントサイド）が担当する。
"""

from __future__ import annotations

from site_src.layout import page_shell

BODY = """    <a class="back-link" href="../index.html" data-i18n="back_home"></a>
    <h1 data-i18n="project_night_name"></h1>

    <section id="screen-start" class="screen">
      <button id="btn-start" type="button" class="primary-btn" data-i18n="start_button"></button>
    </section>

    <section id="screen-select" class="screen" hidden>
      <h2 id="select-title"></h2>
      <div id="select-grid" class="card-grid"></div>
      <p id="select-count"></p>
      <div class="actions">
        <button id="btn-select-cancel" type="button" data-i18n="cancel_button"></button>
        <button id="btn-select-submit" type="button" class="primary-btn" data-i18n="submit_button"></button>
      </div>
    </section>

    <section id="screen-board" class="screen" hidden>
      <div class="board-grid" id="board-grid">
        <div class="pile pile-start" data-i18n="start_point_label"></div>
        <div class="pile pile-end" data-i18n="end_point_label"></div>
      </div>
      <div class="actions">
        <button id="btn-continue" type="button" data-i18n="continue_button"></button>
      </div>
      <div class="log-panel">
        <h2 data-i18n="log_title"></h2>
        <ul id="log-list"></ul>
      </div>
    </section>

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
