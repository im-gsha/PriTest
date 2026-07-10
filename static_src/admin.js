(function () {
  var Games = window.PriTestGames;
  var Scenarios = window.PriTestScenarios;

  function requireAdmin() {
    var ok = Games.checkAdminPassword(window.I18N.t("admin_password_prompt"));
    if (!ok) {
      alert(window.I18N.t("admin_password_wrong"));
      window.location.href = "../index.html";
    }
  }

  function renderScenarioSelect() {
    var select = document.getElementById("scenario-select");
    var current = select.value;
    select.innerHTML = "";
    var customOpt = document.createElement("option");
    customOpt.value = "";
    customOpt.textContent = window.I18N.t("scenario_custom_option");
    select.appendChild(customOpt);
    Scenarios.list().forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = Scenarios.localizedName(s.name);
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function renderGameList() {
    var games = Games.list();
    var list = document.getElementById("game-list");
    list.innerHTML = "";

    if (games.length === 0) {
      var empty = document.createElement("li");
      empty.className = "game-empty";
      empty.textContent = window.I18N.t("admin_no_games");
      list.appendChild(empty);
    }

    games.forEach(function (game) {
      var li = document.createElement("li");
      li.className = "game-row";

      var info = document.createElement("div");
      info.className = "game-info";
      var name = document.createElement("strong");
      name.textContent = game.name;
      var date = document.createElement("span");
      date.className = "game-date";
      date.textContent = new Date(game.createdAt).toLocaleString();
      info.appendChild(name);
      info.appendChild(date);
      if (game.scenarioId) {
        var scenario = Scenarios.get(game.scenarioId);
        if (scenario) {
          var badge = document.createElement("span");
          badge.className = "game-date";
          badge.textContent = window.I18N.t("scenario_badge_label") + window.I18N.t("colon_separator") + Scenarios.localizedName(scenario.name);
          info.appendChild(badge);
        }
      }

      var actions = document.createElement("div");
      actions.className = "game-actions";

      var openBtn = document.createElement("a");
      openBtn.className = "primary-btn";
      openBtn.href = "../characters/index.html?game=" + encodeURIComponent(game.id);
      openBtn.textContent = window.I18N.t("admin_open_button");

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger-btn";
      deleteBtn.textContent = window.I18N.t("admin_delete_button");
      deleteBtn.addEventListener("click", function () {
        if (!window.confirm(window.I18N.t("admin_confirm_delete", { name: game.name }))) return;
        Games.remove(game.id);
        renderGameList();
      });

      actions.appendChild(openBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(info);
      li.appendChild(actions);
      list.appendChild(li);
    });

    var addBtn = document.getElementById("btn-add-game");
    addBtn.disabled = games.length >= Games.MAX_GAMES;
  }

  function handleAddGame() {
    var games = Games.list();
    if (games.length >= Games.MAX_GAMES) {
      alert(window.I18N.t("admin_max_games", { max: Games.MAX_GAMES }));
      return;
    }
    var name = window.prompt(window.I18N.t("admin_new_game_prompt"));
    if (!name) return;
    var scenarioId = document.getElementById("scenario-select").value || null;
    Games.create(name.trim(), scenarioId);
    renderGameList();
  }

  document.addEventListener("DOMContentLoaded", function () {
    requireAdmin();
    renderScenarioSelect();
    renderGameList();
    document.getElementById("btn-add-game").addEventListener("click", handleAddGame);
    window.addEventListener("i18n:change", function () {
      renderScenarioSelect();
      renderGameList();
    });
  });
})();
