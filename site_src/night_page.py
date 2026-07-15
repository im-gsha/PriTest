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

BODY = """    <div class="night-header-row">
      <div class="night-header-left">
        <a id="link-characters" class="back-link" href="../index.html" data-i18n="back_characters"></a>
        <h1 data-i18n="project_night_name"></h1>
        <p id="day-status" class="day-status"></p>
        <button type="button" class="info-btn" id="btn-setup-info">i</button>
        <div id="setup-info-bubble" class="info-bubble" hidden>
          <button type="button" class="info-bubble-close" id="setup-info-close">&times;</button>
          <h3 id="setup-info-title"></h3>
          <div id="setup-info-body"></div>
        </div>
      </div>
      <div class="night-header-actions">
        <button id="btn-undo-night" type="button" data-i18n="undo_night_button"></button>
        <button id="btn-primary-action" type="button" class="primary-btn"></button>
        <button id="btn-new-game" type="button" class="danger-btn" data-i18n="new_game_button"></button>
      </div>
    </div>

    <div id="screen-missing-game" hidden>
      <p data-i18n="game_not_found"></p>
      <a class="back-link" href="../admin/index.html" data-i18n="back_admin"></a>
    </div>

    <section id="screen-board" class="screen">
      <div class="board-area" id="board-area">
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
        <img id="night3-boss-image" class="night3-boss-image" hidden>
      </div>
      <div class="time-loss-bar" id="time-loss-bar">
        <span data-i18n="time_loss_summary_label"></span>
        <span id="time-loss-summary"></span>
        <button type="button" class="info-btn" id="btn-time-loss-info">i</button>
      </div>
      <div class="time-loss-bar" id="battle-bar">
        <span data-i18n="battle_sheet_label"></span>
        <button type="button" class="info-btn" id="btn-battle-info">i</button>
      </div>
      <div class="dice-pool-block" id="dice-pool-bar">
        <div class="dice-pool-header">
          <span data-i18n="dice_pool_label"></span>
          <button type="button" class="icon-btn" id="btn-dice-pool-add">+</button>
        </div>
        <div class="dice-pool-list" id="dice-pool-list"></div>
      </div>
      <div class="character-roster" id="character-roster">
        <h3 data-i18n="character_roster_title"></h3>
        <div class="character-roster-table-wrap">
          <table class="character-roster-table" id="character-roster-table">
            <thead>
              <tr>
                <th></th>
                <th data-i18n="character_roster_col_name"></th>
                <th data-i18n="character_type_label"></th>
                <th data-i18n="record_level_label"></th>
                <th data-i18n="character_hp_label"></th>
                <th data-i18n="character_fp_label"></th>
                <th data-i18n="record_flask_base_label"></th>
              </tr>
            </thead>
            <tbody id="character-roster-tbody"></tbody>
          </table>
        </div>
        <hr class="roster-skills-divider">
        <div id="character-roster-skills"></div>
      </div>
      <div class="log-panel">
        <div class="log-header">
          <h2 data-i18n="log_title"></h2>
          <button id="btn-log-toggle" type="button" class="icon-btn" aria-label="toggle log">👁</button>
        </div>
        <ul id="log-list"></ul>
      </div>

      <div class="threat-ref-block">
        <button type="button" id="btn-open-rulebook" data-i18n="rulebook_open_button"></button>
      </div>
    </section>

    <div id="rulebook-modal" class="modal" hidden>
      <div class="modal-box gallery-modal-box">
        <button type="button" id="btn-rulebook-floating-close" class="modal-floating-close" aria-label="close">×</button>
        <h2 data-i18n="boss_rulebook_title"></h2>
        <div class="rulebook-tabs" id="rulebook-tabs">
          <button type="button" class="rulebook-tab-btn active" data-tab="nightking" data-i18n="rulebook_tab_nightking"></button>
          <button type="button" class="rulebook-tab-btn" data-tab="miniking" data-i18n="rulebook_tab_miniking"></button>
          <button type="button" class="rulebook-tab-btn" data-tab="enemy" data-i18n="rulebook_tab_enemy"></button>
          <button type="button" class="rulebook-tab-btn" data-tab="weapon" data-i18n="rulebook_tab_weapon"></button>
          <button type="button" class="rulebook-tab-btn" data-tab="talisman" data-i18n="rulebook_tab_talisman"></button>
          <button type="button" class="rulebook-tab-btn" data-tab="consumable" data-i18n="rulebook_tab_consumable"></button>
          <button type="button" class="rulebook-tab-btn" data-tab="board" data-i18n="rulebook_tab_board"></button>
          <button type="button" class="rulebook-tab-btn" data-tab="event" data-i18n="rulebook_tab_event"></button>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-nightking">
          <div id="boss-rulebook-list"></div>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-miniking" hidden>
          <p class="threat-ref-body" data-i18n="rulebook_no_data"></p>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-enemy" hidden>
          <div class="weapon-search-box">
            <input type="text" id="enemy-rulebook-search-input">
          </div>
          <div class="weapon-subtabs" id="enemy-family-subtabs"></div>
          <div id="enemy-rulebook-list"></div>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-weapon" hidden>
          <div class="weapon-subtabs" id="weapon-subtabs"></div>
          <div id="weapon-subtab-panels"></div>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-talisman" hidden>
          <div id="talisman-acquisition-table"></div>
          <div id="talisman-rulebook-list"></div>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-consumable" hidden>
          <div id="consumable-rulebook-list"></div>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-board" hidden>
          <p class="threat-ref-body" data-i18n="rulebook_no_data"></p>
        </div>
        <div class="rulebook-tab-panel" id="rulebook-panel-event" hidden>
          <p class="threat-ref-body" data-i18n="rulebook_no_data"></p>
        </div>
        <div class="actions">
          <button type="button" id="btn-rulebook-close" class="primary-btn" data-i18n="close_button"></button>
        </div>
      </div>
    </div>

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
        <p id="keep-terrain-note" class="threat-ref-body" hidden></p>
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
          <div id="roll-effects-list" class="tl-list"></div>
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

    <div id="character-drawer" class="drawer">
      <div class="drawer-backdrop" id="character-drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 id="character-drawer-name"></h2>
        <p id="character-type-badge" class="character-type-badge"></p>
        <img id="character-portrait" class="character-portrait" hidden>

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
            <span id="char-revival-bonus-marker" class="level-bonus-marker"></span>
          </label>
        </div>

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

        <div class="tag-field" data-field="notes">
          <h3 data-i18n="character_notes_label"></h3>
          <div class="tag-list" id="tag-list-notes"></div>
          <div class="tag-add-row">
            <input type="text" id="tag-input-notes">
            <button type="button" class="tag-add-btn" data-field="notes" data-i18n="tag_add_button"></button>
          </div>
        </div>

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

        <div class="weapon-db-field">
          <h3 data-i18n="weapon_db_title"></h3>
          <div class="weapon-search-box">
            <input type="text" id="weapon-search-input">
            <div class="weapon-search-results" id="weapon-search-results" hidden></div>
          </div>
          <div id="weapon-list"></div>
        </div>

        <div class="weapon-db-field">
          <h3 data-i18n="talisman_db_title"></h3>
          <div class="weapon-search-box">
            <input type="text" id="talisman-search-input">
            <div class="weapon-search-results" id="talisman-search-results" hidden></div>
          </div>
          <div id="talisman-list"></div>
        </div>

        <div class="weapon-db-field">
          <h3 data-i18n="consumable_db_title"></h3>
          <div class="weapon-search-box">
            <input type="text" id="consumable-search-input">
            <div class="weapon-search-results" id="consumable-search-results" hidden></div>
          </div>
          <div id="consumable-list"></div>
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
            <button type="button" id="btn-attached-roll-2d" data-i18n="attached_roll_2d_button"></button>
            <button type="button" id="btn-attached-toggle-all" data-i18n="relic_show_all_button"></button>
          </div>
          <div class="dice-pool-list" id="attached-dice-display"></div>
          <div id="attached-candidates"></div>
          <div id="attached-learned-list"></div>
          <div id="attached-all-list" hidden></div>
        </div>

        <div class="actions">
          <button id="btn-delete-character" type="button" class="danger-btn" data-i18n="delete_character_button"></button>
          <button id="btn-character-close" type="button" class="primary-btn" data-i18n="close_button"></button>
        </div>
      </div>
    </div>

    <div id="skills-drawer" class="drawer drawer-left">
      <div class="drawer-backdrop" id="skills-drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 id="skills-drawer-name"></h2>
        <div class="threat-ref-block">
          <h3 data-i18n="cv_active_skills_title"></h3>
          <div id="skills-drawer-active"></div>
        </div>
        <div class="threat-ref-block">
          <h3 data-i18n="cv_passives_title"></h3>
          <div id="skills-drawer-passive"></div>
        </div>
        <div class="actions">
          <button id="btn-skills-drawer-close" type="button" class="primary-btn" data-i18n="close_button"></button>
        </div>
      </div>
    </div>

    <div id="weapon-detail-drawer" class="drawer drawer-left">
      <div class="drawer-backdrop" id="weapon-detail-drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 data-i18n="weapon_detail_drawer_title"></h2>
        <div id="weapon-detail-drawer-body"></div>
        <div class="actions">
          <button id="btn-weapon-detail-drawer-close" type="button" class="primary-btn" data-i18n="close_button"></button>
        </div>
      </div>
    </div>

    <div id="battle-drawer" class="drawer">
      <div class="drawer-backdrop" id="battle-drawer-backdrop"></div>
      <div class="drawer-panel">
        <h2 data-i18n="battle_sheet_title"></h2>

        <div class="threat-ref-block">
          <h3 data-i18n="battle_enemy_lookup_title"></h3>
          <div class="weapon-search-box">
            <input type="text" id="battle-enemy-search-input">
            <div class="weapon-search-results" id="battle-enemy-search-results" hidden></div>
          </div>
          <div id="battle-enemy-lookup-result"></div>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="battle_areas_title"></h3>
          <div class="battle-areas">
            <div class="battle-area">
              <h4 data-i18n="battle_front_area_label"></h4>
              <p class="threat-ref-body" data-i18n="battle_front_area_note"></p>
              <div class="battle-toggle-grid" id="battle-front-grid"></div>
            </div>
            <div class="battle-area">
              <h4 data-i18n="battle_back_area_label"></h4>
              <p class="threat-ref-body" data-i18n="battle_back_area_note"></p>
              <div class="battle-toggle-grid" id="battle-back-grid"></div>
            </div>
          </div>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="battle_enemy_hp_title"></h3>
          <p class="threat-ref-body" data-i18n="battle_hp_apply_order_note"></p>
          <div class="battle-hp-grid" id="battle-enemy-hp-grid"></div>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="battle_mob_hp_title"></h3>
          <p class="threat-ref-body" data-i18n="battle_mob_hp_note"></p>
          <div id="battle-mob-hp-list"></div>
          <button type="button" id="btn-battle-add-mob-row" data-i18n="battle_add_mob_row_button"></button>
        </div>

        <div class="threat-ref-block">
          <h3 data-i18n="battle_pc_damage_title"></h3>
          <p class="threat-ref-body" id="battle-pc-damage-body"></p>
        </div>
        <div class="threat-ref-block">
          <h3 data-i18n="battle_enemy_damage_title"></h3>
          <p class="threat-ref-body" id="battle-enemy-damage-body"></p>
        </div>
        <div class="threat-ref-block">
          <h3 data-i18n="battle_position_title"></h3>
          <p class="threat-ref-body" id="battle-position-body"></p>
        </div>
        <div class="threat-ref-block">
          <h3 data-i18n="battle_simple_combat_title"></h3>
          <p class="threat-ref-body" id="battle-simple-combat-body"></p>
        </div>
        <div class="threat-ref-block">
          <h3 data-i18n="battle_pc_count_title"></h3>
          <p class="threat-ref-body" id="battle-pc-count-body"></p>
        </div>

        <div class="actions">
          <button id="btn-battle-clear" type="button" class="danger-btn" data-i18n="battle_clear_button"></button>
          <button id="btn-battle-drawer-close" type="button" class="primary-btn" data-i18n="close_button"></button>
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
        extra_scripts=(
            "games.js",
            "firebase_config.js",
            "game_storage.js",
            "scenarios.js",
            "character_types.js",
            "weapons.js",
            "weapon_rulebook.js",
            "talismans.js",
            "consumables.js",
            "character_drawer.js",
            "night_bosses.js",
            "night_boss_rulebook.js",
            "enemies.js",
            "night.js",
        ),
    )
