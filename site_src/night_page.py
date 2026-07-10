"""Night ミニゲーム（トランプ翻牌占い）ページを組み立てる。

画面構造:
  screen-board  ... 常時表示される盤面（3x3 + 起點/終點・ログ）。
                    localStorage に保存された状態があればそのまま復元される。
  select-drawer ... 開始/次の夜で右からスライドインするカード選択ドロワー。
  modal         ... 翻開/放回牌庫の確認ダイアログ。
  suit-modal    ... 起點/終點の花色を選ぶダイアログ。

実際のゲームロジックと永続化（localStorage への JSON 保存）は
static/night.js（クライアントサイド）が担当する。
"""

from __future__ import annotations

from site_src.layout import page_shell

BODY = """    <a id="link-characters" class="back-link" href="../index.html" data-i18n="back_characters"></a>
    <h1 data-i18n="project_night_name"></h1>
    <div class="day-status-row" id="day-status-row">
      <p id="day-status" class="day-status"></p>
      <button type="button" class="info-btn" id="btn-setup-info">i</button>
      <div id="setup-info-bubble" class="info-bubble" hidden>
        <button type="button" class="info-bubble-close" id="setup-info-close">&times;</button>
        <h3 id="setup-info-title"></h3>
        <div id="setup-info-body"></div>
      </div>
    </div>

    <div id="screen-missing-game" hidden>
      <p data-i18n="game_not_found"></p>
      <a class="back-link" href="../admin/index.html" data-i18n="back_admin"></a>
    </div>

    <section id="screen-board" class="screen">
      <div class="board-grid" id="board-grid">
        <div class="field-level field-level-0" id="field-level-0"></div>
        <div class="field-level field-level-1" id="field-level-1"></div>
        <div class="field-level field-level-2" id="field-level-2"></div>
        <div class="pile-wrap pile-wrap-start" id="pile-wrap-start">
          <button type="button" class="pile pile-start" id="pile-start"></button>
          <div class="pile-checks">
            <label class="pile-check"><input type="checkbox" id="pile-check-start-one">1</label>
            <label class="pile-check"><input type="checkbox" id="pile-check-start-all"><span data-i18n="check_all_label"></span></label>
          </div>
        </div>
        <div class="pile-wrap pile-wrap-end" id="pile-wrap-end">
          <button type="button" class="pile pile-end" id="pile-end"></button>
          <div class="pile-checks">
            <label class="pile-check"><input type="checkbox" id="pile-check-end-one">1</label>
            <label class="pile-check"><input type="checkbox" id="pile-check-end-all"><span data-i18n="check_all_label"></span></label>
          </div>
        </div>
      </div>
      <div class="time-loss-bar" id="time-loss-bar">
        <span data-i18n="time_loss_summary_label"></span>
        <span id="time-loss-summary"></span>
        <button type="button" class="info-btn" id="btn-time-loss-info">i</button>
      </div>
      <div class="actions">
        <button id="btn-primary-action" type="button" class="primary-btn"></button>
        <button id="btn-new-game" type="button" data-i18n="new_game_button"></button>
      </div>
      <div class="character-roster" id="character-roster">
        <h3 data-i18n="character_roster_title"></h3>
        <div id="character-roster-list" class="character-roster-list"></div>
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

    <div id="keep-drawer" class="drawer">
      <div class="drawer-backdrop" id="keep-drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 data-i18n="keep_cards_title"></h2>
        <div id="keep-grid" class="suit-grid"></div>
        <p id="keep-count"></p>
        <div class="actions">
          <button id="btn-keep-cancel" type="button" data-i18n="cancel_button"></button>
          <button id="btn-keep-submit" type="button" class="primary-btn" data-i18n="submit_button"></button>
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

    <div id="suit-modal" class="modal" hidden>
      <div class="modal-box">
        <p id="suit-modal-title"></p>
        <div id="suit-modal-grid" class="suit-modal-grid"></div>
        <div class="actions">
          <button id="suit-modal-clear" type="button" data-i18n="clear_suit_button"></button>
          <button id="suit-modal-close" type="button" data-i18n="cancel_button"></button>
        </div>
      </div>
    </div>

    <div id="threat-drawer" class="drawer">
      <div class="drawer-backdrop" id="threat-drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 data-i18n="threat_sheet_title"></h2>

        <h3 id="tl-day1-title"></h3>
        <div id="tl-day1-list" class="tl-list"></div>

        <h3 id="tl-day2-title"></h3>
        <div id="tl-day2-list" class="tl-list"></div>

        <div class="threat-ref-block">
          <h3 data-i18n="time_loss_accum_timing_title"></h3>
          <p id="time-loss-accum-timing-body" class="threat-ref-body"></p>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="night_rain_timing_title"></h3>
          <p id="night-rain-timing-body" class="threat-ref-body"></p>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="roll_table_title"></h3>
          <p id="roll-table-body" class="threat-ref-body"></p>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="wandering_blessing_title"></h3>
          <div class="wb-row">
            <span data-i18n="wandering_blessing_base_label"></span>
            <span id="wb-base" class="wb-checks"></span>
          </div>
          <div class="wb-row">
            <span data-i18n="wandering_blessing_extra_label"></span>
            <span id="wb-extra" class="wb-checks"></span>
          </div>
        </div>

        <div class="threat-ref-block">
          <div class="field-row-block">
            <label data-i18n="smithing_stone_label"></label>
            <input type="text" id="input-smithing-stone">
          </div>
          <div class="field-row-block">
            <label data-i18n="stonesword_key_label"></label>
            <input type="text" id="input-stonesword-key">
          </div>
          <div class="field-row-block">
            <label data-i18n="grace_label"></label>
            <input type="text" id="input-grace">
          </div>
        </div>

        <div class="actions">
          <button id="btn-threat-drawer-close" type="button" class="primary-btn" data-i18n="close_button"></button>
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
        extra_scripts=("games.js", "scenarios.js", "character_types.js", "night.js"),
    )
