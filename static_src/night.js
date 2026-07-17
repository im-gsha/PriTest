(function () {
  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var SUIT_CLASS = { S: "suit-black", H: "suit-red", D: "suit-orange", C: "suit-green" };
  var SUIT_CLASSES = ["suit-black", "suit-red", "suit-orange", "suit-green"];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SLOT_COUNT = 9;
  // 固定配置副本（安寧者たち／瓦礫の王）の原書図解ポジション（1-9、上7-8-9／中4-S-5-E-6／下1-2-3）
  // から実際の盤面スロット index（slot-0〜slot-8）への対応表。中央＝ポジション5＝slot-4。
  var FIXED_LAYOUT_POS_TO_SLOT = { 1: 6, 2: 7, 3: 8, 4: 3, 5: 4, 6: 5, 7: 0, 8: 1, 9: 2 };
  var FIXED_LAYOUT_CENTER_SLOT = FIXED_LAYOUT_POS_TO_SLOT[5];
  // 地変（terrain-shift）副本：「場地列5」＝開始山札に隣接するカード列（縦3マス）。
  // scenario.day2 内で terrain:true のカードは常にこの3マスへ強制配置され、
  // プレイヤーの「保持する場地」選択の対象外になる（135頁）。
  var TERRAIN_SWAP_SLOTS = [0, 3, 6];

  function scenarioTerrainRows() {
    if (!scenario || !scenario.day2) return [];
    return scenario.day2.filter(function (row) {
      return row.terrain;
    });
  }
  var NEW_GAME_PASSWORD = "night";
  var RULEBOOK_PASSWORD = "nightnight";
  var RULEBOOK_SESSION_KEY = "pritest-rulebook-session";
  var activeWeaponSubTab = "acquisition";
  var LEVEL_STEPS = [null, 0, 1, 2, 3, 4, 5]; // null = "全"（未指定）

  var Games = window.PriTestGames;
  var GameStorage = window.PriTestGameStorage;
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
    if (game) GameStorage.pushCharacters(gameId, game.storageMode, rosterCharacters);
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
      td.colSpan = 7;
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
        thumb.addEventListener("click", function () {
          CharacterDrawer.openSkills(c.id);
        });
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

      var flaskText = c.flaskBase.used + "/" + c.flaskBase.max + (c.flaskExtra && c.flaskExtra.max > 0 ? "（+" + c.flaskExtra.used + "/" + c.flaskExtra.max + "）" : "");
      [
        type ? CharacterTypes.localizedName(type.name) : "-",
        c.level,
        c.hp.current + "/" + c.hp.max,
        c.fp.current + "/" + c.fp.max,
        flaskText,
      ].forEach(function (val) {
        var cell = document.createElement("td");
        cell.textContent = val;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);

      // 骰子池と武器欄は、この角色の情報行のすぐ下（同じ角色欄）に並べて表示する。
      var detailTr = document.createElement("tr");
      detailTr.className = "roster-detail-row";
      var detailTd = document.createElement("td");
      detailTd.colSpan = 7;
      var detailFlex = document.createElement("div");
      detailFlex.className = "roster-detail-flex";

      var diceCol = document.createElement("div");
      diceCol.className = "roster-detail-col";
      var diceTitle = document.createElement("h5");
      diceTitle.textContent = window.I18N.t("character_dice_pool_label");
      var diceWrap = document.createElement("div");
      diceWrap.className = "dice-pool-list";
      CharacterDrawer.renderDiceDisplay(diceWrap, c.dicePool || []);
      diceCol.appendChild(diceTitle);
      diceCol.appendChild(diceWrap);

      var weaponCol = document.createElement("div");
      weaponCol.className = "roster-detail-col";
      var weaponTitle = document.createElement("h5");
      weaponTitle.textContent = window.I18N.t("character_weapons_label");
      var weaponWrap = document.createElement("div");
      weaponWrap.className = "roster-weapon-list";
      CharacterDrawer.renderRosterWeaponList(c, weaponWrap);
      weaponCol.appendChild(weaponTitle);
      weaponCol.appendChild(weaponWrap);

      detailFlex.appendChild(diceCol);
      detailFlex.appendChild(weaponCol);
      detailTd.appendChild(detailFlex);
      detailTr.appendChild(detailTd);
      tbody.appendChild(detailTr);

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

  var ENEMY_HP_ROWS = 4;
  var ENEMY_HP_COLS = 20;

  function defaultBattleState() {
    return {
      front: [false, false, false, false, false, false],
      back: [false, false, false, false, false, false],
      // PC1〜6の「敵視」。番号は前衛／後衛どちらのマスにいても同じPCを指すため、両エリアで共有する。
      aggro: [0, 0, 0, 0, 0, 0],
      enemyHp: new Array(ENEMY_HP_ROWS * ENEMY_HP_COLS).fill(false),
      mobHpRows: [],
      selectedEnemyIds: [],
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

  function buildSaveData() {
    return {
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
  }

  function saveState() {
    var data = buildSaveData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (game) GameStorage.pushNightState(gameId, game.storageMode, data);
  }

  // --- 「次の夜」への移行を1回分だけ取り消せる（押し間違い対策） ---
  var UNDO_KEY = "pritest-night-undo-" + gameId;
  var MAX_DAY = 3;

  function saveUndoSnapshot() {
    localStorage.setItem(UNDO_KEY, JSON.stringify(buildSaveData()));
  }

  function loadUndoSnapshot() {
    var raw = localStorage.getItem(UNDO_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearUndoSnapshot() {
    localStorage.removeItem(UNDO_KEY);
  }

  function applySnapshot(snap) {
    state.slots = snap.slots;
    state.cardLevels = snap.cardLevels;
    state.eventChips = snap.eventChips;
    state.boardStarted = snap.boardStarted;
    state.log = snap.log;
    state.focusedIndex = snap.focusedIndex;
    state.dayNumber = snap.dayNumber;
    state.startSuit = snap.startSuit;
    state.endSuit = snap.endSuit;
    state.startChecks = snap.startChecks;
    state.endChecks = snap.endChecks;
    state.startDefeated = snap.startDefeated;
    state.startDefeatedDay = snap.startDefeatedDay;
    state.timeLoss = snap.timeLoss;
    state.wanderingBlessing = snap.wanderingBlessing;
    state.rollEffects = snap.rollEffects;
    state.smithingStone = snap.smithingStone;
    state.stoneswordKey = snap.stoneswordKey;
    state.grace = snap.grace;
    state.battle = snap.battle;
    state.dicePool = snap.dicePool;
  }

  function handleUndoNight() {
    var snap = loadUndoSnapshot();
    if (!snap) return;
    if (!window.confirm(window.I18N.t("undo_night_confirm"))) return;
    applySnapshot(snap);
    clearUndoSnapshot();
    saveState();
    renderBoard();
  }

  function renderUndoButton() {
    var btn = document.getElementById("btn-undo-night");
    if (!btn) return;
    btn.disabled = !loadUndoSnapshot();
  }

  function loadBattleState(raw) {
    var fallback = defaultBattleState();
    if (!raw || typeof raw !== "object") return fallback;
    var front = Array.isArray(raw.front) ? raw.front.slice(0, 6).map(Boolean) : fallback.front.slice();
    while (front.length < 6) front.push(false);
    var back = Array.isArray(raw.back) ? raw.back.slice(0, 6).map(Boolean) : fallback.back.slice();
    while (back.length < 6) back.push(false);
    var aggro = Array.isArray(raw.aggro)
      ? raw.aggro.slice(0, 6).map(function (v) {
          return Number(v) || 0;
        })
      : fallback.aggro.slice();
    while (aggro.length < 6) aggro.push(0);
    var hpTotal = ENEMY_HP_ROWS * ENEMY_HP_COLS;
    var enemyHp = Array.isArray(raw.enemyHp) ? raw.enemyHp.slice(0, hpTotal).map(Boolean) : fallback.enemyHp.slice();
    while (enemyHp.length < hpTotal) enemyHp.push(false);
    var mobHpRows = Array.isArray(raw.mobHpRows)
      ? raw.mobHpRows.map(function (row) {
          var r = Array.isArray(row) ? row.slice(0, 10).map(Boolean) : [];
          while (r.length < 10) r.push(false);
          return r;
        })
      : [];
    // 「familyId|enemyId」の合成キー文字列で保持する（Enemies.get(familyId, enemyId)で解決するため）。
    var selectedEnemyIds = Array.isArray(raw.selectedEnemyIds)
      ? raw.selectedEnemyIds.filter(function (v) {
          return typeof v === "string" && v.indexOf("|") !== -1;
        })
      : fallback.selectedEnemyIds.slice();
    return {
      front: front,
      back: back,
      aggro: aggro,
      enemyHp: enemyHp,
      mobHpRows: mobHpRows,
      selectedEnemyIds: selectedEnemyIds,
    };
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

  // dataは既にパース済みのオブジェクト（クラウド購読からの再入も想定）を受け取る。
  function applyLoadedData(data) {
    try {
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

  function loadState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      applyLoadedData(JSON.parse(raw));
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
    clearUndoSnapshot();
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
    renderUndoButton();
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

  // タリスマン獲得決定表（200-202頁）：1Dで表A/Bを決め、各表内をグループ→アイテムの
  // 2段階で振って1個を決定する参考資料。ゲーム内でダイスを振らせる機能ではなく、GM向けの一覧表示。
  function renderTalismanAcquisitionTable() {
    var container = document.getElementById("talisman-acquisition-table");
    var Talismans = window.PriTestTalismans;
    if (!container || !Talismans) return;
    container.innerHTML = "";

    var note = document.createElement("p");
    note.className = "threat-ref-body";
    note.textContent = window.I18N.t("talisman_acquisition_note");
    container.appendChild(note);

    var tables = Talismans.acquisitionTables();
    [
      { label: window.I18N.t("talisman_acquisition_table_a_label"), groups: tables.groupsA },
      { label: window.I18N.t("talisman_acquisition_table_b_label"), groups: tables.groupsB },
    ].forEach(function (table) {
      var heading = document.createElement("p");
      heading.className = "boss-subheading";
      heading.textContent = table.label;
      container.appendChild(heading);

      table.groups.forEach(function (rows, groupIndex) {
        var groupBlock = document.createElement("details");
        groupBlock.className = "ability-entry";
        var summary = document.createElement("summary");
        summary.textContent = window.I18N.t("talisman_acquisition_group_label", { n: groupIndex + 1 });
        groupBlock.appendChild(summary);
        var itemList = document.createElement("ul");
        rows.forEach(function (row) {
          var talisman = Talismans.get(row.id);
          var li = document.createElement("li");
          li.textContent = "[" + row.roll + "] " + (talisman ? Talismans.localizedText(talisman.name) : row.id);
          itemList.appendChild(li);
        });
        groupBlock.appendChild(itemList);
        container.appendChild(groupBlock);
      });
    });
  }

  // タリスマン（装飾品）一覧の参考資料タブ。武器と異なり単体でPassive効果を1つ持つだけ。
  function renderTalismanRulebook() {
    var container = document.getElementById("talisman-rulebook-list");
    var Talismans = window.PriTestTalismans;
    if (!container || !Talismans) return;
    container.innerHTML = "";

    Talismans.list().forEach(function (talisman) {
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent = Talismans.localizedText(talisman.name);
      details.appendChild(summary);
      var body = document.createElement("p");
      body.className = "threat-ref-body";
      body.textContent = Talismans.localizedText(talisman.body);
      details.appendChild(body);
      container.appendChild(details);
    });
  }

  // 消耗品一覧の参考資料タブ。タリスマンと似た単純な構造（名称＋効果）。
  function renderConsumableRulebook() {
    var container = document.getElementById("consumable-rulebook-list");
    var Consumables = window.PriTestConsumables;
    if (!container || !Consumables) return;
    container.innerHTML = "";

    Consumables.list().forEach(function (item) {
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent = Consumables.localizedText(item.name);
      details.appendChild(summary);
      var body = document.createElement("p");
      body.className = "threat-ref-body";
      body.textContent = Consumables.localizedText(item.body);
      details.appendChild(body);
      container.appendChild(details);
    });
  }

  // 消耗品決定表（ダイス2回、d66形式）の参考資料。
  function renderConsumableDetermineTable() {
    var container = document.getElementById("consumable-determine-table");
    var Consumables = window.PriTestConsumables;
    if (!container || !Consumables) return;
    container.innerHTML = "";
    var table = Consumables.determineTable();
    container.appendChild(buildBossTable(table.columns, table.rows, window.PriTestConsumables.localizedText));
  }

  // エネミー（通常討伐対象）一覧の参考資料タブ。系統別サブタブ＋名前検索。
  var activeEnemyFamily = "all";

  function setupEnemyFamilyTabs() {
    var tabsContainer = document.getElementById("enemy-family-subtabs");
    var Enemies = window.PriTestEnemies;
    if (!tabsContainer || !Enemies) return;
    tabsContainer.innerHTML = "";

    var tabs = [{ id: "all", label: window.I18N.t("enemy_family_all_label") }].concat(
      Enemies.listFamilies().map(function (fam) {
        return { id: fam.id, label: Enemies.localizedText(fam.name) };
      })
    );

    tabs.forEach(function (tab) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weapon-subtab-btn" + (tab.id === activeEnemyFamily ? " active" : "");
      btn.setAttribute("data-subtab", tab.id);
      btn.textContent = tab.label;
      btn.addEventListener("click", function () {
        activeEnemyFamily = tab.id;
        setupEnemyFamilyTabs();
        renderEnemyRulebookList();
      });
      tabsContainer.appendChild(btn);
    });
  }

  function buildEnemyActionTable(enemy) {
    var Enemies = window.PriTestEnemies;
    var T = Enemies.localizedText;
    var hasNote = (enemy.actions || []).some(function (a) {
      return a.note;
    });
    var columns = [
      { ja: "出目", zh: "點數" },
      { ja: "アクション名", zh: "招式名稱" },
      { ja: "乱戦ダメージ修正", zh: "亂戰傷害修正" },
    ];
    if (hasNote) columns.push({ ja: "乱戦ダメージへの注釈、個別ダメージなど", zh: "亂戰傷害注釋、個別傷害等" });
    var rows = (enemy.actions || []).map(function (a) {
      var row = [{ ja: a.roll, zh: a.roll }, a.name, { ja: a.mod || "—", zh: a.mod || "—" }];
      if (hasNote) row.push(a.note || { ja: "", zh: "" });
      return row;
    });
    var wrap = document.createElement("div");
    wrap.className = "field-variance-wrap";
    wrap.appendChild(buildBossTable(columns, rows, T));
    return wrap;
  }

  // 系統共通の「レベル／HP枠／乱戦ダメージ」基礎データ表（fam.baseがある系統のみ表示）。
  function buildEnemyBaseTable(fam) {
    var Enemies = window.PriTestEnemies;
    var T = Enemies.localizedText;
    var columns = [
      { ja: "レベル", zh: "等級" },
      { ja: "HP枠", zh: "HP枠" },
      { ja: "乱戦ダメージ", zh: "亂戰傷害" },
    ];
    var rows = fam.base.map(function (lv) {
      var hpText = lv.hp || "—";
      return [lv.level, { ja: hpText, zh: hpText }, lv.dmg];
    });
    var wrap = document.createElement("div");
    wrap.className = "field-variance-wrap";
    wrap.appendChild(buildBossTable(columns, rows, T));
    return wrap;
  }

  // 系統共通の「ガード回数／HP価値」参考表（データがある系統のみ表示）。
  // row.value は通常レベルによらず一定の数値だが、一部の系統（結晶人・人形兵系、ゴーレム・乙女人形系、
  // 小姓・卑兵系など）は原本の基礎データ表でレベルごとにHP価値が異なるため、その場合は
  // row.value に15要素（Lv.1〜15）の配列を指定する。配列を持つ行が1つでもあれば、
  // レベル別の列を持つ表を表示する（配列でない行は全レベル同じ値として扱う）。
  function buildEnemyGuardValueTable(fam) {
    var Enemies = window.PriTestEnemies;
    var T = Enemies.localizedText;
    var hasByLevel = fam.guardValueTable.some(function (row) {
      return Array.isArray(row.value);
    });

    function fmt(row, value) {
      return row.theoretical ? "（" + value + "）" : String(value);
    }

    var columns, rows;
    if (hasByLevel) {
      columns = [{ ja: "ガード回数", zh: "防禦次數" }];
      for (var lv = 1; lv <= 15; lv++) {
        columns.push({ ja: "Lv." + lv, zh: "Lv." + lv });
      }
      rows = fam.guardValueTable.map(function (row) {
        var cells = [row.count];
        for (var i = 0; i < 15; i++) {
          var v = Array.isArray(row.value) ? row.value[i] : row.value;
          var text = fmt(row, v);
          cells.push({ ja: text, zh: text });
        }
        return cells;
      });
    } else {
      columns = [
        { ja: "ガード回数", zh: "防禦次數" },
        { ja: "HP価値", zh: "HP價值" },
      ];
      rows = fam.guardValueTable.map(function (row) {
        var valueText = fmt(row, row.value);
        return [row.count, { ja: valueText, zh: valueText }];
      });
    }

    var wrap = document.createElement("div");
    wrap.className = "field-variance-wrap";
    wrap.appendChild(buildBossTable(columns, rows, T));
    return wrap;
  }

  // 系統（大分類）／エネミー（中分類）へのジャンプボタンを並べた目次。現在の検索・サブタブの絞り込み結果と連動する。
  function renderEnemyNav(container, matchedFamilies, T) {
    var nav = document.createElement("div");
    nav.className = "field-nav";
    matchedFamilies.forEach(function (row) {
      var famEntry = document.createElement("div");
      famEntry.className = "field-nav-card";

      var famLink = document.createElement("button");
      famLink.type = "button";
      famLink.className = "field-nav-card-link";
      famLink.textContent = T(row.fam.name);
      famLink.addEventListener("click", function () {
        var target = document.getElementById("enemy-family-" + row.fam.id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      famEntry.appendChild(famLink);

      var enemyList = document.createElement("div");
      enemyList.className = "field-nav-branch-list";
      row.enemies.forEach(function (enemy) {
        var enemyLink = document.createElement("button");
        enemyLink.type = "button";
        enemyLink.className = "field-nav-branch-link";
        enemyLink.textContent = T(enemy.name);
        enemyLink.addEventListener("click", function () {
          var target = document.getElementById("enemy-entry-" + row.fam.id + "-" + enemy.id);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        enemyList.appendChild(enemyLink);
      });
      famEntry.appendChild(enemyList);

      nav.appendChild(famEntry);
    });
    container.appendChild(nav);
  }

  function renderEnemyRulebookList() {
    var container = document.getElementById("enemy-rulebook-list");
    var Enemies = window.PriTestEnemies;
    if (!container || !Enemies) return;
    var T = Enemies.localizedText;
    container.innerHTML = "";

    var query = (document.getElementById("enemy-rulebook-search-input") || {}).value || "";
    var q = query.trim().toLowerCase();

    var matchedFamilies = Enemies.listFamilies()
      .filter(function (fam) {
        return activeEnemyFamily === "all" || activeEnemyFamily === fam.id;
      })
      .map(function (fam) {
        var famEnemies = fam.enemies.filter(function (e) {
          if (!q) return true;
          var n = e.name;
          return (n.ja && n.ja.toLowerCase().indexOf(q) !== -1) || (n.zh && n.zh.toLowerCase().indexOf(q) !== -1);
        });
        return { fam: fam, enemies: famEnemies };
      })
      .filter(function (row) {
        return row.enemies.length > 0;
      });

    renderEnemyNav(container, matchedFamilies, T);

    matchedFamilies.forEach(function (row) {
      var fam = row.fam;
      var famEnemies = row.enemies;

      var famHeading = document.createElement("p");
      famHeading.className = "boss-subheading";
      famHeading.id = "enemy-family-" + fam.id;
      famHeading.textContent = T(fam.name);
      container.appendChild(famHeading);

      if (fam.base) {
        container.appendChild(buildEnemyBaseTable(fam));
      }

      if (fam.note) {
        var noteP = document.createElement("p");
        noteP.className = "threat-ref-body";
        noteP.textContent = T(fam.note);
        container.appendChild(noteP);
      }

      if (fam.guardValueTable) {
        if (fam.guardCount != null) {
          var guardCountP = document.createElement("p");
          guardCountP.className = "threat-ref-body";
          guardCountP.textContent =
            window.I18N.t("enemy_guard_count_label") + window.I18N.t("colon_separator") + fam.guardCount;
          container.appendChild(guardCountP);
        }
        container.appendChild(buildEnemyGuardValueTable(fam));
      }

      famEnemies.forEach(function (enemy) {
        var details = document.createElement("details");
        details.className = "ability-entry";
        details.id = "enemy-entry-" + fam.id + "-" + enemy.id;
        var summary = document.createElement("summary");
        summary.textContent = T(enemy.name);
        details.appendChild(summary);

        var imgSrc = Enemies.imagePath(enemy);
        if (imgSrc) {
          var img = document.createElement("img");
          img.className = "enemy-portrait";
          img.src = imgSrc;
          img.alt = T(enemy.name);
          details.appendChild(img);
        }

        var statLines = document.createElement("p");
        statLines.className = "threat-ref-body";
        var lines = [window.I18N.t("enemy_size_label") + window.I18N.t("colon_separator") + (enemy.size || "-")];
        if (enemy.resistance) {
          lines.push(window.I18N.t("enemy_resistance_label") + window.I18N.t("colon_separator") + T(enemy.resistance));
        }
        statLines.textContent = lines.join("\n");
        details.appendChild(statLines);

        var actionsTitle = document.createElement("p");
        actionsTitle.className = "boss-subheading";
        actionsTitle.textContent = window.I18N.t("boss_actions_label");
        details.appendChild(actionsTitle);
        details.appendChild(buildEnemyActionTable(enemy));

        if (enemy.special) {
          var spTitle = document.createElement("p");
          spTitle.className = "boss-subheading";
          spTitle.textContent = window.I18N.t("boss_specials_label");
          details.appendChild(spTitle);
          var spBody = document.createElement("p");
          spBody.className = "threat-ref-body";
          spBody.textContent = T(enemy.special);
          details.appendChild(spBody);
        }

        container.appendChild(details);
      });
    });
  }

  function renderEnemyRulebookAll() {
    setupEnemyFamilyTabs();
    renderEnemyRulebookList();
    var searchInput = document.getElementById("enemy-rulebook-search-input");
    if (searchInput && !searchInput.dataset.wired) {
      searchInput.dataset.wired = "1";
      searchInput.addEventListener("input", renderEnemyRulebookList);
    }
  }

  // マップ盤面（フィールド）カードの参考資料タブ。1行＝L(depth, label, text, bullet)。
  // depth 0＝通常記述、1〜3＝「→」「→→」「→→→」に相当するイベント／小イベントの分岐（背景色で強調）。
  function renderFieldLine(container, line, T) {
    var depth = Math.min(line.depth || 0, 3);
    var p = document.createElement("p");
    p.className = "field-line field-line-d" + depth + (line.bullet ? " field-line-bullet" : "");
    var prefix = "";
    if (line.bullet) {
      prefix = "・";
    } else if (depth > 0) {
      for (var i = 0; i < depth; i++) prefix += "→";
    }
    var text = prefix;
    if (line.label) text += "【" + T(line.label) + "】";
    text += T(line.text);
    p.textContent = text;
    container.appendChild(p);
  }

  function renderFieldCard(container, card, T) {
    var block = document.createElement("div");
    block.className = "field-card-block";
    block.id = "field-card-" + card.id;

    var h = document.createElement("h3");
    h.className = "field-card-title";
    h.textContent = "【" + card.cardLabel + "】" + T(card.name);
    block.appendChild(h);

    var metaParts = [];
    if (card.floorCount != null) {
      metaParts.push(window.I18N.t("field_floor_count_label") + window.I18N.t("colon_separator") + card.floorCount);
    }
    if (card.allFloorEffect) {
      metaParts.push(
        window.I18N.t("field_all_floor_effect_label") + window.I18N.t("colon_separator") + T(card.allFloorEffect)
      );
    }
    if (metaParts.length) {
      var metaP = document.createElement("p");
      metaP.className = "field-card-meta";
      metaP.textContent = metaParts.join("　");
      block.appendChild(metaP);
    }

    if (card.varianceNote) {
      var noteP = document.createElement("p");
      noteP.className = "threat-ref-body";
      noteP.textContent = T(card.varianceNote);
      block.appendChild(noteP);
    }

    if (card.varianceTable) {
      block.appendChild(buildBossTable(card.varianceTable.columns, card.varianceTable.rows, T));
    }

    (card.branches || []).forEach(function (branch, branchIndex) {
      var branchDiv = document.createElement("div");
      branchDiv.className = "field-branch";
      branchDiv.id = "field-branch-" + card.id + "-" + branchIndex;

      var tag = document.createElement("span");
      tag.className = "field-region-tag";
      tag.textContent = T(branch.name);
      branchDiv.appendChild(tag);

      if (branch.intro) {
        var introP = document.createElement("p");
        introP.className = "field-branch-intro";
        introP.textContent = T(branch.intro);
        branchDiv.appendChild(introP);
      }

      if (branch.specialRule) {
        var ruleP = document.createElement("p");
        ruleP.className = "field-branch-intro";
        ruleP.textContent = T(branch.specialRule);
        branchDiv.appendChild(ruleP);
      }

      (branch.floorPreviews || []).forEach(function (preview) {
        var pv = document.createElement("p");
        pv.className = "field-branch-intro";
        pv.textContent = "＞" + T(preview.label) + "：" + T(preview.title) + "\n" + T(preview.text);
        branchDiv.appendChild(pv);
      });

      (branch.floors || []).forEach(function (floor) {
        var floorDiv = document.createElement("div");
        floorDiv.className = "field-floor";

        var marker = document.createElement("div");
        marker.className = "field-floor-marker";
        marker.textContent = T(floor.label) + (floor.title ? "　" : "");
        if (floor.title) {
          var titleSpan = document.createElement("span");
          titleSpan.className = "field-floor-title";
          titleSpan.textContent = T(floor.title);
          marker.appendChild(titleSpan);
        }
        floorDiv.appendChild(marker);

        (floor.lines || []).forEach(function (line) {
          renderFieldLine(floorDiv, line, T);
        });

        branchDiv.appendChild(floorDiv);
      });

      block.appendChild(branchDiv);
    });

    (card.extraNotes || []).forEach(function (note) {
      var noteBlock = document.createElement("div");
      noteBlock.className = "threat-ref-block";
      var noteH = document.createElement("h4");
      noteH.textContent = T(note.title);
      noteBlock.appendChild(noteH);
      var noteBody = document.createElement("p");
      noteBody.className = "threat-ref-body";
      noteBody.textContent = T(note.body);
      noteBlock.appendChild(noteBody);
      block.appendChild(noteBlock);
    });

    (card.extraTables || []).forEach(function (tbl) {
      var tblBlock = document.createElement("div");
      tblBlock.className = "threat-ref-block";
      var tblH = document.createElement("h4");
      tblH.textContent = T(tbl.title);
      tblBlock.appendChild(tblH);
      var tblWrap = document.createElement("div");
      tblWrap.className = "field-variance-wrap";
      tblWrap.appendChild(buildBossTable(tbl.columns, tbl.rows, T));
      tblBlock.appendChild(tblWrap);
      block.appendChild(tblBlock);
    });

    container.appendChild(block);
  }

  // カード（大分類）と分岐区域（中分類）へのジャンプボタンを並べた目次。
  // カードは同じcardLabel（例:「A」）を複数枚持ちうるため、カード単位（card.id）でリンク先を決める。
  function renderFieldNav(container, cards, T) {
    var nav = document.createElement("div");
    nav.className = "field-nav";
    cards.forEach(function (card) {
      var cardEntry = document.createElement("div");
      cardEntry.className = "field-nav-card";

      var cardLink = document.createElement("button");
      cardLink.type = "button";
      cardLink.className = "field-nav-card-link";
      cardLink.textContent = "【" + card.cardLabel + "】" + T(card.name);
      cardLink.addEventListener("click", function () {
        var target = document.getElementById("field-card-" + card.id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      cardEntry.appendChild(cardLink);

      var branches = card.branches || [];
      if (branches.length) {
        var branchList = document.createElement("div");
        branchList.className = "field-nav-branch-list";
        branches.forEach(function (branch, branchIndex) {
          var branchLink = document.createElement("button");
          branchLink.type = "button";
          branchLink.className = "field-nav-branch-link";
          branchLink.textContent = T(branch.name);
          branchLink.addEventListener("click", function () {
            var target = document.getElementById("field-branch-" + card.id + "-" + branchIndex);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          });
          branchList.appendChild(branchLink);
        });
        cardEntry.appendChild(branchList);
      }

      nav.appendChild(cardEntry);
    });
    container.appendChild(nav);
  }

  function renderFieldRulebook() {
    var container = document.getElementById("field-rulebook-list");
    var Fields = window.PriTestFields;
    if (!container || !Fields) return;
    container.innerHTML = "";
    var T = Fields.localizedText;
    var cards = Fields.list();
    renderFieldNav(container, cards, T);
    cards.forEach(function (card) {
      renderFieldCard(container, card, T);
    });
  }

  // イベントチット（霊脈・商人・強敵・ランダムイベント）のルールブックタブ。
  // データ形状はfields.jsのCARDSと同じなので、renderFieldNav/renderFieldCardをそのまま再利用する。
  function renderEventRulebook() {
    var container = document.getElementById("event-rulebook-list");
    var Events = window.PriTestEventRulebook;
    if (!container || !Events) return;
    container.innerHTML = "";
    var T = Events.localizedText;
    var cards = Events.list();
    renderFieldNav(container, cards, T);
    cards.forEach(function (card) {
      renderFieldCard(container, card, T);
    });
  }

  // 「得意武器：武器」時の抽選手順（レア度判定→大分類→小分類）の参考資料タブ
  function renderWeaponRulebook() {
    var container = document.getElementById("weapon-rulebook-list");
    var WR = window.PriTestWeaponRulebook;
    if (!container || !WR) return;
    container.innerHTML = "";
    var T = CharacterTypes.localizedText;

    WR.procedure().forEach(function (step) {
      var block = document.createElement("div");
      block.className = "threat-ref-block";
      var h = document.createElement("h4");
      h.textContent = T(step.title);
      block.appendChild(h);
      var p = document.createElement("p");
      p.className = "threat-ref-body";
      p.textContent = T(step.body);
      block.appendChild(p);
      container.appendChild(block);
    });

    var majorTable = WR.majorTable();
    var majorBlock = document.createElement("div");
    majorBlock.className = "threat-ref-block";
    var majorTitle = document.createElement("h4");
    majorTitle.textContent = T(majorTable.title);
    majorBlock.appendChild(majorTitle);
    majorBlock.appendChild(buildBossTable(majorTable.columns, majorTable.rows, T));
    container.appendChild(majorBlock);

    WR.minorTables().forEach(function (tbl) {
      var block = document.createElement("div");
      block.className = "threat-ref-block";
      var h = document.createElement("h4");
      h.textContent = T(tbl.title);
      block.appendChild(h);
      block.appendChild(buildBossTable(tbl.columns, tbl.rows, T));
      container.appendChild(block);
    });

    [WR.acquisitionNote(), WR.rarityNote()].concat(WR.commonSkillNotes()).forEach(function (note) {
      var block = document.createElement("div");
      block.className = "threat-ref-block";
      var h = document.createElement("h4");
      h.textContent = T(note.title);
      block.appendChild(h);
      var p = document.createElement("p");
      p.className = "threat-ref-body";
      p.textContent = T(note.body);
      block.appendChild(p);
      container.appendChild(block);
    });

    var rarityTable = WR.rarityTable();
    var rarityBlock = document.createElement("div");
    rarityBlock.className = "threat-ref-block";
    var rarityTitle = document.createElement("h4");
    rarityTitle.textContent = T(rarityTable.title);
    rarityBlock.appendChild(rarityTitle);
    rarityBlock.appendChild(buildBossTable(rarityTable.columns, rarityTable.rows, T));
    container.appendChild(rarityBlock);

    renderWeaponCategoryRollTables(container);
  }

  // カテゴリごとの種類決定表（レア度内での出目→武器名）。武器獲取タブの末尾に表示。
  function renderWeaponCategoryRollTables(container) {
    var Weapons = window.PriTestWeapons;
    if (!Weapons) return;
    var identity = function (v) {
      return v;
    };
    var rarityOrder = { C: 1, U: 2, R: 3, L: 4 };
    Weapons.categories().forEach(function (category) {
      var weapons = Weapons.list()
        .filter(function (w) {
          return w.category === category.id;
        })
        .slice()
        .sort(function (a, b) {
          return (rarityOrder[a.rarity] || 9) - (rarityOrder[b.rarity] || 9);
        });
      var block = document.createElement("div");
      block.className = "threat-ref-block";
      var h = document.createElement("h4");
      h.textContent = window.I18N.t("weapon_roll_table_title", { category: Weapons.localizedText(category.name) });
      block.appendChild(h);
      var columns = [
        window.I18N.t("weapon_rarity_column_label"),
        window.I18N.t("weapon_roll_column_label"),
        window.I18N.t("weapon_name_column_label"),
      ];
      var rows = weapons.map(function (w) {
        return [w.rarity, w.roll || "－", Weapons.localizedText(w.name)];
      });
      block.appendChild(buildBossTable(columns, rows, identity));
      container.appendChild(block);
    });
  }

  // 武器データ（weapons.js）の装備品スキル参照（art/innate/status/element/bonus/random/note）を
  // 読み取り専用の <details> エントリとして描画する。character_drawer.js の同名処理と役割は同じだが、
  // ランダム戦技をここでは検索割り当てせず「未決定」表示に留める（規則書は参照専用のため）。
  function renderWeaponSkillRefEntry(container, ref) {
    var Weapons = window.PriTestWeapons;
    var WL = Weapons.localizedText;
    var body = "";
    var name = "";
    var kind = null;
    if (ref.kind === "art") {
      var art = Weapons.getSkill(ref.id);
      name = art ? WL(art.name) : ref.id;
      body = art ? WL(art.body) : "";
      kind = art ? art.kind : null;
    } else if (ref.kind === "innate") {
      var innate = null;
      Weapons.categories().forEach(function (cat) {
        (cat.innateSkills || []).forEach(function (s) {
          if (s.id === ref.id) innate = s;
        });
      });
      name = innate ? WL(innate.name) : ref.id;
      body = innate ? WL(innate.body) : "";
      kind = innate ? innate.kind : null;
    } else if (ref.kind === "status") {
      name = window.I18N.t("weapon_status_skill_label", { status: WL(ref.status) });
      body = WL(Weapons.statusSkillBody(ref.status));
      kind = "Passive";
    } else if (ref.kind === "element") {
      name = window.I18N.t("weapon_element_skill_label", { element: WL(ref.element) });
      body = WL(Weapons.elementSkillBody(ref.element));
      kind = "Passive";
    } else if (ref.kind === "special") {
      name = window.I18N.t("weapon_special_skill_label", { target: WL(ref.target) });
      body = WL(Weapons.specialEffectSkillBody(ref.target));
      kind = "Passive";
    } else if (ref.kind === "elementMinus5") {
      name = window.I18N.t("weapon_element_minus5_skill_label", { element: WL(ref.element) });
      body = WL(Weapons.elementMinus5SkillBody(ref.element));
      kind = "Passive";
    } else if (ref.kind === "statusMinus5") {
      name = window.I18N.t("weapon_status_minus5_skill_label", { status: WL(ref.status) });
      body = WL(Weapons.statusMinus5SkillBody(ref.status));
      kind = "Passive";
    } else if (ref.kind === "bonus") {
      name = WL(ref.text);
    } else if (ref.kind === "random") {
      name = window.I18N.t("weapon_random_skill_label") + (ref.table ? "（" + ref.table + "）" : "");
      if (ref.note) body = WL(ref.note);
    } else {
      name = window.I18N.t("weapon_note_label");
      body = WL(ref.text);
    }

    var details = document.createElement("details");
    details.className = "ability-entry";
    var summary = document.createElement("summary");
    summary.textContent = name + (kind ? "［" + kind + "］" : "");
    details.appendChild(summary);
    if (body) {
      var p = document.createElement("p");
      p.className = "threat-ref-body";
      p.textContent = body;
      details.appendChild(p);
    }
    container.appendChild(details);
  }

  // カテゴリ別サブタブの中身：カテゴリの基礎データ＋固有戦技一覧（参照用）＋所属武器ごとの装備品スキル。
  // 各武器に表示するのは weapon.skills（＝表の装備品スキル欄）に載っているものだけ。
  function renderWeaponCategoryList(categoryId) {
    var container = document.getElementById("weapon-category-" + categoryId + "-list");
    var Weapons = window.PriTestWeapons;
    if (!container || !Weapons) return;
    container.innerHTML = "";
    var WL = Weapons.localizedText;
    var category = Weapons.getCategory(categoryId);
    if (!category) return;

    var statsBlock = document.createElement("div");
    statsBlock.className = "threat-ref-block";
    var statsP = document.createElement("p");
    statsP.className = "threat-ref-body";
    if (category.isShield) {
      statsP.textContent = [
        window.I18N.t("weapon_guard_cost_label") + window.I18N.t("colon_separator") + WL(category.basicStats.guardCost),
        window.I18N.t("weapon_guard_hp_label") +
          window.I18N.t("colon_separator") +
          "C/U " +
          category.basicStats.guardHpCU +
          "　R/L " +
          category.basicStats.guardHpRL,
        window.I18N.t("weapon_power_mod_label") + window.I18N.t("colon_separator") + WL(category.basicStats.powerMod),
      ].join("\n");
    } else {
      statsP.textContent = [
        window.I18N.t("weapon_attack_cost_label") + window.I18N.t("colon_separator") + WL(category.basicStats.attackCost),
        window.I18N.t("weapon_power_label") + window.I18N.t("colon_separator") + category.basicStats.weaponPower,
        window.I18N.t("weapon_power_mod_label") + window.I18N.t("colon_separator") + WL(category.basicStats.powerMod),
      ].join("\n");
    }
    statsBlock.appendChild(statsP);
    container.appendChild(statsBlock);

    if (category.note) {
      var noteP = document.createElement("p");
      noteP.className = "threat-ref-body";
      noteP.textContent = WL(category.note);
      container.appendChild(noteP);
    }

    if (category.twoHitBonus && category.twoHitBonus.length) {
      var twoHitTitle = document.createElement("p");
      twoHitTitle.className = "boss-subheading";
      twoHitTitle.textContent = window.I18N.t("weapon_two_hit_bonus_label");
      container.appendChild(twoHitTitle);
      category.twoHitBonus.forEach(function (bonus) {
        var bonusP = document.createElement("p");
        bonusP.className = "threat-ref-body";
        bonusP.textContent = WL(bonus.name) + window.I18N.t("colon_separator") + WL(bonus.body);
        container.appendChild(bonusP);
      });
    }

    if (category.innateSkills && category.innateSkills.length) {
      var innateTitle = document.createElement("p");
      innateTitle.className = "boss-subheading";
      innateTitle.textContent = window.I18N.t("weapon_innate_skills_label");
      container.appendChild(innateTitle);
      category.innateSkills.forEach(function (s) {
        renderWeaponSkillRefEntry(container, { kind: "innate", id: s.id });
      });
    }

    if (category.randomSkillTable && category.randomSkillTable.length) {
      var randomTitle = document.createElement("p");
      randomTitle.className = "boss-subheading";
      randomTitle.textContent = window.I18N.t("weapon_random_skill_table_label");
      container.appendChild(randomTitle);
      category.randomSkillTable.forEach(function (row) {
        var art = Weapons.getSkill(row.id);
        var details = document.createElement("details");
        details.className = "ability-entry";
        var summary = document.createElement("summary");
        summary.textContent = "[" + row.roll + "] " + (art ? WL(art.name) : row.id) + (art && art.kind ? "［" + art.kind + "］" : "");
        details.appendChild(summary);
        if (art) {
          var p = document.createElement("p");
          p.className = "threat-ref-body";
          p.textContent = WL(art.body);
          details.appendChild(p);
        }
        container.appendChild(details);
      });
    }

    if (category.extraTables && category.extraTables.length) {
      category.extraTables.forEach(function (tbl) {
        var tblBlock = document.createElement("div");
        tblBlock.className = "threat-ref-block";
        var tblH = document.createElement("p");
        tblH.className = "boss-subheading";
        tblH.textContent = WL(tbl.title);
        tblBlock.appendChild(tblH);
        var tblWrap = document.createElement("div");
        tblWrap.className = "field-variance-wrap";
        tblWrap.appendChild(buildBossTable(tbl.columns, tbl.rows, WL));
        tblBlock.appendChild(tblWrap);
        container.appendChild(tblBlock);
      });
    }

    // 杖・聖印の「ランダム魔術／ランダム祈祷」決定表：ダイス出目→魔術/祈祷スキルIDを、
    // カテゴリのrandomSkillTableと同じ〈details〉展開形式で複数表ぶん表示する。
    if (category.namedSkillTables && category.namedSkillTables.length) {
      category.namedSkillTables.forEach(function (namedTbl) {
        var namedTitle = document.createElement("p");
        namedTitle.className = "boss-subheading";
        namedTitle.textContent = WL(namedTbl.title);
        container.appendChild(namedTitle);
        namedTbl.rows.forEach(function (row) {
          var art = Weapons.getSkill(row.id);
          var details = document.createElement("details");
          details.className = "ability-entry";
          var summary = document.createElement("summary");
          summary.textContent = "[" + row.roll + "] " + (art ? WL(art.name) : row.id) + (art && art.kind ? "［" + art.kind + "］" : "");
          details.appendChild(summary);
          if (art) {
            var p = document.createElement("p");
            p.className = "threat-ref-body";
            p.textContent = WL(art.body);
            details.appendChild(p);
          }
          container.appendChild(details);
        });
      });
    }

    var listTitle = document.createElement("p");
    listTitle.className = "boss-subheading";
    listTitle.textContent = window.I18N.t("weapon_category_weapon_list_label");
    container.appendChild(listTitle);

    var rarityOrder = { C: 1, U: 2, R: 3, L: 4 };
    var weapons = Weapons.list()
      .filter(function (w) {
        return w.category === categoryId;
      })
      .slice()
      .sort(function (a, b) {
        return (rarityOrder[a.rarity] || 9) - (rarityOrder[b.rarity] || 9);
      });

    weapons.forEach(function (weapon) {
      var card = document.createElement("div");
      card.className = "relic-candidate-card";
      var title = document.createElement("div");
      title.className = "relic-candidate-name";
      title.textContent =
        WL(weapon.name) +
        "（" +
        window.I18N.t("weapon_rarity_column_label") +
        window.I18N.t("colon_separator") +
        weapon.rarity +
        "・" +
        window.I18N.t("weapon_roll_column_label") +
        window.I18N.t("colon_separator") +
        (weapon.roll || "－") +
        "）";
      card.appendChild(title);
      if (category.isShield) {
        if (weapon.attachedEffect && weapon.attachedEffect.length) {
          var attachedTitle = document.createElement("p");
          attachedTitle.className = "boss-subheading";
          attachedTitle.textContent = window.I18N.t("weapon_attached_effect_label");
          card.appendChild(attachedTitle);
          weapon.attachedEffect.forEach(function (ref) {
            renderWeaponSkillRefEntry(card, ref);
          });
        }
        if (weapon.reverseArt && weapon.reverseArt.length) {
          var reverseTitle = document.createElement("p");
          reverseTitle.className = "boss-subheading";
          reverseTitle.textContent = window.I18N.t("weapon_reverse_art_label");
          card.appendChild(reverseTitle);
          weapon.reverseArt.forEach(function (ref) {
            renderWeaponSkillRefEntry(card, ref);
          });
        }
      } else {
        (weapon.skills || []).forEach(function (ref) {
          renderWeaponSkillRefEntry(card, ref);
        });
      }
      container.appendChild(card);
    });
  }

  // 武器タブのサブタブ（武器獲取／カテゴリ別）を動的に構築する。カテゴリは weapons.js に追加され次第、
  // 自動でサブタブとして増えていく。
  function setupWeaponSubTabs() {
    var tabsContainer = document.getElementById("weapon-subtabs");
    var panelsContainer = document.getElementById("weapon-subtab-panels");
    var Weapons = window.PriTestWeapons;
    if (!tabsContainer || !panelsContainer || !Weapons) return;
    tabsContainer.innerHTML = "";
    panelsContainer.innerHTML = "";

    var tabs = [{ id: "acquisition", label: window.I18N.t("weapon_subtab_acquisition_label") }].concat(
      Weapons.categories().map(function (cat) {
        return { id: cat.id, label: Weapons.localizedText(cat.name) };
      })
    );

    tabs.forEach(function (tab) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weapon-subtab-btn" + (tab.id === activeWeaponSubTab ? " active" : "");
      btn.setAttribute("data-subtab", tab.id);
      btn.textContent = tab.label;
      btn.addEventListener("click", function () {
        switchWeaponSubTab(tab.id);
      });
      tabsContainer.appendChild(btn);

      var panel = document.createElement("div");
      panel.className = "weapon-subtab-panel";
      panel.id = "weapon-subpanel-" + tab.id;
      panel.hidden = tab.id !== activeWeaponSubTab;
      var inner = document.createElement("div");
      inner.id = tab.id === "acquisition" ? "weapon-rulebook-list" : "weapon-category-" + tab.id + "-list";
      panel.appendChild(inner);
      panelsContainer.appendChild(panel);
    });
  }

  function switchWeaponSubTab(id) {
    activeWeaponSubTab = id;
    document.querySelectorAll(".weapon-subtab-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-subtab") === id);
    });
    document.querySelectorAll(".weapon-subtab-panel").forEach(function (panel) {
      panel.hidden = panel.id !== "weapon-subpanel-" + id;
    });
  }

  // 武器タブ全体（サブタブ構築＋武器獲取＋カテゴリ別一覧）をまとめて描画する。
  function renderWeaponRulebookAll() {
    setupWeaponSubTabs();
    renderWeaponRulebook();
    var Weapons = window.PriTestWeapons;
    if (Weapons) {
      Weapons.categories().forEach(function (cat) {
        renderWeaponCategoryList(cat.id);
      });
    }
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
  // PC番号（1〜6）は前衛／後衛どちらのマスにいても同じPCを指すため、敵視の値は両エリアで共有する。
  // 片方の入力を変更したら、もう片方の同じ番号の入力欄にも同じ値を反映する。
  function syncAggroInputs(idx, value) {
    ["battle-front-grid", "battle-back-grid"].forEach(function (containerId) {
      var input = document.getElementById(containerId + "-aggro-" + idx);
      if (input && input.value !== String(value)) input.value = value;
    });
  }

  // 前衛／後衛エリア: 1〜6の目に対応する6個のマス（クリックでON/OFFトグル）＋各PCの敵視入力欄
  function buildBattleToggleGrid(containerId, valuesArray, aggroArray) {
    var container = document.getElementById(containerId);
    container.innerHTML = "";
    for (var i = 0; i < 6; i++) {
      (function (idx) {
        var cell = document.createElement("div");
        cell.className = "battle-toggle-cell";

        var btn = document.createElement("button");
        btn.type = "button";
        btn.id = containerId + "-" + idx;
        btn.className = "battle-toggle-square";
        btn.textContent = idx + 1;
        if (valuesArray[idx]) btn.classList.add("active");
        btn.addEventListener("click", function () {
          valuesArray[idx] = !valuesArray[idx];
          btn.classList.toggle("active", valuesArray[idx]);
          saveState();
        });
        cell.appendChild(btn);

        var aggroInput = document.createElement("input");
        aggroInput.type = "number";
        aggroInput.id = containerId + "-aggro-" + idx;
        aggroInput.className = "battle-aggro-input";
        aggroInput.min = "0";
        aggroInput.title = window.I18N.t("battle_aggro_label") + " (PC" + (idx + 1) + ")";
        aggroInput.value = (aggroArray && aggroArray[idx]) || 0;
        aggroInput.addEventListener("input", function () {
          var v = Math.max(0, Number(aggroInput.value) || 0);
          state.battle.aggro[idx] = v;
          syncAggroInputs(idx, v);
          saveState();
        });
        cell.appendChild(aggroInput);

        container.appendChild(cell);
      })(i);
    }
  }

  function renderBattleToggleValues(containerId, valuesArray, aggroArray) {
    valuesArray.forEach(function (value, idx) {
      var btn = document.getElementById(containerId + "-" + idx);
      if (btn) btn.classList.toggle("active", !!value);
      var input = document.getElementById(containerId + "-aggro-" + idx);
      if (input) input.value = (aggroArray && aggroArray[idx]) || 0;
    });
  }

  function buildBattleAreas() {
    buildBattleToggleGrid("battle-front-grid", state.battle.front, state.battle.aggro);
    buildBattleToggleGrid("battle-back-grid", state.battle.back, state.battle.aggro);
  }

  function buildEnemyHpGrid() {
    var container = document.getElementById("battle-enemy-hp-grid");
    container.innerHTML = "";
    for (var row = 0; row < ENEMY_HP_ROWS; row++) {
      var rowDiv = document.createElement("div");
      rowDiv.className = "battle-hp-row";
      for (var col = 0; col < ENEMY_HP_COLS; col++) {
        (function (idx) {
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.id = "battle-enemy-hp-" + idx;
          cb.addEventListener("change", function (e) {
            state.battle.enemyHp[idx] = e.target.checked;
            saveState();
          });
          rowDiv.appendChild(cb);
        })(row * ENEMY_HP_COLS + col);
      }
      container.appendChild(rowDiv);
    }
  }

  function renderEnemyHpGrid() {
    for (var i = 0; i < ENEMY_HP_ROWS * ENEMY_HP_COLS; i++) {
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
    renderBattleToggleValues("battle-front-grid", state.battle.front, state.battle.aggro);
    renderBattleToggleValues("battle-back-grid", state.battle.back, state.battle.aggro);
    renderEnemyHpGrid();
    renderMobHpList();
    renderSelectedEnemies();
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

  // 戦闘盤の簡易エネミー検索。規則書タブと異なり、等級・HP量・系別のみを表示する（耐性・アクション・特殊能力は非表示）。
  function renderBattleEnemySearchResults() {
    var input = document.getElementById("battle-enemy-search-input");
    var results = document.getElementById("battle-enemy-search-results");
    var Enemies = window.PriTestEnemies;
    if (!input || !results || !Enemies) return;
    var q = input.value.trim();
    results.innerHTML = "";
    if (!q) {
      results.hidden = true;
      return;
    }
    var matches = Enemies.search(q);
    if (!matches.length) {
      results.hidden = true;
      return;
    }
    matches.slice(0, 20).forEach(function (row) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weapon-search-item";
      btn.textContent = Enemies.localizedText(row.enemy.name) + "（" + Enemies.localizedText(row.familyName) + "）";
      btn.addEventListener("click", function () {
        input.value = "";
        results.hidden = true;
        renderBattleEnemyLookupResult(row);
      });
      results.appendChild(btn);
    });
    results.hidden = false;
  }

  function renderBattleEnemyLookupResult(row) {
    var container = document.getElementById("battle-enemy-lookup-result");
    var Enemies = window.PriTestEnemies;
    if (!container || !Enemies) return;
    container.innerHTML = "";
    var T = Enemies.localizedText;

    var title = document.createElement("p");
    title.className = "boss-subheading";
    title.textContent = T(row.enemy.name);
    container.appendChild(title);

    var familyLine = document.createElement("p");
    familyLine.className = "threat-ref-body";
    familyLine.textContent = window.I18N.t("enemy_family_label") + window.I18N.t("colon_separator") + T(row.familyName);
    container.appendChild(familyLine);

    var weakness = extractWeakness(row.enemy.special, T);
    if (weakness) {
      var weaknessLine = document.createElement("p");
      weaknessLine.className = "threat-ref-body";
      weaknessLine.textContent = window.I18N.t("enemy_weakness_label") + window.I18N.t("colon_separator") + weakness;
      container.appendChild(weaknessLine);
    }

    var table = document.createElement("table");
    table.className = "boss-action-table";
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    [window.I18N.t("enemy_level_label"), window.I18N.t("enemy_hp_label")].forEach(function (label) {
      var th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    var hasHp = false;
    (row.familyBase || []).forEach(function (lv) {
      if (lv.hp) hasHp = true;
      var tr = document.createElement("tr");
      var tdLevel = document.createElement("td");
      tdLevel.textContent = lv.level;
      tr.appendChild(tdLevel);
      var tdHp = document.createElement("td");
      tdHp.textContent = lv.hp || "—";
      tr.appendChild(tdHp);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var wrap = document.createElement("div");
    wrap.className = "boss-table-scroll";
    wrap.appendChild(table);
    container.appendChild(wrap);

    if (!hasHp) {
      var note = document.createElement("p");
      note.className = "threat-ref-body";
      note.textContent = window.I18N.t("enemy_hp_unavailable_note");
      container.appendChild(note);
    }

    var addRow = document.createElement("div");
    addRow.className = "wb-row";
    var levelLabel = document.createElement("label");
    levelLabel.textContent = window.I18N.t("enemy_level_label");
    var maxLevel = (row.familyBase || []).length || 15;
    var levelInput = document.createElement("input");
    levelInput.type = "number";
    levelInput.className = "stat-input";
    levelInput.min = "1";
    levelInput.max = String(maxLevel);
    levelInput.value = "1";
    levelLabel.appendChild(levelInput);
    addRow.appendChild(levelLabel);

    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "primary-btn";
    addBtn.textContent = window.I18N.t("battle_enemy_add_button");
    addBtn.addEventListener("click", function () {
      var level = Math.max(1, Math.min(maxLevel, Number(levelInput.value) || 1));
      var key = row.familyId + "|" + row.enemy.id + "|" + level;
      if (state.battle.selectedEnemyIds.indexOf(key) === -1) {
        state.battle.selectedEnemyIds.push(key);
        saveState();
        renderSelectedEnemies();
      }
    });
    addRow.appendChild(addBtn);
    container.appendChild(addRow);
  }

  // 戦場で選択中のエネミー（複数選択可）。合成キー「familyId|enemyId|level」をEnemies.getで解決し、
  // 専用イラスト（未整備の場合は汎用アイコンstrong-enemy.pngで代替）+ 名前 +
  // 等級・血量・種族・体型を公開情報として、戦場面板（スライドインするbattle-drawer）の中と、
  // 盤面（board-grid）の左側の共通地図の空きスペースの2箇所に同じ内容を描画する。
  // 特殊能力欄の「〔弱点:XXX〕公開情報」のような記述から、弱点だけを取り出す（公開情報として戦場に表示するため）。
  function extractWeakness(specialField, T) {
    if (!specialField) return null;
    var text = T(specialField);
    var m = text.match(/〔弱[点點][:：]([^〕]+)〕/);
    return m ? m[1] : null;
  }

  function renderSelectedEnemies() {
    var Enemies = window.PriTestEnemies;
    if (!Enemies) return;
    var T = Enemies.localizedText;
    var ids = (state.battle && state.battle.selectedEnemyIds) || [];
    var resolved = ids
      .map(function (key) {
        var parts = key.split("|");
        var info = Enemies.get(parts[0], parts[1]);
        var level = Math.max(1, Number(parts[2]) || 1);
        return info ? { key: key, info: info, level: level } : null;
      })
      .filter(Boolean);

    [
      { containerId: "battle-selected-enemies", withRemove: true },
      { containerId: "board-side-enemies", withRemove: false },
    ].forEach(function (target) {
      var container = document.getElementById(target.containerId);
      if (!container) return;
      container.innerHTML = "";
      container.hidden = resolved.length === 0;
      resolved.forEach(function (item) {
        var chip = document.createElement("div");
        chip.className = "selected-enemy-chip";
        var icon = document.createElement("img");
        icon.className = "selected-enemy-icon";
        icon.src = Enemies.imagePath(item.info.enemy) || "../static/images/icons/strong-enemy.png";
        icon.alt = "";
        chip.appendChild(icon);
        var info = document.createElement("div");
        info.className = "selected-enemy-info";
        var name = document.createElement("span");
        name.className = "selected-enemy-name";
        name.textContent = T(item.info.enemy.name);
        info.appendChild(name);
        var statLine = document.createElement("span");
        statLine.className = "selected-enemy-stats";
        var lvRow = (item.info.familyBase || []).filter(function (lv) {
          return lv.level === item.level;
        })[0];
        var statParts = [
          window.I18N.t("enemy_level_label") + window.I18N.t("colon_separator") + item.level,
          T(item.info.familyName),
          item.info.enemy.size || "-",
        ];
        if (lvRow && lvRow.hp) {
          statParts.push(window.I18N.t("enemy_hp_label") + window.I18N.t("colon_separator") + lvRow.hp);
        }
        var weakness = extractWeakness(item.info.enemy.special, T);
        if (weakness) {
          statParts.push(window.I18N.t("enemy_weakness_label") + window.I18N.t("colon_separator") + weakness);
        }
        statLine.textContent = statParts.join("　");
        info.appendChild(statLine);
        chip.appendChild(info);
        if (target.withRemove) {
          var removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "tag-remove";
          removeBtn.textContent = "×";
          removeBtn.addEventListener("click", function () {
            var idx = state.battle.selectedEnemyIds.indexOf(item.key);
            if (idx !== -1) {
              state.battle.selectedEnemyIds.splice(idx, 1);
              saveState();
              renderSelectedEnemies();
            }
          });
          chip.appendChild(removeBtn);
        }
        container.appendChild(chip);
      });
    });
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
      if (state.dayNumber >= MAX_DAY) {
        btn.disabled = true;
      } else if (scenario) {
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
    var wasContinue = state.selectMode === "continue";
    if (wasContinue) saveUndoSnapshot();

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
    if (scenario.fixedLayout) {
      // 固定配置副本：原書図解の通りの位置（FIXED_LAYOUT_POS_TO_SLOT）にそのまま配置する。
      scenario.day1.forEach(function (row) {
        var idx = FIXED_LAYOUT_POS_TO_SLOT[row.pos];
        state.slots[idx] = { code: row.suit + "-" + row.rank, revealed: false };
        state.cardLevels[idx] = 0;
      });
    } else {
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
    }
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

  function keepCardsTarget() {
    return scenario && scenario.fixedLayout ? SLOT_COUNT - scenario.day2.length : 3;
  }

  function openKeepCardsDrawer() {
    keepSelection.clear();
    if (scenario && scenario.fixedLayout) keepSelection.add(FIXED_LAYOUT_CENTER_SLOT);
    // 地変マスは「常に保持」ではなく「常に除外」なので keepSelection には入れない
    // （入れると submitKeepCards のクリアループで残ってしまい、地変タイルを配置できなくなる）。
    renderKeepGrid();
    var terrainNote = document.getElementById("keep-terrain-note");
    if (terrainNote) {
      var hasTerrain = scenarioTerrainRows().length > 0;
      terrainNote.hidden = !hasTerrain;
      if (hasTerrain && scenario.note) terrainNote.textContent = window.PriTestWeapons.localizedText(scenario.note);
    }
    document.getElementById("keep-drawer").classList.add("open");
  }

  function closeKeepCardsDrawer() {
    document.getElementById("keep-drawer").classList.remove("open");
  }

  function renderKeepGrid() {
    var grid = document.getElementById("keep-grid");
    grid.innerHTML = "";
    var target = keepCardsTarget();
    var isFixed = scenario && scenario.fixedLayout;
    var titleEl = document.querySelector("#keep-drawer h2");
    if (titleEl) {
      titleEl.textContent = isFixed
        ? window.I18N.t("keep_cards_title_fixed", { n: target })
        : window.I18N.t("keep_cards_title");
    }
    var hasTerrain = scenarioTerrainRows().length > 0;
    for (var i = 0; i < SLOT_COUNT; i++) {
      (function (index) {
        var slot = state.slots[index];
        var locked = isFixed && index === FIXED_LAYOUT_CENTER_SLOT;
        var terrainLocked = hasTerrain && TERRAIN_SWAP_SLOTS.indexOf(index) !== -1;
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
        if (locked) btn.classList.add("locked");
        if (terrainLocked) btn.classList.add("terrain-locked");
        btn.addEventListener("click", function () {
          if (!slot || locked || terrainLocked) return;
          if (keepSelection.has(index)) {
            keepSelection.delete(index);
          } else {
            if (keepSelection.size >= target) return;
            keepSelection.add(index);
          }
          renderKeepGrid();
        });
        grid.appendChild(btn);
      })(i);
    }
    document.getElementById("keep-count").textContent = isFixed
      ? window.I18N.t("keep_cards_count_fixed", { n: keepSelection.size, max: target })
      : window.I18N.t("keep_cards_count", { n: keepSelection.size });
    document.getElementById("btn-keep-submit").disabled = keepSelection.size !== target;
  }

  function submitKeepCards() {
    if (keepSelection.size !== keepCardsTarget()) return;
    saveUndoSnapshot();
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (!keepSelection.has(i)) {
        state.slots[i] = null;
        state.cardLevels[i] = null;
      }
    }
    var allDay2Rows = scenario.day2.slice().sort(function (a, b) {
      return a.pos - b.pos;
    });
    var terrainRows = allDay2Rows.filter(function (row) {
      return row.terrain;
    });
    var normalRows = allDay2Rows.filter(function (row) {
      return !row.terrain;
    });
    // 地変（terrain-shift）タイル：場地列5（slot 0/3/6）へランダム順で強制配置。
    // 保持選択の対象外なので、この時点で既に空マスになっている。
    if (terrainRows.length) {
      shuffle(terrainRows).forEach(function (row, i) {
        var pos = TERRAIN_SWAP_SLOTS[i];
        if (pos === undefined) return;
        state.slots[pos] = { code: row.suit + "-" + row.rank, revealed: false };
        state.cardLevels[pos] = 0;
      });
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
    normalRows.forEach(function (row, i) {
      var pos = emptyPositions[i];
      if (pos === undefined) return;
      state.slots[pos] = { code: row.suit + "-" + row.rank, revealed: false };
      state.cardLevels[pos] = 0;
    });
    var day2Rows = allDay2Rows;
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

  document.addEventListener("DOMContentLoaded", async function () {
    if (!Games.checkAdminPassword(window.I18N.t("admin_password_prompt"))) {
      window.location.href = "../admin/index.html";
      return;
    }
    // この端末がまだ知らないgameId（他端末で作成されたクラウドゲームのリンクを初めて開いた場合）
    // なら、Firebaseからメタ情報を取得してローカルにも登録を試みる。
    if (!game) {
      var remoteMeta = await GameStorage.fetchGameMeta(gameId);
      if (remoteMeta) {
        game = Games.registerCloudGame(gameId, remoteMeta);
        scenario = game && game.scenarioId ? Scenarios.get(game.scenarioId) : null;
      }
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
      renderRoster: renderCharacterRoster,
    });
    loadState();
    buildBattleAreas();
    buildEnemyHpGrid();
    renderEnemyHpGrid();
    renderMobHpList();
    renderSelectedEnemies();
    renderBattleRefTexts();
    renderDicePool();
    renderBoard();
    renderLog();
    renderLogToggleLabel();
    renderBossRulebook();
    renderWeaponRulebookAll();
    renderTalismanAcquisitionTable();
    renderTalismanRulebook();
    renderConsumableDetermineTable();
    renderConsumableRulebook();
    renderEnemyRulebookAll();
    renderFieldRulebook();
    renderEventRulebook();

    // クラウド保存ゲームのみ：Firebaseから最新状態を取得し（購読開始時に1回必ず呼ばれる）、
    // 以後は他端末からの変更を受信するたびに再描画する。ローカル専用ゲームでは何もしない。
    if (game && game.storageMode === "cloud") {
      // ゲーム作成直後にすぐページ遷移すると送信中のメタ情報書き込みが中断されることがあるため、
      // このページの読み込み時にも念のため再送信しておく（冪等な操作なので害はない）。
      GameStorage.pushGameMeta(gameId, "cloud", {
        name: game.name,
        createdAt: game.createdAt,
        scenarioId: game.scenarioId || null,
        night3BossId: game.night3BossId || null,
      });
      GameStorage.subscribeNightState(gameId, game.storageMode, function (data) {
        applyLoadedData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        renderEnemyHpGrid();
        renderMobHpList();
        renderSelectedEnemies();
        renderDicePool();
        renderBoard();
        renderLog();
        renderLogToggleLabel();
        renderUndoButton();
      });
      GameStorage.subscribeCharacters(gameId, game.storageMode, function (list) {
        rosterCharacters.length = 0;
        list.forEach(function (c) {
          rosterCharacters.push(CharacterDrawer.ensureDefaults(c));
        });
        localStorage.setItem(CHARACTERS_KEY, JSON.stringify(rosterCharacters));
        renderCharacterRoster();
      });
    }

    document.getElementById("btn-open-rulebook").addEventListener("click", handleOpenRulebook);
    document.getElementById("btn-rulebook-close").addEventListener("click", closeRulebookModal);
    document.getElementById("btn-rulebook-floating-close").addEventListener("click", closeRulebookModal);
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
    document.getElementById("btn-undo-night").addEventListener("click", handleUndoNight);
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
    document.getElementById("battle-enemy-search-input").addEventListener("input", renderBattleEnemySearchResults);
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
      renderWeaponRulebookAll();
      renderTalismanAcquisitionTable();
      renderTalismanRulebook();
      renderConsumableDetermineTable();
      renderConsumableRulebook();
      renderEnemyRulebookAll();
      renderFieldRulebook();
      renderEventRulebook();
      renderSelectedEnemies();
    });
  });
})();
