(function () {
  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SLOT_COUNT = 9;

  function buildDeck() {
    var deck = [];
    SUITS.forEach(function (suit) {
      RANKS.forEach(function (rank) {
        deck.push({
          code: suit + "-" + rank,
          label: SUIT_SYMBOL[suit] + rank,
          red: suit === "H" || suit === "D",
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
    usedCodes: new Set(),
    selection: new Set(),
    selectMode: "initial",
    maxSelect: SLOT_COUNT,
    slots: new Array(SLOT_COUNT).fill(null),
    boardStarted: false,
    log: [],
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

  function addLog(key, params) {
    state.log.push({ key: key, params: params || {}, time: new Date() });
    renderLog();
  }

  function showScreen(name) {
    ["start", "select", "board"].forEach(function (id) {
      document.getElementById("screen-" + id).hidden = id !== name;
    });
  }

  function renderSelectScreen() {
    var grid = document.getElementById("select-grid");
    grid.innerHTML = "";
    DECK.forEach(function (card) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mini-card" + (card.red ? " red" : "");
      btn.textContent = card.label;
      var disabled = state.usedCodes.has(card.code);
      if (disabled) btn.classList.add("disabled");
      if (state.selection.has(card.code)) btn.classList.add("selected");
      btn.disabled = disabled;
      btn.addEventListener("click", function () {
        toggleSelect(card.code);
      });
      grid.appendChild(btn);
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

  function renderBoard() {
    for (var i = 0; i < SLOT_COUNT; i++) {
      var el = document.getElementById("slot-" + i);
      var slot = state.slots[i];
      el.classList.remove("empty", "face-down", "face-up", "red");
      if (!slot) {
        el.classList.add("empty");
        el.textContent = "";
      } else if (!slot.revealed) {
        el.classList.add("face-down");
        el.textContent = "F";
      } else {
        el.classList.add("face-up");
        if (slot.red) el.classList.add("red");
        el.textContent = slot.label;
      }
    }
    var emptyCount = state.slots.filter(function (s) {
      return s === null;
    }).length;
    document.getElementById("btn-continue").disabled = emptyCount === 0;
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
      var time = entry.time.toLocaleTimeString();
      li.textContent = "[" + time + "] " + window.I18N.t(entry.key, entry.params);
      list.appendChild(li);
    });
  }

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

  function startInitialSelect() {
    state.selectMode = "initial";
    state.maxSelect = SLOT_COUNT;
    state.selection.clear();
    showScreen("select");
    renderSelectScreen();
  }

  function startContinueSelect() {
    var emptyCount = state.slots.filter(function (s) {
      return s === null;
    }).length;
    if (emptyCount === 0) {
      alert(window.I18N.t("error_no_empty_slots"));
      return;
    }
    state.selectMode = "continue";
    state.maxSelect = emptyCount;
    state.selection.clear();
    showScreen("select");
    renderSelectScreen();
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
    codes.forEach(function (code) {
      state.usedCodes.add(code);
    });

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
      var c = CARD_BY_CODE[codes[i]];
      state.slots[pos] = { code: c.code, label: c.label, red: c.red, revealed: false };
    });

    if (state.selectMode === "initial") {
      addLog("log_select_submit", { n: codes.length, cards: cardsLabel });
    } else {
      addLog("log_continue_submit", { n: codes.length, cards: cardsLabel });
    }
    state.boardStarted = true;

    showScreen("board");
    renderBoard();
  }

  function onSlotClick(index) {
    var slot = state.slots[index];
    if (!slot) return;
    if (!slot.revealed) {
      openConfirm(
        "confirm_reveal_msg",
        function () {
          slot.revealed = true;
          addLog("log_reveal", { slot: index + 1, card: slot.label });
          renderBoard();
        },
        function () {
          addLog("log_cancel_reveal", { slot: index + 1 });
        }
      );
    } else {
      openConfirm(
        "confirm_draw_msg",
        function () {
          addLog("log_draw_out", { slot: index + 1, card: slot.label });
          state.slots[index] = null;
          renderBoard();
        },
        function () {
          addLog("log_cancel_draw", { slot: index + 1, card: slot.label });
        }
      );
    }
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
    document.getElementById("btn-start").addEventListener("click", startInitialSelect);
    document.getElementById("btn-select-submit").addEventListener("click", submitSelection);
    document.getElementById("btn-select-cancel").addEventListener("click", function () {
      showScreen(state.boardStarted ? "board" : "start");
    });
    document.getElementById("btn-continue").addEventListener("click", startContinueSelect);
    window.addEventListener("i18n:change", function () {
      renderSelectScreen();
      renderLog();
    });
    renderLog();
  });
})();
