(function () {
  // 装備品（武器）データベース。現時点では「短剣」カテゴリのみ収録（写真提供分）。
  // 他カテゴリ（大剣・大曲剣・刺剣・直剣・大槍・槍・斧槍・弓・大斧・特大武器・杖・聖印・盾など）は
  // 資料が揃い次第、同じ形式で CATEGORIES／SKILLS／WEAPONS に追加していく。
  function C(ja, zh) {
    return { ja: ja, zh: zh };
  }

  function lang() {
    return window.I18N ? window.I18N.getLang() : "zh";
  }

  // {zh, ja} を現在言語で解決する（未整備言語は zh にフォールバック）
  function T(field) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[lang()] || field.zh || field.ja || "";
  }

  var UNCONFIRMED = C("未確認（原文が判読できず要確認）", "未確認（原文判讀不易，待確認）");

  // 共通武器スキル（カテゴリを問わず使われる汎用テンプレート。出典：規則書154頁）
  function statusSkillBody(statusField) {
    return C(
      "「" +
        T(statusField) +
        "」の状態異常。このスキルを持つ武器でアタックを行い、総合ダメージとしてエネミーにダメージを与える際、効果を発揮（戦技では発揮されない）。エネミーに対する状態異常蓄積値が増加する。1Hitのときは「蓄積値：1」、2Hitのときは「蓄積値：2」。",
      "「" +
        T(statusField) +
        "」異常狀態。持有此技能的武器進行攻擊，以總合傷害對敵人造成傷害時發揮效果（戰技不發揮）。敵人的異常狀態蓄積值增加。1Hit時「蓄積值：1」，2Hit時「蓄積值：2」。"
    );
  }

  function elementSkillBody(elementField) {
    return C(
      "「" +
        T(elementField) +
        "」の属性（魔／炎／雷／聖のいずれか）。このスキルを持つ武器でアタックを行い、総合ダメージとしてエネミーにダメージを与える際、効果を発揮（戦技では発揮されない）。エネミーに対する属性蓄積値が増加する。1Hitのときは「蓄積値：1」、2Hitのときは「蓄積値：2」。",
      "「" +
        T(elementField) +
        "」屬性（魔／火／雷／聖之一）。持有此技能的武器進行攻擊，以總合傷害對敵人造成傷害時發揮效果（戰技不發揮）。敵人的屬性蓄積值增加。1Hit時「蓄積值：1」，2Hit時「蓄積值：2」。"
    );
  }

  var CATEGORIES = [
    {
      id: "dagger",
      name: C("短剣", "短劍"),
      basicStats: {
        attackCost: C("1Hit：①／2Hit：①①", "1Hit：①／2Hit：①①"),
        weaponPower: 5,
        powerMod: C("技量（※一部の武器は例外あり）", "技巧（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("属性＋2", "屬性＋2"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し属性蓄積値が加算されるとき「蓄積値：＋2」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成屬性蓄積值，則「蓄積值：＋2」。"
          ),
        },
        {
          name: C("状態異常＋1", "異常狀態＋1"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し状態異常蓄積値が加算されるとき「蓄積値：＋1」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成異常狀態蓄積值，則「蓄積值：＋1」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "dagger_crit_up",
          name: C("致命の一撃＋20", "致命一擊＋20"),
          kind: "Passive",
          body: C(
            "この装備品で遺物効果「致命の一撃」を発生させたとき、そのダメージを「＋20」する。",
            "使用此裝備發動遺物效果「致命一擊」時，將該傷害「＋20」。"
          ),
        },
        {
          id: "dagger_parry",
          name: C("パリィ", "格擋"),
          kind: "Defense",
          body: UNCONFIRMED,
        },
        {
          id: "dagger_step",
          name: C("魔ダガーステップ", "魔匕首步"),
          kind: "Action",
          body: UNCONFIRMED,
        },
      ],
    },
  ];

  var SKILLS = {
    art_blood_blade: {
      name: C("血の刃", "血刃"),
      kind: "Action",
      body: C("コスト：④／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：5＋戦技威力", "消耗：④／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：5＋戰技威力"),
    },
    art_frost_step: {
      name: C("霜踏み", "霜踏"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：15＋戦技威力", "消耗：①／FP■　對象：敵人　編隊：前衛時可使用　威力：15＋戰技威力"),
    },
    art_flame_strike: {
      name: C("炎撃", "炎擊"),
      kind: "Action",
      body: C("コスト：③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：50＋戦技威力", "消耗：③／FP■　對象：敵人　編隊：前衛時可使用　威力：50＋戰技威力"),
    },
    art_assassin_method: {
      name: C("暗殺の作法", "暗殺之法"),
      kind: "Action",
      body: UNCONFIRMED,
    },
    art_quickstep: { name: C("クイックステップ", "疾風步"), kind: null, body: UNCONFIRMED },
    art_consecutive_thrust: { name: C("連続突き", "連續突刺"), kind: null, body: UNCONFIRMED },
    art_reduvia_blood_blade: { name: C("レドゥビアの血刃", "雷度維亞的血刃"), kind: null, body: UNCONFIRMED },
    art_death_blade: { name: C("死の刃", "死之刃"), kind: null, body: UNCONFIRMED },
  };

  var WEAPONS = [
    { id: "dagger_lady", category: "dagger", name: C("レディの短剣", "淑女的短劍"), rarity: "C", skills: [{ kind: "art", id: "art_blood_blade" }] },
    { id: "dagger_targe", category: "dagger", name: C("タガー", "匕首"), rarity: "C", skills: [{ kind: "random" }] },
    { id: "dagger_parrying", category: "dagger", name: C("パリングタガー", "格擋短劍"), rarity: "C", skills: [{ kind: "innate", id: "dagger_parry" }] },
    { id: "dagger_large_knife", category: "dagger", name: C("大型ナイフ", "大型小刀"), rarity: "C", skills: [{ kind: "status", status: C("出血", "出血") }] },
    { id: "dagger_mercy", category: "dagger", name: C("慈悲の短刀", "慈悲短刀"), rarity: "C", skills: [{ kind: "art", id: "art_frost_step" }] },
    {
      id: "dagger_brass",
      category: "dagger",
      name: C("黄銅の短剣", "黃銅短劍"),
      rarity: "C",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_frost_step" }],
    },
    {
      id: "dagger_wakizashi",
      category: "dagger",
      name: C("脇差", "脇差"),
      rarity: "U",
      powerModOverride: C("信仰", "信仰"),
      skills: [{ kind: "innate", id: "dagger_crit_up" }, { kind: "art", id: "art_quickstep" }],
    },
    { id: "dagger_sickle", category: "dagger", name: C("祝祭の手鎌", "祭典鐮刀"), rarity: "U", skills: [{ kind: "random" }] },
    { id: "dagger_strange_knife", category: "dagger", name: C("奇晶ナイフ", "奇晶小刀"), rarity: "U", skills: [{ kind: "status", status: C("出血", "出血") }] },
    {
      id: "dagger_crystal_needle",
      category: "dagger",
      name: C("結晶の針", "結晶之針"),
      rarity: "U",
      powerModOverride: C("知力", "知力"),
      skills: [{ kind: "element", element: C("魔", "魔") }],
    },
    { id: "dagger_insect_needle", category: "dagger", name: C("蟲の針", "蟲之針"), rarity: "U", skills: [{ kind: "status", status: C("腐敗", "腐敗") }] },
    { id: "dagger_cinquedea", category: "dagger", name: C("チンクエディア", "闊劍匕首"), rarity: "U", skills: [{ kind: "art", id: "art_consecutive_thrust" }] },
    {
      id: "dagger_glintstone_kris",
      category: "dagger",
      name: C("輝石のクリス", "輝石短劍"),
      rarity: "R",
      skills: [{ kind: "bonus", text: C("戦技ダメージ＋5", "戰技傷害＋5") }, { kind: "random" }],
    },
    {
      id: "dagger_reduvia",
      category: "dagger",
      name: C("レドゥビア", "雷度維亞"),
      rarity: "R",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_reduvia_blood_blade" }],
    },
    {
      id: "dagger_mission_blade",
      category: "dagger",
      name: C("使命の刃", "使命之刃"),
      rarity: "R",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "art", id: "art_death_blade" }],
    },
    {
      id: "dagger_black_named",
      category: "dagger",
      name: C("黒名刃", "黑名刃"),
      rarity: "L",
      skills: [{ kind: "note", text: C("この表には存在しない。R表で再抽選する。", "此稀有度不存在此武器，改於R表重新抽選。") }],
    },
  ];

  function list() {
    return WEAPONS;
  }

  function get(id) {
    return (
      WEAPONS.filter(function (w) {
        return w.id === id;
      })[0] || null
    );
  }

  function getCategory(id) {
    return (
      CATEGORIES.filter(function (c) {
        return c.id === id;
      })[0] || null
    );
  }

  function getSkill(id) {
    return SKILLS[id] || null;
  }

  function categories() {
    return CATEGORIES;
  }

  // 名称の部分一致検索（大文字小文字を区別しない）。空文字なら空配列を返す。
  function search(query) {
    var q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return WEAPONS.filter(function (w) {
      return T(w.name).toLowerCase().indexOf(q) !== -1;
    });
  }

  window.PriTestWeapons = {
    list: list,
    get: get,
    getCategory: getCategory,
    getSkill: getSkill,
    categories: categories,
    search: search,
    localizedText: T,
    statusSkillBody: statusSkillBody,
    elementSkillBody: elementSkillBody,
  };
})();
