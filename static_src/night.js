(function () {
  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var SUIT_CLASS = { S: "suit-black", H: "suit-red", D: "suit-orange", C: "suit-green" };
  var SUIT_CLASSES = ["suit-black", "suit-red", "suit-orange", "suit-green"];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SLOT_COUNT = 9;
  var STORAGE_KEY = "pritest-night-state";

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

  var state = {
    slots: new Array(SLOT_COUNT).fill(null), // { code, revealed } | null
    boardStarted: false,
    log: [], // { key, params, time(ms) }
    lastRevealedIndex: null,
    selection: new Set(),
    selectMode: "initial",
    maxSelect: SLOT_COUNT,
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

  function saveState() {
    var data = {
      slots: state.slots,
      boardStarted: state.boardStarted,
      log: state.log,
      lastRevealedIndex: state.lastRevealedIndex,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      if (Array.isArray(data.slots) && data.slots.length === SLOT_COUNT) {
        state.slots = data.slots;
      }
      state.boardStarted = !!data.boardStarted;
      state.log = Array.isArray(data.log) ? data.log : [];
      state.lastRevealedIndex =
        typeof data.lastRevealedIndex === "number" ? data.lastRevealedIndex : null;
    } catch (e) {
      // 壊れた状態は無視して初期状態のまま続行する
    }
  }

  function resetState() {
    state.slots = new Array(SLOT_COUNT).fill(null);
    state.boardStarted = false;
    state.log = [];
    state.lastRevealedIndex = null;
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
        if (state.lastRevealedIndex === i) el.classList.add("latest");
      }
    }
    document.getElementById("pile-start").classList.toggle("active", state.boardStarted);
    document.getElementById("pile-end").classList.toggle("active", state.boardStarted);
    renderPrimaryButton();
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
      btn.textContent = window.I18N.t("continue_button");
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
    });

    var logKey = state.selectMode === "initial" ? "log_select_submit" : "log_continue_submit";
    state.boardStarted = true;
    closeSelectDrawer();
    renderBoard();
    addLog(logKey, { n: codes.length, cards: cardsLabel });
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
    var card = CARD_BY_CODE[slot.code];
    if (!slot.revealed) {
      openConfirm(
        "confirm_reveal_msg",
        function () {
          slot.revealed = true;
          state.lastRevealedIndex = index;
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
          if (state.lastRevealedIndex === index) state.lastRevealedIndex = null;
          renderBoard();
          addLog("log_draw_out", { slot: index + 1, card: card.label });
        },
        function () {
          addLog("log_cancel_draw", { slot: index + 1, card: card.label });
        }
      );
    }
  }

  function handleNewGame() {
    if (!state.boardStarted) {
      resetState();
      renderBoard();
      renderLog();
      return;
    }
    openConfirm("confirm_new_game_msg", function () {
      resetState();
      renderBoard();
      addLog("log_new_game");
    });
  }

  function buildBoardSlots() {
    var grid = document.getElementById("board-grid");
    for (var i = 0; i < SLOT_COUNT; i++) {
      (function (index) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.id = "slot-" + index;
        btn.className = "slot slot-" + index + " empty";
        btn.addEventListener("click", function () {
          onSlotClick(index);
        });
        grid.appendChild(btn);
      })(i);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
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

    window.addEventListener("i18n:change", function () {
      renderBoard();
      renderLog();
      renderLogToggleLabel();
      renderSelectScreen();
    });
  });
})();
