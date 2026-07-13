(function () {
  // タリスマン（装飾品）データベース。武器と異なり単体でPassive効果を1つ持つだけの単純な構造。
  // 写真の情報密度が高く、確認できた名称・効果を中心とした部分収録（200〜202頁）。
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

  var TALISMANS = [
    {
      id: "talisman_sturdy_horn_charm",
      name: C("頑健の角飾り", "頑健的角飾"),
      body: C(
        "自身はエネミーからの状態異常「出血／凍傷」の蓄積値を無効にする。",
        "自身無效化來自敵人的異常狀態「出血／凍傷」蓄積值。"
      ),
    },
    {
      id: "talisman_immune_horn_charm",
      name: C("免疫の角飾り", "免疫的角飾"),
      body: C(
        "自身はエネミーからの状態異常「猛毒／腐敗」の蓄積値を無効にする。",
        "自身無效化來自敵人的異常狀態「猛毒／腐敗」蓄積值。"
      ),
    },
    {
      id: "talisman_sane_horn_charm",
      name: C("正気の角飾り", "正氣的角飾"),
      body: C(
        "自身はエネミーからの状態異常「発狂／睡眠」の蓄積値を無効にする。",
        "自身無效化來自敵人的異常狀態「發狂／睡眠」蓄積值。"
      ),
    },
    {
      id: "talisman_dappled_horn_charm",
      name: C("斑色の角飾り", "斑色的角飾"),
      body: C("自身はエネミーからの状態異常「呪死」の蓄積値を無効にする。", "自身無效化來自敵人的異常狀態「咒死」蓄積值。"),
    },
    { id: "talisman_prince_of_death_pouch", name: C("死王子の懐", "死亡王子的懷袋"), body: UNCONFIRMED },
    { id: "talisman_sacred_scar", name: C("聖なる痕", "聖痕"), body: UNCONFIRMED },
    {
      id: "talisman_dragoncrest_thunder",
      name: C("雷竜印の紋章", "雷龍紋章"),
      body: C("自身に、エネミーからの状態異常「雷」の蓄積値を増加する。", "自身受到敵人「雷」屬性蓄積值時，該蓄積值增加。"),
    },
    {
      id: "talisman_dragoncrest_flame",
      name: C("炎竜印の紋章", "炎龍紋章"),
      body: C("自身に、エネミーからの状態異常「炎」の蓄積値を増加する。", "自身受到敵人「炎」屬性蓄積值時，該蓄積值增加。"),
    },
    {
      id: "talisman_dragoncrest_magic",
      name: C("魔力竜印の紋章", "魔力龍紋章"),
      body: C("自身に、エネミーからの属性「魔」の蓄積値を増加する。", "自身受到敵人「魔」屬性蓄積值時，該蓄積值增加。"),
    },
    {
      id: "talisman_dragoncrest_rot",
      name: C("廃竜印の紋章", "廢龍紋章"),
      body: C("自身に、エネミーからの属性「廃」の蓄積値を増加する。", "自身受到敵人「廢」屬性蓄積值時，該蓄積值增加。"),
    },
    {
      id: "talisman_dragoncrest_holy",
      name: C("聖竜印の紋章", "聖龍紋章"),
      body: C("自身に、エネミーからの属性「聖」の蓄積値を増加する。", "自身受到敵人「聖」屬性蓄積值時，該蓄積值增加。"),
    },
    { id: "talisman_dragoncrest_pearl", name: C("真珠竜印の紋章", "珍珠龍紋章"), body: UNCONFIRMED },
    { id: "talisman_millicents_gauntlet", name: C("ミリセントの装手", "米莉森的護手"), body: UNCONFIRMED },
    {
      id: "talisman_twin_blade",
      name: C("両刃の徽章", "雙刃徽章"),
      body: C("自身が装備状態の近接武器に「2Hit特典」を追加する。", "自身裝備狀態的近戰武器追加「2Hit特典」。"),
    },
    { id: "talisman_winged_sword", name: C("有翼剣の徽章", "有翼劍徽章"), body: UNCONFIRMED },
    { id: "talisman_god_skin_swaddle", name: C("神肌のおくるみ", "神肌的襁褓"), body: UNCONFIRMED },
    {
      id: "talisman_curved_sword",
      name: C("曲剣のタリスマン", "彎劍護符"),
      body: C("自身の装備武器（曲剣・大曲剣）の「2Hitダメージ」を「＋10」する。", "自身裝備武器（曲劍・大曲劍）的「2Hit傷害」「＋10」。"),
    },
    { id: "talisman_greathammer", name: C("大槌のタリスマン", "大槌護符"), body: UNCONFIRMED },
    {
      id: "talisman_radagons_soreseal",
      name: C("ラダゴンの肖像", "拉塔岡的肖像"),
      body: UNCONFIRMED,
    },
    { id: "talisman_pillage_cameo", name: C("略奪のカメオ", "掠奪的浮雕"), body: UNCONFIRMED },
    { id: "talisman_spirit_horn", name: C("精霊の角", "精靈之角"), body: UNCONFIRMED },
    { id: "talisman_claw", name: C("爪のタリスマン", "爪之護符"), body: C("自身の行う遺物効果「ジャンプ攻撃」の効果を強化する。", "強化自身進行的遺物效果「跳躍攻擊」。") },
    { id: "talisman_axe", name: C("斧のタリスマン", "斧之護符"), body: C("自身の行う遺物効果「タメ攻撃」のダメージを強化する。", "強化自身進行的遺物效果「蓄力攻擊」傷害。") },
    { id: "talisman_roar_medallion", name: C("咆哮遺物のメダリオン", "咆哮遺物勳章"), body: UNCONFIRMED },
    { id: "talisman_godfreys_icon", name: C("ゴッドフレイの肖像", "戈弗雷的肖像"), body: UNCONFIRMED },
    {
      id: "talisman_perfumers",
      name: C("調香師のタリスマン", "調香師的護符"),
      body: C(
        "調合瓶消耗品を使用してもよい。この効果はアビリティ「携行知識」と重複しない。",
        "可以使用調香瓶消耗品。此效果不與能力「攜行知識」重複。"
      ),
    },
    {
      id: "talisman_blood_lord_joy",
      name: C("血の君主の歓喜", "血之君主的歡喜"),
      body: C(
        "PCの誰かが、エネミーに対して状態異常「出血」の蓄積値を発生させるごとに、自身に「HP回復：□」を適用する。",
        "任一名PC對敵人造成異常狀態「出血」蓄積值時，自身即獲得「HP回復：□」。"
      ),
    },
    {
      id: "talisman_rot_joy",
      name: C("廃散者の歓喜", "廢散者的歡喜"),
      body: C(
        "PCの誰かが、エネミーに対して属性「廃」の蓄積値を発生させるごとに、自身に「FP回復：□」を適用する。",
        "任一名PC對敵人造成屬性「廢」蓄積值時，自身即獲得「FP回復：□」。"
      ),
    },
    { id: "talisman_greed", name: C("貪欲者の洛印", "貪婪者的烙印"), body: C("自身の獲得するルーンの量を増加する。", "增加自身獲得的盧恩量。") },
    { id: "talisman_great_goat", name: C("大山羊のタリスマン", "大山羊護符"), body: C("自身の「最大HP」を「＋□」する。", "自身的「最大HP」「＋□」。") },
    { id: "talisman_great_shield", name: C("大盾のタリスマン", "大盾護符"), body: C("自身がガードするとき、自身の「ガード時HP価値」を「＋□」する。", "自身進行防禦時，自身的「防禦時HP價值」「＋□」。") },
    { id: "talisman_arsenal_charm", name: C("樹幽羽のタリスマン", "樹幽羽護符"), body: UNCONFIRMED },
    {
      id: "talisman_millicents_prosthesis",
      name: C("ミリセントの義手", "米莉森的義手"),
      body: C(
        "自身が「逆手の戦技／祈祷」を使用するとき、対応するダイスコストを「1／2／3」の場合、そのダイスコストが1つ無効になる。",
        "自身使用「逆手戰技／祈禱」時，若對應骰子消耗為「1／2／3」，該骰子消耗其中1個無效。"
      ),
    },
    {
      id: "talisman_dual_blade_emblem",
      name: C("両刃の徽章（次頁）", "雙刃徽章（次頁）"),
      body: UNCONFIRMED,
    },
    {
      id: "talisman_god_eater",
      name: C("略奪の力メオ", "掠奪之力浮雕"),
      body: C(
        "自身だけで総合ダメージを130以上発生させたとき、その1回だけ自身に「HP回復：□」を適用する。",
        "僅靠自身造成130以上總合傷害時，該次自身獲得「HP回復：□」。"
      ),
    },
    {
      id: "talisman_daedicars_woe",
      name: C("咆哮遺物のメダリオン（強化）", "咆哮遺物勳章（強化）"),
      body: UNCONFIRMED,
    },
    {
      id: "talisman_ragged",
      name: C("ラダゴンの肖像（フェイズ効果）", "拉塔岡的肖像（階段效果）"),
      body: C(
        "自身が使用する「魔術／祈祷」のダイスコストで必要な出目が1つ（例：①、連番）の場合、その1回だけダイスコストがりを無効にする。フェイズごとに1回。",
        "自身使用「魔術／祈禱」的骰子消耗僅需1個出目（例：①、連號）時，該次骰子消耗其中1個無效。每階段限1次。"
      ),
    },
    {
      id: "talisman_shield_scorpion_charm",
      name: C("捧鬮の盾", "捧鬮之盾"),
      body: C(
        "自身が「HP価値：最大HP」のとき、自身がガードすると、追加ダメージを「＋20」する（複数回ガードする場合は、そのつど）。",
        "自身「HP價值：最大HP」時，自身進行防禦可追加傷害「＋20」（多次防禦時，每次皆適用）。"
      ),
    },
    {
      id: "talisman_sword_scorpion_charm",
      name: C("捧鬮の剣", "捧鬮之劍"),
      body: C(
        "自身が「現在HP＝最大HP」のとき、自身から発生するアタックのダメージを「1Hit：＋5／2Hit：＋10」する。",
        "自身「現在HP＝最大HP」時，自身進行的攻擊傷害「1Hit：＋5／2Hit：＋10」。"
      ),
    },
    {
      id: "talisman_crimson_seven_edge",
      name: C("赤羽の七支刃", "赤羽的七支刃"),
      body: C("自身が「現在HP＝□□□以下」のとき、自身から発生するダメージを「＋5」する。", "自身「現在HP＝□□□以下」時，自身造成的傷害「＋5」。"),
    },
    {
      id: "talisman_indigo_seven_edge",
      name: C("青紫の七支刃", "青紫的七支刃"),
      body: C(
        "自身が「現在HP＝□□□以下」のとき、自身に「HP価値：□□□」する（ただし最大値100）。",
        "自身「現在HP＝□□□以下」時，自身獲得「HP價值：□□□」（但最大值為100）。"
      ),
    },
    { id: "talisman_dew_tear", name: C("憐みの雫", "憐憫的雫滴"), body: UNCONFIRMED },
    {
      id: "talisman_blue_dancer_blade",
      name: C("青色の凶刃", "青色的凶刃"),
      body: C("自身が遺物「致命の一撃」を使用すると、対応するスキルの効果に重複しない。", "自身使用遺物「致命一擊」時，效果與對應技能不重複。"),
    },
    {
      id: "talisman_green_dancer_blade",
      name: C("緑色の凶刃", "綠色的凶刃"),
      body: C("自身が遺物「致命の一撃」を使用すると、対応するスキルの効果に重複しない。", "自身使用遺物「致命一擊」時，效果與對應技能不重複。"),
    },
    { id: "talisman_short_dancer_blade", name: C("短剣の凶刃", "短劍的凶刃"), body: UNCONFIRMED },
    {
      id: "talisman_gold_scarab",
      name: C("金のスカラベ", "金聖甲蟲"),
      body: C(
        "自身が消耗する「消耗品・投擲武器」を1個獲得する。このスキルは1ターンでのみ、任意にガードすることができる。",
        "自身可獲得消耗的「消耗品・投擲武器」1個。此技能僅限每回合任意防禦時使用1次。"
      ),
    },
    {
      id: "talisman_silver_scarab",
      name: C("銀のスカラベ", "銀聖甲蟲"),
      body: C(
        "自身が獲得する消耗品「投擲武器」を1個追加する。この効果は重複しない。",
        "自身獲得的消耗品「投擲武器」追加1個。此效果不重複。"
      ),
    },
  ];

  function list() {
    return TALISMANS;
  }

  function get(id) {
    return (
      TALISMANS.filter(function (t) {
        return t.id === id;
      })[0] || null
    );
  }

  function search(query) {
    var q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return TALISMANS.filter(function (t) {
      return T(t.name).toLowerCase().indexOf(q) !== -1;
    });
  }

  window.PriTestTalismans = {
    list: list,
    get: get,
    search: search,
    localizedText: T,
  };
})();
