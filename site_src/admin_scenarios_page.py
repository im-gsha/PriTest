"""管理員が自訂副本（シナリオ）のカード配置・地名を自由編輯できるページ。

固定データ（scenarios.js に直書きされたビルド組み込みシナリオ）は閲覧のみ。
自訂副本は localStorage（pritest-custom-scenarios）に保存され、
admin ページのシナリオ選択プルダウンにも反映される。
実際のロジックは static/scenarios.js・static/admin_scenarios.js が担当する。
"""

from __future__ import annotations

from site_src.layout import page_shell

BODY = """    <a class="back-link" href="../index.html" data-i18n="back_admin"></a>
    <h1 data-i18n="scenario_editor_title"></h1>
    <p data-i18n="scenario_editor_subtitle"></p>

    <div class="actions">
      <button id="btn-add-scenario" type="button" class="primary-btn" data-i18n="scenario_add_button"></button>
    </div>

    <ul id="scenario-list" class="game-list"></ul>

    <div id="scenario-editor" hidden>
      <h2 id="scenario-editor-title"></h2>

      <div class="field-grid">
        <label class="field-row-block">
          <span data-i18n="scenario_name_zh_label"></span>
          <input type="text" id="scenario-name-zh">
        </label>
        <label class="field-row-block">
          <span data-i18n="scenario_name_ja_label"></span>
          <input type="text" id="scenario-name-ja">
        </label>
      </div>

      <div class="field-grid">
        <label class="field-row-block">
          <span data-i18n="scenario_start_label"></span>
          <select id="scenario-start-suit"></select>
          <select id="scenario-start-rank"></select>
        </label>
        <label class="field-row-block">
          <span data-i18n="scenario_end_label"></span>
          <select id="scenario-end-suit"></select>
          <select id="scenario-end-rank"></select>
        </label>
      </div>

      <h3 data-i18n="scenario_day1_label"></h3>
      <div id="scenario-day1-rows" class="scenario-card-rows"></div>

      <h3 data-i18n="scenario_day2_label"></h3>
      <div id="scenario-day2-rows" class="scenario-card-rows"></div>

      <div class="actions">
        <button id="btn-scenario-save" type="button" class="primary-btn" data-i18n="scenario_save_button"></button>
        <button id="btn-scenario-delete" type="button" class="danger-btn" data-i18n="scenario_delete_button"></button>
        <button id="btn-scenario-close" type="button" data-i18n="close_button"></button>
      </div>
    </div>
"""


def build_admin_scenarios_html() -> str:
    return page_shell(
        title="Scenario Editor - PriTest",
        body=BODY,
        static_prefix="../../static/",
        home_href="../../index.html",
        extra_scripts=("games.js", "scenarios.js", "admin_scenarios.js"),
    )
