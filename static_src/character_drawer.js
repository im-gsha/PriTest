(function () {
  // characters.js（角色一覧ページ）と night.js（盤面ページ）の両方から
  // 使う共通のキャラクタードロワー（編集モーダル）ロジック。
  // 呼び出し側は init({ characters, save, onChange }) でこのモジュールに
  // 自分の characters 配列（参照）と永続化関数を渡す。
  var CharacterTypes = window.PriTestCharacterTypes;
  var TAG_FIELDS = ["status", "equipment", "weapons", "skills", "items", "talismans", "buildup"];
  var MAX_DICE_POOL = 20;

  function rollD6() {
    return 1 + Math.floor(Math.random() * 6);
  }

  // 骰子池（1-6の出目配列）をアイコン＋削除ボタンで描画する。
  // night.js の共有骰子池、このファイル自身のキャラクター別骰子池の両方から使う。
  function renderDicePool(listEl, pool, onRemove, addBtnEl) {
    listEl.innerHTML = "";
    pool.forEach(function (value, index) {
      var die = document.createElement("span");
      die.className = "dice-item";
      die.textContent = value;

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "dice-remove";
      remove.textContent = "×";
      remove.addEventListener("click", function () {
        onRemove(index);
      });

      die.appendChild(remove);
      listEl.appendChild(die);
    });
    if (addBtnEl) addBtnEl.disabled = pool.length >= MAX_DICE_POOL;
  }

  // 出目のみを表示する（削除ボタン無し）。レベルアップ遺物効果の擲骰結果表示に使う。
  function renderDiceDisplay(listEl, values) {
    listEl.innerHTML = "";
    values.forEach(function (v) {
      var die = document.createElement("span");
      die.className = "dice-item";
      die.textContent = v;
      listEl.appendChild(die);
    });
  }

  // --- レベルアップ遺物効果の習得（骰子2個で正選／逆選） ---
  // レベル4-15の12回分、群A(1-2)/B(3-4)/C(5-6)＋群内位置(1-6)で対象を決める。
  var RELIC_LEVEL_START = 4;
  var RELIC_LEVEL_END = 15;
  var relicRolledDice = null; // { x, y } | null

  function relicEffectKey(typeId, groupIndex, effectIndex) {
    return typeId + "-r" + groupIndex + "-" + effectIndex;
  }

  function relicThird(value) {
    if (value <= 2) return 0;
    if (value <= 4) return 1;
    return 2;
  }

  function relicMaxLearnable(level) {
    return Math.max(0, Math.min(level - (RELIC_LEVEL_START - 1), RELIC_LEVEL_END - RELIC_LEVEL_START + 1));
  }

  // groupValue で群（A/B/C）、indexValue（1-6）で群内の位置を決める。
  // 該当位置が存在しない、または既に習得済みなら null（=選択不可）を返す。
  function relicCandidateFor(type, c, groupValue, indexValue) {
    var group = type.relicEffectGroups[relicThird(groupValue)];
    var idx = indexValue - 1;
    if (!group || idx >= group.effects.length) return null;
    var key = relicEffectKey(type.id, relicThird(groupValue), idx);
    if ((c.learnedRelicEffects || []).indexOf(key) !== -1) return null;
    return { key: key, effect: group.effects[idx] };
  }

  function relicAllUnlearned(type, c) {
    var out = [];
    (type.relicEffectGroups || []).forEach(function (g, gi) {
      g.effects.forEach(function (e, ei) {
        var key = relicEffectKey(type.id, gi, ei);
        if ((c.learnedRelicEffects || []).indexOf(key) === -1) out.push({ key: key, effect: e });
      });
    });
    return out;
  }

  function renderRelicCandidateCard(container, candidate, c) {
    var card = document.createElement("div");
    card.className = "relic-candidate-card";

    var title = document.createElement("div");
    title.className = "relic-candidate-name";
    title.textContent = CharacterTypes.localizedText(candidate.effect.name) + "［" + candidate.effect.kind + "］";
    card.appendChild(title);

    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = CharacterTypes.localizedText(candidate.effect.body);
    card.appendChild(body);

    var learnBtn = document.createElement("button");
    learnBtn.type = "button";
    learnBtn.textContent = window.I18N.t("relic_learn_button");
    learnBtn.addEventListener("click", function () {
      if (!c.learnedRelicEffects) c.learnedRelicEffects = [];
      c.learnedRelicEffects.push(candidate.key);
      saveFn();
      relicRolledDice = null;
      renderRelicSection();
      renderTypeReference(c);
    });
    card.appendChild(learnBtn);

    container.appendChild(card);
  }

  function renderRelicCandidates() {
    var c = findCharacter(activeCharacterId);
    var type = c && c.typeId ? CharacterTypes.get(c.typeId) : null;
    var candidatesEl = document.getElementById("relic-candidates");
    if (!candidatesEl) return;
    candidatesEl.innerHTML = "";
    if (!c || !type || !relicRolledDice) return;
    if ((c.learnedRelicEffects || []).length >= relicMaxLearnable(c.level)) return;

    var forward = relicCandidateFor(type, c, relicRolledDice.x, relicRolledDice.y);
    var reverse = relicCandidateFor(type, c, relicRolledDice.y, relicRolledDice.x);
    if (forward && reverse && forward.key === reverse.key) reverse = null;

    if (forward || reverse) {
      var label = document.createElement("p");
      label.className = "threat-ref-body";
      label.textContent = window.I18N.t("relic_choose_one_label");
      candidatesEl.appendChild(label);
      if (forward) renderRelicCandidateCard(candidatesEl, forward, c);
      if (reverse) renderRelicCandidateCard(candidatesEl, reverse, c);
    } else {
      var freeLabel = document.createElement("p");
      freeLabel.className = "threat-ref-body";
      freeLabel.textContent = window.I18N.t("relic_free_choice_label");
      candidatesEl.appendChild(freeLabel);
      relicAllUnlearned(type, c).forEach(function (cand) {
        renderRelicCandidateCard(candidatesEl, cand, c);
      });
    }
  }

  function renderRelicSection() {
    var c = findCharacter(activeCharacterId);
    var type = c && c.typeId ? CharacterTypes.get(c.typeId) : null;
    var progressEl = document.getElementById("relic-progress-text");
    var rollBtn = document.getElementById("btn-relic-roll");
    var diceEl = document.getElementById("relic-dice-display");
    if (!progressEl) return;

    if (!c || !type) {
      progressEl.textContent = "";
      if (rollBtn) rollBtn.disabled = true;
      if (diceEl) diceEl.innerHTML = "";
      document.getElementById("relic-candidates").innerHTML = "";
      return;
    }

    var learned = (c.learnedRelicEffects || []).length;
    var maxLearnable = relicMaxLearnable(c.level);
    progressEl.textContent = window.I18N.t("relic_progress_text", { learned: learned, max: maxLearnable });
    if (rollBtn) rollBtn.disabled = learned >= maxLearnable;
    if (diceEl) {
      if (relicRolledDice) renderDiceDisplay(diceEl, [relicRolledDice.x, relicRolledDice.y]);
      else diceEl.innerHTML = "";
    }
    renderRelicCandidates();
  }

  function handleRelicRoll() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    if ((c.learnedRelicEffects || []).length >= relicMaxLearnable(c.level)) return;
    relicRolledDice = { x: rollD6(), y: rollD6() };
    renderRelicSection();
  }

  // レベルアップで得られるHP/FP/加護上限の+1（2等HP→3等FP→4等加護、以降繰り返し）を、
  // 該当する項目のラベル横に「(+1)」として表示する。
  function renderLevelBonusMarkers(c) {
    var hpEl = document.getElementById("char-hp-level-bonus");
    var fpEl = document.getElementById("char-fp-level-bonus");
    var blessingEl = document.getElementById("char-blessing-level-bonus");
    if (!hpEl || !fpEl || !blessingEl) return;
    hpEl.textContent = "";
    fpEl.textContent = "";
    blessingEl.textContent = "";
    if (!c || c.level < 2) return;
    var order = [hpEl, fpEl, blessingEl];
    var target = order[(c.level - 2) % 3];
    target.textContent = window.I18N.t("level_bonus_marker");
  }

  var characters = [];
  var activeCharacterId = null;
  var saveFn = function () {};
  var onChangeFn = function () {};

  function newCharacter(name, typeId) {
    return {
      id: "c" + Date.now() + Math.floor(Math.random() * 1000),
      name: name,
      typeId: typeId || null,
      entered: false,
      hp: { current: 0, max: 0 },
      fp: { current: 0, max: 0 },
      blessing: "",
      attribute: "",
      ultimate: "",
      status: [],
      equipment: [],
      weapons: [],
      skills: [],
      items: [],
      level: 1,
      runes: 0,
      blessingSlots: { current: 0, max: 0 },
      flaskBase: { used: 0, max: 3 },
      flaskExtra: { used: 0, max: 0 },
      revivalCount: 0,
      talismans: [],
      buildup: [],
      abilityUses: {},
      dicePool: [],
      learnedRelicEffects: [],
    };
  }

  // 旧データ互換: 新フィールドが無い既存キャラクターに初期値を補完する
  function ensureDefaults(c) {
    var fallback = newCharacter(c.name, c.typeId);
    Object.keys(fallback).forEach(function (key) {
      if (c[key] === undefined) c[key] = fallback[key];
    });
    return c;
  }

  function findCharacter(id) {
    return (
      characters.filter(function (c) {
        return c.id === id;
      })[0] || null
    );
  }

  function renderTagList(field) {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    var container = document.getElementById("tag-list-" + field);
    if (!container) return;
    container.innerHTML = "";
    c[field].forEach(function (value, index) {
      var chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = value;

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "tag-remove";
      remove.textContent = "×";
      remove.addEventListener("click", function () {
        c[field].splice(index, 1);
        saveFn();
        renderTagList(field);
      });

      chip.appendChild(remove);
      container.appendChild(chip);
    });
  }

  function addTag(field) {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    var input = document.getElementById("tag-input-" + field);
    var value = input.value.trim();
    if (!value) return;
    c[field].push(value);
    input.value = "";
    saveFn();
    renderTagList(field);
  }

  // 1つのアビリティ/スキル/アーツ/遺物効果を折りたたみ表示（クリックで詳細展開）で描画する。
  // レベル未到達なら表示しない。使用回数がある場合は残り回数の増減ボタンも付ける。
  function renderAbilityEntry(container, entry, c) {
    if (entry.level && c.level < entry.level) return;
    var details = document.createElement("details");
    details.className = "ability-entry";
    var summary = document.createElement("summary");
    summary.textContent =
      CharacterTypes.localizedText(entry.name) +
      "［" + entry.kind + "］" +
      (entry.level ? "　" + window.I18N.t("ability_level_label", { level: entry.level }) : "");
    details.appendChild(summary);

    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = CharacterTypes.localizedText(entry.body);
    details.appendChild(body);

    if (entry.uses && entry.id) {
      var usesRow = document.createElement("div");
      usesRow.className = "level-control ability-uses";

      var label = document.createElement("span");
      label.className = "ability-uses-label";
      label.textContent = window.I18N.t("ability_uses_label");

      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "level-btn";
      minus.textContent = "-";

      var value = document.createElement("span");
      value.className = "level-value";

      var plus = document.createElement("button");
      plus.type = "button";
      plus.className = "level-btn";
      plus.textContent = "+";

      function remaining() {
        var v = c.abilityUses && c.abilityUses[entry.id];
        return typeof v === "number" ? v : entry.uses;
      }
      function renderVal() {
        value.textContent = remaining() + "/" + entry.uses;
      }
      renderVal();
      minus.addEventListener("click", function () {
        if (!c.abilityUses) c.abilityUses = {};
        c.abilityUses[entry.id] = Math.max(0, remaining() - 1);
        renderVal();
        saveFn();
      });
      plus.addEventListener("click", function () {
        if (!c.abilityUses) c.abilityUses = {};
        c.abilityUses[entry.id] = Math.min(entry.uses, remaining() + 1);
        renderVal();
        saveFn();
      });

      usesRow.appendChild(label);
      usesRow.appendChild(minus);
      usesRow.appendChild(value);
      usesRow.appendChild(plus);
      details.appendChild(usesRow);
    }

    container.appendChild(details);
  }

  // type（夜渡りタイプ）の全アビリティ/スキル/アーツ/遺物効果を
  // 「可発動技能（Action/Defense）」「被動能力（Passive）」の2コンテナに振り分けて描画する。
  function renderAbilitySections(c, type, activeContainer, passiveContainer) {
    activeContainer.innerHTML = "";
    passiveContainer.innerHTML = "";
    if (!type) return;
    var entries = [].concat(type.abilities || []).concat(type.skills || []).concat(type.arts || []);
    var learned = c.learnedRelicEffects || [];
    (type.relicEffectGroups || []).forEach(function (g, gi) {
      g.effects.forEach(function (e, ei) {
        if (learned.indexOf(relicEffectKey(type.id, gi, ei)) !== -1) entries.push(e);
      });
    });
    entries.forEach(function (entry) {
      renderAbilityEntry(entry.kind === "Passive" ? passiveContainer : activeContainer, entry, c);
    });
  }

  function renderTypeReference(c) {
    var block = document.getElementById("type-reference-block");
    var type = c.typeId ? CharacterTypes.get(c.typeId) : null;
    var badge = document.getElementById("character-type-badge");
    if (badge) {
      badge.textContent = type
        ? window.I18N.t("character_type_label") + window.I18N.t("colon_separator") + CharacterTypes.localizedName(type.name)
        : "";
    }
    var portrait = document.getElementById("character-portrait");
    if (portrait) {
      var src = type ? CharacterTypes.imagePath(type) : null;
      if (src) {
        portrait.src = src;
        portrait.alt = CharacterTypes.localizedName(type.name);
        portrait.hidden = false;
      } else {
        portrait.hidden = true;
      }
    }
    if (!block) return;
    if (!type) {
      block.hidden = true;
      document.getElementById("type-active-skills").innerHTML = "";
      document.getElementById("type-passives").innerHTML = "";
      return;
    }
    block.hidden = false;
    document.getElementById("type-reference-title").textContent = CharacterTypes.localizedName(type.name);

    var lines = [
      window.I18N.t("stat_stamina_dice") + window.I18N.t("colon_separator") + type.staminaDice.action + "／" + type.staminaDice.defense,
      window.I18N.t("stat_resource_slots") +
        window.I18N.t("colon_separator") +
        type.resourceSlots.hp + "／" + type.resourceSlots.fp + "／" + type.resourceSlots.blessing,
      window.I18N.t("stat_check_values") +
        window.I18N.t("colon_separator") +
        type.checkValues.luck + "／" + type.checkValues.physical + "／" + type.checkValues.mental,
      window.I18N.t("stat_power_mod") +
        window.I18N.t("colon_separator") +
        [
          type.powerMod.strength,
          type.powerMod.dex,
          type.powerMod.balance,
          type.powerMod.intelligence,
          type.powerMod.faith,
          type.powerMod.arcane,
        ].join("／"),
      window.I18N.t("stat_favored_weapons") + window.I18N.t("colon_separator") + CharacterTypes.localizedText(type.favoredWeapons),
      window.I18N.t("stat_starting_equipment") + window.I18N.t("colon_separator") + CharacterTypes.localizedText(type.startingEquipment),
    ];
    document.getElementById("type-reference-stats").textContent = lines.join("\n");

    renderAbilitySections(c, type, document.getElementById("type-active-skills"), document.getElementById("type-passives"));
  }

  function renderCharacterDicePool() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    var listEl = document.getElementById("char-dice-pool-list");
    if (!listEl) return;
    renderDicePool(
      listEl,
      c.dicePool,
      function (index) {
        c.dicePool.splice(index, 1);
        saveFn();
        renderCharacterDicePool();
      },
      document.getElementById("btn-char-dice-add")
    );
  }

  function openDrawer(id) {
    activeCharacterId = id;
    var c = findCharacter(id);
    if (!c) return;

    document.getElementById("character-drawer-name").textContent = c.name;
    document.getElementById("char-entered").checked = c.entered;
    document.getElementById("char-hp-current").value = c.hp.current;
    document.getElementById("char-hp-max").value = c.hp.max;
    document.getElementById("char-fp-current").value = c.fp.current;
    document.getElementById("char-fp-max").value = c.fp.max;
    document.getElementById("char-blessing").value = c.blessing;
    document.getElementById("char-attribute").value = c.attribute;
    document.getElementById("char-ultimate").value = c.ultimate;
    document.getElementById("char-level").value = c.level;
    document.getElementById("char-runes").value = c.runes;
    document.getElementById("char-blessing-current").value = c.blessingSlots.current;
    document.getElementById("char-blessing-max").value = c.blessingSlots.max;
    document.getElementById("char-flask-base-used").value = c.flaskBase.used;
    document.getElementById("char-flask-base-max").value = c.flaskBase.max;
    document.getElementById("char-flask-extra-used").value = c.flaskExtra.used;
    document.getElementById("char-flask-extra-max").value = c.flaskExtra.max;
    document.getElementById("char-revival-count").value = c.revivalCount;
    TAG_FIELDS.forEach(renderTagList);
    relicRolledDice = null;
    renderTypeReference(c);
    renderCharacterDicePool();
    renderRelicSection();
    renderLevelBonusMarkers(c);

    document.getElementById("character-drawer").classList.add("open");
  }

  function closeDrawer() {
    document.getElementById("character-drawer").classList.remove("open");
    activeCharacterId = null;
    onChangeFn();
  }

  function bindFieldSave(elId, apply) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.addEventListener("change", function (e) {
      var c = findCharacter(activeCharacterId);
      if (!c) return;
      apply(c, e.target);
      saveFn();
      if (elId === "char-entered") onChangeFn();
      if (elId === "char-level") {
        relicRolledDice = null;
        renderTypeReference(c);
        renderRelicSection();
        renderLevelBonusMarkers(c);
      }
    });
  }

  function handleDeleteCharacter() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    if (!window.confirm(window.I18N.t("character_confirm_delete", { name: c.name }))) return;
    characters.splice(characters.indexOf(c), 1);
    saveFn();
    closeDrawer();
  }

  function bindEvents() {
    document.getElementById("btn-character-close").addEventListener("click", closeDrawer);
    document.getElementById("character-drawer-backdrop").addEventListener("click", closeDrawer);
    document.getElementById("btn-delete-character").addEventListener("click", handleDeleteCharacter);
    document.getElementById("btn-char-dice-add").addEventListener("click", function () {
      var c = findCharacter(activeCharacterId);
      if (!c || c.dicePool.length >= MAX_DICE_POOL) return;
      c.dicePool.push(rollD6());
      saveFn();
      renderCharacterDicePool();
    });
    document.getElementById("btn-relic-roll").addEventListener("click", handleRelicRoll);

    document.querySelectorAll(".tag-add-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addTag(btn.getAttribute("data-field"));
      });
    });
    TAG_FIELDS.forEach(function (field) {
      var input = document.getElementById("tag-input-" + field);
      if (!input) return;
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          addTag(field);
        }
      });
    });

    bindFieldSave("char-entered", function (c, el) {
      c.entered = el.checked;
    });
    bindFieldSave("char-hp-current", function (c, el) {
      c.hp.current = Number(el.value) || 0;
    });
    bindFieldSave("char-hp-max", function (c, el) {
      c.hp.max = Number(el.value) || 0;
    });
    bindFieldSave("char-fp-current", function (c, el) {
      c.fp.current = Number(el.value) || 0;
    });
    bindFieldSave("char-fp-max", function (c, el) {
      c.fp.max = Number(el.value) || 0;
    });
    bindFieldSave("char-blessing", function (c, el) {
      c.blessing = el.value;
    });
    bindFieldSave("char-attribute", function (c, el) {
      c.attribute = el.value;
    });
    bindFieldSave("char-ultimate", function (c, el) {
      c.ultimate = el.value;
    });
    bindFieldSave("char-level", function (c, el) {
      c.level = Number(el.value) || 0;
    });
    bindFieldSave("char-runes", function (c, el) {
      c.runes = Number(el.value) || 0;
    });
    bindFieldSave("char-blessing-current", function (c, el) {
      c.blessingSlots.current = Number(el.value) || 0;
    });
    bindFieldSave("char-blessing-max", function (c, el) {
      c.blessingSlots.max = Number(el.value) || 0;
    });
    bindFieldSave("char-flask-base-used", function (c, el) {
      c.flaskBase.used = Number(el.value) || 0;
    });
    bindFieldSave("char-flask-base-max", function (c, el) {
      c.flaskBase.max = Number(el.value) || 0;
    });
    bindFieldSave("char-flask-extra-used", function (c, el) {
      c.flaskExtra.used = Number(el.value) || 0;
    });
    bindFieldSave("char-flask-extra-max", function (c, el) {
      c.flaskExtra.max = Number(el.value) || 0;
    });
    bindFieldSave("char-revival-count", function (c, el) {
      c.revivalCount = Number(el.value) || 0;
    });

    window.addEventListener("i18n:change", function () {
      if (activeCharacterId) openDrawer(activeCharacterId);
    });
  }

  function init(options) {
    characters = options.characters;
    saveFn = options.save;
    onChangeFn = options.onChange || function () {};
    bindEvents();
  }

  window.PriTestCharacterDrawer = {
    init: init,
    open: openDrawer,
    close: closeDrawer,
    newCharacter: newCharacter,
    ensureDefaults: ensureDefaults,
    renderAbilitySections: renderAbilitySections,
    rollD6: rollD6,
    renderDicePool: renderDicePool,
    MAX_DICE_POOL: MAX_DICE_POOL,
  };
})();
