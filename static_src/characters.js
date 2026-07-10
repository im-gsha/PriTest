(function () {
  var Games = window.PriTestGames;
  var CharacterTypes = window.PriTestCharacterTypes;
  var CharacterDrawer = window.PriTestCharacterDrawer;

  var gameId = Games.getGameIdFromQuery();
  var game = gameId ? Games.get(gameId) : null;
  var characters = [];

  function storageKey() {
    return "pritest-characters-" + gameId;
  }

  function loadCharacters() {
    var raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      var list = Array.isArray(data) ? data : [];
      return list.map(CharacterDrawer.ensureDefaults);
    } catch (e) {
      return [];
    }
  }

  function saveCharacters() {
    localStorage.setItem(storageKey(), JSON.stringify(characters));
  }

  function findCharacter(id) {
    return (
      characters.filter(function (c) {
        return c.id === id;
      })[0] || null
    );
  }

  // --- roster list ---
  function renderList() {
    var list = document.getElementById("character-list");
    list.innerHTML = "";
    characters.forEach(function (c) {
      var li = document.createElement("li");
      li.className = "character-row" + (c.entered ? " entered" : "");

      var nameBtn = document.createElement("button");
      nameBtn.type = "button";
      nameBtn.className = "character-name-btn";
      var type = c.typeId ? CharacterTypes.get(c.typeId) : null;
      nameBtn.textContent = type ? c.name + "（" + CharacterTypes.localizedName(type.name) + "）" : c.name;
      nameBtn.addEventListener("click", function () {
        CharacterDrawer.open(c.id);
      });

      var badge = document.createElement("span");
      badge.className = "character-badge";
      badge.textContent = window.I18N.t(c.entered ? "character_badge_entered" : "character_badge_bench");

      li.appendChild(nameBtn);
      li.appendChild(badge);
      list.appendChild(li);
    });

    var addBtn = document.getElementById("btn-add-character");
    addBtn.disabled = characters.length >= Games.MAX_CHARACTERS;
  }

  function renderTypeSelect() {
    var select = document.getElementById("character-type-select");
    var current = select.value;
    select.innerHTML = "";
    var noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = window.I18N.t("character_type_none_option");
    select.appendChild(noneOpt);
    CharacterTypes.list().forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = CharacterTypes.localizedName(t.name);
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function renderGallery() {
    var grid = document.getElementById("gallery-grid");
    grid.innerHTML = "";
    CharacterTypes.list().forEach(function (t) {
      var card = document.createElement("div");
      card.className = "gallery-card";
      var src = CharacterTypes.imagePath(t);
      if (src) {
        var img = document.createElement("img");
        img.src = src;
        img.alt = CharacterTypes.localizedName(t.name);
        card.appendChild(img);
      }
      var name = document.createElement("p");
      name.textContent = CharacterTypes.localizedName(t.name);
      card.appendChild(name);
      grid.appendChild(card);
    });
  }

  function openGallery() {
    renderGallery();
    document.getElementById("gallery-modal").hidden = false;
  }

  function closeGallery() {
    document.getElementById("gallery-modal").hidden = true;
  }

  function handleAddCharacter() {
    if (characters.length >= Games.MAX_CHARACTERS) {
      alert(window.I18N.t("character_max_reached", { max: Games.MAX_CHARACTERS }));
      return;
    }
    var name = window.prompt(window.I18N.t("character_new_prompt"));
    if (!name) return;
    var typeId = document.getElementById("character-type-select").value || null;
    var c = CharacterDrawer.newCharacter(name.trim(), typeId);
    characters.push(c);
    saveCharacters();
    renderList();
    CharacterDrawer.open(c.id);
  }

  function init() {
    if (!Games.checkAdminPassword(window.I18N.t("admin_password_prompt"))) {
      window.location.href = "../admin/index.html";
      return;
    }
    if (!game) {
      document.getElementById("screen-missing-game").hidden = false;
      document.getElementById("screen-characters").hidden = true;
      return;
    }
    document.getElementById("game-title").textContent = game.name;
    document.getElementById("btn-enter-map").href = "../night/index.html?game=" + encodeURIComponent(gameId);

    characters = loadCharacters();
    CharacterDrawer.init({
      characters: characters,
      save: saveCharacters,
      onChange: renderList,
    });
    renderTypeSelect();
    renderList();

    document.getElementById("btn-add-character").addEventListener("click", handleAddCharacter);
    document.getElementById("btn-view-gallery").addEventListener("click", openGallery);
    document.getElementById("btn-gallery-close").addEventListener("click", closeGallery);

    var openId = new URLSearchParams(window.location.search).get("open");
    if (openId && findCharacter(openId)) CharacterDrawer.open(openId);

    window.addEventListener("i18n:change", function () {
      renderTypeSelect();
      renderList();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
