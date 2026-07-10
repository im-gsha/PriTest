(function () {
  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var SUIT_CLASS = { S: "suit-black", H: "suit-red", D: "suit-orange", C: "suit-green" };
  var SUIT_CLASSES = ["suit-black", "suit-red", "suit-orange", "suit-green"];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SLOT_COUNT = 9;
  var NEW_GAME_PASSWORD = "night";
  var LEVEL_STEPS = [null, 0, 1, 2, 3, 4, 5]; // null = "全"（未指定）

  var Games = window.PriTestGames;
  var gameId = Games.getGameIdFromQuery();
  var game = gameId ? Games.get(gameId) : null;
  var STORAGE_KEY = "pritest-night-state-" + gameId;

  function buildDeck() {
    var deck = [];
    SUITS.forEach(function (suit) {
      RANKS.forEach(function (rank) {
        deck.push({
          code: suit + "-" + rank,
          suit: suit,
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

  var state = {
    slots: new Array(SLOT_COUNT).fill(null), // { code, revealed } | null
    cardLevels: new Array(SLOT_COUNT).fill(null), // null("全") | 0-5
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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadChecks(raw) {
    if (!raw || typeof raw !== "object") return defaultChecks();
    return { one: !!raw.one, all: !!raw.all };
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
    } catch (e) {
      // 壊れた状態は無視して初期状態のまま続行する
    }
  }

  function resetState() {
    state.slots = new Array(SLOT_COUNT).fill(null);
    state.cardLevels = new Array(SLOT_COUNT).fill(null);
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
    }
    renderPiles();
    renderFieldLevels();
    renderDayStatus();
    renderPrimaryButton();
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
    document.getElementById("day-status").textContent = game.name + " " + dayText;
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
      btn.onclick = function () {
        openSelectDrawer("initial", SLOT_COUNT);
      };
    } else {
      btn.textContent = window.I18N.t("next_night_button");
      btn.disabled = emptyCount === 0;
      btn.onclick = function () {
        openSelectDrawer("continue", emptyCount);
      };
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
      state.cardLevels[pos] = null;
    });

    var wasContinue = state.selectMode === "continue";
    var logKey = wasContinue ? "log_continue_submit" : "log_select_submit";
    state.boardStarted = true;
    if (wasContinue) {
      state.startDefeatedDay = state.dayNumber;
      state.startSuit = state.endSuit;
      state.startChecks = { one: true, all: true };
      state.startDefeated = true;
      state.endSuit = null;
      state.endChecks = defaultChecks();
      state.dayNumber += 1;
    }
    closeSelectDrawer();
    renderBoard();
    addLog(logKey, { n: codes.length, cards: cardsLabel });
    if (wasContinue) addLog("log_next_night", { day: state.dayNumber });
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
    loadState();
    renderBoard();
    renderLog();
    renderLogToggleLabel();

    document.getElementById("btn-select-submit").addEventListener("click", submitSelection);
    document.getElementById("btn-select-cancel").addEventListener("click", closeSelectDrawer);
    document.getElementById("drawer-backdrop").addEventListener("click", closeSelectDrawer);
    document.getElementById("btn-new-game").addEventListener("click", handleNewGame);
    document.getElementById("btn-log-toggle").addEventListener("click", function () {
      document.getElementById("log-list").classList.toggle("collapsed");
      renderLogToggleLabel();
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
    });
  });
})();
