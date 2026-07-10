(function () {
  var Games = window.PriTestGames;
  var TAG_FIELDS = ["status", "equipment", "weapons", "skills", "items"];

  var gameId = Games.getGameIdFromQuery();
  var game = gameId ? Games.get(gameId) : null;
  var characters = [];
  var activeCharacterId = null;

  function storageKey() {
    return "pritest-characters-" + gameId;
  }

  function loadCharacters() {
    var raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveCharacters() {
    localStorage.setItem(storageKey(), JSON.stringify(characters));
  }

  function newCharacter(name) {
    return {
      id: "c" + Date.now() + Math.floor(Math.random() * 1000),
      name: name,
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
    };
  }

  function findCharacter(id) {
    return characters.filter(function (c) {
      return c.id === id;
    })[0] || null;
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
      nameBtn.textContent = c.name;
      nameBtn.addEventListener("click", function () {
        openDrawer(c.id);
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

  function handleAddCharacter() {
    if (characters.length >= Games.MAX_CHARACTERS) {
      alert(window.I18N.t("character_max_reached", { max: Games.MAX_CHARACTERS }));
      return;
    }
    var name = window.prompt(window.I18N.t("character_new_prompt"));
    if (!name) return;
    var c = newCharacter(name.trim());
    characters.push(c);
    saveCharacters();
    renderList();
    openDrawer(c.id);
  }

  // --- drawer ---
  function renderTagList(field) {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    var container = document.getElementById("tag-list-" + field);
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
        saveCharacters();
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
    saveCharacters();
    renderTagList(field);
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
    TAG_FIELDS.forEach(renderTagList);

    document.getElementById("character-drawer").classList.add("open");
  }

  function closeDrawer() {
    document.getElementById("character-drawer").classList.remove("open");
    activeCharacterId = null;
    renderList();
  }

  function bindFieldSave(elId, apply) {
    document.getElementById(elId).addEventListener("change", function (e) {
      var c = findCharacter(activeCharacterId);
      if (!c) return;
      apply(c, e.target);
      saveCharacters();
      if (elId === "char-entered") renderList();
    });
  }

  function handleDeleteCharacter() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    if (!window.confirm(window.I18N.t("character_confirm_delete", { name: c.name }))) return;
    characters = characters.filter(function (item) {
      return item.id !== c.id;
    });
    saveCharacters();
    closeDrawer();
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
    document.getElementById("btn-enter-map").href =
      "../night/index.html?game=" + encodeURIComponent(gameId);

    characters = loadCharacters();
    renderList();

    document.getElementById("btn-add-character").addEventListener("click", handleAddCharacter);
    document.getElementById("btn-character-close").addEventListener("click", closeDrawer);
    document
      .getElementById("character-drawer-backdrop")
      .addEventListener("click", closeDrawer);
    document.getElementById("btn-delete-character").addEventListener("click", handleDeleteCharacter);

    document.querySelectorAll(".tag-add-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addTag(btn.getAttribute("data-field"));
      });
    });
    TAG_FIELDS.forEach(function (field) {
      document.getElementById("tag-input-" + field).addEventListener("keydown", function (e) {
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

    window.addEventListener("i18n:change", function () {
      renderList();
      if (activeCharacterId) openDrawer(activeCharacterId);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
