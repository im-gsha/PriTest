(function () {
  // シナリオ（副本）ごとの固定カード配置表。
  // 出典: シナリオブック掲載の「ステージ構成に使用するトランプ」表。
  var SCENARIOS = [
    {
      id: "tricephalos",
      name: { zh: "三首獸", ja: "三つ首の獣", en: "Tricephalos" },
      start: { suit: "H", rank: "A" },
      end: { suit: "D", rank: "A" },
      day1: [
        { pos: 1, suit: "C", rank: "2", name: { zh: "大教會（聖）", ja: "大教会（聖）", en: "Grand Cathedral (Sacred)" } },
        { pos: 2, suit: "D", rank: "3", name: { zh: "小砦（無印）", ja: "小砦（無印）", en: "Small Fort (Plain)" } },
        { pos: 3, suit: "H", rank: "4", name: { zh: "大野營地（1）", ja: "大野営地（1）", en: "Main Camp (1)" } },
        { pos: 4, suit: "S", rank: "5", name: { zh: "遺跡（無印）", ja: "遺跡（無印）", en: "Ruins (Plain)" } },
        { pos: 5, suit: "C", rank: "6", name: { zh: "坑道（1）", ja: "坑道（1）", en: "Tunnel (1)" } },
        { pos: 6, suit: "D", rank: "8", name: { zh: "鍛造村（雷1）", ja: "鍛冶村（雷1）", en: "Smithing Village (Lightning 1)" } },
        { pos: 7, suit: "C", rank: "9", name: { zh: "封牢（無印）", ja: "封牢（無印）", en: "Sealed Prison (Plain)" } },
        { pos: 8, suit: "C", rank: "K", name: { zh: "教會（埋沒女神像）", ja: "教会（埋まった女神像）", en: "Church (Buried Idol)" } },
        { pos: 9, suit: "D", rank: "K", name: { zh: "教會（瓦礫之山）", ja: "教会（瓦礫の山）", en: "Church (Rubble Pile)" } },
      ],
      day2: [
        { pos: 1, suit: "D", rank: "2", name: { zh: "大教會（無印）", ja: "大教会（無印）", en: "Grand Cathedral (Plain)" } },
        { pos: 2, suit: "S", rank: "4", name: { zh: "大野營地（火1）", ja: "大野営地（炎1）", en: "Main Camp (Fire 1)" } },
        { pos: 3, suit: "H", rank: "5", name: { zh: "遺跡（聖）", ja: "遺跡（聖）", en: "Ruins (Sacred)" } },
        { pos: 4, suit: "H", rank: "9", name: { zh: "封牢（無印）", ja: "封牢（無印）", en: "Sealed Prison (Plain)" } },
        { pos: 5, suit: "S", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 6, suit: "H", rank: "K", name: { zh: "教會（商人）", ja: "教会（商人）", en: "Church (Merchant)" } },
      ],
    },
  ];

  // --- 管理員が自由編輯できる自訂副本（localStorage 保存、ビルド時の固定データとは別枠） ---
  var CUSTOM_KEY = "pritest-custom-scenarios";
  var SLOT_COUNT = 9;

  function loadCustomScenarios() {
    var raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomScenarios(scenarios) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(scenarios));
  }

  function emptyCard() {
    return { suit: "S", rank: "A", name: { zh: "", ja: "" } };
  }

  function newScenario() {
    return {
      id: "custom" + Date.now() + Math.floor(Math.random() * 1000),
      custom: true,
      name: { zh: "", ja: "" },
      start: { suit: "S", rank: "A" },
      end: { suit: "S", rank: "A" },
      day1: Array.from({ length: SLOT_COUNT }, emptyCard),
      day2: Array.from({ length: 6 }, emptyCard),
    };
  }

  function createScenario() {
    var customs = loadCustomScenarios();
    var s = newScenario();
    customs.push(s);
    saveCustomScenarios(customs);
    return s;
  }

  function updateScenario(id, patch) {
    var customs = loadCustomScenarios();
    var s = customs.filter(function (c) {
      return c.id === id;
    })[0];
    if (!s) return null;
    Object.keys(patch).forEach(function (key) {
      s[key] = patch[key];
    });
    saveCustomScenarios(customs);
    return s;
  }

  function deleteScenario(id) {
    saveCustomScenarios(
      loadCustomScenarios().filter(function (c) {
        return c.id !== id;
      })
    );
  }

  function isCustom(id) {
    return !SCENARIOS.some(function (s) {
      return s.id === id;
    });
  }

  function list() {
    return SCENARIOS.concat(loadCustomScenarios());
  }

  function localizedName(nameObj) {
    var lang = window.I18N ? window.I18N.getLang() : "zh";
    return nameObj[lang] || nameObj.zh || nameObj.ja || nameObj.en;
  }

  function get(id) {
    return (
      list().filter(function (s) {
        return s.id === id;
      })[0] || null
    );
  }

  // dayKey: "day1" | "day2" 上の該当カードの情報（あれば）を返す
  function findCardEffect(scenarioId, dayKey, suit, rank) {
    var scenario = get(scenarioId);
    if (!scenario) return null;
    var rows = scenario[dayKey] || [];
    return (
      rows.filter(function (r) {
        return r.suit === suit && r.rank === rank;
      })[0] || null
    );
  }

  window.PriTestScenarios = {
    list: list,
    get: get,
    findCardEffect: findCardEffect,
    localizedName: localizedName,
    createScenario: createScenario,
    updateScenario: updateScenario,
    deleteScenario: deleteScenario,
    isCustom: isCustom,
    SLOT_COUNT: SLOT_COUNT,
  };
})();
