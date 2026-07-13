(function () {
  // 消耗品データベース。タリスマンと同様に単純な構造だが、所持数（持有數）を持つ点が異なる。
  // 写真の情報密度が高く、確認できた名称・効果を中心とした部分収録（203〜204頁）。
  function C(ja, zh) {
    return { ja: ja, zh: zh };
  }

  function lang() {
    return window.I18N ? window.I18N.getLang() : "zh";
  }

  function T(field) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[lang()] || field.zh || field.ja || "";
  }

  var UNCONFIRMED = C("未確認（原文が判読できず要確認）", "未確認（原文判讀不易，待確認）");

  var CONSUMABLES = [
    {
      id: "item_bitter_medicine",
      name: C("苔薬", "苔藥"),
      body: C(
        "使用回数：○○　対象：自身　隊列：前衛・後衛どちらでも使用可能　効果：自身に蓄積している任意の状態異常蓄積値を1種類選ぶ。その蓄積値を「0」にする。",
        "使用次數：○○　對象：自身　編隊：前衛・後衛皆可使用　效果：選擇自身累積的任1種異常狀態蓄積值，將該蓄積值歸「0」。"
      ),
    },
    {
      id: "item_grease",
      name: C("塗り脂", "塗脂"),
      body: C(
        "使用回数：○○　対象：自身　効果：自身が装備状態の武器または盾を1つ選ぶ。武器を選んだ場合、エンドフェイズまで、選んだ武器にスキル「属性」X（任意の属性を選ぶ）を追加する。この効果は重複しない。",
        "使用次數：○○　對象：自身　效果：選擇自身裝備狀態的武器或盾1個。選擇武器時，直到結束階段為止，為該武器追加技能「屬性」X（任選一種屬性）。此效果不重複。"
      ),
    },
    {
      id: "item_warming_stone",
      name: C("ぬくもり石", "溫石"),
      body: C(
        "使用回数：○○　対象：自身と他のPC1人　隊列：前衛・後衛どちらでも使用可能　効果：対象に「HP回復：□□」を適用する。",
        "使用次數：○○　對象：自身與其他1名PC　編隊：前衛・後衛皆可使用　效果：對對象套用「HP回復：□□」。"
      ),
    },
    {
      id: "item_throwing_dagger",
      name: C("スローイングダガー", "投擲短劍"),
      body: C(
        "使用回数：○○○　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　効果：対象に【総合ダメージ：□□】を与える。",
        "使用次數：○○○　對象：敵人　編隊：前衛・後衛皆可使用　效果：對敵人造成【總合傷害：□□】。"
      ),
    },
    {
      id: "item_azure_throwing_knife",
      name: C("蒼火の投げナイフ", "蒼火的投擲刀"),
      body: C(
        "使用回数：○○　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　効果：対象に【総合ダメージ：□□】を与える。",
        "使用次數：○○　對象：敵人　編隊：前衛・後衛皆可使用　效果：對敵人造成【總合傷害：□□】。"
      ),
    },
    {
      id: "item_scrap_shuriken",
      name: C("屑投暗器", "廢鐵暗器"),
      body: C(
        "使用回数：○○○　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　効果：対象に【総合ダメージ：10×1D】を与える。",
        "使用次數：○○○　對象：敵人　編隊：前衛・後衛皆可使用　效果：對敵人造成【總合傷害：10×1D】。"
      ),
    },
    { id: "item_hero_meat_chunk", name: C("勇者の肉塊", "勇者的肉塊"), body: UNCONFIRMED },
    { id: "item_shard_of_caution", name: C("慎重の欠片", "謹慎的碎片"), body: UNCONFIRMED },
    { id: "item_boulder_shard", name: C("巨石の欠片", "巨石的碎片"), body: UNCONFIRMED },
    { id: "item_moss_shroom_reek", name: C("厳崩埋葬器", "嚴崩埋葬器"), body: UNCONFIRMED },
    { id: "item_charming_incense", name: C("妖の香り", "妖異之香"), body: UNCONFIRMED },
    { id: "item_savage_reward", name: C("蕃の褒賞", "蕃之褒賞"), body: UNCONFIRMED },
    { id: "item_faint_venom_mist", name: C("淡霧の毒香品", "淡霧的毒香品"), body: UNCONFIRMED },
    {
      id: "item_perfume_acid_spray",
      name: C("調香瓶｜酸の噴霧", "調香瓶｜酸之噴霧"),
      body: C(
        "コスト：③／使用回数：○○　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　効果：堕落した調香師の技。別の効果で条件を満たしたら効果発揮。前衛に攻撃力を低下させる。エンドフェイズまで、ガードする場合、追加ダメージを与える。",
        "消耗：③／使用次數：○○　對象：敵人　編隊：前衛・後衛皆可使用　效果：墮落調香師之技。以其他效果滿足條件時發揮效果。使前衛攻擊力下降。直到結束階段為止，若進行防禦則追加傷害。"
      ),
    },
    {
      id: "item_perfume_iron_pot_spray",
      name: C("調香瓶｜鉄壺の噴霧", "調香瓶｜鐵壺之噴霧"),
      body: C(
        "使用回数：○○　対象：自身　隊列：前衛のとき使用可能　効果：エンドフェイズまで、状態異常や状態異常の影響を受けるダメージによるHP損害を1個減少する。",
        "使用次數：○○　對象：自身　編隊：前衛時可使用　效果：直到結束階段為止，異常狀態或受異常狀態影響的傷害所造成的HP損害減少1個。"
      ),
    },
    {
      id: "item_perfume_spark_aroma",
      name: C("調香瓶｜火花の香り", "調香瓶｜火花之香"),
      body: C(
        "使用回数：○○　対象：エネミー・モブ　隊列：前衛・後衛どちらでも使用可能　効果：モブに「HP損害：■」を与え、さらにエネミーに「炎：2」を与える。",
        "使用次數：○○　對象：敵人・雜兵　編隊：前衛・後衛皆可使用　效果：對雜兵造成「HP損害：■」，並對敵人追加「火：2」。"
      ),
    },
    {
      id: "item_perfume_uplifting_aroma",
      name: C("調香瓶｜高揚の香り", "調香瓶｜高揚之香"),
      body: C(
        "使用回数：○○　対象：PC全員　隊列：前衛・後衛どちらでも使用可能　効果：対象のアタックのダメージを「1Hit：＋5／2Hit：＋10」する。",
        "使用次數：○○　對象：全體PC　編隊：前衛・後衛皆可使用　效果：對象的攻擊傷害「1Hit：＋5／2Hit：＋10」。"
      ),
    },
    {
      id: "item_perfume_poison_spray",
      name: C("調香瓶｜毒の噴霧", "調香瓶｜毒之噴霧"),
      body: C(
        "使用回数：○○　対象：エネミー・モブ　隊列：前衛のとき使用可能　効果：モブに「HP損害：■」を与え、エネミーに「猛毒：1D」の効果。",
        "使用次數：○○　對象：敵人・雜兵　編隊：前衛時可使用　效果：對雜兵造成「HP損害：■」，並對敵人給予「猛毒：1D」效果。"
      ),
    },
    { id: "item_glowing_shard", name: C("蓄光の欠片", "蓄光的碎片"), body: UNCONFIRMED },
    { id: "item_heavy_glowing_shard", name: C("重光の欠片", "重光的碎片"), body: UNCONFIRMED },
    { id: "item_waking_shard", name: C("醒めの欠片", "醒覺的碎片"), body: UNCONFIRMED },
    { id: "item_perfumers_taboo", name: C("調香師の禁忌", "調香師的禁忌"), body: UNCONFIRMED },
  ];

  function list() {
    return CONSUMABLES;
  }

  function get(id) {
    return (
      CONSUMABLES.filter(function (i) {
        return i.id === id;
      })[0] || null
    );
  }

  function search(query) {
    var q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return CONSUMABLES.filter(function (i) {
      return T(i.name).toLowerCase().indexOf(q) !== -1;
    });
  }

  window.PriTestConsumables = {
    list: list,
    get: get,
    search: search,
    localizedText: T,
  };
})();
