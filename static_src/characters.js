(function () {
  var Games = window.PriTestGames;
  var CharacterTypes = window.PriTestCharacterTypes;
  var TAG_FIELDS = ["status", "equipment", "weapons", "skills", "items", "talismans", "buildup"];
  var TYPE_DETAIL_OPEN = false;

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
      var list = Array.isArray(data) ? data : [];
      return list.map(ensureCharacterDefaults);
    } catch (e) {
      return [];
    }
  }

  function saveCharacters() {
    localStorage.setItem(storageKey(), JSON.stringify(characters));
  }

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
    };
  }

  // 旧データ互換: 新フィールドが無い既存キャラクターに初期値を補完する
  function ensureCharacterDefaults(c) {
    var fallback = newCharacter(c.name, c.typeId);
    Object.keys(fallback).forEach(function (key) {
      if (c[key] === undefined) c[key] = fallback[key];
    });
    return c;
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
      var type = c.typeId ? CharacterTypes.get(c.typeId) : null;
      nameBtn.textContent = type ? c.name + "（" + CharacterTypes.localizedName(type.name) + "）" : c.name;
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

  function handleAddCharacter() {
    if (characters.length >= Games.MAX_CHARACTERS) {
      alert(window.I18N.t("character_max_reached", { max: Games.MAX_CHARACTERS }));
      return;
    }
    var name = window.prompt(window.I18N.t("character_new_prompt"));
    if (!name) return;
    var typeId = document.getElementById("character-type-select").value || null;
    var c = newCharacter(name.trim(), typeId);
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

  function renderTypeReference(c) {
    var block = document.getElementById("type-reference-block");
    var type = c.typeId ? CharacterTypes.get(c.typeId) : null;
    document.getElementById("character-type-badge").textContent = type
      ? window.I18N.t("character_type_label") + window.I18N.t("colon_separator") + CharacterTypes.localizedName(type.name)
      : "";
    if (!type) {
      block.hidden = true;
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
      window.I18N.t("stat_favored_weapons") + window.I18N.t("colon_separator") + type.favoredWeapons,
      window.I18N.t("stat_starting_equipment") + window.I18N.t("colon_separator") + type.startingEquipment,
    ];
    document.getElementById("type-reference-stats").textContent = lines.join("\n");

    var toggleBtn = document.getElementById("btn-toggle-type-detail");
    toggleBtn.textContent = window.I18N.t(TYPE_DETAIL_OPEN ? "type_detail_toggle_hide" : "type_detail_toggle_show");

    var detail = document.getElementById("type-reference-detail");
    detail.hidden = !TYPE_DETAIL_OPEN;
    if (TYPE_DETAIL_OPEN) {
      detail.innerHTML = "";
      renderAbilityGroup(detail, type.abilities);
      renderAbilityGroup(detail, type.skills);
      renderAbilityGroup(detail, type.arts);
      type.relicEffectGroups.forEach(function (group) {
        var h = document.createElement("h3");
        h.textContent = group.title;
        detail.appendChild(h);
        renderAbilityGroup(detail, group.effects);
      });
    }
  }

  function renderAbilityGroup(container, entries) {
    (entries || []).forEach(function (entry) {
      var box = document.createElement("div");
      box.className = "ability-entry";
      var h = document.createElement("h4");
      h.textContent = entry.name + "［" + entry.kind + "］" + (entry.level ? "　" + window.I18N.t("ability_level_label", { level: entry.level }) : "");
      var body = document.createElement("p");
      body.className = "threat-ref-body";
      body.textContent = entry.body;
      box.appendChild(h);
      box.appendChild(body);
      container.appendChild(box);
    });
  }

  function openDrawer(id) {
    activeCharacterId = id;
    var c = findCharacter(id);
    if (!c) return;
    TYPE_DETAIL_OPEN = false;

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
    renderTypeReference(c);

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
    renderTypeSelect();
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

    document.getElementById("btn-toggle-type-detail").addEventListener("click", function () {
      TYPE_DETAIL_OPEN = !TYPE_DETAIL_OPEN;
      var c = findCharacter(activeCharacterId);
      if (c) renderTypeReference(c);
    });

    var openId = new URLSearchParams(window.location.search).get("open");
    if (openId && findCharacter(openId)) openDrawer(openId);

    window.addEventListener("i18n:change", function () {
      renderTypeSelect();
      renderList();
      if (activeCharacterId) openDrawer(activeCharacterId);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
