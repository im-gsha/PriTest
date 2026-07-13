(function () {
  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var SUIT_CLASS = { S: "suit-black", H: "suit-red", D: "suit-orange", C: "suit-green" };
  var SUIT_CLASSES = ["suit-black", "suit-red", "suit-orange", "suit-green"];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SLOT_COUNT = 9;
  var NEW_GAME_PASSWORD = "night";
  var RULEBOOK_PASSWORD = "nightnight";
  var RULEBOOK_SESSION_KEY = "pritest-rulebook-session";
  var LEVEL_STEPS = [null, 0, 1, 2, 3, 4, 5]; // null = "全"（未指定）

  var Games = window.PriTestGames;
  var Scenarios = window.PriTestScenarios;
  var CharacterTypes = window.PriTestCharacterTypes;
  var CharacterDrawer = window.PriTestCharacterDrawer;
  var gameId = Games.getGameIdFromQuery();
  var game = gameId ? Games.get(gameId) : null;
  var scenario = game && game.scenarioId ? Scenarios.get(game.scenarioId) : null;
  var STORAGE_KEY = "pritest-night-state-" + gameId;
  var CHARACTERS_KEY = "pritest-characters-" + gameId;
  var rosterCharacters = [];

  function loadRosterCharacters() {
    var raw = localStorage.getItem(CHARACTERS_KEY);
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      var list = Array.isArray(data) ? data : [];
      return list.map(CharacterDrawer.ensureDefaults);
    } catch (e) {
      return [];
    }
  }

  function saveRosterCharacters() {
    localStorage.setItem(CHARACTERS_KEY, JSON.stringify(rosterCharacters));
  }

  function renderCharacterRoster() {
    var tbody = document.getElementById("character-roster-tbody");
    var skillsWrap = document.getElementById("character-roster-skills");
    tbody.innerHTML = "";
    skillsWrap.innerHTML = "";

    var entered = rosterCharacters.filter(function (c) {
      return c.entered;
    });

    if (entered.length === 0) {
      var emptyRow = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = 6;
      td.className = "character-roster-empty";
      td.textContent = window.I18N.t("character_roster_empty");
      emptyRow.appendChild(td);
      tbody.appendChild(emptyRow);
      return;
    }

    entered.forEach(function (c) {
      var type = c.typeId && CharacterTypes ? CharacterTypes.get(c.typeId) : null;

      var tr = document.createElement("tr");

      var thumbTd = document.createElement("td");
      var thumbSrc = type ? CharacterTypes.imagePath(type) : null;
      if (thumbSrc) {
        var thumb = document.createElement("img");
        thumb.className = "character-thumb";
        thumb.src = thumbSrc;
        thumb.alt = c.name;
        thumbTd.appendChild(thumb);
      }
      tr.appendChild(thumbTd);

      var nameTd = document.createElement("td");
      var nameBtn = document.createElement("button");
      nameBtn.type = "button";
      nameBtn.className = "character-name-btn";
      nameBtn.textContent = c.name;
      nameBtn.addEventListener("click", function () {
        CharacterDrawer.open(c.id);
      });
      nameTd.appendChild(nameBtn);
      tr.appendChild(nameTd);

      [
        type ? CharacterTypes.localizedName(type.name) : "-",
        c.level,
        c.hp.current + "/" + c.hp.max,
        c.fp.current + "/" + c.fp.max,
      ].forEach(function (val) {
        var cell = document.createElement("td");
        cell.textContent = val;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);

      var block = document.createElement("div");
      block.className = "roster-character-block";
      var h4 = document.createElement("h4");
      h4.textContent = c.name;
      block.appendChild(h4);

      var activeTitle = document.createElement("h5");
      activeTitle.textContent = window.I18N.t("cv_active_skills_title");
      var activeWrap = document.createElement("div");
      var passiveTitle = document.createElement("h5");
      passiveTitle.textContent = window.I18N.t("cv_passives_title");
      var passiveWrap = document.createElement("div");
      if (type) CharacterDrawer.renderAbilitySections(c, type, activeWrap, passiveWrap);

      block.appendChild(activeTitle);
      block.appendChild(activeWrap);
      block.appendChild(passiveTitle);
      block.appendChild(passiveWrap);
      skillsWrap.appendChild(block);
    });
  }

  function buildDeck() {
    var deck = [];
    SUITS.forEach(function (suit) {
      RANKS.forEach(function (rank) {
        deck.push({
          code: suit + "-" + rank,
          suit: suit,
          rank: rank,
          label: SUIT_SYMBOL[suit] + rank,
          colorClass: SUIT_CLASS[suit],
        });
      });
    });
    return deck;
  }

  var DECK = buildDeck();
  var CARD_BY_CODE = {};
  DECK.forEach(function (c) {
    CARD_BY_CODE[c.code] = c;
  });

  function defaultChecks() {
    return { one: false, all: false };
  }

  var TIME_LOSS_ROW_DEFS = [
    { kind: "threat", boxes: 2 },
    { kind: "rain", tier: 1, boxes: 2 },
    { kind: "threat", boxes: 2 },
    { kind: "rain", tier: 2, boxes: 2 },
    { kind: "threat", boxes: 2 },
    { kind: "rain", tier: 3, boxes: 2 },
    { kind: "visit", boxes: 1 },
  ];

  function defaultTimeLossDay() {
    return TIME_LOSS_ROW_DEFS.map(function (def) {
      return new Array(def.boxes).fill(false);
    });
  }

  function defaultTimeLoss() {
    return { day1: defaultTimeLossDay(), day2: defaultTimeLossDay() };
  }

  function defaultWanderingBlessing() {
    return { base: [false, false, false], extra: [false, false, false] };
  }

  var ROLL_EFFECTS = [
    { id: "enemy_damage", tiers: 4 },
    { id: "enemy_hp", tiers: 2 },
    { id: "max_blessing", tiers: 2 },
    { id: "attribute_buildup", tiers: 2 },
    { id: "flask_uses", tiers: 2 },
  ];

  function defaultRollEffects() {
    var obj = {};
    ROLL_EFFECTS.forEach(function (e) {
      obj[e.id] = 0;
    });
    return obj;
  }

  function defaultBattleState() {
    return {
      frontNames: ["", "", "", "", "", ""],
      backNames: ["", "", "", "", "", ""],
      enemyHp: new Array(40).fill(false),
      mobHpRows: [],
    };
  }

  // イベントチット（靈脈・商人・祝福・強敵・ランダム）: 毎晩、9マスにランダム配置され、
  // カードを翻開するまで内容は分からない（自訂・固定副本のどちらでも共通）。
  var EVENT_CHIP_TYPES = [
    { id: "spirit_vein", icon: "spirit-vein.png" },
    { id: "merchant", icon: "merchant.png" },
    { id: "merchant", icon: "merchant.png" },
    { id: "blessing", icon: "blessing.png" },
    { id: "blessing", icon: "blessing.png" },
    { id: "blessing", icon: "blessing.png" },
    { id: "strong_enemy", icon: "strong-enemy.png" },
    { id: "strong_enemy", icon: "strong-enemy.png" },
    { id: "random", icon: "random.png" },
  ];

  function rollEventChips() {
    return shuffle(EVENT_CHIP_TYPES.map(function (c) { return c.id; }));
  }

  var state = {
    slots: new Array(SLOT_COUNT).fill(null), // { code, revealed } | null
    cardLevels: new Array(SLOT_COUNT).fill(null), // null("全") | 0-5
    eventChips: new Array(SLOT_COUNT).fill(null), // 各マスのイベントチット（翻開まで非公開）
    boardStarted: false,
    log: [], // { key, params, time(ms) }
    focusedIndex: null,
    selection: new Set(),
    selectMode: "initial",
    maxSelect: SLOT_COUNT,
    dayNumber: 1,
    startSuit: null,
    endSuit: null,
    startChecks: defaultChecks(),
    endChecks: defaultChecks(),
    startDefeated: false, // 前日の終點が「撃破済み」として起點側に引き継がれた状態か
    startDefeatedDay: null,
    timeLoss: defaultTimeLoss(),
    wanderingBlessing: defaultWanderingBlessing(),
    rollEffects: defaultRollEffects(),
    smithingStone: "",
    stoneswordKey: "",
    grace: "",
    battle: defaultBattleState(),
    dicePool: [],
  };

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function codesOnBoard() {
    var set = new Set();
    state.slots.forEach(function (s) {
      if (s) set.add(s.code);
    });
    return set;
  }

  function isSwappedDay() {
    return state.dayNumber % 2 === 0;
  }

  function fieldLevelsForDay() {
    return isSwappedDay() ? [5, 4, 3] : [0, 1, 2];
  }

  function saveState() {
    var data = {
      slots: state.slots,
      cardLevels: state.cardLevels,
      eventChips: state.eventChips,
      boardStarted: state.boardStarted,
      log: state.log,
      focusedIndex: state.focusedIndex,
      dayNumber: state.dayNumber,
      startSuit: state.startSuit,
      endSuit: state.endSuit,
      startChecks: state.startChecks,
      endChecks: state.endChecks,
      startDefeated: state.startDefeated,
      startDefeatedDay: state.startDefeatedDay,
      timeLoss: state.timeLoss,
      wanderingBlessing: state.wanderingBlessing,
      rollEffects: state.rollEffects,
      smithingStone: state.smithingStone,
      stoneswordKey: state.stoneswordKey,
      grace: state.grace,
      battle: state.battle,
      dicePool: state.dicePool,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadBattleState(raw) {
    var fallback = defaultBattleState();
    if (!raw || typeof raw !== "object") return fallback;
    var frontNames = Array.isArray(raw.frontNames) ? raw.frontNames.slice(0, 6) : fallback.frontNames.slice();
    while (frontNames.length < 6) frontNames.push("");
    var backNames = Array.isArray(raw.backNames) ? raw.backNames.slice(0, 6) : fallback.backNames.slice();
    while (backNames.length < 6) backNames.push("");
    var enemyHp = Array.isArray(raw.enemyHp) ? raw.enemyHp.slice(0, 40).map(Boolean) : fallback.enemyHp.slice();
    while (enemyHp.length < 40) enemyHp.push(false);
    var mobHpRows = Array.isArray(raw.mobHpRows)
      ? raw.mobHpRows.map(function (row) {
          var r = Array.isArray(row) ? row.slice(0, 10).map(Boolean) : [];
          while (r.length < 10) r.push(false);
          return r;
        })
      : [];
    return { frontNames: frontNames, backNames: backNames, enemyHp: enemyHp, mobHpRows: mobHpRows };
  }

  function loadTimeLossDay(raw) {
    var fallback = defaultTimeLossDay();
    if (!Array.isArray(raw)) return fallback;
    return TIME_LOSS_ROW_DEFS.map(function (def, i) {
      var row = raw[i];
      if (!Array.isArray(row)) return fallback[i];
      var out = [];
      for (var b = 0; b < def.boxes; b++) out.push(!!row[b]);
      return out;
    });
  }

  function loadWanderingBlessing(raw) {
    var fallback = defaultWanderingBlessing();
    if (!raw || typeof raw !== "object") return fallback;
    return {
      base: Array.isArray(raw.base) ? [!!raw.base[0], !!raw.base[1], !!raw.base[2]] : fallback.base,
      extra: Array.isArray(raw.extra) ? [!!raw.extra[0], !!raw.extra[1], !!raw.extra[2]] : fallback.extra,
    };
  }

  function loadRollEffects(raw) {
    var fallback = defaultRollEffects();
    if (!raw || typeof raw !== "object") return fallback;
    var out = {};
    ROLL_EFFECTS.forEach(function (e) {
      var v = raw[e.id];
      out[e.id] = typeof v === "number" ? Math.max(0, Math.min(e.tiers, v)) : 0;
    });
    return out;
  }

  function loadChecks(raw) {
    if (!raw || typeof raw !== "object") return defaultChecks();
    return { one: !!raw.one, all: !!raw.all };
  }

  function loadDicePool(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(function (v) {
        return typeof v === "number" && v >= 1 && v <= 6;
      })
      .slice(0, CharacterDrawer.MAX_DICE_POOL);
  }

  function loadState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      if (Array.isArray(data.slots) && data.slots.length === SLOT_COUNT) {
        state.slots = data.slots;
      }
      if (Array.isArray(data.cardLevels) && data.cardLevels.length === SLOT_COUNT) {
        state.cardLevels = data.cardLevels;
      }
      if (Array.isArray(data.eventChips) && data.eventChips.length === SLOT_COUNT) {
        state.eventChips = data.eventChips;
      }
      state.boardStarted = !!data.boardStarted;
      state.log = Array.isArray(data.log) ? data.log : [];
      state.focusedIndex = typeof data.focusedIndex === "number" ? data.focusedIndex : null;
      state.dayNumber = typeof data.dayNumber === "number" ? data.dayNumber : 1;
      state.startSuit = SUITS.indexOf(data.startSuit) !== -1 ? data.startSuit : null;
      state.endSuit = SUITS.indexOf(data.endSuit) !== -1 ? data.endSuit : null;
      state.startChecks = loadChecks(data.startChecks);
      state.endChecks = loadChecks(data.endChecks);
      state.startDefeated = !!data.startDefeated;
      state.startDefeatedDay = typeof data.startDefeatedDay === "number" ? data.startDefeatedDay : null;
      state.timeLoss = {
        day1: loadTimeLossDay(data.timeLoss && data.timeLoss.day1),
        day2: loadTimeLossDay(data.timeLoss && data.timeLoss.day2),
      };
      state.wanderingBlessing = loadWanderingBlessing(data.wanderingBlessing);
      state.rollEffects = loadRollEffects(data.rollEffects);
      state.smithingStone = typeof data.smithingStone === "string" ? data.smithingStone : "";
      state.stoneswordKey = typeof data.stoneswordKey === "string" ? data.stoneswordKey : "";
      state.grace = typeof data.grace === "string" ? data.grace : "";
      state.battle = loadBattleState(data.battle);
      state.dicePool = loadDicePool(data.dicePool);
    } catch (e) {
      // 壊れた状態は無視して初期状態のまま続行する
    }
  }

  function resetState() {
    state.slots = new Array(SLOT_COUNT).fill(null);
    state.cardLevels = new Array(SLOT_COUNT).fill(null);
    state.eventChips = new Array(SLOT_COUNT).fill(null);
    state.boardStarted = false;
    state.log = [];
    state.focusedIndex = null;
    state.dayNumber = 1;
    state.startSuit = null;
    state.endSuit = null;
    state.startChecks = defaultChecks();
    state.endChecks = defaultChecks();
    state.startDefeated = false;
    state.startDefeatedDay = null;
    state.timeLoss = defaultTimeLoss();
    state.wanderingBlessing = defaultWanderingBlessing();
    state.rollEffects = defaultRollEffects();
    state.smithingStone = "";
    state.stoneswordKey = "";
    state.grace = "";
    state.battle = defaultBattleState();
    state.dicePool = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  function addLog(key, params) {
    state.log.push({ key: key, params: params || {}, time: Date.now() });
    renderLog();
    saveState();
  }

  // --- board ---
  function renderBoard() {
    for (var i = 0; i < SLOT_COUNT; i++) {
      var el = document.getElementById("slot-" + i);
      var slot = state.slots[i];
      el.classList.remove("empty", "face-down", "face-up", "latest");
      SUIT_CLASSES.forEach(function (cls) {
        el.classList.remove(cls);
      });
      if (!slot) {
        el.textContent = "";
        el.classList.add("empty");
      } else if (!slot.revealed) {
        el.textContent = "F";
        el.classList.add("face-down");
      } else {
        var card = CARD_BY_CODE[slot.code];
        el.textContent = card.label;
        el.classList.add("face-up", card.colorClass);
      }
      if (slot && state.focusedIndex === i) el.classList.add("latest");

      var levelControl = document.getElementById("level-control-" + i);
      levelControl.style.display = slot ? "flex" : "none";
      renderCardLevel(i);
      renderSlotEffect(i);
    }
    renderPiles();
    renderFieldLevels();
    renderDayStatus();
    renderPrimaryButton();
    renderThreatSheet();
    renderCharacterRoster();
    renderNight3BossImage();
  }

  // 第三天（最終夜）到達時のみ、管理員が設定した夜の王画像を盤面右側に表示する
  function renderNight3BossImage() {
    var img = document.getElementById("night3-boss-image");
    if (!img) return;
    var boss = game && game.night3BossId ? window.PriTestNightBosses.get(game.night3BossId) : null;
    if (!boss || state.dayNumber < 3) {
      img.hidden = true;
      img.removeAttribute("src");
      return;
    }
    img.src = window.PriTestNightBosses.imagePath(boss);
    img.alt = boss.title + " - " + boss.subtitle;
    img.hidden = false;
  }

  // --- 夜の王 規則書（管理員閲覧用の参考資料。紀錄の下に常時表示） ---
  function buildBossTable(columns, rows, T) {
    var table = document.createElement("table");
    table.className = "boss-action-table";
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    columns.forEach(function (col) {
      var th = document.createElement("th");
      th.textContent = T(col);
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      row.forEach(function (cell) {
        var td = document.createElement("td");
        td.textContent = T(cell);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var wrap = document.createElement("div");
    wrap.className = "boss-table-scroll";
    wrap.appendChild(table);
    return wrap;
  }

  function renderBossRulebook() {
    var container = document.getElementById("boss-rulebook-list");
    var Rulebook = window.PriTestBossRulebook;
    if (!container || !Rulebook) return;
    container.innerHTML = "";
    var T = CharacterTypes.localizedText;

    Rulebook.list().forEach(function (boss) {
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent = T(boss.name);
      details.appendChild(summary);

      var statLines = document.createElement("p");
      statLines.className = "threat-ref-body";
      statLines.textContent = [
        window.I18N.t("boss_level_label") + window.I18N.t("colon_separator") + boss.level,
        window.I18N.t("boss_size_label") + window.I18N.t("colon_separator") + T(boss.size),
        window.I18N.t("boss_hp_label") + window.I18N.t("colon_separator") + T(boss.hp),
        T(boss.guard),
        window.I18N.t("boss_weakness_label") + window.I18N.t("colon_separator") + T(boss.weakness),
        window.I18N.t("boss_resistance_label") + window.I18N.t("colon_separator") + T(boss.resistance),
      ].join("\n");
      details.appendChild(statLines);

      if (boss.specials && boss.specials.length) {
        var specialsTitle = document.createElement("p");
        specialsTitle.className = "boss-subheading";
        specialsTitle.textContent = window.I18N.t("boss_specials_label");
        details.appendChild(specialsTitle);
        boss.specials.forEach(function (sp) {
          var spEntry = document.createElement("details");
          spEntry.className = "ability-entry";
          var spSummary = document.createElement("summary");
          spSummary.textContent = T(sp.name);
          spEntry.appendChild(spSummary);
          var spBody = document.createElement("p");
          spBody.className = "threat-ref-body";
          spBody.textContent = T(sp.body);
          spEntry.appendChild(spBody);
          details.appendChild(spEntry);
        });
      }

      if (boss.additionalEffectTable) {
        var aetTitle = document.createElement("p");
        aetTitle.className = "boss-subheading";
        aetTitle.textContent = window.I18N.t("boss_additional_effect_label");
        details.appendChild(aetTitle);
        details.appendChild(buildBossTable(boss.additionalEffectTable.columns, boss.additionalEffectTable.rows, T));
      }

      var actionsTitle = document.createElement("p");
      actionsTitle.className = "boss-subheading";
      actionsTitle.textContent = window.I18N.t("boss_actions_label");
      details.appendChild(actionsTitle);
      details.appendChild(buildBossTable(boss.actionColumns, boss.actions, T));

      container.appendChild(details);
    });
  }

  // 規則書モーダル: 管理員パスワード（"nightnight"、通常のadmin認証とは別）＋タブ切替
  function isRulebookAuthenticated() {
    return sessionStorage.getItem(RULEBOOK_SESSION_KEY) === "1";
  }

  function checkRulebookPassword() {
    if (isRulebookAuthenticated()) return true;
    var input = window.prompt(window.I18N.t("rulebook_password_prompt"));
    var ok = input === RULEBOOK_PASSWORD;
    if (ok) sessionStorage.setItem(RULEBOOK_SESSION_KEY, "1");
    return ok;
  }

  function handleOpenRulebook() {
    if (!checkRulebookPassword()) {
      alert(window.I18N.t("rulebook_password_wrong"));
      return;
    }
    document.getElementById("rulebook-modal").hidden = false;
  }

  function closeRulebookModal() {
    document.getElementById("rulebook-modal").hidden = true;
  }

  function switchRulebookTab(tabId) {
    document.querySelectorAll(".rulebook-tab-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".rulebook-tab-panel").forEach(function (panel) {
      panel.hidden = panel.id !== "rulebook-panel-" + tabId;
    });
  }

  // --- 夜の脅威シート（タイムロス／さまよう祝福／参考情報） ---
  function buildTimeLossRows(dayKey) {
    var container = document.getElementById("tl-" + dayKey + "-list");
    TIME_LOSS_ROW_DEFS.forEach(function (def, rowIndex) {
      var row = document.createElement("div");
      row.className = "tl-row";

      var boxesWrap = document.createElement("div");
      boxesWrap.className = "tl-boxes";
      for (var b = 0; b < def.boxes; b++) {
        (function (boxIndex) {
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.id = "tl-" + dayKey + "-" + rowIndex + "-" + boxIndex;
          cb.addEventListener("change", function () {
            state.timeLoss[dayKey][rowIndex][boxIndex] = cb.checked;
            renderTimeLossSummary();
            saveState();
          });
          boxesWrap.appendChild(cb);
        })(b);
      }
      row.appendChild(boxesWrap);

      var text = document.createElement("div");
      text.className = "tl-row-text";
      var strong = document.createElement("strong");
      strong.id = "tl-" + dayKey + "-" + rowIndex + "-label";
      var span = document.createElement("span");
      span.id = "tl-" + dayKey + "-" + rowIndex + "-detail";
      text.appendChild(strong);
      text.appendChild(span);
      row.appendChild(text);

      container.appendChild(row);
    });
  }

  function timeLossRowLabelDetail(dayKey, def) {
    if (def.kind === "threat") {
      return [window.I18N.t("threat_effect_add_label"), window.I18N.t("threat_effect_add_detail")];
    }
    if (def.kind === "rain") {
      return [window.I18N.t("night_rain_label"), window.I18N.t("night_rain_detail_" + dayKey + "_" + def.tier)];
    }
    return [window.I18N.t("night_visit_label"), window.I18N.t("night_visit_detail")];
  }

  function renderTimeLossText(dayKey) {
    document.getElementById("tl-" + dayKey + "-title").textContent = window.I18N.t("time_loss_day_title", {
      day: dayKey === "day1" ? 1 : 2,
    });
    TIME_LOSS_ROW_DEFS.forEach(function (def, rowIndex) {
      var parts = timeLossRowLabelDetail(dayKey, def);
      document.getElementById("tl-" + dayKey + "-" + rowIndex + "-label").textContent = parts[0];
      document.getElementById("tl-" + dayKey + "-" + rowIndex + "-detail").textContent = parts[1];
    });
  }

  function renderTimeLossChecks(dayKey) {
    TIME_LOSS_ROW_DEFS.forEach(function (def, rowIndex) {
      for (var b = 0; b < def.boxes; b++) {
        document.getElementById("tl-" + dayKey + "-" + rowIndex + "-" + b).checked = !!(
          state.timeLoss[dayKey][rowIndex] && state.timeLoss[dayKey][rowIndex][b]
        );
      }
    });
  }

  function renderTimeLossSummary() {
    var dayKey = isSwappedDay() ? "day2" : "day1";
    var rows = state.timeLoss[dayKey];
    var triggered = [];
    TIME_LOSS_ROW_DEFS.forEach(function (def, i) {
      if (rows[i].every(Boolean)) triggered.push(timeLossRowLabelDetail(dayKey, def));
    });
    ROLL_EFFECTS.forEach(function (effect) {
      var count = state.rollEffects[effect.id] || 0;
      if (count > 0) {
        triggered.push([window.I18N.t("roll_effect_" + effect.id + "_label"), window.I18N.t("roll_effect_" + effect.id + "_tier" + count)]);
      }
    });
    var summaryEl = document.getElementById("time-loss-summary");
    if (triggered.length === 0) {
      summaryEl.textContent = window.I18N.t("time_loss_none");
      return;
    }
    summaryEl.textContent = triggered
      .map(function (parts) {
        return parts[0] + window.I18N.t("colon_separator") + parts[1];
      })
      .join("、");
  }

  function buildWanderingBlessingChecks() {
    ["base", "extra"].forEach(function (which) {
      var container = document.getElementById("wb-" + which);
      for (var i = 0; i < 3; i++) {
        (function (idx) {
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.id = "wb-" + which + "-" + idx;
          cb.addEventListener("change", function () {
            state.wanderingBlessing[which][idx] = cb.checked;
            saveState();
          });
          container.appendChild(cb);
        })(i);
      }
    });
  }

  function renderWanderingBlessing() {
    ["base", "extra"].forEach(function (which) {
      for (var i = 0; i < 3; i++) {
        document.getElementById("wb-" + which + "-" + i).checked = !!state.wanderingBlessing[which][i];
      }
    });
  }

  function renderThreatTextFields() {
    document.getElementById("input-smithing-stone").value = state.smithingStone || "";
    document.getElementById("input-stonesword-key").value = state.stoneswordKey || "";
    document.getElementById("input-grace").value = state.grace || "";
  }

  function renderThreatRefTexts() {
    document.getElementById("time-loss-accum-timing-body").textContent = window.I18N.t("time_loss_accum_timing_body");
    document.getElementById("night-rain-timing-body").textContent = window.I18N.t("night_rain_timing_body");
  }

  function renderRollEffects() {
    var container = document.getElementById("roll-effects-list");
    container.innerHTML = "";
    ROLL_EFFECTS.forEach(function (effect) {
      var count = state.rollEffects[effect.id] || 0;

      var row = document.createElement("div");
      row.className = "tl-row";

      var text = document.createElement("div");
      text.className = "tl-row-text";
      var strong = document.createElement("strong");
      strong.textContent = window.I18N.t("roll_effect_" + effect.id + "_label");
      var span = document.createElement("span");
      span.textContent = count === 0 ? window.I18N.t("time_loss_none") : window.I18N.t("roll_effect_" + effect.id + "_tier" + count);
      text.appendChild(strong);
      text.appendChild(span);
      row.appendChild(text);

      var stepper = document.createElement("div");
      stepper.className = "level-control";
      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "level-btn";
      minus.textContent = "-";
      var value = document.createElement("span");
      value.className = "level-value";
      value.textContent = count + "/" + effect.tiers;
      var plus = document.createElement("button");
      plus.type = "button";
      plus.className = "level-btn";
      plus.textContent = "+";
      minus.addEventListener("click", function () {
        state.rollEffects[effect.id] = Math.max(0, count - 1);
        saveState();
        renderRollEffects();
        renderTimeLossSummary();
      });
      plus.addEventListener("click", function () {
        state.rollEffects[effect.id] = Math.min(effect.tiers, count + 1);
        saveState();
        renderRollEffects();
        renderTimeLossSummary();
      });
      stepper.appendChild(minus);
      stepper.appendChild(value);
      stepper.appendChild(plus);
      row.appendChild(stepper);

      container.appendChild(row);
    });
  }

  function renderThreatSheet() {
    document.getElementById("btn-time-loss-info").title = window.I18N.t("time_loss_info_button");
    renderTimeLossText("day1");
    renderTimeLossText("day2");
    renderTimeLossChecks("day1");
    renderTimeLossChecks("day2");
    renderTimeLossSummary();
    renderWanderingBlessing();
    renderThreatTextFields();
    renderThreatRefTexts();
    renderRollEffects();
  }

  function openThreatDrawer() {
    document.getElementById("threat-drawer").classList.add("open");
  }

  function closeThreatDrawer() {
    document.getElementById("threat-drawer").classList.remove("open");
  }

  // --- 戦場シート ---
  function buildBattleAreaGrid(containerId, namesArray) {
    var container = document.getElementById(containerId);
    container.innerHTML = "";
    for (var i = 0; i < namesArray.length; i++) {
      (function (idx) {
        var row = document.createElement("label");
        row.className = "battle-aggro-row";
        var span = document.createElement("span");
        span.className = "battle-aggro-index";
        span.textContent = idx;
        var input = document.createElement("input");
        input.type = "text";
        input.id = containerId + "-" + idx;
        input.value = namesArray[idx] || "";
        input.addEventListener("input", function (e) {
          namesArray[idx] = e.target.value;
          saveState();
        });
        row.appendChild(span);
        row.appendChild(input);
        container.appendChild(row);
      })(i);
    }
  }

  function renderBattleAreaValues(containerId, namesArray) {
    namesArray.forEach(function (name, idx) {
      var input = document.getElementById(containerId + "-" + idx);
      if (input) input.value = name || "";
    });
  }

  function buildBattleAreas() {
    buildBattleAreaGrid("battle-front-grid", state.battle.frontNames);
    buildBattleAreaGrid("battle-back-grid", state.battle.backNames);
  }

  function buildEnemyHpGrid() {
    var container = document.getElementById("battle-enemy-hp-grid");
    container.innerHTML = "";
    for (var row = 0; row < 4; row++) {
      var rowDiv = document.createElement("div");
      rowDiv.className = "battle-hp-row";
      for (var col = 0; col < 10; col++) {
        (function (idx) {
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.id = "battle-enemy-hp-" + idx;
          cb.addEventListener("change", function (e) {
            state.battle.enemyHp[idx] = e.target.checked;
            saveState();
          });
          rowDiv.appendChild(cb);
        })(row * 10 + col);
      }
      container.appendChild(rowDiv);
    }
  }

  function renderEnemyHpGrid() {
    for (var i = 0; i < 40; i++) {
      var cb = document.getElementById("battle-enemy-hp-" + i);
      if (cb) cb.checked = !!state.battle.enemyHp[i];
    }
  }

  function renderMobHpList() {
    var container = document.getElementById("battle-mob-hp-list");
    container.innerHTML = "";
    state.battle.mobHpRows.forEach(function (row, rowIndex) {
      var rowWrap = document.createElement("div");
      rowWrap.className = "battle-hp-row-wrap";
      var rowDiv = document.createElement("div");
      rowDiv.className = "battle-hp-row";
      row.forEach(function (checked, col) {
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = checked;
        cb.addEventListener("change", function (e) {
          state.battle.mobHpRows[rowIndex][col] = e.target.checked;
          saveState();
        });
        rowDiv.appendChild(cb);
      });
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "tag-remove battle-row-remove";
      removeBtn.textContent = "×";
      removeBtn.title = window.I18N.t("battle_remove_row_button");
      removeBtn.addEventListener("click", function () {
        state.battle.mobHpRows.splice(rowIndex, 1);
        saveState();
        renderMobHpList();
      });
      rowWrap.appendChild(rowDiv);
      rowWrap.appendChild(removeBtn);
      container.appendChild(rowWrap);
    });
  }

  function handleAddMobRow() {
    state.battle.mobHpRows.push(new Array(10).fill(false));
    saveState();
    renderMobHpList();
  }

  function renderBattleRefTexts() {
    document.getElementById("battle-pc-damage-body").textContent = window.I18N.t("battle_pc_damage_body");
    document.getElementById("battle-enemy-damage-body").textContent = window.I18N.t("battle_enemy_damage_body");
    document.getElementById("battle-position-body").textContent = window.I18N.t("battle_position_body");
    document.getElementById("battle-simple-combat-body").textContent = window.I18N.t("battle_simple_combat_body");
    document.getElementById("battle-pc-count-body").textContent = [
      window.I18N.t("battle_pc_count_1"),
      window.I18N.t("battle_pc_count_2"),
      window.I18N.t("battle_pc_count_3"),
      window.I18N.t("battle_pc_count_4"),
    ].join("\n");
  }

  function handleBattleClear() {
    if (!window.confirm(window.I18N.t("battle_clear_confirm"))) return;
    state.battle = defaultBattleState();
    saveState();
    renderBattleAreaValues("battle-front-grid", state.battle.frontNames);
    renderBattleAreaValues("battle-back-grid", state.battle.backNames);
    renderEnemyHpGrid();
    renderMobHpList();
  }

  function renderDicePool() {
    var listEl = document.getElementById("dice-pool-list");
    CharacterDrawer.renderDicePool(
      listEl,
      state.dicePool,
      function (index) {
        state.dicePool.splice(index, 1);
        saveState();
        renderDicePool();
      },
      document.getElementById("btn-dice-pool-add")
    );
  }

  function handleAddDice() {
    if (state.dicePool.length >= CharacterDrawer.MAX_DICE_POOL) return;
    state.dicePool.push(CharacterDrawer.rollD6());
    saveState();
    renderDicePool();
  }

  function openBattleDrawer() {
    document.getElementById("battle-drawer").classList.add("open");
  }

  function closeBattleDrawer() {
    document.getElementById("battle-drawer").classList.remove("open");
  }

  function renderFieldLevels() {
    var levels = fieldLevelsForDay();
    levels.forEach(function (n, i) {
      var el = document.getElementById("field-level-" + i);
      var value = "±" + n;
      el.innerHTML = "";
      var main = document.createElement("span");
      main.className = "field-level-main";
      main.textContent = value;
      var sub = document.createElement("span");
      sub.className = "field-level-sub";
      sub.textContent = window.I18N.t("field_level_note", { value: value });
      el.appendChild(main);
      el.appendChild(sub);
    });
  }

  function renderDayStatus() {
    var dayText = window.I18N.t("day_status", { n: state.dayNumber });
    var text = game.name + " " + dayText;
    if (scenario) {
      text += " ・ " + Scenarios.localizedName(scenario.name);
    }
    document.getElementById("day-status").textContent = text;
    renderSetupInfo();
  }

  function renderSetupInfo() {
    document.getElementById("btn-setup-info").title = window.I18N.t("setup_info_button");
    document.getElementById("setup-info-title").textContent = window.I18N.t("setup_info_button");
    var body = document.getElementById("setup-info-body");
    body.innerHTML = "";
    ["day1", "day2"].forEach(function (dayKey) {
      var h = document.createElement("h4");
      h.textContent = window.I18N.t("setup_info_title_" + dayKey);
      body.appendChild(h);
      window.I18N.t("setup_info_body_" + dayKey)
        .split("\n")
        .forEach(function (line) {
          var p = document.createElement("p");
          p.textContent = line;
          body.appendChild(p);
        });
    });
  }

  function toggleSetupInfo() {
    document.getElementById("setup-info-bubble").hidden = !document.getElementById("setup-info-bubble").hidden;
  }

  function closeSetupInfo() {
    document.getElementById("setup-info-bubble").hidden = true;
  }

  function renderPiles() {
    document.getElementById("board-grid").classList.toggle("swapped", isSwappedDay());
    renderStartPile();
    renderPileButton("pile-end", "end_point_label", state.endSuit);
    renderPileChecks("end", state.endChecks, false);
  }

  function renderPileButton(id, labelKey, suit) {
    var el = document.getElementById(id);
    SUIT_CLASSES.forEach(function (cls) {
      el.classList.remove(cls);
    });
    var label = window.I18N.t(labelKey);
    el.textContent = suit ? label + " " + SUIT_SYMBOL[suit] : label;
    if (suit) el.classList.add(SUIT_CLASS[suit]);
    el.classList.toggle("active", state.boardStarted);
  }

  function renderStartPile() {
    var el = document.getElementById("pile-start");
    SUIT_CLASSES.forEach(function (cls) {
      el.classList.remove(cls);
    });
    el.classList.remove("defeated");
    if (state.startDefeated) {
      var goalLabel = window.I18N.t("end_point_label");
      var note = window.I18N.t("pile_defeated_note", { day: state.startDefeatedDay });
      el.textContent = (state.startSuit ? goalLabel + " " + SUIT_SYMBOL[state.startSuit] : goalLabel) + " " + note;
      if (state.startSuit) el.classList.add(SUIT_CLASS[state.startSuit]);
      el.classList.add("defeated", "active");
      el.disabled = true;
    } else {
      var label = window.I18N.t("start_point_label");
      el.textContent = state.startSuit ? label + " " + SUIT_SYMBOL[state.startSuit] : label;
      if (state.startSuit) el.classList.add(SUIT_CLASS[state.startSuit]);
      el.classList.toggle("active", state.boardStarted);
      el.disabled = false;
    }
    renderPileChecks("start", state.startChecks, state.startDefeated);
  }

  function renderPileChecks(which, checks, locked) {
    ["one", "all"].forEach(function (field) {
      var el = document.getElementById("pile-check-" + which + "-" + field);
      el.checked = locked ? true : !!checks[field];
      el.disabled = locked;
    });
  }

  function renderCardLevel(index) {
    var el = document.getElementById("level-value-" + index);
    var v = state.cardLevels[index];
    el.textContent = v === null || v === undefined ? window.I18N.t("level_all") : String(v);
  }

  function renderSlotEffect(index) {
    var el = document.getElementById("slot-effect-" + index);
    var slot = state.slots[index];
    if (!el) return;
    el.innerHTML = "";
    if (!slot || !slot.revealed) return;

    if (scenario) {
      var card = CARD_BY_CODE[slot.code];
      var dayKey = isSwappedDay() ? "day2" : "day1";
      var effect = Scenarios.findCardEffect(game.scenarioId, dayKey, card.suit, card.rank);
      if (effect) {
        var effectLine = document.createElement("div");
        effectLine.textContent = Scenarios.localizedName(effect.name);
        el.appendChild(effectLine);
      }
    }

    var chipId = state.eventChips[index];
    var chipDef = chipId
      ? EVENT_CHIP_TYPES.filter(function (c) {
          return c.id === chipId;
        })[0]
      : null;
    if (chipDef) {
      var chipRow = document.createElement("div");
      chipRow.className = "slot-chip-row";
      var img = document.createElement("img");
      img.className = "slot-chip-icon";
      img.src = "../static/images/icons/" + chipDef.icon;
      img.alt = window.I18N.t("event_chip_" + chipId);
      var label = document.createElement("span");
      label.textContent = window.I18N.t("event_chip_" + chipId);
      chipRow.appendChild(img);
      chipRow.appendChild(label);
      el.appendChild(chipRow);
    }
  }

  function stepCardLevel(index, dir) {
    if (!state.slots[index]) return;
    var curIdx = LEVEL_STEPS.indexOf(state.cardLevels[index]);
    if (curIdx === -1) curIdx = 0;
    var nextIdx = (curIdx + dir + LEVEL_STEPS.length) % LEVEL_STEPS.length;
    state.cardLevels[index] = LEVEL_STEPS[nextIdx];
    renderCardLevel(index);
    saveState();
  }

  function renderPrimaryButton() {
    var btn = document.getElementById("btn-primary-action");
    var emptyCount = state.slots.filter(function (s) {
      return s === null;
    }).length;
    if (!state.boardStarted) {
      btn.textContent = window.I18N.t("start_button");
      btn.disabled = false;
      btn.onclick = scenario
        ? dealScenarioInitial
        : function () {
            openSelectDrawer("initial", SLOT_COUNT);
          };
    } else {
      btn.textContent = window.I18N.t("next_night_button");
      if (scenario) {
        btn.disabled = false;
        btn.onclick = openKeepCardsDrawer;
      } else {
        btn.disabled = emptyCount === 0;
        btn.onclick = function () {
          openSelectDrawer("continue", emptyCount);
        };
      }
    }
  }

  function renderLog() {
    var list = document.getElementById("log-list");
    list.innerHTML = "";
    if (state.log.length === 0) {
      var empty = document.createElement("li");
      empty.textContent = window.I18N.t("log_empty");
      list.appendChild(empty);
      return;
    }
    state.log.forEach(function (entry) {
      var li = document.createElement("li");
      var time = new Date(entry.time).toLocaleTimeString();
      li.textContent = "[" + time + "] " + window.I18N.t(entry.key, entry.params);
      list.appendChild(li);
    });
  }

  function renderLogToggleLabel() {
    var btn = document.getElementById("btn-log-toggle");
    var collapsed = document.getElementById("log-list").classList.contains("collapsed");
    btn.textContent = collapsed ? "🙈" : "👁";
    btn.title = window.I18N.t(collapsed ? "log_toggle_show" : "log_toggle_hide");
  }

  // --- select drawer ---
  function renderSelectScreen() {
    var grid = document.getElementById("select-grid");
    grid.innerHTML = "";
    var onBoard = codesOnBoard();
    SUITS.forEach(function (suit) {
      var group = document.createElement("div");
      group.className = "suit-group";
      var heading = document.createElement("h3");
      heading.className = SUIT_CLASS[suit];
      heading.textContent = SUIT_SYMBOL[suit];
      group.appendChild(heading);

      var subGrid = document.createElement("div");
      subGrid.className = "suit-grid";
      DECK.filter(function (c) {
        return c.suit === suit;
      }).forEach(function (card) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mini-card " + card.colorClass;
        btn.textContent = card.label;
        var disabled = onBoard.has(card.code);
        if (disabled) btn.classList.add("disabled");
        if (state.selection.has(card.code)) btn.classList.add("selected");
        btn.disabled = disabled;
        btn.addEventListener("click", function () {
          toggleSelect(card.code);
        });
        subGrid.appendChild(btn);
      });
      group.appendChild(subGrid);
      grid.appendChild(group);
    });

    document.getElementById("select-title").textContent = window.I18N.t(
      state.selectMode === "initial" ? "select_title_initial" : "select_title_continue",
      { max: state.maxSelect }
    );
    updateSelectCount();
  }

  function updateSelectCount() {
    document.getElementById("select-count").textContent = window.I18N.t("selected_count", {
      n: state.selection.size,
      max: state.maxSelect,
    });
    document.getElementById("btn-select-submit").disabled = state.selection.size === 0;
  }

  function toggleSelect(code) {
    if (state.selection.has(code)) {
      state.selection.delete(code);
    } else {
      if (state.selection.size >= state.maxSelect) return;
      state.selection.add(code);
    }
    renderSelectScreen();
  }

  function openSelectDrawer(mode, maxSelect) {
    if (maxSelect <= 0) {
      if (mode === "continue") alert(window.I18N.t("error_no_empty_slots"));
      return;
    }
    state.selectMode = mode;
    state.maxSelect = maxSelect;
    state.selection.clear();
    renderSelectScreen();
    document.getElementById("select-drawer").classList.add("open");
  }

  function closeSelectDrawer() {
    document.getElementById("select-drawer").classList.remove("open");
  }

  function submitSelection() {
    if (state.selection.size === 0) {
      alert(window.I18N.t("error_select_at_least_one"));
      return;
    }
    var codes = Array.from(state.selection);
    var cardsLabel = codes
      .map(function (c) {
        return CARD_BY_CODE[c].label;
      })
      .join(", ");

    var targetPositions;
    if (state.selectMode === "initial") {
      targetPositions = shuffle(
        Array.from({ length: SLOT_COUNT }, function (_, i) {
          return i;
        })
      ).slice(0, codes.length);
    } else {
      var emptyPositions = [];
      state.slots.forEach(function (s, i) {
        if (s === null) emptyPositions.push(i);
      });
      targetPositions = shuffle(emptyPositions).slice(0, codes.length);
    }

    targetPositions.forEach(function (pos, i) {
      state.slots[pos] = { code: codes[i], revealed: false };
      state.cardLevels[pos] = 0;
    });
    state.eventChips = rollEventChips();

    var wasContinue = state.selectMode === "continue";
    var logKey = wasContinue ? "log_continue_submit" : "log_select_submit";
    state.boardStarted = true;
    if (wasContinue) advanceToNextNight();
    closeSelectDrawer();
    renderBoard();
    addLog(logKey, { n: codes.length, cards: cardsLabel });
    if (wasContinue) addLog("log_next_night", { day: state.dayNumber });
  }

  function advanceToNextNight() {
    state.startDefeatedDay = state.dayNumber;
    state.startSuit = state.endSuit;
    state.startChecks = { one: true, all: true };
    state.startDefeated = true;
    state.endSuit = null;
    state.endChecks = defaultChecks();
    state.dayNumber += 1;
  }

  // --- シナリオ（副本）モード：固定カード配置 ---
  function dealScenarioInitial() {
    state.startSuit = scenario.start.suit;
    state.endSuit = scenario.end.suit;
    // 副本で決まっているのは「9枚のカードと場効果の組」だけで、どのマスに入るかは
    // 自訂モードと同様にランダム（プレイのたびに配置が変わる）。
    var positions = shuffle(
      Array.from({ length: SLOT_COUNT }, function (_, i) {
        return i;
      })
    );
    scenario.day1.forEach(function (row, i) {
      var idx = positions[i];
      state.slots[idx] = { code: row.suit + "-" + row.rank, revealed: false };
      state.cardLevels[idx] = 0;
    });
    state.eventChips = rollEventChips();
    state.boardStarted = true;
    renderBoard();
    addLog("log_select_submit", {
      n: scenario.day1.length,
      cards: scenario.day1
        .map(function (row) {
          return CARD_BY_CODE[row.suit + "-" + row.rank].label;
        })
        .join(", "),
    });
  }

  var keepSelection = new Set(); // 保留する場地（スロット番号）

  function openKeepCardsDrawer() {
    keepSelection.clear();
    renderKeepGrid();
    document.getElementById("keep-drawer").classList.add("open");
  }

  function closeKeepCardsDrawer() {
    document.getElementById("keep-drawer").classList.remove("open");
  }

  function renderKeepGrid() {
    var grid = document.getElementById("keep-grid");
    grid.innerHTML = "";
    for (var i = 0; i < SLOT_COUNT; i++) {
      (function (index) {
        var slot = state.slots[index];
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mini-card";
        if (slot) {
          var card = CARD_BY_CODE[slot.code];
          btn.textContent = index + 1 + ". " + card.label;
          btn.classList.add(card.colorClass);
        } else {
          btn.textContent = index + 1 + ". -";
          btn.classList.add("disabled");
          btn.disabled = true;
        }
        if (keepSelection.has(index)) btn.classList.add("selected");
        btn.addEventListener("click", function () {
          if (!slot) return;
          if (keepSelection.has(index)) {
            keepSelection.delete(index);
          } else {
            if (keepSelection.size >= 3) return;
            keepSelection.add(index);
          }
          renderKeepGrid();
        });
        grid.appendChild(btn);
      })(i);
    }
    document.getElementById("keep-count").textContent = window.I18N.t("keep_cards_count", { n: keepSelection.size });
    document.getElementById("btn-keep-submit").disabled = keepSelection.size !== 3;
  }

  function submitKeepCards() {
    if (keepSelection.size !== 3) return;
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (!keepSelection.has(i)) {
        state.slots[i] = null;
        state.cardLevels[i] = null;
      }
    }
    var emptyPositions = shuffle(
      state.slots
        .map(function (s, i) {
          return s === null ? i : null;
        })
        .filter(function (v) {
          return v !== null;
        })
    );
    var day2Rows = scenario.day2.slice().sort(function (a, b) {
      return a.pos - b.pos;
    });
    day2Rows.forEach(function (row, i) {
      var pos = emptyPositions[i];
      if (pos === undefined) return;
      state.slots[pos] = { code: row.suit + "-" + row.rank, revealed: false };
      state.cardLevels[pos] = 0;
    });
    state.eventChips = rollEventChips();

    advanceToNextNight();
    closeKeepCardsDrawer();
    renderBoard();
    addLog("log_continue_submit", {
      n: day2Rows.length,
      cards: day2Rows
        .map(function (row) {
          return CARD_BY_CODE[row.suit + "-" + row.rank].label;
        })
        .join(", "),
    });
    addLog("log_next_night", { day: state.dayNumber });
  }

  // --- suit picker ---
  function openSuitPicker(which) {
    if (!state.boardStarted) return;
    if (which === "start" && state.startDefeated) return;
    var modal = document.getElementById("suit-modal");
    document.getElementById("suit-modal-title").textContent = window.I18N.t(
      which === "start" ? "select_suit_start_title" : "select_suit_end_title"
    );
    var grid = document.getElementById("suit-modal-grid");
    grid.innerHTML = "";
    var current = which === "start" ? state.startSuit : state.endSuit;
    SUITS.forEach(function (suit) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mini-card " + SUIT_CLASS[suit] + (current === suit ? " selected" : "");
      btn.textContent = SUIT_SYMBOL[suit];
      btn.addEventListener("click", function () {
        if (which === "start") state.startSuit = suit;
        else state.endSuit = suit;
        closeSuitPicker();
        renderPiles();
        saveState();
        addLog(which === "start" ? "log_set_start_suit" : "log_set_end_suit", {
          suit: SUIT_SYMBOL[suit],
        });
      });
      grid.appendChild(btn);
    });
    document.getElementById("suit-modal-clear").onclick = function () {
      if (which === "start") state.startSuit = null;
      else state.endSuit = null;
      closeSuitPicker();
      renderPiles();
      saveState();
      addLog(which === "start" ? "log_clear_start_suit" : "log_clear_end_suit");
    };
    document.getElementById("suit-modal-close").onclick = closeSuitPicker;
    modal.hidden = false;
  }

  function closeSuitPicker() {
    document.getElementById("suit-modal").hidden = true;
  }

  // --- modal ---
  function openConfirm(messageKey, onYes, onNo) {
    var modal = document.getElementById("modal");
    document.getElementById("modal-message").textContent = window.I18N.t(messageKey);
    modal.hidden = false;
    var yesBtn = document.getElementById("modal-yes");
    var noBtn = document.getElementById("modal-no");

    function cleanup() {
      modal.hidden = true;
      yesBtn.removeEventListener("click", onYesClick);
      noBtn.removeEventListener("click", onNoClick);
    }
    function onYesClick() {
      cleanup();
      onYes();
    }
    function onNoClick() {
      cleanup();
      if (onNo) onNo();
    }
    yesBtn.addEventListener("click", onYesClick);
    noBtn.addEventListener("click", onNoClick);
  }

  function onSlotClick(index) {
    var slot = state.slots[index];
    if (!slot) return;
    state.focusedIndex = index;
    renderBoard();
    saveState();

    var card = CARD_BY_CODE[slot.code];
    if (!slot.revealed) {
      openConfirm(
        "confirm_reveal_msg",
        function () {
          slot.revealed = true;
          renderBoard();
          addLog("log_reveal", { slot: index + 1, card: card.label });
        },
        function () {
          addLog("log_cancel_reveal", { slot: index + 1 });
        }
      );
    } else {
      openConfirm(
        "confirm_draw_msg",
        function () {
          state.slots[index] = null;
          state.cardLevels[index] = null;
          if (state.focusedIndex === index) state.focusedIndex = null;
          renderBoard();
          addLog("log_draw_out", { slot: index + 1, card: card.label });
        },
        function () {
          addLog("log_cancel_draw", { slot: index + 1, card: card.label });
        }
      );
    }
  }

  function checkNewGamePassword() {
    var input = window.prompt(window.I18N.t("new_game_password_prompt"));
    return input === NEW_GAME_PASSWORD;
  }

  function handleNewGame() {
    if (!checkNewGamePassword()) return;
    var hadBoard = state.boardStarted;
    resetState();
    renderBoard();
    renderLog();
    renderDicePool();
    if (hadBoard) addLog("log_new_game");
  }

  function buildBoardSlots() {
    var grid = document.getElementById("board-grid");
    for (var i = 0; i < SLOT_COUNT; i++) {
      (function (index) {
        var wrap = document.createElement("div");
        wrap.className = "slot-wrap slot-wrap-" + index;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.id = "slot-" + index;
        btn.className = "slot empty";
        btn.addEventListener("click", function () {
          onSlotClick(index);
        });
        wrap.appendChild(btn);

        var effectCaption = document.createElement("div");
        effectCaption.className = "slot-effect";
        effectCaption.id = "slot-effect-" + index;
        wrap.appendChild(effectCaption);

        var levelControl = document.createElement("div");
        levelControl.className = "level-control";
        levelControl.id = "level-control-" + index;

        var minus = document.createElement("button");
        minus.type = "button";
        minus.className = "level-btn";
        minus.textContent = "-";
        minus.addEventListener("click", function () {
          stepCardLevel(index, -1);
        });

        var value = document.createElement("span");
        value.className = "level-value";
        value.id = "level-value-" + index;

        var plus = document.createElement("button");
        plus.type = "button";
        plus.className = "level-btn";
        plus.textContent = "+";
        plus.addEventListener("click", function () {
          stepCardLevel(index, 1);
        });

        levelControl.appendChild(minus);
        levelControl.appendChild(value);
        levelControl.appendChild(plus);
        wrap.appendChild(levelControl);

        grid.appendChild(wrap);
      })(i);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!Games.checkAdminPassword(window.I18N.t("admin_password_prompt"))) {
      window.location.href = "../admin/index.html";
      return;
    }
    if (!game) {
      document.getElementById("screen-missing-game").hidden = false;
      document.getElementById("screen-board").hidden = true;
      document.getElementById("day-status").hidden = true;
      document.getElementById("link-characters").hidden = true;
      return;
    }

    document.getElementById("link-characters").href =
      "../characters/index.html?game=" + encodeURIComponent(gameId);

    buildBoardSlots();
    buildTimeLossRows("day1");
    buildTimeLossRows("day2");
    buildWanderingBlessingChecks();
    rosterCharacters = loadRosterCharacters();
    CharacterDrawer.init({
      characters: rosterCharacters,
      save: saveRosterCharacters,
      onChange: renderCharacterRoster,
    });
    loadState();
    buildBattleAreas();
    buildEnemyHpGrid();
    renderEnemyHpGrid();
    renderMobHpList();
    renderBattleRefTexts();
    renderDicePool();
    renderBoard();
    renderLog();
    renderLogToggleLabel();
    renderBossRulebook();

    document.getElementById("btn-open-rulebook").addEventListener("click", handleOpenRulebook);
    document.getElementById("btn-rulebook-close").addEventListener("click", closeRulebookModal);
    document.querySelectorAll(".rulebook-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchRulebookTab(btn.getAttribute("data-tab"));
      });
    });

    document.getElementById("btn-select-submit").addEventListener("click", submitSelection);
    document.getElementById("btn-select-cancel").addEventListener("click", closeSelectDrawer);
    document.getElementById("drawer-backdrop").addEventListener("click", closeSelectDrawer);
    document.getElementById("btn-keep-submit").addEventListener("click", submitKeepCards);
    document.getElementById("btn-keep-cancel").addEventListener("click", closeKeepCardsDrawer);
    document.getElementById("keep-drawer-backdrop").addEventListener("click", closeKeepCardsDrawer);
    document.getElementById("btn-new-game").addEventListener("click", handleNewGame);
    document.getElementById("btn-log-toggle").addEventListener("click", function () {
      document.getElementById("log-list").classList.toggle("collapsed");
      renderLogToggleLabel();
    });
    document.getElementById("btn-setup-info").addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSetupInfo();
    });
    document.getElementById("setup-info-close").addEventListener("click", closeSetupInfo);
    document.addEventListener("click", function (e) {
      var bubble = document.getElementById("setup-info-bubble");
      if (bubble.hidden) return;
      if (bubble.contains(e.target) || e.target.id === "btn-setup-info") return;
      closeSetupInfo();
    });
    document.getElementById("btn-time-loss-info").addEventListener("click", openThreatDrawer);
    document.getElementById("btn-threat-drawer-close").addEventListener("click", closeThreatDrawer);
    document.getElementById("threat-drawer-backdrop").addEventListener("click", closeThreatDrawer);
    document.getElementById("btn-battle-info").addEventListener("click", openBattleDrawer);
    document.getElementById("btn-battle-drawer-close").addEventListener("click", closeBattleDrawer);
    document.getElementById("battle-drawer-backdrop").addEventListener("click", closeBattleDrawer);
    document.getElementById("btn-battle-add-mob-row").addEventListener("click", handleAddMobRow);
    document.getElementById("btn-battle-clear").addEventListener("click", handleBattleClear);
    document.getElementById("btn-dice-pool-add").addEventListener("click", handleAddDice);
    document.getElementById("input-smithing-stone").addEventListener("input", function (e) {
      state.smithingStone = e.target.value;
      saveState();
    });
    document.getElementById("input-stonesword-key").addEventListener("input", function (e) {
      state.stoneswordKey = e.target.value;
      saveState();
    });
    document.getElementById("input-grace").addEventListener("input", function (e) {
      state.grace = e.target.value;
      saveState();
    });
    document.getElementById("pile-start").addEventListener("click", function () {
      openSuitPicker("start");
    });
    document.getElementById("pile-end").addEventListener("click", function () {
      openSuitPicker("end");
    });
    ["start", "end"].forEach(function (which) {
      ["one", "all"].forEach(function (field) {
        document.getElementById("pile-check-" + which + "-" + field).addEventListener("change", function (e) {
          if (which === "start" && state.startDefeated) {
            renderStartPile();
            return;
          }
          var checks = which === "start" ? state.startChecks : state.endChecks;
          checks[field] = e.target.checked;
          saveState();
        });
      });
    });

    window.addEventListener("i18n:change", function () {
      renderBoard();
      renderLog();
      renderLogToggleLabel();
      renderSelectScreen();
      renderBattleRefTexts();
      renderBossRulebook();
    });
  });
})();
