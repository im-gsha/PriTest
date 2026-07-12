"""角色欄位ページ（1つのゲームセーブに紐づく最大10体のキャラクター管理）を組み立てる。

画面構造:
  character-list    ... 入場中/未入場のキャラクター一覧（最大10件）。
  character-drawer  ... 名前・HP/FP・加護・屬性・狀態・裝備・武器・技能・
                        大招・道具を編集するスライドインドロワー。

実際のロジックと永続化（localStorage への JSON 保存）は
static/games.js・static/characters.js（クライアントサイド）が担当する。
"""

from __future__ import annotations

from site_src.layout import page_shell

BODY = """    <a class="back-link" href="../admin/index.html" data-i18n="back_admin"></a>
    <h1 id="game-title"></h1>

    <div id="screen-missing-game" hidden>
      <p data-i18n="game_not_found"></p>
      <a class="back-link" href="../admin/index.html" data-i18n="back_admin"></a>
    </div>

    <section id="screen-characters">
      <div class="field-row-block">
        <label data-i18n="character_type_label"></label>
        <select id="character-type-select"></select>
      </div>
      <div class="actions">
        <button id="btn-add-character" type="button" class="primary-btn" data-i18n="add_character_button"></button>
        <a id="btn-enter-map" class="primary-btn" href="#" data-i18n="enter_map_button"></a>
        <button id="btn-view-gallery" type="button" data-i18n="character_gallery_button"></button>
      </div>

      <ul id="character-list" class="character-list"></ul>
    </section>

    <div id="gallery-modal" class="modal" hidden>
      <div class="modal-box gallery-modal-box">
        <h2 data-i18n="character_gallery_title"></h2>
        <div id="gallery-grid" class="gallery-grid"></div>
        <div class="actions">
          <button id="btn-gallery-close" type="button" class="primary-btn" data-i18n="close_button"></button>
        </div>
      </div>
    </div>

    <div id="character-drawer" class="drawer">
      <div class="drawer-backdrop" id="character-drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 id="character-drawer-name"></h2>
        <p id="character-type-badge" class="character-type-badge"></p>
        <img id="character-portrait" class="character-portrait" hidden>

        <label class="field-row">
          <input type="checkbox" id="char-entered">
          <span data-i18n="character_entered_label"></span>
        </label>

        <div class="field-grid">
          <label class="field-row">
            <span data-i18n="character_hp_label"></span>
            <input type="number" id="char-hp-current" class="stat-input">
            <span>/</span>
            <input type="number" id="char-hp-max" class="stat-input">
            <span id="char-hp-level-bonus" class="level-bonus-marker"></span>
          </label>
          <label class="field-row">
            <span data-i18n="character_fp_label"></span>
            <input type="number" id="char-fp-current" class="stat-input">
            <span>/</span>
            <input type="number" id="char-fp-max" class="stat-input">
            <span id="char-fp-level-bonus" class="level-bonus-marker"></span>
          </label>
        </div>

        <div class="dice-pool-block">
          <div class="dice-pool-header">
            <h3 data-i18n="character_dice_pool_label"></h3>
            <button type="button" class="icon-btn" id="btn-char-dice-add">+</button>
          </div>
          <div class="dice-pool-list" id="char-dice-pool-list"></div>
        </div>

        <label class="field-row-block">
          <span data-i18n="character_blessing_label"></span>
          <input type="text" id="char-blessing">
        </label>

        <label class="field-row-block">
          <span data-i18n="character_attribute_label"></span>
          <input type="text" id="char-attribute">
        </label>

        <label class="field-row-block">
          <span data-i18n="character_ultimate_label"></span>
          <input type="text" id="char-ultimate">
        </label>

        <div class="tag-field" data-field="status">
          <h3 data-i18n="character_status_label"></h3>
          <div class="tag-list" id="tag-list-status"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-status">
            <button type="button" class="tag-add-btn" data-field="status" data-i18n="tag_add_button"></button>
          </div>
        </div>

        <div class="tag-field" data-field="equipment">
          <h3 data-i18n="character_equipment_label"></h3>
          <div class="tag-list" id="tag-list-equipment"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-equipment">
            <button type="button" class="tag-add-btn" data-field="equipment" data-i18n="tag_add_button"></button>
          </div>
        </div>

        <div class="tag-field" data-field="weapons">
          <h3 data-i18n="character_weapons_label"></h3>
          <div class="tag-list" id="tag-list-weapons"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-weapons">
            <button type="button" class="tag-add-btn" data-field="weapons" data-i18n="tag_add_button"></button>
          </div>
        </div>

        <div class="tag-field" data-field="skills">
          <h3 data-i18n="character_skills_label"></h3>
          <div class="tag-list" id="tag-list-skills"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-skills">
            <button type="button" class="tag-add-btn" data-field="skills" data-i18n="tag_add_button"></button>
          </div>
        </div>

        <div class="tag-field" data-field="items">
          <h3 data-i18n="character_items_label"></h3>
          <div class="tag-list" id="tag-list-items"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-items">
            <button type="button" class="tag-add-btn" data-field="items" data-i18n="tag_add_button"></button>
          </div>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="record_sheet_title"></h3>
          <div class="field-grid">
            <label class="field-row">
              <span data-i18n="record_level_label"></span>
              <input type="number" id="char-level" class="stat-input" min="1" max="15">
            </label>
            <label class="field-row">
              <span data-i18n="record_runes_label"></span>
              <input type="number" id="char-runes" class="stat-input">
            </label>
          </div>
          <div class="field-grid">
            <label class="field-row">
              <span data-i18n="character_blessing_slots_label"></span>
              <input type="number" id="char-blessing-current" class="stat-input">
              <span>/</span>
              <input type="number" id="char-blessing-max" class="stat-input">
              <span id="char-blessing-level-bonus" class="level-bonus-marker"></span>
            </label>
          </div>
          <div class="field-grid">
            <label class="field-row">
              <span data-i18n="record_flask_base_label"></span>
              <input type="number" id="char-flask-base-used" class="stat-input">
              <span>/</span>
              <input type="number" id="char-flask-base-max" class="stat-input">
            </label>
            <label class="field-row">
              <span data-i18n="record_flask_extra_label"></span>
              <input type="number" id="char-flask-extra-used" class="stat-input">
              <span>/</span>
              <input type="number" id="char-flask-extra-max" class="stat-input">
            </label>
          </div>
          <label class="field-row">
            <span data-i18n="record_revival_label"></span>
            <input type="number" id="char-revival-count" class="stat-input" min="0">
          </label>
        </div>

        <div class="tag-field" data-field="talismans">
          <h3 data-i18n="record_talismans_label"></h3>
          <div class="tag-list" id="tag-list-talismans"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-talismans">
            <button type="button" class="tag-add-btn" data-field="talismans" data-i18n="tag_add_button"></button>
          </div>
        </div>

        <div class="tag-field" data-field="buildup">
          <h3 data-i18n="record_buildup_label"></h3>
          <div class="tag-list" id="tag-list-buildup"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-buildup">
            <button type="button" class="tag-add-btn" data-field="buildup" data-i18n="tag_add_button"></button>
          </div>
        </div>

        <div class="threat-ref-block" id="type-reference-block" hidden>
          <h3 id="type-reference-title"></h3>
          <p id="type-reference-stats" class="threat-ref-body"></p>
        </div>
        <div class="threat-ref-block">
          <h3 data-i18n="cv_active_skills_title"></h3>
          <div id="type-active-skills"></div>
        </div>
        <div class="threat-ref-block">
          <h3 data-i18n="cv_passives_title"></h3>
          <div id="type-passives"></div>
        </div>

        <div class="threat-ref-block" id="relic-select-block">
          <h3 data-i18n="relic_select_title"></h3>
          <p class="threat-ref-body" id="relic-progress-text"></p>
          <div class="actions">
            <button type="button" id="btn-relic-roll" data-i18n="relic_roll_button"></button>
            <button type="button" id="btn-relic-toggle-all" data-i18n="relic_show_all_button"></button>
          </div>
          <div class="dice-pool-list" id="relic-dice-display"></div>
          <div id="relic-candidates"></div>
          <div id="relic-all-list" hidden></div>
        </div>

        <div class="threat-ref-block" id="attached-select-block">
          <h3 data-i18n="attached_select_title"></h3>
          <p class="threat-ref-body" id="attached-progress-text"></p>
          <div class="actions">
            <button type="button" id="btn-attached-roll-1d" data-i18n="attached_roll_1d_button"></button>
            <button type="button" id="btn-attached-roll-2d" data-i18n="attached_roll_2d_button"></button>
          </div>
          <div class="dice-pool-list" id="attached-dice-display"></div>
          <div id="attached-candidates"></div>
          <div id="attached-learned-list"></div>
        </div>

        <div class="actions">
          <button id="btn-delete-character" type="button" class="danger-btn" data-i18n="delete_character_button"></button>
          <button id="btn-character-close" type="button" class="primary-btn" data-i18n="close_button"></button>
        </div>
      </div>
    </div>
"""


def build_characters_html() -> str:
    return page_shell(
        title="Characters - PriTest",
        body=BODY,
        static_prefix="../static/",
        home_href="../index.html",
        extra_scripts=("games.js", "character_types.js", "character_drawer.js", "characters.js"),
    )
