(function () {
  var Scenarios = window.PriTestScenarios;
  var Games = window.PriTestGames;
  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  var activeScenarioId = null;
  var day1Rows = [];
  var day2Rows = [];

  function requireAdmin() {
    var ok = Games.checkAdminPassword(window.I18N.t("admin_password_prompt"));
    if (!ok) {
      alert(window.I18N.t("admin_password_wrong"));
      window.location.href = "../index.html";
    }
  }

  function renderScenarioList() {
    var list = document.getElementById("scenario-list");
    list.innerHTML = "";
    Scenarios.list().forEach(function (s) {
      var li = document.createElement("li");
      li.className = "game-row";

      var info = document.createElement("div");
      info.className = "game-info";
      var name = document.createElement("strong");
      name.textContent = Scenarios.localizedName(s.name) || "(" + s.id + ")";
      info.appendChild(name);
      if (!Scenarios.isCustom(s.id)) {
        var badge = document.createElement("span");
        badge.className = "game-date";
        badge.textContent = window.I18N.t("scenario_builtin_badge");
        info.appendChild(badge);
      }
      li.appendChild(info);

      var actions = document.createElement("div");
      actions.className = "game-actions";
      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = Scenarios.isCustom(s.id)
        ? window.I18N.t("scenario_edit_button")
        : window.I18N.t("scenario_view_button");
      editBtn.addEventListener("click", function () {
        openEditor(s.id);
      });
      actions.appendChild(editBtn);
      li.appendChild(actions);

      list.appendChild(li);
    });
  }

  function buildSelect(id, options, labelFn) {
    var select = document.getElementById(id);
    select.innerHTML = "";
    options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt;
      o.textContent = labelFn ? labelFn(opt) : opt;
      select.appendChild(o);
    });
  }

  function buildCardRow(container, index, card, readOnly) {
    var row = document.createElement("div");
    row.className = "scenario-card-row";

    var label = document.createElement("span");
    label.className = "scenario-card-index";
    label.textContent = index + 1;
    row.appendChild(label);

    var suitSelect = document.createElement("select");
    SUITS.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s;
      o.textContent = SUIT_SYMBOL[s];
      suitSelect.appendChild(o);
    });
    suitSelect.value = card.suit;
    suitSelect.disabled = readOnly;
    row.appendChild(suitSelect);

    var rankSelect = document.createElement("select");
    RANKS.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r;
      o.textContent = r;
      rankSelect.appendChild(o);
    });
    rankSelect.value = card.rank;
    rankSelect.disabled = readOnly;
    row.appendChild(rankSelect);

    var nameZh = document.createElement("input");
    nameZh.type = "text";
    nameZh.placeholder = window.I18N.t("scenario_name_zh_label");
    nameZh.value = (card.name && card.name.zh) || "";
    nameZh.disabled = readOnly;
    row.appendChild(nameZh);

    var nameJa = document.createElement("input");
    nameJa.type = "text";
    nameJa.placeholder = window.I18N.t("scenario_name_ja_label");
    nameJa.value = (card.name && card.name.ja) || "";
    nameJa.disabled = readOnly;
    row.appendChild(nameJa);

    row._getValue = function () {
      return { suit: suitSelect.value, rank: rankSelect.value, name: { zh: nameZh.value, ja: nameJa.value } };
    };
    container.appendChild(row);
    return row;
  }

  function openEditor(id) {
    var s = Scenarios.get(id);
    if (!s) return;
    activeScenarioId = id;
    var readOnly = !Scenarios.isCustom(id);

    document.getElementById("scenario-editor-title").textContent = Scenarios.localizedName(s.name) || s.id;
    document.getElementById("scenario-name-zh").value = s.name.zh || "";
    document.getElementById("scenario-name-ja").value = s.name.ja || "";
    document.getElementById("scenario-name-zh").disabled = readOnly;
    document.getElementById("scenario-name-ja").disabled = readOnly;

    buildSelect("scenario-start-suit", SUITS, function (v) {
      return SUIT_SYMBOL[v];
    });
    buildSelect("scenario-start-rank", RANKS);
    buildSelect("scenario-end-suit", SUITS, function (v) {
      return SUIT_SYMBOL[v];
    });
    buildSelect("scenario-end-rank", RANKS);
    document.getElementById("scenario-start-suit").value = s.start.suit;
    document.getElementById("scenario-start-rank").value = s.start.rank;
    document.getElementById("scenario-end-suit").value = s.end.suit;
    document.getElementById("scenario-end-rank").value = s.end.rank;
    document.getElementById("scenario-start-suit").disabled = readOnly;
    document.getElementById("scenario-start-rank").disabled = readOnly;
    document.getElementById("scenario-end-suit").disabled = readOnly;
    document.getElementById("scenario-end-rank").disabled = readOnly;

    var day1Container = document.getElementById("scenario-day1-rows");
    var day2Container = document.getElementById("scenario-day2-rows");
    day1Container.innerHTML = "";
    day2Container.innerHTML = "";
    day1Rows = s.day1.map(function (card, i) {
      return buildCardRow(day1Container, i, card, readOnly);
    });
    day2Rows = s.day2.map(function (card, i) {
      return buildCardRow(day2Container, i, card, readOnly);
    });

    document.getElementById("btn-scenario-save").hidden = readOnly;
    document.getElementById("btn-scenario-delete").hidden = readOnly;

    document.getElementById("scenario-editor").hidden = false;
  }

  function closeEditor() {
    document.getElementById("scenario-editor").hidden = true;
    activeScenarioId = null;
  }

  function handleSave() {
    if (!activeScenarioId) return;
    var patch = {
      name: { zh: document.getElementById("scenario-name-zh").value, ja: document.getElementById("scenario-name-ja").value },
      start: {
        suit: document.getElementById("scenario-start-suit").value,
        rank: document.getElementById("scenario-start-rank").value,
      },
      end: {
        suit: document.getElementById("scenario-end-suit").value,
        rank: document.getElementById("scenario-end-rank").value,
      },
      day1: day1Rows.map(function (r) {
        return r._getValue();
      }),
      day2: day2Rows.map(function (r) {
        return r._getValue();
      }),
    };
    Scenarios.updateScenario(activeScenarioId, patch);
    closeEditor();
    renderScenarioList();
  }

  function handleDelete() {
    if (!activeScenarioId) return;
    if (!window.confirm(window.I18N.t("scenario_confirm_delete"))) return;
    Scenarios.deleteScenario(activeScenarioId);
    closeEditor();
    renderScenarioList();
  }

  function handleAdd() {
    var s = Scenarios.createScenario();
    renderScenarioList();
    openEditor(s.id);
  }

  document.addEventListener("DOMContentLoaded", function () {
    requireAdmin();
    renderScenarioList();
    document.getElementById("btn-add-scenario").addEventListener("click", handleAdd);
    document.getElementById("btn-scenario-save").addEventListener("click", handleSave);
    document.getElementById("btn-scenario-delete").addEventListener("click", handleDelete);
    document.getElementById("btn-scenario-close").addEventListener("click", closeEditor);
    window.addEventListener("i18n:change", function () {
      renderScenarioList();
      if (activeScenarioId) openEditor(activeScenarioId);
    });
  });
})();
