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
          body: C(
            "コスト：ゾロ（2個）　対象：自身　隊列：前衛・後衛どちらでも使用可能　効果：「ガード」の代わりに使用可能。効果を完全に無効化し、追加効果も無効化する。エンドフェイズまでにスタミナダイスを1個追加する。",
            "消耗：豹子（2個）　對象：自身　編隊：前衛・後衛皆可使用　效果：可代替「防禦」使用。完全無效化該次傷害，追加效果也一併無效化。直到結束階段為止，追加1個體力骰。"
          ),
        },
        {
          id: "dagger_step",
          name: C("魔ダガーステップ", "魔匕首步"),
          kind: "Action",
          body: C(
            "コスト：②／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：0＋戦技威力",
            "消耗：②／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：0＋戰技威力"
          ),
        },
      ],
    },
    {
      id: "straightsword",
      name: C("直剣", "直劍"),
      basicStats: {
        attackCost: C("1Hit：③／2Hit：③③", "1Hit：③／2Hit：③③"),
        weaponPower: 15,
        powerMod: C("バランス（※一部の武器は例外あり）", "平衡（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("総合＆復帰ダメージ＋10", "總合＆復歸傷害＋10"),
          body: C(
            "この装備品での全ての2Hitアタックによる総合ダメージと復帰ダメージを「＋10」する。",
            "此裝備所有的2Hit攻擊所造成的總合傷害與復歸傷害「＋10」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "straightsword_2hit_bonus",
          name: C("2Hitダメージ＋10", "2Hit傷害＋10"),
          kind: "Passive",
          body: C(
            "この装備品での全ての2Hitアタックにより発生するダメージを「＋10」する。",
            "此裝備的所有2Hit攻擊所造成的傷害「＋10」。"
          ),
        },
        {
          id: "straightsword_no_swap_cost",
          name: C("持ち替えコストなし", "無需替換消耗"),
          kind: "Passive",
          body: C(
            "他の装備品へ持ち替えを行う際、この装備品への持ち替えに持ち替えコストのダイスを必要としない。",
            "替換為其他裝備品時，替換為此裝備不需要消耗替換所需的骰子。"
          ),
        },
        {
          id: "straightsword_dual_wield",
          name: C("二本差し", "二刀"),
          kind: "Action",
          body: C(
            "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：55＋戦技威力",
            "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：55＋戰技威力"
          ),
        },
        {
          id: "straightsword_night_and_flame",
          name: C("夜と炎の加護", "夜與焰之加護"),
          kind: "Passive",
          body: UNCONFIRMED,
        },
      ],
    },
    {
      // 写真の回転・情報密度が高く、短剣／直剣より判読の確信度は低い。装備品スキル欄の細部は要再確認。
      id: "greatsword",
      name: C("大剣", "大劍"),
      basicStats: {
        attackCost: C("1Hit：⑤／2Hit：⑤⑤", "1Hit：⑤／2Hit：⑤⑤"),
        weaponPower: 25,
        powerMod: C("バランス（※一部の武器は例外あり）", "平衡（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("総合＆復帰ダメージ＋20", "總合＆復歸傷害＋20"),
          body: C(
            "この装備品での全ての2Hitアタックによる総合ダメージと復帰ダメージを「＋20」する。",
            "此裝備所有的2Hit攻擊所造成的總合傷害與復歸傷害「＋20」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "greatsword_two_handed_bonus",
          name: C("両手持ちダメージ＋", "雙手持傷害＋"),
          kind: "Passive",
          body: C(
            "他の武器（盾・杖・聖印状態のものを含む）を装備していないとき、この装備品でのアタックのダメージを「＋5」する。",
            "未裝備其他武器（含盾・杖・聖印狀態）時，此裝備攻擊造成的傷害「＋5」。"
          ),
        },
        { id: "greatsword_armor_break", name: C("鎧砕きの加護", "破鎧之加護"), kind: "Passive", body: UNCONFIRMED },
        { id: "greatsword_after_pierce", name: C("貫通後の加護", "貫穿後之加護"), kind: "Passive", body: UNCONFIRMED },
        { id: "greatsword_dragon_lineage", name: C("龍胤の加護", "龍胤之加護"), kind: "Passive", body: UNCONFIRMED },
        { id: "greatsword_great_grace", name: C("大いなる加護", "偉大之加護"), kind: "Passive", body: UNCONFIRMED },
      ],
    },
    {
      id: "colossal",
      name: C("特大剣", "特大劍"),
      basicStats: {
        attackCost: C("1Hit：⑤／2Hit：⑤⑤", "1Hit：⑤／2Hit：⑤⑤"),
        weaponPower: 30,
        powerMod: C("筋力", "力量"),
      },
      twoHitBonus: [
        {
          name: C("総合ダメージ＋▲", "總合傷害＋▲"),
          body: C(
            "この装備品での全ての2Hitアタックによる総合ダメージを「＋▲」する。",
            "此裝備所有的2Hit攻擊所造成的總合傷害「＋▲」。"
          ),
        },
      ],
      innateSkills: [
        { id: "colossal_strength_grace", name: C("膂力の加護", "膂力之加護"), kind: "Passive", body: UNCONFIRMED },
        { id: "colossal_armor_grace", name: C("鎧の加護", "鎧甲之加護"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "colossal_queen_wail",
          name: C("女王の慟哭", "女王的慟哭"),
          kind: "Action",
          body: C(
            "コスト：ゾロ（2個）／FP■　対象：自身　隊列：前衛のとき使用可能　威力：5",
            "消耗：豹子（2個）／FP■　對象：自身　編隊：前衛時可使用　威力：5"
          ),
        },
        { id: "colossal_wandering_spirit", name: C("彷徨いの霊", "徬徨之靈"), kind: "Action", body: UNCONFIRMED },
        {
          id: "colossal_star_call",
          name: C("星呼び", "呼星"),
          kind: "Action",
          body: C(
            "コスト：ソロ（3個）／FP■■■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：25",
            "消耗：ソロ（3個）／FP■■■　對象：敵人・雜兵　編隊：前衛時可使用　威力：25"
          ),
        },
        {
          id: "colossal_fate_of_death",
          name: C("運命の死", "命運之死"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：55",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：前衛時可使用　威力：55"
          ),
        },
      ],
    },
    {
      id: "rapier",
      name: C("刺剣", "刺劍"),
      basicStats: {
        attackCost: C("1Hit：②／2Hit：②②", "1Hit：②／2Hit：②②"),
        weaponPower: 10,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("スタミナダイス〇追加", "體力骰〇追加"),
          body: C(
            "この装備品での2Hitアタックの後、自身のスタミナダイスに〇を追加する。",
            "此裝備進行2Hit攻擊後，於自身的體力骰追加〇。"
          ),
        },
      ],
      innateSkills: [],
    },
    {
      id: "heavy_rapier",
      name: C("重刺剣", "重刺劍"),
      basicStats: {
        attackCost: C("1Hit：④／2Hit：④④", "1Hit：④／2Hit：④④"),
        weaponPower: 20,
        powerMod: C("バランス", "平衡"),
      },
      twoHitBonus: [
        {
          name: C("スタミナダイス□追加", "體力骰□追加"),
          body: C(
            "この装備品での2Hitアタックの後、自身のスタミナダイスに□を追加する。",
            "此裝備進行2Hit攻擊後，於自身的體力骰追加□。"
          ),
        },
      ],
      innateSkills: [
        { id: "heavy_rapier_dragon_grace", name: C("竜王の加護", "龍王之加護"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "heavy_rapier_chain_art",
          name: C("連続戦技", "連續戰技"),
          kind: "Action",
          body: C(
            "コスト：②（2個）／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：30",
            "消耗：②（2個）／FP■　對象：敵人　編隊：前衛時可使用　威力：30"
          ),
        },
        {
          id: "heavy_rapier_dynasty_art",
          name: C("王朝剣技", "王朝劍技"),
          kind: "Action",
          body: C(
            "コスト：連番／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：50",
            "消耗：連號／FP■　對象：敵人　編隊：前衛時可使用　威力：50"
          ),
        },
        {
          id: "heavy_rapier_thunderclad",
          name: C("雷雲の姿", "雷雲之姿"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：20",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：20"
          ),
        },
      ],
    },
    {
      id: "curved_sword",
      name: C("曲剣", "曲劍"),
      basicStats: {
        attackCost: C("1Hit：③／2Hit：③③", "1Hit：③／2Hit：③③"),
        weaponPower: 15,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("属性蓄積値＋1", "屬性蓄積值＋1"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し属性蓄積値が加算されるとき「蓄積値：＋1」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成屬性蓄積值，則「蓄積值：＋1」。"
          ),
        },
        {
          name: C("状態異常蓄積値＋1", "異常狀態蓄積值＋1"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し状態異常蓄積値が加算されるとき「蓄積値：＋1」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成異常狀態蓄積值，則「蓄積值：＋1」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "curved_sword_2hit_bonus",
          name: C("2Hitダメージ＋10", "2Hit傷害＋10"),
          kind: "Passive",
          body: C(
            "この装備品での全ての2Hitアタックで発生するダメージを「＋10」する。",
            "此裝備的所有2Hit攻擊所造成的傷害「＋10」。"
          ),
        },
        { id: "curved_sword_power_mod_up", name: C("威力補正（技量）＋5", "威力補正（技巧）＋5"), kind: "Passive", body: UNCONFIRMED },
        { id: "curved_sword_heal_up", name: C("HP回復効果アップ＋5", "HP回復效果提升＋5"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "curved_sword_lava_guillotine",
          name: C("溶岩ギロチン", "熔岩斷頭台"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：15",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：15"
          ),
        },
        {
          id: "curved_sword_cursed_blood_slash",
          name: C("呪血の斬撃", "咒血斬擊"),
          kind: "Action",
          body: C(
            "コスト：連番／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：30",
            "消耗：連號／FP■　對象：敵人　編隊：後衛時可使用　威力：30"
          ),
        },
      ],
    },
    {
      id: "great_curved_sword",
      name: C("大曲剣", "大曲劍"),
      basicStats: {
        attackCost: C("1Hit：⑤／2Hit：⑤⑤", "1Hit：⑤／2Hit：⑤⑤"),
        weaponPower: 25,
        powerMod: C("バランス（※一部の武器は例外あり）", "平衡（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("属性蓄積値＋1", "屬性蓄積值＋1"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し属性蓄積値が加算されるとき「蓄積値：＋1」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成屬性蓄積值，則「蓄積值：＋1」。"
          ),
        },
        {
          name: C("状態異常蓄積値＋1", "異常狀態蓄積值＋1"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し状態異常蓄積値が加算されるとき「蓄積値：＋1」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成異常狀態蓄積值，則「蓄積值：＋1」。"
          ),
        },
      ],
      innateSkills: [
        { id: "great_curved_sword_omen_grace", name: C("忌み子の加護", "忌子之加護"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "great_curved_sword_hound_volley",
          name: C("猟犬の斉撃", "獵犬的齊擊"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：10",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：10"
          ),
        },
        {
          id: "great_curved_sword_black_king_repel",
          name: C("黒王の斥力波", "黑王的斥力波"),
          kind: "Action",
          body: C(
            "コスト：ゾロ（2個）／FP■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：10",
            "消耗：豹子（2個）／FP■　對象：敵人・雜兵　編隊：前衛時可使用　威力：10"
          ),
        },
      ],
    },
    {
      id: "katana",
      name: C("刀", "刀"),
      basicStats: {
        attackCost: C("1Hit：③／2Hit：③③", "1Hit：③／2Hit：③③"),
        weaponPower: 10,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("総合＆復帰ダメージ＋10", "總合＆復歸傷害＋10"),
          body: C(
            "この装備品での全ての2Hitアタックによる総合ダメージと復帰ダメージを「＋10」する。",
            "此裝備所有的2Hit攻擊所造成的總合傷害與復歸傷害「＋10」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "katana_power_up5",
          name: C("武器威力＋5", "武器威力＋5"),
          kind: "Passive",
          body: C(
            "この装備品の「武器威力」を「＋5」する。",
            "此裝備的「武器威力」「＋5」。"
          ),
        },
        {
          id: "katana_power_up10",
          name: C("武器威力＋10", "武器威力＋10"),
          kind: "Passive",
          body: C(
            "この装備品の「武器威力」を「＋10」する。",
            "此裝備的「武器威力」「＋10」。"
          ),
        },
        { id: "katana_unbroken_grace", name: C("不敗の加護", "不敗之加護"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "katana_moment_of_moonlight",
          name: C("束の間の月影", "須臾的月影"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：30",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：前衛時可使用　威力：30"
          ),
        },
        {
          id: "katana_countless_corpses",
          name: C("死屍累々", "死屍累累"),
          kind: "Action",
          body: C(
            "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：10",
            "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：10"
          ),
        },
        {
          id: "katana_ice_thunder_kill",
          name: C("氷雷刹", "冰雷剎"),
          kind: "Action",
          body: C(
            "コスト：①②③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：10",
            "消耗：①②③／FP■　對象：敵人　編隊：前衛時可使用　威力：10"
          ),
        },
        {
          id: "katana_water_bird_dance",
          name: C("水鳥乱舞", "水鳥亂舞"),
          kind: "Action",
          body: C(
            "コスト：連番（2〜3個）／FP■■■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：40",
            "消耗：連號（2〜3個）／FP■■■　對象：敵人　編隊：前衛・後衛皆可使用　威力：40"
          ),
        },
      ],
    },
    {
      id: "twinblade",
      name: C("両刃剣", "兩刃劍"),
      basicStats: {
        attackCost: C("1Hit：②／2Hit：②②", "1Hit：②／2Hit：②②"),
        weaponPower: 20,
        powerMod: C("バランス（※一部の武器は例外あり）", "平衡（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("武器威力＋10", "武器威力＋10"),
          body: C(
            "他の武器（盾・杖・聖印状態のものを含む）を装備状態にしておらず、この装備品を装備状態なら、2Hitのアタックのダメージを「＋10」する。",
            "未將其他武器（含盾・杖・聖印狀態）裝備狀態化，且此裝備為裝備狀態時，2Hit攻擊的傷害「＋10」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "twinblade_power_down5",
          name: C("武器威力－5", "武器威力－5"),
          kind: "Passive",
          body: C(
            "この装備品の「武器威力」を「－5」する。",
            "此裝備的「武器威力」「－5」。"
          ),
        },
      ],
    },
    {
      id: "mace",
      name: C("槌", "槌"),
      basicStats: {
        attackCost: C("1Hit：③／2Hit：③③", "1Hit：③／2Hit：③③"),
        weaponPower: 10,
        powerMod: C("筋力（※一部の武器は例外あり）", "力量（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("総合ダメージ＋▲", "總合傷害＋▲"),
          body: C(
            "この装備品での2Hitアタックによる総合ダメージを「＋▲」する。",
            "此裝備2Hit攻擊所造成的總合傷害「＋▲」。"
          ),
        },
      ],
      innateSkills: [
        { id: "mace_two_handed_bonus", name: C("両手持ちダメージ＋", "雙手持傷害＋"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "mace_power_up5",
          name: C("武器威力＋5", "武器威力＋5"),
          kind: "Passive",
          body: C("この装備品の「武器威力」を「＋5」する。", "此裝備的「武器威力」「＋5」。"),
        },
        {
          id: "mace_queen_jabon",
          name: C("女王のジャボン", "女王的香波"),
          kind: "Action",
          body: C(
            "コスト：連番（2個）／FP■　対象：エネミー・モブ　隊列：後衛のとき使用可能　威力：25",
            "消耗：連號（2個）／FP■　對象：敵人・雜兵　編隊：後衛時可使用　威力：25"
          ),
        },
        {
          id: "mace_fluidize",
          name: C("流体化", "流體化"),
          kind: "Action",
          body: C(
            "コスト：①②／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：20",
            "消耗：①②／FP■　對象：敵人　編隊：後衛時可使用　威力：20"
          ),
        },
        {
          id: "mace_flick",
          name: C("爪弾き", "彈指"),
          kind: "Action",
          body: C(
            "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：10",
            "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：10"
          ),
        },
        {
          id: "mace_hyakuchi_world",
          name: C("百智の世界", "百智的世界"),
          kind: "Action",
          body: C(
            "コスト：①／FP■　対象：PC全員　隊列：前衛のとき使用可能　威力：20",
            "消耗：①／FP■　對象：全體PC　編隊：前衛時可使用　威力：20"
          ),
        },
        {
          id: "mace_golden_crush",
          name: C("黄金砕き", "黃金碎"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー・モブ　隊列：後衛のとき使用可能　威力：10",
            "消耗：ソロ（2個）／FP■　對象：敵人・雜兵　編隊：後衛時可使用　威力：10"
          ),
        },
      ],
    },
    {
      id: "axe",
      name: C("斧", "斧"),
      basicStats: {
        attackCost: C("1Hit：④／2Hit：④④", "1Hit：④／2Hit：④④"),
        weaponPower: 20,
        powerMod: C("バランス（※一部の武器は例外あり）", "平衡（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("総合＆復帰ダメージ＋10", "總合＆復歸傷害＋10"),
          body: C(
            "この装備品での2Hitアタックによる総合ダメージと復帰ダメージを「＋10」する。",
            "此裝備2Hit攻擊所造成的總合傷害與復歸傷害「＋10」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "axe_thunder_storm",
          name: C("雷嵐", "雷嵐"),
          kind: "Action",
          body: C(
            "コスト：①③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：45",
            "消耗：①③／FP■　對象：敵人　編隊：前衛時可使用　威力：45"
          ),
        },
      ],
    },
    {
      // 斧ページと同様、写真の情報密度が高く判読の確信度は短剣／直剣より低いカテゴリ。
      id: "flail",
      name: C("フレイル", "連枷"),
      basicStats: {
        attackCost: C("1Hit：④／2Hit：④④", "1Hit：④／2Hit：④④"),
        weaponPower: 15,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("総合ダメージ＋▲", "總合傷害＋▲"),
          body: C(
            "この装備品での2Hitアタックによる総合ダメージを「＋▲」する。",
            "此裝備2Hit攻擊所造成的總合傷害「＋▲」。"
          ),
        },
      ],
      innateSkills: [
        { id: "flail_chain_tremor", name: C("鎖の震え", "鎖之震顫"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "flail_chain_swing",
          name: C("鎖回し", "鎖迴旋"),
          kind: "Action",
          body: C(
            "コスト：①①／FP■　対象：自身　隊列：前衛のとき使用可能　威力：35",
            "消耗：①①／FP■　對象：自身　編隊：前衛時可使用　威力：35"
          ),
        },
        {
          id: "flail_family_wail",
          name: C("家族の怨霊", "家族的怨靈"),
          kind: "Action",
          body: C(
            "コスト：①②／FP■・モブ　対象：エネミー・モブ　隊列：後衛のとき使用可能　威力：60",
            "消耗：①②／FP■・雜兵　對象：敵人・雜兵　編隊：後衛時可使用　威力：60"
          ),
        },
      ],
    },
    {
      id: "greataxe",
      name: C("大斧", "大斧"),
      basicStats: {
        attackCost: C("1Hit：⑤／2Hit：⑤⑤", "1Hit：⑤／2Hit：⑤⑤"),
        weaponPower: 45,
        powerMod: C("筋力", "力量"),
      },
      twoHitBonus: [
        {
          name: C("総合ダメージ＋▲（2Hit時は2倍）", "總合傷害＋▲（2Hit時為2倍）"),
          body: C(
            "この装備品での2Hitアタックによる総合ダメージを「＋▲」する。2Hit時には▲が2倍になる。",
            "此裝備2Hit攻擊所造成的總合傷害「＋▲」。2Hit時▲數值為2倍。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "greataxe_crit_up20",
          name: C("致命の一撃＋20", "致命一擊＋20"),
          kind: "Passive",
          body: C(
            "この装備品で遺物効果「致命の一撃」を発生させたとき、そのダメージを「＋20」する。",
            "使用此裝備發動遺物效果「致命一擊」時，將該傷害「＋20」。"
          ),
        },
        { id: "greataxe_two_handed_bonus", name: C("両手持ちダメージ＋", "雙手持傷害＋"), kind: "Passive", body: UNCONFIRMED },
        { id: "greataxe_golden_lineage_grace", name: C("黄金の一族の加護", "黃金一族的加護"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "greataxe_bishop_flame_wave",
          name: C("司教の炎波", "主教的炎波"),
          kind: "Action",
          body: C(
            "コスト：連番／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：90",
            "消耗：連號／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：90"
          ),
        },
        {
          id: "greataxe_gravity_quake",
          name: C("重力震", "重力震"),
          kind: "Action",
          body: C(
            "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：20",
            "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：20"
          ),
        },
        {
          id: "greataxe_lava_eruption",
          name: C("溶岩噴火", "熔岩噴發"),
          kind: "Action",
          body: C(
            "コスト：①②③／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：20",
            "消耗：①②③／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：20"
          ),
        },
        {
          id: "greataxe_spin_flight",
          name: C("回転飛翔", "迴轉飛翔"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：40",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：40"
          ),
        },
        {
          id: "greataxe_big_bubble",
          name: C("大シャボン", "大泡泡"),
          kind: "Action",
          body: C(
            "コスト：②②／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：5",
            "消耗：②②／FP■　對象：敵人　編隊：前衛時可使用　威力：5"
          ),
        },
      ],
    },
    {
      id: "spear",
      name: C("槍", "槍"),
      basicStats: {
        attackCost: C("1Hit：②／2Hit：②②", "1Hit：②／2Hit：②②"),
        weaponPower: 10,
        powerMod: C("バランス", "平衡"),
      },
      twoHitBonus: [
        {
          name: C("スタミナダイス□追加", "體力骰□追加"),
          body: C(
            "この装備品でのアタックの後、自身のスタミナダイスに□を追加する。",
            "此裝備進行攻擊後，於自身的體力骰追加□。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "spear_backline_attack",
          name: C("後衛アタック可能", "後衛可攻擊"),
          kind: "Passive",
          body: C("この装備品は、後衛アタックが可能である。", "此裝備可進行後衛攻擊。"),
        },
      ],
    },
    {
      id: "great_spear",
      name: C("大槍", "大槍"),
      basicStats: {
        attackCost: C("1Hit：④／2Hit：④④", "1Hit：④／2Hit：④④"),
        weaponPower: 20,
        powerMod: C("バランス", "平衡"),
      },
      twoHitBonus: [
        {
          name: C("スタミナダイス□追加", "體力骰□追加"),
          body: C(
            "この装備品での2Hitアタックの後、自身のスタミナダイスに□を追加する。",
            "此裝備進行2Hit攻擊後，於自身的體力骰追加□。"
          ),
        },
      ],
      innateSkills: [
        { id: "great_spear_blood_lord_grace", name: C("血の主の加護", "血之主的加護"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "great_spear_serpent_hunt",
          name: C("大蛇狩り", "獵大蛇"),
          kind: "Action",
          body: C(
            "コスト：①④／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：50",
            "消耗：①④／FP■　對象：敵人　編隊：前衛時可使用　威力：50"
          ),
        },
        {
          id: "great_spear_ciriria_vortex",
          name: C("シルリアの渦", "西琉里亞的漩渦"),
          kind: "Action",
          body: C(
            "コスト：①②③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：60",
            "消耗：①②③／FP■　對象：敵人　編隊：前衛時可使用　威力：60"
          ),
        },
        {
          id: "great_spear_mad_flame_thrust",
          name: C("狂い火突き", "狂焰突刺"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：5",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：5"
          ),
        },
      ],
    },
    {
      // 写真の情報密度が高く（種類決定表16種）、個々の武器⇔装備品スキル対応の一部は未確認。
      id: "halberd",
      name: C("斧槍", "斧槍"),
      basicStats: {
        attackCost: C("1Hit：⑤／2Hit：⑤⑤", "1Hit：⑤／2Hit：⑤⑤"),
        weaponPower: 25,
        powerMod: C("バランス（※一部の武器は例外あり）", "平衡（※部分武器有例外）"),
      },
      twoHitBonus: [
        {
          name: C("スタミナダイス〇追加", "體力骰〇追加"),
          body: C(
            "この装備品での2Hitアタックの後、自身のスタミナダイスに〇を追加する。",
            "此裝備進行2Hit攻擊後，於自身的體力骰追加〇。"
          ),
        },
      ],
      innateSkills: [
        { id: "halberd_two_handed_bonus", name: C("両手持ちダメージ＋", "雙手持傷害＋"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "halberd_under_the_banner",
          name: C("軍旗の下に", "軍旗之下"),
          kind: "Action",
          body: C(
            "コスト：③／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　効果：対象に【総合ダメージ：威力】と、PCの人数×20のダメージを与える。",
            "消耗：③／FP■　對象：敵人　編隊：前衛・後衛皆可使用　效果：對敵人造成【總合傷害：威力】，並追加PC人數×20的傷害。"
          ),
        },
      ],
    },
    {
      id: "scythe",
      name: C("鎌", "鐮"),
      basicStats: {
        attackCost: C("1Hit：④／2Hit：④④", "1Hit：④／2Hit：④④"),
        weaponPower: 15,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("属性蓄積値＋2", "屬性蓄積值＋2"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し属性蓄積値が加算されるとき「蓄積値：＋2」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成屬性蓄積值，則「蓄積值：＋2」。"
          ),
        },
        {
          name: C("状態異常蓄積値＋1", "異常狀態蓄積值＋1"),
          body: C(
            "この装備品での2Hitアタックで、エネミーに対し状態異常蓄積値が加算されるとき「蓄積値：＋1」する。",
            "此裝備使用2Hit攻擊時，若對敵人造成異常狀態蓄積值，則「蓄積值：＋1」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "scythe_holy_halo",
          name: C("聖なる光輪", "聖之光輪"),
          kind: "Action",
          body: C(
            "コスト：④／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：30",
            "消耗：④／FP■　對象：敵人　編隊：後衛時可使用　威力：30"
          ),
        },
        {
          id: "scythe_spin_slash",
          name: C("回転斬撃", "迴轉斬擊"),
          kind: "Action",
          body: C(
            "コスト：②③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：40",
            "消耗：②③／FP■　對象：敵人　編隊：前衛時可使用　威力：40"
          ),
        },
        {
          id: "scythe_black_flame_vortex",
          name: C("黒炎の渦", "黑炎之渦"),
          kind: "Action",
          body: C(
            "コスト：②②／FP■・モブ　対象：エネミー・モブ　隊列：前衛・後衛どちらでも使用可能　威力：0",
            "消耗：②②／FP■・雜兵　對象：敵人・雜兵　編隊：前衛・後衛皆可使用　威力：0"
          ),
        },
      ],
    },
    {
      id: "whip",
      name: C("鞭", "鞭"),
      basicStats: {
        attackCost: C("1Hit：②／2Hit：②②", "1Hit：②／2Hit：②②"),
        weaponPower: 5,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("総合ダメージ＋▲", "總合傷害＋▲"),
          body: C(
            "この装備品での2Hitアタックによる総合ダメージを「＋▲」する。",
            "此裝備2Hit攻擊所造成的總合傷害「＋▲」。"
          ),
        },
      ],
      innateSkills: [
        { id: "whip_white_shadow_invite", name: C("白い影の誘い", "白影之誘"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "whip_lava_sea",
          name: C("溶岩の海", "熔岩之海"),
          kind: "Action",
          body: C(
            "コスト：②／FP■　対象：エネミー・モブ　隊列：後衛のとき使用可能　威力：0",
            "消耗：②／FP■　對象：敵人・雜兵　編隊：後衛時可使用　威力：0"
          ),
        },
        {
          id: "whip_flame_dance",
          name: C("炎の舞", "炎之舞"),
          kind: "Action",
          body: C(
            "コスト：③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：25",
            "消耗：③／FP■　對象：敵人　編隊：前衛時可使用　威力：25"
          ),
        },
      ],
    },
    {
      id: "fist",
      name: C("拳", "拳"),
      basicStats: {
        attackCost: C("1Hit：①／2Hit：①①", "1Hit：①／2Hit：①①"),
        weaponPower: 10,
        powerMod: C("バランス（※一部の武器は例外あり）", "平衡（※部分武器有例外）"),
      },
      twoHitBonus: [
        { name: C("2Hitダメージ＋10", "2Hit傷害＋10"), body: UNCONFIRMED },
      ],
      innateSkills: [
        {
          id: "fist_life_reaping_strike",
          name: C("命の奪撃", "奪命之擊"),
          kind: "Action",
          body: C(
            "コスト：連番（2〜3個）／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：60",
            "消耗：連號（2〜3個）／FP■　對象：敵人　編隊：前衛時可使用　威力：60"
          ),
        },
        {
          id: "fist_whirlwind_strike",
          name: C("風旋撃", "風旋擊"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：40",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：40"
          ),
        },
        {
          id: "fist_unyielding_disaster",
          name: C("防ぎ得ぬ災", "無法防禦之災"),
          kind: "Action",
          body: C(
            "コスト：モブ／FP■　対象：モブ　隊列：前衛のとき使用可能　効果：対象に【総合ダメージ：威力】と「炎：4」を与える。",
            "消耗：雜兵／FP■　對象：雜兵　編隊：前衛時可使用　效果：對敵人造成【總合傷害：威力】與「火：4」。"
          ),
        },
      ],
    },
    {
      id: "claw",
      name: C("爪", "爪"),
      basicStats: {
        attackCost: C("1Hit：②／2Hit：②③", "1Hit：②／2Hit：②③"),
        weaponPower: 15,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("2Hitダメージ＋10", "2Hit傷害＋10"),
          body: UNCONFIRMED,
        },
      ],
      innateSkills: [
        { id: "claw_dragon_grace", name: C("飛竜の加護", "飛龍之加護"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "claw_life_strike",
          name: C("命の一撃", "命之一擊"),
          kind: "Action",
          body: C(
            "コスト：連番／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：60",
            "消耗：連號／FP■　對象：敵人　編隊：前衛時可使用　威力：60"
          ),
        },
        {
          id: "claw_storm_claw_strike",
          name: C("嵐爪撃", "嵐爪擊"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：40",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：40"
          ),
        },
        {
          id: "claw_behold",
          name: C("ご照覧あれい！", "請鑒察吧！"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：モブ　隊列：前衛のとき使用可能　威力：15",
            "消耗：ソロ（2個）／FP■　對象：雜兵　編隊：前衛時可使用　威力：15"
          ),
        },
      ],
    },
    {
      id: "bow",
      name: C("弓", "弓"),
      basicStats: {
        attackCost: C("1Hit：②／2Hit：②②", "1Hit：②／2Hit：②②"),
        weaponPower: 10,
        powerMod: C("技量", "技巧"),
      },
      twoHitBonus: [
        {
          name: C("総合＆復帰ダメージ＋10", "總合＆復歸傷害＋10"),
          body: C(
            "この装備品での全ての2Hitアタックによる総合ダメージと復帰ダメージを「＋10」する。",
            "此裝備所有的2Hit攻擊所造成的總合傷害與復歸傷害「＋10」。"
          ),
        },
      ],
      innateSkills: [],
    },
    {
      id: "greatbow",
      name: C("大弓", "大弓"),
      basicStats: {
        attackCost: C("1Hit：④／2Hit：④④", "1Hit：④／2Hit：④④"),
        weaponPower: 15,
        powerMod: C("バランス", "平衡"),
      },
      twoHitBonus: [
        {
          name: C("総合ダメージ＋▲", "總合傷害＋▲"),
          body: C(
            "この装備品での2Hitアタックによる総合ダメージを「＋▲」する。",
            "此裝備2Hit攻擊所造成的總合傷害「＋▲」。"
          ),
        },
      ],
      innateSkills: [
        {
          id: "greatbow_general_grace",
          name: C("将軍の加護", "將軍之加護"),
          kind: "Passive",
          body: C(
            "この装備品での全てのアタックを行ったとき、ダイスコストに「囮」が含まれるなら、ダメージを「＋15」する。",
            "使用此裝備進行所有攻擊時，若骰子消耗中含有「誘餌」，則傷害「＋15」。"
          ),
        },
        {
          id: "greatbow_radahn_downpour",
          name: C("ラダーンの驟雨", "拉塔恩的驟雨"),
          kind: "Action",
          body: C(
            "コスト：④④／FP■・モブ　対象：エネミー・モブ　隊列：後衛のとき使用可能　威力：50",
            "消耗：④④／FP■・雜兵　對象：敵人・雜兵　編隊：後衛時可使用　威力：50"
          ),
        },
      ],
    },
    {
      id: "crossbow",
      name: C("クロスボウ", "弩"),
      basicStats: {
        attackCost: C("1Hit：②／2Hit：②②", "1Hit：②／2Hit：②②"),
        weaponPower: 35,
        powerMod: C("なし", "無"),
      },
      twoHitBonus: [],
      innateSkills: [
        {
          id: "crossbow_kick",
          name: C("キック", "踢擊"),
          kind: "Action",
          body: C(
            "コスト：①　対象：エネミー　隊列：前衛のとき使用可能　効果：対象、前衛、対象に「▲」を与える。エネミーが「サイズ：LL」の場合、使用できない。",
            "消耗：①　對象：敵人　編隊：前衛時可使用　效果：對敵人、前衛的對象造成「▲」傷害。敵人為「體型：LL」時無法使用。"
          ),
        },
      ],
    },
    {
      id: "ballista",
      name: C("バリスタ", "弩砲"),
      basicStats: {
        attackCost: C("1Hit：⑥", "1Hit：⑥"),
        weaponPower: 40,
        powerMod: C("なし", "無"),
      },
      twoHitBonus: [],
      innateSkills: [],
    },
    // ▼盾（小盾／中盾／大盾）：武器と異なりガードコスト／レア度別ガード時HP価値を持ち、
    // 装備品スキル欄も「付随効果」と「逆手の戦技（ガード時戦技）」の2種類に分かれる（isShield: true）。
    // 種類決定表は写真の情報密度が非常に高く（各カテゴリ15種以上）、現時点ではC帯を中心とした
    // 部分的な収録にとどめている。続報の写真があれば拡充する。
    {
      id: "small_shield",
      isShield: true,
      name: C("小盾", "小盾"),
      basicStats: {
        guardCost: C("①", "①"),
        guardHpCU: 50,
        guardHpRL: 60,
        powerMod: C("バランス", "平衡"),
      },
      innateSkills: [
        { id: "small_shield_poison_immune_n", name: C("毒無効＋n", "毒無效＋n"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "small_shield_reverse_parry",
          name: C("逆手バリィ", "反手格擋"),
          kind: "Defense",
          body: C(
            "コスト：②（2個）／FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能　効果：「ガード」の代わりに使用可能。効果を完全に無効化し、追加効果も無効化する。開始時のスタミナダイスを1個追加する。",
            "消耗：②（2個）／FP■　對象：自身　編隊：前衛・後衛皆可使用　效果：可代替「防禦」使用。完全無效化該次傷害，追加效果也一併無效化。開始時追加1個體力骰。"
          ),
        },
        {
          id: "small_shield_golden_retribution",
          name: C("黄金の返報", "黃金的回報"),
          kind: "Action",
          body: C(
            "コスト：ソロ／FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能",
            "消耗：ソロ／FP■　對象：自身　編隊：前衛・後衛皆可使用"
          ),
        },
        {
          id: "small_shield_poison_bite",
          name: C("毒の噛みつき", "毒之噬咬"),
          kind: "Action",
          body: C(
            "コスト：③連番／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：10",
            "消耗：③連號／FP■　對象：敵人　編隊：前衛時可使用　威力：10"
          ),
        },
      ],
    },
    {
      id: "medium_shield",
      isShield: true,
      name: C("中盾", "中盾"),
      basicStats: {
        guardCost: C("②", "②"),
        guardHpCU: 70,
        guardHpRL: 80,
        powerMod: C("前衛的（原文判読不易・要再確認）", "前衛型（原文判讀不易，待確認）"),
      },
      innateSkills: [
        { id: "medium_shield_poison_immune_n", name: C("毒無効＋n", "毒無效＋n"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "medium_shield_reverse_parry",
          name: C("逆手クラーバリィ", "反手格擋"),
          kind: "Defense",
          body: C(
            "コスト：②（2個）／FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能　効果：「ガード」の代わりに使用可能。効果を完全に無効化し、追加効果も無効化する。開始時のスタミナダイスを1個追加する。",
            "消耗：②（2個）／FP■　對象：自身　編隊：前衛・後衛皆可使用　效果：可代替「防禦」使用。完全無效化該次傷害，追加效果也一併無效化。開始時追加1個體力骰。"
          ),
        },
        {
          id: "medium_shield_golden_retribution",
          name: C("黄金の返報", "黃金的回報"),
          kind: "Action",
          body: C(
            "コスト：ソロ／FP■　対象：自身　隊列：前衛のとき使用可能",
            "消耗：ソロ／FP■　對象：自身　編隊：前衛時可使用"
          ),
        },
        {
          id: "medium_shield_poison_bite",
          name: C("毒の噛みつき", "毒之噬咬"),
          kind: "Action",
          body: C(
            "コスト：③連番／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：10",
            "消耗：③連號／FP■　對象：敵人　編隊：前衛時可使用　威力：10"
          ),
        },
      ],
    },
    {
      id: "large_shield",
      isShield: true,
      name: C("大盾", "大盾"),
      basicStats: {
        guardCost: C("③", "③"),
        guardHpCU: 90,
        guardHpRL: 100,
        powerMod: C("筋力", "力量"),
      },
      innateSkills: [
        { id: "large_shield_poison_immune_n", name: C("毒無効＋n", "毒無效＋n"), kind: "Passive", body: UNCONFIRMED },
        {
          id: "large_shield_reverse_parry",
          name: C("ガードクラーバリィ", "格擋反手"),
          kind: "Defense",
          body: UNCONFIRMED,
        },
        {
          id: "large_shield_golden_retribution",
          name: C("黄金の返報", "黃金的回報"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能　威力：10",
            "消耗：ソロ（2個）／FP■　對象：自身　編隊：前衛・後衛皆可使用　威力：10"
          ),
        },
        {
          id: "large_shield_flame_belch",
          name: C("火炎の嘔き", "火炎之嘔"),
          kind: "Action",
          body: C(
            "コスト：連番／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：35",
            "消耗：連號／FP■　對象：敵人　編隊：前衛時可使用　威力：35"
          ),
        },
        {
          id: "large_shield_flame_spit",
          name: C("炎の唾", "炎之唾"),
          kind: "Action",
          body: C(
            "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：10",
            "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：10"
          ),
        },
        { id: "large_shield_contagious_fury", name: C("伝染する怒り", "傳染的憤怒"), kind: "Action", body: UNCONFIRMED },
      ],
    },
    // 杖（staff）：他の武器と異なり、装備品スキル欄は「魔術」（戦技とは別の呪文体系、154頁ではなく
    // 185〜190頁を参照）を指す。杖自体にアタックコスト／武器威力は存在しない（威力補正のみ影響）。
    // ランダム魔術決定表はA1〜A6・B1〜B6の12グループ×各6種＝計72種と非常に広大なため、
    // 固有魔術（各杖が個別に参照する魔術）を中心に収録し、ランダム枠は基本的に random 扱いとした。
    {
      id: "staff",
      name: C("杖", "杖"),
      basicStats: {
        attackCost: C("なし", "無"),
        weaponPower: 0,
        powerMod: C("知力", "智力"),
      },
      innateSkills: [],
    },
    // 聖印（sacred_seal）：杖と同様、装備品スキル欄は祈祷（191〜199頁）を参照する。杖の魔術以上に
    // ページ数・種類（A1〜A6／B1〜B6／C1〜C3の計15グループ×各6種）が多く、今回は判読できた
    // 祈祷を中心とした部分収録。
    {
      id: "sacred_seal",
      name: C("聖印", "聖印"),
      basicStats: {
        attackCost: C("なし", "無"),
        weaponPower: 0,
        powerMod: C("信仰", "信仰"),
      },
      innateSkills: [],
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
      body: C(
        "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　効果：対象を、後衛、エンドフェイズまで「敵視：0」に変更する。",
        "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　效果：將對象變更為後衛，直到結束階段為止「敵視：0」。"
      ),
    },
    // 脇差の第2戦技名は写真からは確定できず、暫定的に「クイックステップ」のまま保持。要再確認。
    art_quickstep: { name: C("クイックステップ", "疾風步"), kind: null, body: UNCONFIRMED },
    art_consecutive_thrust: {
      name: C("連続突き", "連續突刺"),
      kind: "Action",
      body: C(
        "コスト：②（2個）　対象：連続　隊列：前衛のとき使用可能　威力：40＋戦技威力",
        "消耗：②（2個）　對象：連續　編隊：前衛時可使用　威力：40＋戰技威力"
      ),
    },
    art_reduvia_blood_blade: {
      name: C("レドゥビアの血刃", "雷度維亞的血刃"),
      kind: "Action",
      body: C(
        "コスト：③個／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：20　効果：対象に【総合ダメージ：威力】と「出血：2」を与える。",
        "消耗：③個／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：20　效果：對敵人造成【總合傷害：威力】與「出血：2」。"
      ),
    },
    art_death_blade: {
      name: C("死の刃", "死之刃"),
      kind: "Action",
      body: C(
        "コスト：④個　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：0＋戦技威力　効果：対象に【総合ダメージ：威力＋▲】と「聖：2」を与える。",
        "消耗：④個　對象：敵人　編隊：前衛・後衛皆可使用　威力：0＋戰技威力　效果：對敵人造成【總合傷害：威力＋▲】與「聖：2」。"
      ),
    },
    // 直剣｜ランダム戦技決定表（1D）：1なら構え、2〜6なら岩石構え。
    art_stance: {
      name: C("構え", "架式"),
      kind: "Action",
      body: C(
        "コスト：①③／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：45＋戦技威力",
        "消耗：①③／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：45＋戰技威力"
      ),
    },
    art_boulder_stance: {
      name: C("岩石構え", "岩石架式"),
      kind: "Action",
      body: C(
        "コスト：①／FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能　効果：対象に【総合ダメージ：威力】を与える。この装備品で2Hitのアタックを行ったとき、そのダメージに「＋▲」する。",
        "消耗：①／FP■　對象：自身　編隊：前衛・後衛皆可使用　效果：對敵人造成【總合傷害：威力】。此裝備進行2Hit攻擊時，該傷害「＋▲」。"
      ),
    },
    art_eohid_sword_dance: {
      name: C("エオヒドの剣舞", "艾奧希德的劍舞"),
      kind: "Action",
      body: C(
        "コスト：③個／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：15＋戦技威力",
        "消耗：③個／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：15＋戰技威力"
      ),
    },
    art_unyielding_blade: {
      name: C("防ぎ得ぬ刃", "無法防禦之刃"),
      kind: "Action",
      body: C(
        "コスト：①③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：15＋戦技威力",
        "消耗：①③／FP■　對象：敵人　編隊：前衛時可使用　威力：15＋戰技威力"
      ),
    },
    // 大剣／特大剣｜ランダム戦技決定表（1D）のうち出目1。
    art_lunge: {
      name: C("踏み込み", "踏入"),
      kind: "Action",
      body: C(
        "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：55＋戦技威力",
        "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：55＋戰技威力"
      ),
    },
    art_white_daylight_pull_wave: {
      name: C("白日の引力波", "白日引力波"),
      kind: "Action",
      body: C(
        "コスト：①②／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：20",
        "消耗：①②／FP■　對象：敵人　編隊：前衛時可使用　威力：20"
      ),
    },
    art_ruin_spirit_flame: {
      name: C("滅びの霊炎", "滅亡靈炎"),
      kind: "Action",
      body: C(
        "コスト：FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能　威力：15",
        "消耗：FP■　對象：自身　編隊：前衛・後衛皆可使用　威力：15"
      ),
    },
    art_plunder_flame: {
      name: C("略奪の炎", "掠奪之炎"),
      kind: "Action",
      body: C(
        "コスト：ゾロ／FP■■■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：35",
        "消耗：豹子／FP■■■　對象：敵人・雜兵　編隊：前衛時可使用　威力：35"
      ),
    },
    art_golden_order_hoist: {
      name: C("黄金律掲揚", "黃金律掲揚"),
      kind: "Action",
      body: C(
        "コスト：①①（2個）／FP■■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：10",
        "消耗：①①（2個）／FP■■　對象：敵人・雜兵　編隊：前衛時可使用　威力：10"
      ),
    },
    art_moonlight_blade: {
      name: C("月光剣", "月光劍"),
      kind: "Action",
      body: C(
        "コスト：ゾロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：10",
        "消耗：豹子（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：10"
      ),
    },
    art_golden_wave: {
      name: C("黄金波", "黃金波"),
      kind: "Action",
      body: C(
        "コスト：①①①／FP■■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：35",
        "消耗：①①①／FP■■　對象：敵人・雜兵　編隊：前衛時可使用　威力：35"
      ),
    },
    // 刺剣｜ランダム戦技決定表：※ランダム戦技の武器はここから該当する戦技を検索して割り当てる。
    art_glintstone_pebble: {
      name: C("輝石のつぶて", "輝石礫"),
      kind: "Action",
      body: C(
        "コスト：①②／FP■　対象：エネミー　隊列：後衛どちらでも使用可能　威力：15",
        "消耗：①②／FP■　對象：敵人　編隊：後衛皆可使用　威力：15"
      ),
    },
    art_blood_toll: {
      name: C("血の徴収", "血之徵收"),
      kind: "Action",
      body: C(
        "コスト：①②／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：50",
        "消耗：①②／FP■　對象：敵人　編隊：前衛時可使用　威力：50"
      ),
    },
    art_holy_blade: {
      name: C("聖なる刃", "聖之刃"),
      kind: "Action",
      body: C(
        "コスト：①③／HP■　対象：エネミー　隊列：前衛のとき使用可能　威力：50",
        "消耗：①③／HP■　對象：敵人　編隊：前衛時可使用　威力：50"
      ),
    },
    // 重刺剣｜ランダム戦技決定表（1D）出目1。
    art_piercing_thrust: {
      name: C("貫通突き", "貫穿突刺"),
      kind: "Action",
      body: C(
        "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：35",
        "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：35"
      ),
    },
    art_zamiel_ice_storm: {
      name: C("ザミエルの氷嵐", "扎米爾的冰嵐"),
      kind: "Action",
      body: C(
        "コスト：②②／FP■■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：30",
        "消耗：②②／FP■■　對象：敵人・雜兵　編隊：前衛時可使用　威力：30"
      ),
    },
    art_death_flare: {
      name: C("死のフレア", "死亡閃焰"),
      kind: "Action",
      body: UNCONFIRMED,
    },
    // 刀｜ランダム戦技決定表（1D）出目1〜3。
    art_iai: {
      name: C("居合", "居合"),
      kind: "Action",
      body: C(
        "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：40",
        "消耗：ソロ（2個）／FP■　對象：敵人　編隊：前衛時可使用　威力：40"
      ),
    },
    art_seppuku: {
      name: C("切腹", "切腹"),
      kind: "Action",
      body: C("コスト：HP■　対象：自身　威力：50", "消耗：HP■　對象：自身　威力：50"),
    },
    art_fang_thrust: {
      name: C("牙突き", "牙突"),
      kind: "Action",
      body: C(
        "コスト：連番／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：40",
        "消耗：連號／FP■　對象：敵人　編隊：後衛時可使用　威力：40"
      ),
    },
    // 両刃剣ページの標準戦技（装備品スキル欄の「戦技｜血刃乱舞」との対応は未確認）。
    art_black_flame_vortex: {
      name: C("黒炎の渦", "黑炎之渦"),
      kind: "Action",
      body: C("コスト：④／HP■　対象：エネミー　隊列：前衛のとき使用可能", "消耗：④／HP■　對象：敵人　編隊：前衛時可使用"),
    },
    art_blood_slash_twinblade: {
      name: C("血の斬撃", "血之斬擊"),
      kind: "Action",
      body: C(
        "コスト：①③／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：25",
        "消耗：①③／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：25"
      ),
    },
    art_ice_lance: {
      name: C("氷槍", "冰槍"),
      kind: "Action",
      body: C(
        "コスト：①②／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：40",
        "消耗：①②／FP■　對象：敵人　編隊：後衛時可使用　威力：40"
      ),
    },
    // 両刃剣｜ランダム戦技決定表（1D）出目1〜3。
    art_sword_dance: {
      name: C("剣舞", "劍舞"),
      kind: "Action",
      body: C(
        "コスト：①②／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：60",
        "消耗：①②／FP■　對象：敵人　編隊：前衛時可使用　威力：60"
      ),
    },
    art_spin_slash: {
      name: C("回転斬り", "迴轉斬"),
      kind: "Action",
      body: C(
        "コスト：連番（2個）／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：40",
        "消耗：連號（2個）／FP■　對象：敵人　編隊：前衛時可使用　威力：40"
      ),
    },
    art_phantom_pair_strike: {
      name: C("共撃の幻", "共擊之幻"),
      kind: "Action",
      body: C(
        "コスト：①⑤／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：55",
        "消耗：①⑤／FP■　對象：敵人　編隊：後衛時可使用　威力：55"
      ),
    },
    // 槌／斧｜ランダム戦技決定表（1D）出目1〜6。
    art_war_cry: {
      name: C("ウォークライ", "戰吼"),
      kind: "Action",
      body: C("コスト：FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能", "消耗：FP■　對象：自身　編隊：前衛・後衛皆可使用"),
    },
    art_endure: {
      name: C("我慢", "忍耐"),
      kind: "Defense",
      body: C(
        "コスト：FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能　効果：「ガード」の代わりに使用可能。",
        "消耗：FP■　對象：自身　編隊：前衛・後衛皆可使用　效果：可代替「防禦」使用。"
      ),
    },
    art_hoarah_loux_shake: {
      name: C("ホーラ・ルーの揺らし", "霍拉羅之搖撼"),
      kind: "Action",
      body: C(
        "コスト：①①／HP■・モブ　隊列：前衛のとき使用可能　威力：45",
        "消耗：①①／HP■・雜兵　編隊：前衛時可使用　威力：45"
      ),
    },
    art_rampage: {
      name: C("乱撃", "亂擊"),
      kind: "Action",
      body: C(
        "コスト：①③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：65",
        "消耗：①③／FP■　對象：敵人　編隊：前衛時可使用　威力：65"
      ),
    },
    art_holy_law: {
      name: C("聖律", "聖律"),
      kind: "Action",
      body: C("コスト：FP■　対象：自身", "消耗：FP■　對象：自身"),
    },
    art_prayer_strike: {
      name: C("祈りの一撃", "祈禱之一擊"),
      kind: "Action",
      body: C(
        "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：60　効果：自身に「HP回復：□」を追加する。",
        "消耗：ソロ（2個）／FP■　對象：敵人　編隊：前衛時可使用　威力：60　效果：對自身追加「HP回復：□」。"
      ),
    },
    art_roses_call: {
      name: C("ローゼスの呼び声", "羅葉的呼喚"),
      kind: "Action",
      body: C(
        "コスト：②②／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：35",
        "消耗：②②／FP■　對象：敵人　編隊：前衛時可使用　威力：35"
      ),
    },
    art_piercing_spear: {
      name: C("刺さる槍", "刺入之槍"),
      kind: "Action",
      body: C(
        "コスト：①②／FP■・モブ　対象：エネミー・モブ　隊列：後衛のとき使用可能　威力：35",
        "消耗：①②／FP■・雜兵　對象：敵人・雜兵　編隊：後衛時可使用　威力：35"
      ),
    },
    art_slumber_spear: {
      name: C("侶眠の槍", "伴眠之槍"),
      kind: "Action",
      body: C(
        "コスト：①①（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：30",
        "消耗：①①（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：30"
      ),
    },
    art_ancient_spear: {
      name: C("古噴の槍", "古噴之槍"),
      kind: "Action",
      body: C(
        "コスト：ソロ／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：50",
        "消耗：ソロ／FP■　對象：敵人　編隊：後衛時可使用　威力：50"
      ),
    },
    art_blood_draw_spear: {
      name: C("血汲の槍", "汲血之槍"),
      kind: "Action",
      body: C(
        "コスト：連番／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：0",
        "消耗：連號／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：0"
      ),
    },
    // 斧槍｜ランダム戦技決定表（1D）出目1〜2。
    art_charge: {
      name: C("突撃", "突擊"),
      kind: "Action",
      body: C(
        "コスト：連番（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：30",
        "消耗：連號（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：30"
      ),
    },
    art_spin_strike: {
      name: C("回転撃", "迴轉擊"),
      kind: "Action",
      body: C(
        "コスト：②③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：40",
        "消耗：②③／FP■　對象：敵人　編隊：前衛時可使用　威力：40"
      ),
    },
    // 鎌｜ランダム戦技決定表（1D）出目1〜2。
    art_miquella_halo: {
      name: C("ミケラの光輪", "米凱拉的光輪"),
      kind: "Action",
      body: C(
        "コスト：③／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：25",
        "消耗：③／FP■　對象：敵人　編隊：後衛時可使用　威力：25"
      ),
    },
    art_angel_wing: {
      name: C("天使の翼", "天使之翼"),
      kind: "Action",
      body: C(
        "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：65",
        "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：65"
      ),
    },
    art_loretta_slash: {
      name: C("ローレッタの斬撃", "羅蕾塔的斬擊"),
      kind: "Action",
      body: C(
        "コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：65",
        "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：65"
      ),
    },
    art_cold_mist: {
      name: C("冷気の霧", "冷氣之霧"),
      kind: "Action",
      body: C(
        "コスト：①③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：25",
        "消耗：①③／FP■　對象：敵人　編隊：前衛時可使用　威力：25"
      ),
    },
    art_poison_mist: {
      name: C("毒の霧", "毒之霧"),
      kind: "Action",
      body: C(
        "コスト：①③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：35",
        "消耗：①③／FP■　對象：敵人　編隊：前衛時可使用　威力：35"
      ),
    },
    // 鞭｜ランダム戦技決定表（1D）出目1〜5。
    art_holy_law_share: {
      name: C("聖律共有", "共享聖律"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：自身とPC1人　隊列：前衛・後衛どちらでも使用可能", "消耗：①／FP■　對象：自身與1名PC　編隊：前衛・後衛皆可使用"),
    },
    art_hound_step: {
      name: C("猟犬のステップ", "獵犬的步伐"),
      kind: "Action",
      body: C("コスト：連番（2〜3個）／FP■　対象：自身", "消耗：連號（2〜3個）／FP■　對象：自身"),
    },
    art_red_lion_flame: {
      name: C("赤獅子の炎", "赤獅之炎"),
      kind: "Action",
      body: C(
        "コスト：①①／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：30",
        "消耗：①①／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：30"
      ),
    },
    art_frost_slumber: {
      name: C("凍み", "凍眠"),
      kind: "Action",
      body: C(
        "コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：15",
        "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：15"
      ),
    },
    // 拳｜ランダム戦技決定表（1D）出目1〜5。
    art_kick: {
      name: C("キック", "踢擊"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：前衛のとき使用可能", "消耗：①／FP■　對象：敵人　編隊：前衛時可使用"),
    },
    art_hip_drop: {
      name: C("ヒップドロップ", "臀擊"),
      kind: "Action",
      body: C(
        "コスト：①①①／FP■・モブ　対象：エネミー　隊列：前衛のとき使用可能　威力：40",
        "消耗：①①①／FP■・雜兵　對象：敵人　編隊：前衛時可使用　威力：40"
      ),
    },
    art_savage_roar: {
      name: C("野蛮な咆哮", "野蠻的咆哮"),
      kind: "Action",
      body: C("コスト：FP■　対象：自身", "消耗：FP■　對象：自身"),
    },
    art_thunder_strike: {
      name: C("雷の一撃", "雷之一擊"),
      kind: "Action",
      body: C(
        "コスト：連番／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：35",
        "消耗：連號／FP■　對象：敵人　編隊：前衛時可使用　威力：35"
      ),
    },
    // 弓｜ランダム戦技決定表（1D）出目1〜3。
    art_strong_shot: {
      name: C("強射", "強射"),
      kind: "Action",
      body: C(
        "コスト：連番（2個）／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：60",
        "消耗：連號（2個）／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：60"
      ),
    },
    // 弓と大弓で共通の戦技（名称・威力・対象・隊列が一致するため同一のものとして登録）。
    art_piercing_shot: {
      name: C("貫通射撃", "貫穿射擊"),
      kind: "Action",
      body: C(
        "コスト：連番（2個）／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：30",
        "消耗：連號（2個）／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：30"
      ),
    },
    art_continuous_shot: {
      name: C("連続射撃", "連續射擊"),
      kind: "Action",
      body: C(
        "コスト：FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能　効果：対象のこの装備品での2Hitアタックを「ダイスコスト：②②」に変更する。",
        "消耗：FP■　對象：自身　編隊：前衛・後衛皆可使用　效果：將此裝備的2Hit攻擊變更為「骰子消耗：②②」。"
      ),
    },

    // ▼杖｜魔術（185〜190頁）。戦技とは別の呪文体系。写真の情報密度が非常に高く、
    // 「効果」節の詳細まで確信を持てないものはコスト／対象／隊列／威力のみ収録している。
    spell_glintstone_pebble: {
      name: C("輝石のつぶて", "輝石礫"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：15", "消耗：①／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：15"),
    },
    spell_arc_of_sin: {
      name: C("罪のアーク", "罪之弧"),
      kind: "Action",
      body: C("コスト：②／FP■・モブ　対象：エネミー・モブ　隊列：前衛・後衛どちらでも使用可能　威力：35", "消耗：②／FP■・雜兵　對象：敵人・雜兵　編隊：前衛・後衛皆可使用　威力：35"),
    },
    spell_rock_sling: {
      name: C("岩盤砕き", "岩盤破碎"),
      kind: "Action",
      body: C("コスト：②（2個）／HP■　対象：エネミー　隊列：前衛のとき使用可能　威力：50", "消耗：②（2個）／HP■　對象：敵人　編隊：前衛時可使用　威力：50"),
    },
    spell_carian_slicer: {
      name: C("カーリアの速剣", "卡利亞的速劍"),
      kind: "Action",
      body: C(
        "コスト：ソロ（2個）／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：40",
        "消耗：ソロ（2個）／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：40"
      ),
    },
    spell_glintblade: {
      name: C("輝剣", "輝劍"),
      kind: "Action",
      body: C("コスト：③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：25", "消耗：③／FP■　對象：敵人　編隊：前衛時可使用　威力：25"),
    },
    spell_night_comet: {
      name: C("夜の彗星（不可視）", "夜之彗星（不可視）"),
      kind: "Action",
      body: C("コスト：④／FP■■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：45", "消耗：④／FP■■　對象：敵人　編隊：前衛・後衛皆可使用　威力：45"),
    },
    spell_lava_bolt: {
      name: C("溶岩弾", "熔岩彈"),
      kind: "Action",
      body: C("コスト：②／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：30", "消耗：②／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：30"),
    },
    spell_shattering_thorns: {
      name: C("砕け散る茨（結晶人）", "碎裂荊棘（結晶人）"),
      kind: "Action",
      body: C("コスト：②（2個）／FP■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：40", "消耗：②（2個）／FP■　對象：敵人・雜兵　編隊：前衛時可使用　威力：40"),
    },
    spell_thorns_of_punishment: {
      name: C("罰の茨", "罰之荊棘"),
      kind: "Action",
      body: C("コスト：②②／HP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：10", "消耗：②②／HP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：10"),
    },
    spell_azur_comet: {
      name: C("彗星アズール", "彗星阿祖爾"),
      kind: "Action",
      body: C("コスト：連番（4個）／FP■■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：130", "消耗：連號（4個）／FP■■　對象：敵人　編隊：前衛・後衛皆可使用　威力：130"),
    },
    spell_ruinous_meteor: {
      name: C("滅びの流星", "滅亡的流星"),
      kind: "Action",
      body: C("コスト：③③／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：55", "消耗：③③／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：55"),
    },
    spell_crystal_person: {
      name: C("結晶人", "結晶人"),
      kind: "Action",
      body: C("コスト：連番／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：10", "消耗：連號／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：10"),
    },
    spell_thops_barrage: {
      name: C("トーフスの大弓", "托普斯的大弓"),
      kind: "Action",
      body: C("コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：60", "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：60"),
    },
    spell_lorettas_mastery: {
      name: C("ローレッツの絶技", "羅蕾塔的絕技"),
      kind: "Action",
      body: C("コスト：ソロ（3個）／FP■■　対象：エネミー　隊列：後衛のとき使用可能　威力：105", "消耗：ソロ（3個）／FP■■　對象：敵人　編隊：後衛時可使用　威力：105"),
    },
    spell_rennalas_dark_moon: {
      name: C("ラニの暗月", "拉妮的暗月"),
      kind: "Defense",
      body: C("コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：35", "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：35"),
    },
    spell_carian_retaliation: {
      name: C("カーリアの返報", "卡利亞的回報"),
      kind: "Defense",
      body: C(
        "コスト：ソロ（2個）／FP■　対象：自身　効果：「ガード」の代わりに使用可能。1回分を完全に無効化し、追加効果も無効化する。",
        "消耗：ソロ（2個）／FP■　對象：自身　效果：可代替「防禦」使用。完全無效化該次傷害，追加效果也一併無效化。"
      ),
    },
    spell_crystal_barrage: {
      name: C("結晶連弾", "結晶連彈"),
      kind: "Action",
      body: C("コスト：連番／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：45", "消耗：連號／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：45"),
    },
    spell_carian_phalanx: {
      name: C("カーリアの円陣", "卡利亞的圓陣"),
      kind: "Action",
      body: C("コスト：①／自身　隊列：前衛・後衛どちらでも使用可能", "消耗：①／自身　編隊：前衛・後衛皆可使用"),
    },
    spell_shattering_crystal: {
      name: C("砕け散る結晶", "碎裂結晶"),
      kind: "Action",
      body: C("コスト：連番（2〜3個）／エネミー・モブ　隊列：前衛のとき使用可能　威力：25", "消耗：連號（2〜3個）／敵人・雜兵　編隊：前衛時可使用　威力：25"),
    },
    spell_crystal_release: {
      name: C("結晶の解放", "結晶的解放"),
      kind: "Action",
      body: C("コスト：③（3個）／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：45", "消耗：③（3個）／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：45"),
    },
    spell_briars_of_sin: {
      name: C("罪の茨", "罪之荊棘"),
      kind: "Action",
      body: C("コスト：②／HP■　対象：エネミー　隊列：前衛のとき使用可能　威力：20", "消耗：②／HP■　對象：敵人　編隊：前衛時可使用　威力：20"),
    },
    spell_scattershot_crystal: {
      name: C("巻壁砕破", "捲壁碎破"),
      kind: "Action",
      body: C("コスト：②③／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：35", "消耗：②③／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：35"),
    },
    spell_night_shard: {
      name: C("夜のつぶて", "夜之礫"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：25", "消耗：①／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：25"),
    },
    spell_carian_greatsword: {
      name: C("カーリアの大剣", "卡利亞的大劍"),
      kind: "Action",
      body: C("コスト：③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：45", "消耗：③／FP■　對象：敵人　編隊：前衛時可使用　威力：45"),
    },
    spell_glintblade_phalanx: {
      name: C("輝剣の円陣", "輝劍的圓陣"),
      kind: "Action",
      body: C("コスト：③／自身　隊列：前衛・後衛どちらでも使用可能", "消耗：③／自身　編隊：前衛・後衛皆可使用"),
    },
    spell_adulas_moonblade: {
      name: C("アデューラの月の剣", "阿德拉的月劍"),
      kind: "Action",
      body: C("コスト：②（2個）／FP■　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：15", "消耗：②（2個）／FP■　對象：敵人・雜兵　編隊：前衛時可使用　威力：15"),
    },
    spell_night_maiden_mist: {
      name: C("夜巫女の霧", "夜巫女之霧"),
      kind: "Action",
      body: C("コスト：①③／FP■　対象：エネミー　隊列：前衛のとき使用可能", "消耗：①③／FP■　對象：敵人　編隊：前衛時可使用"),
    },
    spell_eternal_darkness: {
      name: C("永遠の暗黒", "永遠的黑暗"),
      kind: "Defense",
      body: C("コスト：FP■　対象：自身", "消耗：FP■　對象：自身"),
    },
    spell_lichdragons_lament: {
      name: C("ライカードの怨嗟", "萊卡德的怨嗟"),
      kind: "Action",
      body: C("コスト：ソロ（2個）／エネミー・モブ　隊列：後衛のとき使用可能　威力：30", "消耗：ソロ（2個）／敵人・雜兵　編隊：後衛時可使用　威力：30"),
    },
    spell_oracle_big_bubble: {
      name: C("神託の大シャボン", "神諭的大泡泡"),
      kind: "Action",
      body: C("コスト：連番（2個）／FP■　対象：エネミー・モブ　威力：35", "消耗：連號（2個）／FP■　對象：敵人・雜兵　威力：35"),
    },
    spell_oracle_bubble: {
      name: C("神託のシャボン", "神諭的泡泡"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：50", "消耗：①／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：50"),
    },
    spell_boiling_magma: {
      name: C("たぎる溶岩", "沸騰的熔岩"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：35", "消耗：①／FP■　對象：敵人　編隊：前衛時可使用　威力：35"),
    },
    spell_gelmirs_wrath: {
      name: C("ゲルミアの怒り", "格爾米爾之怒"),
      kind: "Action",
      body: C("コスト：①①／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：35", "消耗：①①／FP■　對象：敵人　編隊：前衛時可使用　威力：35"),
    },
    spell_gravity_bolt: {
      name: C("重力弾", "重力彈"),
      kind: "Action",
      body: C("コスト：③③／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：50", "消耗：③③／FP■　對象：敵人　編隊：前衛時可使用　威力：50"),
    },
    spell_star_shower: {
      name: C("星殺ぎ", "星殺"),
      kind: "Action",
      body: C("コスト：②（2個）／FP■　対象：エネミー　隊列：後衛どちらでも使用可能　威力：50", "消耗：②（2個）／FP■　對象：敵人　編隊：後衛皆可使用　威力：50"),
    },
    spell_rock_blast: {
      name: C("岩石弾", "岩石彈"),
      kind: "Action",
      body: C("対象：エネミー　隊列：後衛のとき使用可能　威力：20", "對象：敵人　編隊：後衛時可使用　威力：20"),
    },
    spell_meteorite: {
      name: C("メテオライト", "隕石"),
      kind: "Action",
      body: C("コスト：③／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：30", "消耗：③／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：30"),
    },
    spell_astel_meteor: {
      name: C("アステール・メテオ", "亞絲緹爾隕石"),
      kind: "Action",
      body: C("コスト：連番（4個）／FP■■　対象：エネミー　隊列：前衛のとき使用可能　威力：45", "消耗：連號（4個）／FP■■　對象：敵人　編隊：前衛時可使用　威力：45"),
    },
    spell_tibias_call: {
      name: C("ティビアの呼び声", "提比亞的呼喚"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能　威力：30", "消耗：①／FP■　對象：敵人　編隊：前衛・後衛皆可使用　威力：30"),
    },
    spell_freezing_weapon: {
      name: C("氷結の武器", "冰結的武器"),
      kind: "Action",
      body: C("コスト：FP■　対象：自身　隊列：前衛・後衛どちらでも使用可能", "消耗：FP■　對象：自身　編隊：前衛・後衛皆可使用"),
    },
    spell_zamiels_ice_storm: {
      name: C("ザミエルの氷嵐", "扎米爾的冰嵐"),
      kind: "Action",
      body: C(
        "コスト：連番（2個）／FP■・モブ　対象：エネミー・モブ　隊列：前衛のとき使用可能　威力：25",
        "消耗：連號（2個）／FP■・雜兵　對象：敵人・雜兵　編隊：前衛時可使用　威力：25"
      ),
    },
    spell_ancient_deaths_grudge: {
      name: C("古き死の怨霊", "古老死者的怨靈"),
      kind: "Action",
      body: C("コスト：③③／エネミー　隊列：前衛・後衛どちらでも使用可能　威力：60", "消耗：③③／敵人　編隊：前衛・後衛皆可使用　威力：60"),
    },
    spell_bursting_spirit_flame: {
      name: C("爆ぜる霊炎", "爆裂的靈炎"),
      kind: "Action",
      body: C("コスト：ソロ（2個）／FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：25", "消耗：ソロ（2個）／FP■　對象：敵人　編隊：後衛時可使用　威力：25"),
    },
    spell_glintstone_icecrag: {
      name: C("輝石の氷塊", "輝石冰塊"),
      kind: "Action",
      body: C("コスト：②／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：25", "消耗：②／FP■　對象：敵人　編隊：前衛時可使用　威力：25"),
    },
    spell_ice_spit: {
      name: C("氷の唾", "冰之唾"),
      kind: "Action",
      body: C("コスト：②／FP■　対象：エネミー　隊列：前衛のとき使用可能　威力：5", "消耗：②／FP■　對象：敵人　編隊：前衛時可使用　威力：5"),
    },
    spell_glintstone_quick_pebble: {
      name: C("輝石の速つぶて", "輝石速礫"),
      kind: "Action",
      body: C("コスト：①／FP■　対象：エネミー　隊列：後衛どちらでも使用可能　威力：25", "消耗：①／FP■　對象：敵人　編隊：後衛皆可使用　威力：25"),
    },
    spell_glintstone_big_pebble: {
      name: C("輝石の大つぶて", "輝石大礫"),
      kind: "Action",
      body: C("コスト：⑤／FP■　対象：エネミー　隊列：後衛どちらでも使用可能　威力：40", "消耗：⑤／FP■　對象：敵人　編隊：後衛皆可使用　威力：40"),
    },
    spell_haimas_cannonball: {
      name: C("ハイマの砲丸", "海馬的砲丸"),
      kind: "Action",
      body: C("コスト：③③／エネミー・モブ　隊列：後衛のとき使用可能　威力：40", "消耗：③③／敵人・雜兵　編隊：後衛時可使用　威力：40"),
    },
    spell_haimas_great_club: {
      name: C("ハイマの大槌", "海馬的大槌"),
      kind: "Action",
      body: C("コスト：②②／エネミー・モブ　隊列：前衛のとき使用可能　威力：35", "消耗：②②／敵人・雜兵　編隊：前衛時可使用　威力：35"),
    },
    spell_rennalas_full_moon: {
      name: C("レナラの満月", "蕾娜菈的滿月"),
      kind: "Action",
      body: C("コスト：ソロ（2個）／エネミー　隊列：後衛のとき使用可能　威力：60", "消耗：ソロ（2個）／敵人　編隊：後衛時可使用　威力：60"),
    },

    // ▼聖印｜祈祷（191〜199頁）。杖の魔術と同様、戦技とは別の呪文体系。「効果」節の詳細まで
    // 確信を持てないものはコスト／対象／隊列／威力のみ収録している。
    prayer_royal_ancient_faith: {
      name: C("王古き者信仰", "王古老者信仰"),
      kind: "Action",
      body: C("コスト：②②／エネミー　隊列：前衛・後衛どちらでも使用可能　威力：35", "消耗：②②／敵人　編隊：前衛・後衛皆可使用　威力：35"),
    },
    prayer_firebomb: {
      name: C("火投げ", "投火"),
      kind: "Action",
      body: C("コスト：③／自身　隊列：前衛・後衛どちらでも使用可能　威力：30", "消耗：③／自身　編隊：前衛・後衛皆可使用　威力：30"),
    },
    prayer_dragon_feast: {
      name: C("竜餐", "龍餐"),
      kind: "Action",
      body: C("コスト：③／エネミー・モブ　隊列：前衛のとき使用可能　威力：10", "消耗：③／敵人・雜兵　編隊：前衛時可使用　威力：10"),
    },
    prayer_beast: {
      name: C("獣", "獸"),
      kind: "Action",
      body: C("コスト：③／エネミー　隊列：前衛のとき使用可能　威力：45", "消耗：③／敵人　編隊：前衛時可使用　威力：45"),
    },
    prayer_golden_fury: {
      name: C("黄金の怒り", "黃金之怒"),
      kind: "Action",
      body: C("コスト：④／エネミー・モブ　隊列：前衛のとき使用可能　威力：5", "消耗：④／敵人・雜兵　編隊：前衛時可使用　威力：5"),
    },
    prayer_golden_order_fundamentalism_halo: {
      name: C("黄金律原理主義｜光輪", "黃金律原理主義｜光輪"),
      kind: "Action",
      body: C("コスト：④／エネミー　隊列：後衛のとき使用可能　威力：25", "消耗：④／敵人　編隊：後衛時可使用　威力：25"),
    },
    prayer_urgent_heal: {
      name: C("性急な回復", "緊急回復"),
      kind: "Action",
      body: C("コスト：③／自身", "消耗：③／自身"),
    },
    prayer_great_heal: {
      name: C("大回復", "大回復"),
      kind: "Action",
      body: C("コスト：③③／自身とPC1体", "消耗：③③／自身與1名PC"),
    },
    prayer_kings_heal: {
      name: C("王たる回復", "王者的回復"),
      kind: "Action",
      body: C("コスト：③③／自身×4", "消耗：③③／自身×4"),
    },
    prayer_golden_heal: {
      name: C("黄金の回復", "黃金的回復"),
      kind: "Action",
      body: C("コスト：③／FP■　対象：PC1体", "消耗：③／FP■　對象：1名PC"),
    },
    prayer_erdtree_blessing: {
      name: C("黄金樹の恵み", "黃金樹的恩惠"),
      kind: "Action",
      body: C("コスト：③／自身", "消耗：③／自身"),
    },
    prayer_lansseaxs_glaive: {
      name: C("ランサクスの箭刀", "蘭賽克斯的箭刀"),
      kind: "Action",
      body: C("コスト：②／FP■　隊列：後衛どちらでも使用可能　威力：15", "消耗：②／FP■　編隊：後衛皆可使用　威力：15"),
    },
    prayer_folsaxs_lightning_spear: {
      name: C("フォルサクスの雷槍", "佛薩克斯的雷槍"),
      kind: "Action",
      body: C("コスト：③（3個）／FP■　隊列：後衛のとき使用可能　威力：30", "消耗：③（3個）／FP■　編隊：後衛時可使用　威力：30"),
    },
    prayer_radagons_halo: {
      name: C("ラダゴンの光輪", "拉塔岡的光輪"),
      kind: "Action",
      body: C("コスト：FP■　対象：エネミー　隊列：前衛・後衛どちらでも使用可能", "消耗：FP■　對象：敵人　編隊：前衛・後衛皆可使用"),
    },
    prayer_lightning_strike: {
      name: C("雷撃", "雷擊"),
      kind: "Action",
      body: C("コスト：③③／エネミー　隊列：前衛・後衛どちらでも使用可能　威力：40", "消耗：③③／敵人　編隊：前衛・後衛皆可使用　威力：40"),
    },
    prayer_aimed_lightning_strike: {
      name: C("狙いすます雷撃", "瞄準的雷擊"),
      kind: "Action",
      body: C("コスト：FP■　隊列：前衛・後衛どちらでも使用可能　威力：35", "消耗：FP■　編隊：前衛・後衛皆可使用　威力：35"),
    },
    prayer_ancient_dragon_lightning_spear: {
      name: C("古竜の雷槍", "古龍的雷槍"),
      kind: "Action",
      body: C("コスト：②／エネミー　隊列：後衛のとき使用可能　威力：25", "消耗：②／敵人　編隊：後衛時可使用　威力：25"),
    },
    prayer_ice_lightning_spear: {
      name: C("氷の雷槍", "冰之雷槍"),
      kind: "Action",
      body: C("コスト：③／エネミー　隊列：前衛・後衛どちらでも使用可能　威力：15", "消耗：③／敵人　編隊：前衛・後衛皆可使用　威力：15"),
    },
    prayer_death_lightning: {
      name: C("死の雷撃", "死亡雷擊"),
      kind: "Action",
      body: C("コスト：③／エネミー　隊列：後衛どちらでも使用可能　威力：35", "消耗：③／敵人　編隊：後衛皆可使用　威力：35"),
    },
    prayer_fire_bathe: {
      name: C("火よ！", "焰啊！"),
      kind: "Action",
      body: C("コスト：③③／エネミー　威力：25", "消耗：③③／敵人　威力：25"),
    },
    prayer_giants_flame_take: {
      name: C("巨人の火をくらえ", "領受巨人之火"),
      kind: "Action",
      body: C("コスト：③③／エネミー　隊列：前衛・後衛どちらでも使用可能　威力：40", "消耗：③③／敵人　編隊：前衛・後衛皆可使用　威力：40"),
    },
    prayer_giants_flame_rain: {
      name: C("降り注げ（巨人の火）", "降下吧（巨人之火）"),
      kind: "Action",
      body: C("コスト：③／FP■・モブ　隊列：前衛・後衛どちらでも使用可能　威力：15", "消耗：③／FP■・雜兵　編隊：前衛・後衛皆可使用　威力：15"),
    },
    prayer_giants_flame_evil_god: {
      name: C("悪神の火", "邪神之火"),
      kind: "Action",
      body: C("コスト：③（2個）／FP■　隊列：後衛どちらでも使用可能　威力：20", "消耗：③（2個）／FP■　編隊：後衛皆可使用　威力：20"),
    },
    prayer_giants_flame_burn: {
      name: C("火よ焼き尽くせ", "焰啊焚盡一切"),
      kind: "Action",
      body: C("コスト：③／FP■・モブ　威力：15", "消耗：③／FP■・雜兵　威力：15"),
    },
    prayer_black_flame: {
      name: C("黒炎", "黑炎"),
      kind: "Action",
      body: C("コスト：③／エネミー・モブ　隊列：前衛どちらでも使用可能　威力：20", "消耗：③／敵人・雜兵　編隊：前衛皆可使用　威力：20"),
    },
    prayer_beastclaw_gnaw: {
      name: C("グランクの獣爪", "格蘭克的獸爪"),
      kind: "Action",
      body: C("コスト：①①／FP■・モブ　隊列：前衛のとき使用可能　威力：40", "消耗：①①／FP■・雜兵　編隊：前衛時可使用　威力：40"),
    },
    prayer_beastclaw_rock: {
      name: C("グランクの岩", "格蘭克的岩石"),
      kind: "Action",
      body: C("コスト：③／エネミー　隊列：後衛のとき使用可能　威力：15", "消耗：③／敵人　編隊：後衛時可使用　威力：15"),
    },
    prayer_flies_swarm: {
      name: C("蝿たかり", "蒼蠅群聚"),
      kind: "Action",
      body: C("コスト：③／FP■・モブ", "消耗：③／FP■・雜兵"),
    },
    prayer_bloody_claw_mark: {
      name: C("血獄の爪痕", "血獄的爪痕"),
      kind: "Action",
      body: C("コスト：③／エネミー　隊列：前衛のとき使用可能　威力：10", "消耗：③／敵人　編隊：前衛時可使用　威力：10"),
    },
    prayer_beastclaw: {
      name: C("獣爪", "獸爪"),
      kind: "Action",
      body: C("コスト：③／エネミー　威力：50", "消耗：③／敵人　威力：50"),
    },
    prayer_sky_rending_madness: {
      name: C("空裂狂火", "裂空狂火"),
      kind: "Action",
      body: C("コスト：FP■　隊列：前衛・後衛どちらでも使用可能　威力：30", "消耗：FP■　編隊：前衛・後衛皆可使用　威力：30"),
    },
    prayer_shabrirris_scream: {
      name: C("シャブリリの叫び", "夏布利利的吶喊"),
      kind: "Action",
      body: C("コスト：⑤／FP■　対象：エネミー", "消耗：⑤／FP■　對象：敵人"),
    },
    prayer_unquenchable_madness_fire: {
      name: C("燃えきれぬ狂い火", "燒不盡的狂火"),
      kind: "Action",
      body: C("コスト：連番（2個）／FP■　威力：20", "消耗：連號（2個）／FP■　威力：20"),
    },
    prayer_lava_breath: {
      name: C("溶岩ブレス", "熔岩吐息"),
      kind: "Action",
      body: C("コスト：連番（3個）／エネミー・モブ　隊列：後衛のとき使用可能　威力：65", "消耗：連號（3個）／敵人・雜兵　編隊：後衛時可使用　威力：65"),
    },
    prayer_glintstone_breath: {
      name: C("輝石ブレス", "輝石吐息"),
      kind: "Action",
      body: C("コスト：連番（3個）／エネミー・モブ　威力：65", "消耗：連號（3個）／敵人・雜兵　威力：65"),
    },
    prayer_rot_breath: {
      name: C("腐敗ブレス", "腐敗吐息"),
      kind: "Action",
      body: C("コスト：連番（3個）／エネミー・モブ　隊列：後衛のとき使用可能　威力：40", "消耗：連號（3個）／敵人・雜兵　編隊：後衛時可使用　威力：40"),
    },
    prayer_blood_offering: {
      name: C("血摂", "血攝"),
      kind: "Action",
      body: C("コスト：③／自身　隊列：前衛のとき使用可能　威力：10", "消耗：③／自身　編隊：前衛時可使用　威力：10"),
    },
    prayer_wicked_flame: {
      name: C("悪炎", "惡炎"),
      kind: "Action",
      body: C("コスト：FP■　対象：エネミー　隊列：後衛のとき使用可能　威力：50", "消耗：FP■　對象：敵人　編隊：後衛時可使用　威力：50"),
    },
    prayer_crimson_aeonia: {
      name: C("朱色エオニア", "朱紅艾歐尼亞"),
      kind: "Action",
      body: C("コスト：ソロ（3個）／エネミー・モブ　隊列：前衛のとき使用可能　威力：0", "消耗：ソロ（3個）／敵人・雜兵　編隊：前衛時可使用　威力：0"),
    },
    prayer_exkis_rot: {
      name: C("エクスキスの腐敗", "艾克斯基斯的腐敗"),
      kind: "Action",
      body: C("コスト：連番（4個）／FP■■■　隊列：後衛のとき使用可能　威力：80", "消耗：連號（4個）／FP■■■　編隊：後衛時可使用　威力：80"),
    },
    prayer_borealis_miasma: {
      name: C("ボレアリスの氷瘴", "波瑞里斯的冰瘴"),
      kind: "Action",
      body: C("コスト：連番（4個）／FP■　隊列：後衛のとき使用可能　威力：80", "消耗：連號（4個）／FP■　編隊：後衛時可使用　威力：80"),
    },
    prayer_greyolls_roar: {
      name: C("グレイオールの咆哮", "格雷歐爾的咆哮"),
      kind: "Action",
      body: C("コスト：連番（3個）／FP■■　隊列：後衛のとき使用可能　威力：70", "消耗：連號（3個）／FP■■　編隊：後衛時可使用　威力：70"),
    },
    prayer_agheels_flame: {
      name: C("アギールの炎", "阿基爾之炎"),
      kind: "Action",
      body: C("コスト：連番（4個）／FP■　威力：90", "消耗：連號（4個）／FP■　威力：90"),
    },
    prayer_theodoricks_magma: {
      name: C("テオドリックの溶岩", "提歐多力克的熔岩"),
      kind: "Action",
      body: C("コスト：連番（4個）／FP■　威力：100", "消耗：連號（4個）／FP■　威力：100"),
    },
    prayer_smaragds_glintstone: {
      name: C("スマラグの輝石", "斯瑪拉格的輝石"),
      kind: "Action",
      body: C("コスト：連番（4個）／FP■　威力：100", "消耗：連號（4個）／FP■　威力：100"),
    },
    prayer_dragonice: {
      name: C("竜氷", "龍冰"),
      kind: "Action",
      body: C("コスト：③（3個）／エネミー　隊列：前衛のとき使用可能　威力：40", "消耗：③（3個）／敵人　編隊：前衛時可使用　威力：40"),
    },
    prayer_dragonclaw: {
      name: C("竜爪", "龍爪"),
      kind: "Action",
      body: C("コスト：FP■　隊列：前衛のとき使用可能　威力：50", "消耗：FP■　編隊：前衛時可使用　威力：50"),
    },
    prayer_gods_slaying_venom: {
      name: C("毒の刃", "毒之刃"),
      kind: "Action",
      body: C("コスト：FP■　対象：自身", "消耗：FP■　對象：自身"),
    },
  };

  // roll：種類決定表（同カテゴリ・同レアリティ内で該当武器を決める出目）。写真の目分判読による暫定値のため、
  // 実物の規則書と食い違う場合は要修正。
  var WEAPONS = [
    { id: "dagger_lady", category: "dagger", name: C("レディの短剣", "淑女的短劍"), rarity: "C", roll: "1", skills: [{ kind: "art", id: "art_blood_blade" }] },
    { id: "dagger_targe", category: "dagger", name: C("タガー", "匕首"), rarity: "C", roll: "2", skills: [{ kind: "random" }] },
    { id: "dagger_parrying", category: "dagger", name: C("パリングタガー", "格擋短劍"), rarity: "C", roll: "3", skills: [{ kind: "innate", id: "dagger_parry" }] },
    { id: "dagger_large_knife", category: "dagger", name: C("大型ナイフ", "大型小刀"), rarity: "C", roll: "4", skills: [{ kind: "status", status: C("出血", "出血") }] },
    { id: "dagger_mercy", category: "dagger", name: C("慈悲の短刀", "慈悲短刀"), rarity: "C", roll: "5", skills: [{ kind: "art", id: "art_frost_step" }] },
    {
      id: "dagger_brass",
      category: "dagger",
      name: C("黄銅の短剣", "黃銅短劍"),
      rarity: "C",
      roll: "6",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_frost_step" }],
    },
    {
      id: "dagger_wakizashi",
      category: "dagger",
      name: C("脇差", "脇差"),
      rarity: "U",
      roll: "1",
      powerModOverride: C("信仰", "信仰"),
      skills: [{ kind: "innate", id: "dagger_crit_up" }, { kind: "art", id: "art_quickstep" }],
    },
    { id: "dagger_sickle", category: "dagger", name: C("祝祭の手鎌", "祭典鐮刀"), rarity: "U", roll: "2", skills: [{ kind: "random" }] },
    { id: "dagger_strange_knife", category: "dagger", name: C("奇晶ナイフ", "奇晶小刀"), rarity: "U", roll: "3", skills: [{ kind: "status", status: C("出血", "出血") }] },
    {
      id: "dagger_crystal_needle",
      category: "dagger",
      name: C("結晶の針", "結晶之針"),
      rarity: "U",
      roll: "4",
      powerModOverride: C("知力", "知力"),
      skills: [{ kind: "element", element: C("魔", "魔") }],
    },
    { id: "dagger_insect_needle", category: "dagger", name: C("蟲の針", "蟲之針"), rarity: "U", roll: "5", skills: [{ kind: "status", status: C("腐敗", "腐敗") }] },
    { id: "dagger_cinquedea", category: "dagger", name: C("チンクエディア", "闊劍匕首"), rarity: "U", roll: "6", skills: [{ kind: "art", id: "art_consecutive_thrust" }] },
    {
      id: "dagger_glintstone_kris",
      category: "dagger",
      name: C("輝石のクリス", "輝石短劍"),
      rarity: "R",
      roll: "1〜2",
      skills: [{ kind: "bonus", text: C("戦技ダメージ＋5", "戰技傷害＋5") }, { kind: "random" }],
    },
    {
      id: "dagger_reduvia",
      category: "dagger",
      name: C("レドゥビア", "雷度維亞"),
      rarity: "R",
      roll: "3〜4",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_reduvia_blood_blade" }],
    },
    {
      id: "dagger_mission_blade",
      category: "dagger",
      name: C("使命の刃", "使命之刃"),
      rarity: "R",
      roll: "5〜6",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "art", id: "art_death_blade" }],
    },
    {
      id: "dagger_black_named",
      category: "dagger",
      name: C("黒名刃", "黑名刃"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "note", text: C("この表には存在しない。R表で再抽選する。", "此稀有度不存在此武器，改於R表重新抽選。") }],
    },

    // ▼直剣（straightsword）：写真判読による暫定データ。C/U/R/Lの一部武器名・装備品スキルは要再確認（UNCONFIRMED参照）。
    { id: "straightsword_short_sword", category: "straightsword", name: C("ショートソード", "短劍"), rarity: "C", roll: "1", skills: [{ kind: "random" }] },
    { id: "straightsword_long_sword", category: "straightsword", name: C("ロングソード", "長劍"), rarity: "C", roll: "2", skills: [{ kind: "art", id: "art_stance" }] },
    { id: "straightsword_broadsword", category: "straightsword", name: C("ブロードソード", "闊劍"), rarity: "C", roll: "3", skills: [{ kind: "random" }] },
    { id: "straightsword_worn", category: "straightsword", name: C("古びた直剣", "老舊直劍"), rarity: "C", roll: "4", skills: [{ kind: "random" }] },
    {
      id: "straightsword_noble_rapier",
      category: "straightsword",
      name: C("貴人の細剣", "貴人的細劍"),
      rarity: "C",
      roll: "5",
      skills: [{ kind: "innate", id: "straightsword_no_swap_cost" }],
    },
    {
      id: "straightsword_lordsworn",
      category: "straightsword",
      name: C("君主軍の直剣", "君主軍的直劍"),
      rarity: "C",
      roll: "6",
      skills: [{ kind: "innate", id: "straightsword_2hit_bonus" }],
    },
    {
      id: "straightsword_warhawk_talon",
      category: "straightsword",
      name: C("戦鷲の爪剣", "戰鷹之爪劍"),
      rarity: "U",
      roll: "1",
      skills: [{ kind: "element", element: C("聖", "聖") }],
    },
    {
      id: "straightsword_lazuli_glintstone",
      category: "straightsword",
      name: C("ラズリの輝石剣", "琉璃輝石劍"),
      rarity: "U",
      roll: "2",
      skills: [{ kind: "element", element: C("魔", "魔") }],
    },
    {
      id: "straightsword_carian_knights",
      category: "straightsword",
      name: C("カーリアの騎士剣", "卡利亞騎士劍"),
      rarity: "U",
      roll: "3",
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "straightsword_crystallized_knights",
      category: "straightsword",
      name: C("腐敗した騎士剣", "腐敗騎士劍"),
      rarity: "U",
      roll: "4",
      skills: [{ kind: "status", status: C("腐敗", "腐敗") }],
    },
    {
      id: "straightsword_miquella_knights",
      category: "straightsword",
      name: C("ミケラの騎士剣", "米凱拉的騎士劍"),
      rarity: "U",
      roll: "5",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "straightsword_parade",
      category: "straightsword",
      name: C("儀仗の直剣", "儀仗直劍"),
      rarity: "U",
      roll: "6",
      skills: [{ kind: "innate", id: "straightsword_dual_wield" }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "straightsword_gravestone",
      category: "straightsword",
      name: C("黄金の墓標", "黃金的墓標"),
      rarity: "R",
      roll: "1〜2",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "straightsword_trina",
      category: "straightsword",
      name: C("トリーナの剣", "特里娜之劍"),
      rarity: "R",
      roll: "3〜4",
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "straightsword_eohid",
      category: "straightsword",
      name: C("エオヒドの剣舞", "艾奧希德的劍舞"),
      rarity: "R",
      roll: "5〜6",
      skills: [{ kind: "art", id: "art_eohid_sword_dance" }],
    },
    {
      id: "straightsword_secret_letters",
      category: "straightsword",
      name: C("秘文字の剣", "祕文字之劍"),
      rarity: "L",
      roll: "1〜3",
      powerModOverride: C("信仰", "信仰"),
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "art", id: "art_unyielding_blade" }],
    },
    {
      id: "straightsword_night_and_flame",
      category: "straightsword",
      name: C("夜と炎の剣", "夜與焰之劍"),
      rarity: "L",
      roll: "4〜6",
      skills: [{ kind: "element", element: C("炎", "火") }, { kind: "innate", id: "straightsword_night_and_flame" }],
    },

    // ▼大剣（greatsword）／特大剣（colossal）：写真の回転・情報密度が高く判読の確信度が低いカテゴリ。
    // 出目の決定方式自体は他カテゴリと同じ（★でレア度→そのレア度内で1Dを振って武器を決定）。
    // ただし大剣C帯はアイコンギャラリー上7種確認できており（種類決定表は6種のみ判読）、レア度内の
    // 正確な出目対応はクレイモアのみ「?」とし他は暫定で1〜6を割り当てている。装備品スキルも多くを
    // 「note」＋未確認とした。
    { id: "greatsword_pursuer", category: "greatsword", name: C("追跡者の大剣", "追跡者的大劍"), rarity: "C", roll: "1", skills: [{ kind: "art", id: "art_lunge" }] },
    { id: "greatsword_bastard_sword", category: "greatsword", name: C("バスタードソード", "混血劍"), rarity: "C", roll: "2", skills: [{ kind: "random" }] },
    { id: "greatsword_iron", category: "greatsword", name: C("鉄の大剣", "鐵之大劍"), rarity: "C", roll: "3", skills: [{ kind: "random" }] },
    { id: "greatsword_lordsworn", category: "greatsword", name: C("君主軍の大剣", "君主軍的大劍"), rarity: "C", roll: "4", skills: [{ kind: "random" }] },
    { id: "greatsword_knight", category: "greatsword", name: C("騎士大剣", "騎士大劍"), rarity: "C", roll: "5", skills: [{ kind: "random" }] },
    { id: "greatsword_exiled", category: "greatsword", name: C("失地騎士の大剣", "失地騎士的大劍"), rarity: "C", roll: "6", skills: [{ kind: "random" }] },
    { id: "greatsword_claymore", category: "greatsword", name: C("クレイモア", "克雷莫爾"), rarity: "C", roll: "?", skills: [{ kind: "random" }] },
    { id: "greatsword_flamberge", category: "greatsword", name: C("フランベルジュ", "焰形劍"), rarity: "U", roll: "1", skills: [{ kind: "random" }] },
    {
      id: "greatsword_twin_unbound",
      category: "greatsword",
      name: C("分かたれぬ双児の剣", "不可分之雙子劍"),
      rarity: "U",
      roll: "2",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greatsword_gargoyle",
      category: "greatsword",
      name: C("ガーゴイルの大剣", "石像鬼的大劍"),
      rarity: "U",
      roll: "3",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greatsword_gargoyle_black",
      category: "greatsword",
      name: C("ガーゴイルの黒剣", "石像鬼的黑劍"),
      rarity: "U",
      roll: "4",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greatsword_miyr",
      category: "greatsword",
      name: C("ミエロスの剣", "米埃洛斯之劍"),
      rarity: "U",
      roll: "5",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_white_daylight_pull_wave" }],
    },
    {
      id: "greatsword_ordovis",
      category: "greatsword",
      name: C("オルドビスの大剣", "奧多維斯的大劍"),
      rarity: "U",
      roll: "6",
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greatsword_white_king",
      category: "greatsword",
      name: C("白王の剣", "白王之劍"),
      rarity: "R",
      roll: "1",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greatsword_death_rake",
      category: "greatsword",
      name: C("死かき棒", "死之撥棒"),
      rarity: "R",
      roll: "2",
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "art", id: "art_ruin_spirit_flame" }],
    },
    {
      id: "greatsword_helphen",
      category: "greatsword",
      name: C("ヘルフェンの尖塔", "赫爾芬的尖塔"),
      rarity: "R",
      roll: "3",
      powerModOverride: C("神秘", "神秘"),
      skills: [{ kind: "status", status: C("黄金律", "黃金律") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greatsword_blasphemous",
      category: "greatsword",
      name: C("冒涜の聖剣", "冒瀆的聖劍"),
      rarity: "R",
      roll: "4",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greatsword_marais_executioner",
      category: "greatsword",
      name: C("マレー家の執行剣", "馬雷家的處刑劍"),
      rarity: "R",
      roll: "5",
      skills: [{ kind: "art", id: "art_plunder_flame" }],
    },
    {
      id: "greatsword_golden_order",
      category: "greatsword",
      name: C("黄金律の大剣", "黃金律的大劍"),
      rarity: "R",
      roll: "6",
      skills: [{ kind: "art", id: "art_golden_order_hoist" }],
    },
    {
      id: "greatsword_dark_moon",
      category: "greatsword",
      name: C("暗月の大剣", "闇月大劍"),
      rarity: "L",
      roll: "1〜3",
      skills: [{ kind: "status", status: C("黄金律", "黃金律") }, { kind: "art", id: "art_moonlight_blade" }],
    },
    {
      id: "greatsword_marika_relic",
      category: "greatsword",
      name: C("神の遺剣", "神之遺劍"),
      rarity: "L",
      roll: "4〜6",
      skills: [{ kind: "art", id: "art_golden_wave" }],
    },

    { id: "colossal_zweihander", category: "colossal", name: C("ツヴァイヘンダー", "雙手巨劍"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    { id: "colossal_greatsword", category: "colossal", name: C("グレートソード", "大劍"), rarity: "U", roll: "1〜2", skills: [{ kind: "random" }] },
    { id: "colossal_thunder_hound", category: "colossal", name: C("雷犬の大剣", "雷犬的大劍"), rarity: "U", roll: "3〜4", skills: [{ kind: "random" }] },
    {
      id: "colossal_troll_golden",
      category: "colossal",
      name: C("トロルの黄金剣", "巨魔的黃金劍"),
      rarity: "U",
      roll: "5〜6",
      skills: [{ kind: "element", element: C("炎", "火") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "colossal_troll_knight",
      category: "colossal",
      name: C("トロルの騎士剣", "巨魔的騎士劍"),
      rarity: "R",
      roll: "1〜2",
      skills: [{ kind: "element", element: C("炎", "火") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "colossal_godslayer",
      category: "colossal",
      name: C("神狩りの剣", "狩神之劍"),
      rarity: "R",
      roll: "3〜4",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "colossal_flensing",
      category: "colossal",
      name: C("剥ぎ取りの大剣", "剝取的大劍"),
      rarity: "R",
      roll: "5〜6",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "colossal_ruins",
      category: "colossal",
      name: C("遺跡の大剣", "遺跡的大劍"),
      rarity: "L",
      roll: "1〜2",
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "colossal_starcrusher",
      category: "colossal",
      name: C("星砕きの大剣", "碎星的大劍"),
      rarity: "L",
      roll: "3",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "colossal_marikes_black",
      category: "colossal",
      name: C("マリケスの黒き剣", "馬利卡斯的黑劍"),
      rarity: "L",
      roll: "4",
      skills: [{ kind: "note", text: C("この表には存在しない可能性あり（※再抽選する、と読める記載）。要再確認。", "此稀有度可能不存在此武器（原文似為「重新抽選」）。待確認。") }],
    },
    {
      id: "colossal_royal_greatsword",
      category: "colossal",
      name: C("王家のグレートソード", "王家的大劍"),
      rarity: "L",
      roll: "5〜6",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },

    // ▼刺剣（rapier）／重刺剣（heavy_rapier）
    { id: "rapier_scholar", category: "rapier", name: C("学者の剃剣", "學者的剃劍"), rarity: "C", roll: "－", skills: [{ kind: "art", id: "art_consecutive_thrust" }] },
    { id: "rapier_rapier", category: "rapier", name: C("レイピア", "西洋劍"), rarity: "U", roll: "1〜3", skills: [{ kind: "random" }] },
    { id: "rapier_estoc", category: "rapier", name: C("エストック", "刺劍"), rarity: "U", roll: "4〜6", skills: [{ kind: "random" }] },
    { id: "rapier_noble_knight", category: "rapier", name: C("貴人騎士の剣", "貴人騎士的劍"), rarity: "R", roll: "1〜2", skills: [{ kind: "random" }] },
    {
      id: "rapier_rogier",
      category: "rapier",
      name: C("ロジェールのレイピア", "羅傑爾的西洋劍"),
      rarity: "R",
      roll: "3〜4",
      skills: [{ kind: "status", status: C("腐敗", "腐敗") }, { kind: "status", status: C("凍傷", "凍傷") }],
    },
    { id: "rapier_ant_thread", category: "rapier", name: C("蟻線のレイピア", "蟻線的西洋劍"), rarity: "R", roll: "5〜6", skills: [{ kind: "random" }] },
    {
      id: "rapier_none_l",
      category: "rapier",
      name: C("（L表には該当武器なし）", "（L稀有度無對應武器）"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "note", text: C("この表には存在しない。Rの表で再抽選する。", "此稀有度不存在此武器，改於R表重新抽選。") }],
    },

    { id: "heavy_rapier_great_eva", category: "heavy_rapier", name: C("グレート・エバ", "偉大・伊娃"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    { id: "heavy_rapier_god_skin_stitcher", category: "heavy_rapier", name: C("神肌繍い", "神肌縫合"), rarity: "U", roll: "1〜6", skills: [{ kind: "random" }] },
    {
      id: "heavy_rapier_bloody_helice",
      category: "heavy_rapier",
      name: C("血のヘリケー", "血之螺旋"),
      rarity: "R",
      roll: "1〜3",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "innate", id: "heavy_rapier_dynasty_art" }],
    },
    {
      id: "heavy_rapier_dragon_king",
      category: "heavy_rapier",
      name: C("竜王の岩剣", "龍王的岩劍"),
      rarity: "R",
      roll: "4〜6",
      skills: [
        { kind: "element", element: C("雷", "雷") },
        { kind: "innate", id: "heavy_rapier_thunderclad" },
        { kind: "note", text: C("特効：竜（155頁、本文未確認）", "特效：龍（155頁，本文未確認）") },
      ],
    },
    {
      id: "heavy_rapier_none_l",
      category: "heavy_rapier",
      name: C("（L表には該当武器なし）", "（L稀有度無對應武器）"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "note", text: C("この表には存在しない。Rの表で再抽選する。", "此稀有度不存在此武器，改於R表重新抽選。") }],
    },

    // ▼曲剣（curved_sword）／大曲剣（great_curved_sword）
    { id: "curved_sword_scimitar", category: "curved_sword", name: C("シミター", "彎刀"), rarity: "C", roll: "1", skills: [{ kind: "random" }] },
    { id: "curved_sword_falchion", category: "curved_sword", name: C("ファルシオン", "彎背刀"), rarity: "C", roll: "2", skills: [{ kind: "random" }] },
    { id: "curved_sword_shotel", category: "curved_sword", name: C("ショーテル", "肖特爾"), rarity: "C", roll: "3", skills: [{ kind: "random" }] },
    { id: "curved_sword_shamshir", category: "curved_sword", name: C("シャムシール", "彎月刀"), rarity: "C", roll: "4", skills: [{ kind: "random" }] },
    { id: "curved_sword_grossmesser", category: "curved_sword", name: C("グロスメッサー", "大砍刀"), rarity: "C", roll: "5", skills: [{ kind: "random" }] },
    { id: "curved_sword_corpse_piler", category: "curved_sword", name: C("死体漁りの曲刀", "拾屍者的彎刀"), rarity: "C", roll: "6", skills: [{ kind: "random" }] },
    { id: "curved_sword_ant_sting", category: "curved_sword", name: C("蟻螫り", "蟻螫"), rarity: "U", roll: "1", skills: [{ kind: "random" }] },
    {
      id: "curved_sword_beastman",
      category: "curved_sword",
      name: C("獣人の曲刀", "獸人的彎刀"),
      rarity: "U",
      roll: "2",
      skills: [{ kind: "innate", id: "curved_sword_2hit_bonus" }],
    },
    { id: "curved_sword_serpent_god", category: "curved_sword", name: C("蛇神の曲刀", "蛇神的彎刀"), rarity: "U", roll: "3", skills: [{ kind: "random" }] },
    {
      id: "curved_sword_flowing_water",
      category: "curved_sword",
      name: C("流水の曲刀", "流水的彎刀"),
      rarity: "U",
      roll: "4",
      skills: [{ kind: "status", status: C("出血", "出血") }],
    },
    {
      id: "curved_sword_astel_fin",
      category: "curved_sword",
      name: C("アステールの海羽", "亞絲緹爾的海翼"),
      rarity: "U",
      roll: "5",
      skills: [
        { kind: "innate", id: "curved_sword_power_mod_up" },
        { kind: "innate", id: "curved_sword_heal_up" },
      ],
    },
    {
      id: "curved_sword_bloody_shotel",
      category: "curved_sword",
      name: C("血のショーテル", "血之肖特爾"),
      rarity: "U",
      roll: "6",
      skills: [{ kind: "innate", id: "curved_sword_cursed_blood_slash" }],
    },
    {
      id: "curved_sword_magma_blade",
      category: "curved_sword",
      name: C("溶岩刀", "熔岩刀"),
      rarity: "R",
      roll: "－",
      skills: [{ kind: "element", element: C("炎", "火") }, { kind: "innate", id: "curved_sword_lava_guillotine" }],
    },
    {
      id: "curved_sword_eclipse_shotel",
      category: "curved_sword",
      name: C("蝕のショーテル", "蝕之肖特爾"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "art", id: "art_death_flare" }],
    },

    { id: "great_curved_sword_zanbato", category: "great_curved_sword", name: C("斬馬刀", "斬馬刀"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    {
      id: "great_curved_sword_omen",
      category: "great_curved_sword",
      name: C("忌み子の大刀", "忌子的大刀"),
      rarity: "U",
      roll: "－",
      skills: [{ kind: "innate", id: "great_curved_sword_omen_grace" }],
    },
    {
      id: "great_curved_sword_hound_fang",
      category: "great_curved_sword",
      name: C("猟犬の長牙", "獵犬的長牙"),
      rarity: "R",
      roll: "1〜3",
      skills: [{ kind: "innate", id: "great_curved_sword_hound_volley" }],
    },
    {
      id: "great_curved_sword_black_knight",
      category: "great_curved_sword",
      name: C("黒王の大剣", "黑王的大劍"),
      rarity: "R",
      roll: "4〜6",
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "innate", id: "great_curved_sword_black_king_repel" }],
    },
    {
      id: "great_curved_sword_zamiel",
      category: "great_curved_sword",
      name: C("ザミエルの海刃", "扎米爾的海刃"),
      rarity: "L",
      roll: "1〜3",
      skills: [{ kind: "art", id: "art_zamiel_ice_storm" }],
    },
    {
      id: "great_curved_sword_morgott",
      category: "great_curved_sword",
      name: C("モーゴットの呪剣", "莫格的咒劍"),
      rarity: "L",
      roll: "4〜6",
      skills: [{ kind: "status", status: C("猛毒", "猛毒") }, { kind: "note", text: UNCONFIRMED }],
    },

    // ▼刀（katana）
    {
      id: "katana_executioner",
      category: "katana",
      name: C("執行者の刀", "執行者的刀"),
      rarity: "C",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_iai" }],
    },
    {
      id: "katana_uchigatana",
      category: "katana",
      name: C("打刀", "打刀"),
      rarity: "U",
      roll: "1",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "katana_fang",
      category: "katana",
      name: C("長牙", "長牙"),
      rarity: "U",
      roll: "2〜3",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "katana_serpent_belt",
      category: "katana",
      name: C("蛇腹の刀", "蛇腹之刀"),
      rarity: "U",
      roll: "4〜6",
      skills: [{ kind: "status", status: C("猛毒", "猛毒") }, { kind: "random" }],
    },
    {
      id: "katana_moon_veil",
      category: "katana",
      name: C("名刀月隠", "名刀月隱"),
      rarity: "R",
      roll: "1〜3",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "innate", id: "katana_moment_of_moonlight" }],
    },
    {
      id: "katana_corpse_pile",
      category: "katana",
      name: C("屍山河", "屍山河"),
      rarity: "R",
      roll: "4〜6",
      skills: [
        { kind: "innate", id: "katana_power_up5" },
        { kind: "status", status: C("出血", "出血") },
        { kind: "innate", id: "katana_countless_corpses" },
      ],
    },
    {
      id: "katana_wool",
      category: "katana",
      name: C("毛織刀", "毛織刀"),
      rarity: "L",
      roll: "1〜3",
      skills: [{ kind: "innate", id: "katana_power_up10" }, { kind: "innate", id: "katana_ice_thunder_kill" }],
    },
    {
      id: "katana_maniac_naginata",
      category: "katana",
      name: C("マニアの薙手刀", "狂熱者的薙手刀"),
      rarity: "L",
      roll: "4〜6",
      skills: [
        { kind: "innate", id: "katana_power_up5" },
        { kind: "status", status: C("出血", "出血") },
        { kind: "innate", id: "katana_unbroken_grace" },
      ],
    },

    // ▼両刃剣（twinblade）
    { id: "twinblade_twinblade", category: "twinblade", name: C("ツインブレード", "雙刃劍"), rarity: "C", roll: "1〜2", skills: [{ kind: "random" }] },
    { id: "twinblade_twin_knight_sword", category: "twinblade", name: C("ツインナイトソード", "雙子騎士劍"), rarity: "C", roll: "3〜4", skills: [{ kind: "random" }] },
    { id: "twinblade_god_skin_peeler", category: "twinblade", name: C("神肌剥ぎ", "神肌剝離"), rarity: "C", roll: "5〜6", skills: [{ kind: "random" }] },
    { id: "twinblade_gargoyle", category: "twinblade", name: C("ガーゴイルの両刃", "石像鬼的雙刃"), rarity: "U", roll: "－", skills: [{ kind: "random" }] },
    {
      id: "twinblade_gargoyle_black",
      category: "twinblade",
      name: C("ガーゴイルの黒両刃", "石像鬼的黑雙刃"),
      rarity: "R",
      roll: "1〜3",
      skills: [
        { kind: "element", element: C("聖", "聖") },
        { kind: "status", status: C("凍傷", "凍傷") },
        { kind: "note", text: C("戦技｜血刃乱舞（この頁、本文未確認）", "戰技｜血刃亂舞（本頁，本文未確認）") },
      ],
    },
    {
      id: "twinblade_eleonora",
      category: "twinblade",
      name: C("エレオノーラの双刃", "艾蕾諾拉的雙刃"),
      rarity: "R",
      roll: "4〜6",
      skills: [
        { kind: "innate", id: "twinblade_power_down5" },
        { kind: "element", element: C("炎", "火") },
        { kind: "status", status: C("出血", "出血") },
        { kind: "note", text: C("戦技｜血刃乱舞（この頁、本文未確認）", "戰技｜血刃亂舞（本頁，本文未確認）") },
      ],
    },
    {
      id: "twinblade_none_l",
      category: "twinblade",
      name: C("（L表には該当武器なし）", "（L稀有度無對應武器）"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "note", text: C("この表には存在しない。Rの表で再抽選する。", "此稀有度不存在此武器，改於R表重新抽選。") }],
    },

    // ▼槌（mace）／斧（axe）
    {
      id: "mace_funeral",
      category: "mace",
      name: C("葬儀屋の槌", "殯葬者的槌"),
      rarity: "C",
      roll: "1",
      skills: [{ kind: "art", id: "art_prayer_strike" }],
    },
    { id: "mace_club", category: "mace", name: C("クラブ", "棍棒"), rarity: "C", roll: "2", skills: [{ kind: "random" }] },
    { id: "mace_bent_stick", category: "mace", name: C("曲り棍棒", "彎曲棍棒"), rarity: "C", roll: "3", skills: [{ kind: "random" }] },
    { id: "mace_stone_club", category: "mace", name: C("石棍棒", "石棍棒"), rarity: "C", roll: "4", skills: [{ kind: "random" }] },
    { id: "mace_mace", category: "mace", name: C("メイス", "狼牙棒"), rarity: "C", roll: "5", skills: [{ kind: "random" }] },
    { id: "mace_fanged", category: "mace", name: C("牙付き棍棒", "尖牙棍棒"), rarity: "C", roll: "6", skills: [{ kind: "random" }] },
    {
      id: "mace_morning_star",
      category: "mace",
      name: C("モーニングスター", "晨星錘"),
      rarity: "U",
      roll: "1〜2",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "mace_warpick",
      category: "mace",
      name: C("ウォーピック", "戰鎬"),
      rarity: "U",
      roll: "3",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    { id: "mace_hammer", category: "mace", name: C("ハンマー", "鐵鎚"), rarity: "U", roll: "4", skills: [{ kind: "random" }] },
    { id: "mace_monk_flame", category: "mace", name: C("僧兵の炎姿槍", "僧兵的炎姿槍"), rarity: "U", roll: "5", skills: [{ kind: "random" }] },
    { id: "mace_varre", category: "mace", name: C("ヴァレーの花束", "瓦雷的花束"), rarity: "U", roll: "6", skills: [{ kind: "random" }] },
    {
      id: "mace_nox_flowing",
      category: "mace",
      name: C("ノクスの流体槍", "諾克斯的流體槍"),
      rarity: "R",
      roll: "1〜3",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "innate", id: "mace_queen_jabon" }],
    },
    {
      id: "mace_ring_finger",
      category: "mace",
      name: C("指輪指", "指環指"),
      rarity: "R",
      roll: "4〜6",
      skills: [{ kind: "innate", id: "mace_power_up5" }, { kind: "innate", id: "mace_flick" }],
    },
    {
      id: "mace_hyakuchi_staff",
      category: "mace",
      name: C("百智の王杖", "百智的王杖"),
      rarity: "L",
      roll: "1〜3",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "innate", id: "mace_hyakuchi_world" }],
    },
    {
      id: "mace_marika",
      category: "mace",
      name: C("マリカの槌", "瑪莉卡的槌"),
      rarity: "L",
      roll: "4〜6",
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "art", id: "art_roses_call" }],
    },

    { id: "axe_hand_axe", category: "axe", name: C("ハンドアクス", "手斧"), rarity: "C", roll: "1", skills: [{ kind: "random" }] },
    { id: "axe_forked", category: "axe", name: C("二又の手斧", "分岔手斧"), rarity: "C", roll: "2", skills: [{ kind: "random" }] },
    { id: "axe_battle_axe", category: "axe", name: C("バトルアクス", "戰斧"), rarity: "C", roll: "3", skills: [{ kind: "random" }] },
    { id: "axe_toothed", category: "axe", name: C("歯列の斧", "齒列之斧"), rarity: "C", roll: "4", skills: [{ kind: "random" }] },
    { id: "axe_warped", category: "axe", name: C("歪んだ斧", "扭曲之斧"), rarity: "C", roll: "5", skills: [{ kind: "random" }] },
    { id: "axe_iron", category: "axe", name: C("鉄の鉞", "鐵鉞"), rarity: "C", roll: "6", skills: [{ kind: "random" }] },
    { id: "axe_highland", category: "axe", name: C("ハイランドアクス", "高地斧"), rarity: "U", roll: "1〜3", skills: [{ kind: "random" }] },
    { id: "axe_sacrifice", category: "axe", name: C("生贄の斧", "祭品之斧"), rarity: "U", roll: "4〜6", skills: [{ kind: "random" }] },
    { id: "axe_ice_calamity", category: "axe", name: C("氷禍の斧", "冰禍之斧"), rarity: "R", roll: "－", skills: [{ kind: "random" }] },
    {
      id: "axe_roses",
      category: "axe",
      name: C("ローゼスの斧", "羅葉之斧"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },

    // ▼フレイル（flail）
    {
      id: "flail_large_club",
      category: "flail",
      name: C("ラージクラブ", "大棍棒"),
      rarity: "C",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "innate", id: "flail_chain_swing" }],
    },
    {
      id: "flail_linked_mace",
      category: "flail",
      name: C("連接棍", "連接棍"),
      rarity: "U",
      roll: "1〜3",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "flail_family_bell",
      category: "flail",
      name: C("家族の音", "家族之音"),
      rarity: "U",
      roll: "4〜6",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "flail_weeping_stars",
      category: "flail",
      name: C("涙し子の星々", "淚子的群星"),
      rarity: "R",
      roll: "－",
      skills: [
        { kind: "element", element: C("魔", "魔") },
        { kind: "innate", id: "flail_family_wail" },
        { kind: "note", text: C("特効：星の眷属（155頁、本文未確認）", "特效：星之眷屬（155頁，本文未確認）") },
      ],
    },

    // ▼大斧（greataxe）
    { id: "greataxe_greataxe", category: "greataxe", name: C("グレートアクス", "大斧"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    { id: "greataxe_omen_crush", category: "greataxe", name: C("忌み潰しの大斧", "忌子壓碎的大斧"), rarity: "U", roll: "1〜3", skills: [{ kind: "random" }] },
    { id: "greataxe_torso_cleave", category: "greataxe", name: C("断胴の大斧", "斷胴的大斧"), rarity: "U", roll: "4〜6", skills: [{ kind: "random" }] },
    { id: "greataxe_long_hilt", category: "greataxe", name: C("長柄鉈", "長柄鉈"), rarity: "U", roll: "－", skills: [{ kind: "random" }] },
    {
      id: "greataxe_gargoyle_black",
      category: "greataxe",
      name: C("ガーゴイルの黒斧", "石像鬼的黑斧"),
      rarity: "R",
      roll: "1〜3",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greataxe_gargoyle",
      category: "greataxe",
      name: C("ガーゴイルの大斧", "石像鬼的大斧"),
      rarity: "R",
      roll: "4〜6",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "greataxe_godrick",
      category: "greataxe",
      name: C("コドリックの王斧", "戈瑞克的王斧"),
      rarity: "L",
      roll: "1〜3",
      skills: [{ kind: "innate", id: "greataxe_golden_lineage_grace" }],
    },
    {
      id: "greataxe_golem",
      category: "greataxe",
      name: C("ゴーレムの斧槌", "傀儡的斧槌"),
      rarity: "L",
      roll: "4〜6",
      skills: [{ kind: "innate", id: "greataxe_two_handed_bonus" }],
    },

    // ▼槍（spear）／大槍（great_spear）
    { id: "spear_short_spear", category: "spear", name: C("ショートスピア", "短矛"), rarity: "C", roll: "1", skills: [{ kind: "random" }] },
    { id: "spear_iron", category: "spear", name: C("鉄の槍", "鐵之槍"), rarity: "C", roll: "2", skills: [{ kind: "random" }] },
    { id: "spear_spear", category: "spear", name: C("スピア", "長矛"), rarity: "C", roll: "3", skills: [{ kind: "random" }] },
    {
      id: "spear_halberd_partisan",
      category: "spear",
      name: C("ハルチザン", "戟槍"),
      rarity: "C",
      roll: "4",
      skills: [{ kind: "innate", id: "spear_backline_attack" }],
    },
    {
      id: "spear_pike",
      category: "spear",
      name: C("パイク", "長槍"),
      rarity: "C",
      roll: "5",
      skills: [{ kind: "status", status: C("出血", "出血") }],
    },
    {
      id: "spear_cross_glaive",
      category: "spear",
      name: C("十文字薙刀", "十字薙刀"),
      rarity: "C",
      roll: "6",
      skills: [{ kind: "element", element: C("魔", "魔") }],
    },
    { id: "spear_vulgar_militia", category: "spear", name: C("ボールトーチ", "火把矛"), rarity: "U", roll: "1", skills: [{ kind: "random" }] },
    { id: "spear_clay_man", category: "spear", name: C("泥人の筈", "泥人之筈"), rarity: "U", roll: "2", skills: [{ kind: "random" }] },
    {
      id: "spear_corrupted_crystal",
      category: "spear",
      name: C("腐敗した結晶槍", "腐敗的結晶槍"),
      rarity: "U",
      roll: "3",
      skills: [{ kind: "random" }],
    },
    {
      id: "spear_shining_gate",
      category: "spear",
      name: C("真門臣台", "真門臣台"),
      rarity: "U",
      roll: "4",
      skills: [{ kind: "art", id: "art_slumber_spear" }],
    },
    {
      id: "spear_noble_knight",
      category: "spear",
      name: C("貴腐騎士の槍", "貴腐騎士的槍"),
      rarity: "U",
      roll: "5",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_ancient_spear" }],
    },
    {
      id: "spear_death_ritual",
      category: "spear",
      name: C("死儀礼の槍", "死儀禮之槍"),
      rarity: "U",
      roll: "6",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "art", id: "art_piercing_spear" }],
    },
    {
      id: "spear_granskaxe_thunder",
      category: "spear",
      name: C("グランサクスの雷", "格蘭薩克斯的雷"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "element", element: C("雷", "雷") }, { kind: "art", id: "art_blood_draw_spear" }],
    },

    { id: "great_spear_lance", category: "great_spear", name: C("ランス", "騎槍"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    { id: "great_spear_tree", category: "great_spear", name: C("ツリースピア", "樹矛"), rarity: "U", roll: "1〜3", skills: [{ kind: "random" }] },
    {
      id: "great_spear_serpent_hunter",
      category: "great_spear",
      name: C("大蛇狩り", "獵大蛇者"),
      rarity: "U",
      roll: "4〜6",
      skills: [{ kind: "innate", id: "great_spear_serpent_hunt" }],
    },
    {
      id: "great_spear_ciriria",
      category: "great_spear",
      name: C("シルリアの槍", "西琉里亞的槍"),
      rarity: "R",
      roll: "1〜3",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "innate", id: "great_spear_ciriria_vortex" }],
    },
    {
      id: "great_spear_vyke",
      category: "great_spear",
      name: C("ヴァイクの戦槍", "維克的戰槍"),
      rarity: "R",
      roll: "4〜6",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "innate", id: "great_spear_mad_flame_thrust" }],
    },
    {
      id: "great_spear_mohgwyn",
      category: "great_spear",
      name: C("モーグウィンの聖槍", "莫格温的聖槍"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "art", id: "art_blood_draw_spear" }],
    },

    // ▼斧槍（halberd）：装備品スキルの多くは対応関係が未確認のため random／note で保守的に登録。
    { id: "halberd_guardian", category: "halberd", name: C("守護者のハルバード", "守護者的戟槍"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    { id: "halberd_halberd", category: "halberd", name: C("ハルバード", "戟槍"), rarity: "U", roll: "1", skills: [{ kind: "random" }] },
    { id: "halberd_exiled_knight", category: "halberd", name: C("失地騎士の斧槍", "失地騎士的斧槍"), rarity: "U", roll: "2", skills: [{ kind: "random" }] },
    { id: "halberd_lutzeern", category: "halberd", name: C("ルッツエルン", "盧策倫"), rarity: "U", roll: "3", skills: [{ kind: "random" }] },
    { id: "halberd_glaive", category: "halberd", name: C("グレイブ", "偃月刀"), rarity: "U", roll: "4", skills: [{ kind: "random" }] },
    { id: "halberd_night_shotel", category: "halberd", name: C("夜兵のショーテル", "夜兵的肖特爾"), rarity: "U", roll: "5", skills: [{ kind: "random" }] },
    { id: "halberd_jar_saw", category: "halberd", name: C("壺人のノコギリ", "壺人的鋸子"), rarity: "U", roll: "6", skills: [{ kind: "random" }] },
    { id: "halberd_night_cavalry_glaive", category: "halberd", name: C("夜騎兵のグレイブ", "夜騎兵的偃月刀"), rarity: "R", roll: "1", skills: [{ kind: "random" }] },
    {
      id: "halberd_insect",
      category: "halberd",
      name: C("蟲の斧槍", "蟲之斧槍"),
      rarity: "R",
      roll: "2",
      skills: [{ kind: "status", status: C("出血", "出血") }],
    },
    {
      id: "halberd_thunder_gap",
      category: "halberd",
      name: C("欠波の斧槍", "欠波的斧槍"),
      rarity: "R",
      roll: "3",
      skills: [{ kind: "element", element: C("雷", "雷") }],
    },
    {
      id: "halberd_gargoyle_black",
      category: "halberd",
      name: C("ガーゴイルの黒斧槍", "石像鬼的黑斧槍"),
      rarity: "R",
      roll: "4",
      skills: [{ kind: "element", element: C("聖", "聖") }],
    },
    {
      id: "halberd_gargoyle",
      category: "halberd",
      name: C("ガーゴイルの斧槍", "石像鬼的斧槍"),
      rarity: "R",
      roll: "5",
      skills: [{ kind: "element", element: C("聖", "聖") }],
    },
    {
      id: "halberd_golden_banner",
      category: "halberd",
      name: C("黄金の軍旗", "黃金軍旗"),
      rarity: "R",
      roll: "6",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "random" }],
    },
    {
      id: "halberd_dragon",
      category: "halberd",
      name: C("竜のハルバード", "龍之戟槍"),
      rarity: "L",
      roll: "1〜2",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "halberd_loretta",
      category: "halberd",
      name: C("ローレッタの斧槍", "羅蕾塔的斧槍"),
      rarity: "L",
      roll: "3〜4",
      powerModOverride: C("神秘", "神秘"),
      skills: [{ kind: "random" }],
    },
    {
      id: "halberd_veteran_banner",
      category: "halberd",
      name: C("宿将の軍旗", "宿將的軍旗"),
      rarity: "L",
      roll: "5〜6",
      skills: [
        { kind: "innate", id: "halberd_two_handed_bonus" },
        { kind: "innate", id: "halberd_under_the_banner" },
      ],
    },

    // ▼鎌（scythe）
    {
      id: "scythe_greatscythe",
      category: "scythe",
      name: C("大鎌", "大鐮"),
      rarity: "C",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "scythe_grave",
      category: "scythe",
      name: C("墓場の大鎌", "墓場的大鐮"),
      rarity: "U",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "scythe_halo_scythe",
      category: "scythe",
      name: C("光輪のサイズ", "光輪的鐮刀"),
      rarity: "R",
      roll: "－",
      skills: [
        { kind: "element", element: C("聖", "聖") },
        { kind: "status", status: C("出血", "出血") },
        { kind: "innate", id: "scythe_holy_halo" },
      ],
    },
    {
      id: "scythe_wing",
      category: "scythe",
      name: C("翼の鎌", "翼之鐮"),
      rarity: "L",
      roll: "－",
      skills: [
        { kind: "element", element: C("聖", "聖") },
        { kind: "status", status: C("出血", "出血") },
        { kind: "art", id: "art_angel_wing" },
      ],
    },

    // ▼鞭（whip）
    { id: "whip_whip", category: "whip", name: C("ウィップ", "鞭"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    {
      id: "whip_thorn",
      category: "whip",
      name: C("茨鞭", "荊棘鞭"),
      rarity: "U",
      roll: "1〜3",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "whip_urumi",
      category: "whip",
      name: C("ウルミ", "烏魯米"),
      rarity: "U",
      roll: "4〜6",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "whip_hoslow",
      category: "whip",
      name: C("ホスローの花弁", "霍斯洛的花瓣"),
      rarity: "R",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "innate", id: "whip_lava_sea" }],
    },
    {
      id: "whip_giant_redhair",
      category: "whip",
      name: C("巨人の赤髪", "巨人的赤髮"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "element", element: C("炎", "火") }, { kind: "innate", id: "whip_flame_dance" }],
    },

    // ▼拳（fist）
    {
      id: "fist_vengeful",
      category: "fist",
      name: C("復讐者の呪爪", "復仇者的咒爪"),
      rarity: "C",
      roll: "－",
      powerModOverride: C("信仰", "信仰"),
      skills: [{ kind: "innate", id: "fist_life_reaping_strike" }],
    },
    { id: "fist_katar", category: "fist", name: C("カタール", "卡塔爾"), rarity: "U", roll: "1〜4", skills: [{ kind: "random" }] },
    { id: "fist_cestus", category: "fist", name: C("セスタス", "凱斯特斯"), rarity: "U", roll: "1〜4", skills: [{ kind: "random" }] },
    { id: "fist_high_cestus", category: "fist", name: C("ハイクセスタス", "高凱斯特斯"), rarity: "U", roll: "1〜4", skills: [{ kind: "random" }] },
    { id: "fist_iron_ball", category: "fist", name: C("鉄球拳", "鐵球拳"), rarity: "U", roll: "1〜4", skills: [{ kind: "random" }] },
    {
      id: "fist_bound_bone",
      category: "fist",
      name: C("縛り付く手骨", "束縛的手骨"),
      rarity: "R",
      roll: "－",
      powerModOverride: C("信仰", "信仰"),
      skills: [{ kind: "element", element: C("魔", "魔") }, { kind: "innate", id: "fist_whirlwind_strike" }],
    },
    {
      id: "fist_secret_letters_pata",
      category: "fist",
      name: C("秘文字のパタ", "祕文字的帕塔"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "innate", id: "fist_unyielding_disaster" }],
    },

    // ▼爪（claw）
    { id: "claw_hooked", category: "claw", name: C("鉤爪", "鉤爪"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    {
      id: "claw_hound",
      category: "claw",
      name: C("猟犬の爪", "獵犬之爪"),
      rarity: "U",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },
    {
      id: "claw_viper_fang",
      category: "claw",
      name: C("毒蛇の牙", "毒蛇之牙"),
      rarity: "R",
      roll: "－",
      skills: [{ kind: "status", status: C("猛毒", "猛毒") }, { kind: "random" }],
    },
    {
      id: "claw_raptor_talon",
      category: "claw",
      name: C("猛禽の鉤爪", "猛禽之鉤爪"),
      rarity: "L",
      roll: "－",
      skills: [{ kind: "status", status: C("出血", "出血") }, { kind: "random" }],
    },

    // ▼弓（bow）
    { id: "bow_iron_eye", category: "bow", name: C("鉄の目の弓", "鐵目之弓"), rarity: "C", roll: "－", skills: [{ kind: "random" }] },
    { id: "bow_shortbow", category: "bow", name: C("ショートボウ", "短弓"), rarity: "U", roll: "1", skills: [{ kind: "random" }] },
    { id: "bow_baptismal", category: "bow", name: C("浸礼の小弓", "浸禮的小弓"), rarity: "U", roll: "2", skills: [{ kind: "random" }] },
    { id: "bow_composite", category: "bow", name: C("コンポジットボウ", "複合弓"), rarity: "U", roll: "3", skills: [{ kind: "random" }] },
    { id: "bow_longbow", category: "bow", name: C("ロングボウ", "長弓"), rarity: "U", roll: "4", skills: [{ kind: "random" }] },
    { id: "bow_redwood_short", category: "bow", name: C("赤木のショートボウ", "赤木短弓"), rarity: "U", roll: "5", skills: [{ kind: "random" }] },
    { id: "bow_half_bow", category: "bow", name: C("ハーフボウ", "半弓"), rarity: "U", roll: "6", skills: [{ kind: "random" }] },
    { id: "bow_silver", category: "bow", name: C("しろがね弓", "白銀弓"), rarity: "R", roll: "－", skills: [{ kind: "random" }] },
    {
      id: "bow_horn",
      category: "bow",
      name: C("角の弓", "角弓"),
      rarity: "L",
      roll: "1〜3",
      skills: [{ kind: "status", status: C("猛毒", "猛毒") }, { kind: "random" }],
    },
    {
      id: "bow_black",
      category: "bow",
      name: C("黒弓", "黑弓"),
      rarity: "L",
      roll: "4〜6",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "random" }],
    },

    // ▼大弓（greatbow）
    { id: "greatbow_greatbow", category: "greatbow", name: C("大弓", "大弓"), rarity: "C", roll: "－", skills: [{ kind: "art", id: "art_piercing_shot" }] },
    {
      id: "greatbow_golem",
      category: "greatbow",
      name: C("ゴーレムの大弓", "傀儡的大弓"),
      rarity: "U",
      roll: "－",
      skills: [{ kind: "art", id: "art_piercing_shot" }],
    },
    {
      id: "greatbow_erdtree",
      category: "greatbow",
      name: C("黄金樹の大弓", "黃金樹的大弓"),
      rarity: "R",
      roll: "－",
      skills: [{ kind: "element", element: C("聖", "聖") }, { kind: "art", id: "art_piercing_shot" }],
    },
    {
      id: "greatbow_lion",
      category: "greatbow",
      name: C("獅子の大弓", "獅子的大弓"),
      rarity: "L",
      roll: "－",
      skills: [
        { kind: "innate", id: "greatbow_general_grace" },
        { kind: "innate", id: "greatbow_radahn_downpour" },
      ],
    },

    // ▼クロスボウ（crossbow）
    { id: "crossbow_soldier", category: "crossbow", name: C("兵士のクロスボウ", "士兵的弩"), rarity: "C", roll: "1", skills: [{ kind: "innate", id: "crossbow_kick" }] },
    { id: "crossbow_light", category: "crossbow", name: C("ライトクロスボウ", "輕弩"), rarity: "C", roll: "2", skills: [{ kind: "innate", id: "crossbow_kick" }] },
    { id: "crossbow_heavy", category: "crossbow", name: C("ヘビークロスボウ", "重弩"), rarity: "C", roll: "3", skills: [{ kind: "innate", id: "crossbow_kick" }] },
    { id: "crossbow_arbalest", category: "crossbow", name: C("アーバレスト", "十字弩"), rarity: "C", roll: "4", skills: [{ kind: "innate", id: "crossbow_kick" }] },
    { id: "crossbow_kreps", category: "crossbow", name: C("クレプスの黒鐔", "克雷普斯的黑鐔"), rarity: "C", roll: "5", skills: [{ kind: "innate", id: "crossbow_kick" }] },
    { id: "crossbow_moon_ring", category: "crossbow", name: C("月輪の弩", "月輪之弩"), rarity: "C", roll: "6", skills: [{ kind: "innate", id: "crossbow_kick" }] },
    {
      id: "crossbow_pulley",
      category: "crossbow",
      name: C("滑車の弩", "滑車之弩"),
      rarity: "U",
      roll: "－",
      skills: [{ kind: "innate", id: "crossbow_kick" }, { kind: "note", text: C("武器威力40＋▲（他のクロスボウと異なる特殊な基礎値）", "武器威力40＋▲（與其他弩不同的特殊基礎值）") }],
    },

    // ▼バリスタ（ballista）
    { id: "ballista_handheld", category: "ballista", name: C("手持ちバリスタ", "手持式弩砲"), rarity: "U", roll: "－", skills: [{ kind: "innate", id: "crossbow_kick" }] },
    { id: "ballista_pot_cannon", category: "ballista", name: C("壺大砲", "壺大砲"), rarity: "R", roll: "－", skills: [{ kind: "innate", id: "crossbow_kick" }] },

    // ▼盾（shield）：C帯を中心とした部分収録。attachedEffect＝付随効果／reverseArt＝逆手の戦技（ガード時戦技）。
    {
      id: "small_shield_pursuer",
      category: "small_shield",
      name: C("追跡者の小盾", "追跡者的小盾"),
      rarity: "C",
      roll: "1",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_tin",
      category: "small_shield",
      name: C("鉄新の木盾", "鐵薪的木盾"),
      rarity: "C",
      roll: "2",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_pale_blue",
      category: "small_shield",
      name: C("青白の木盾", "青白的木盾"),
      rarity: "C",
      roll: "3",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_holy_curse",
      category: "small_shield",
      name: C("聖旬の木盾", "聖旬的木盾"),
      rarity: "C",
      roll: "4",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_red_white",
      category: "small_shield",
      name: C("赤白の木盾", "赤白的木盾"),
      rarity: "C",
      roll: "5",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_neck_water",
      category: "small_shield",
      name: C("首の水盾", "頸之水盾"),
      rarity: "C",
      roll: "6",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_snake",
      category: "small_shield",
      name: C("蛇人の盾", "蛇人之盾"),
      rarity: "U",
      roll: "1〜4",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_troubled_eye",
      category: "small_shield",
      name: C("悦け目の盾", "悅目之盾"),
      rarity: "U",
      roll: "5〜6",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "small_shield_incense",
      category: "small_shield",
      name: C("調香師の盾", "調香師之盾"),
      rarity: "R",
      roll: "－",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "innate", id: "small_shield_golden_retribution" }],
    },
    {
      id: "small_shield_muddy",
      category: "small_shield",
      name: C("濁りの盾", "濁之盾"),
      rarity: "L",
      roll: "－",
      attachedEffect: [{ kind: "status", status: C("猛毒", "猛毒") }],
      reverseArt: [{ kind: "innate", id: "small_shield_poison_bite" }],
    },

    {
      id: "medium_shield_heater",
      category: "medium_shield",
      name: C("ヒーターシールド", "熱盾"),
      rarity: "C",
      roll: "1",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_round",
      category: "medium_shield",
      name: C("ラウンドシールド", "圓盾"),
      rarity: "C",
      roll: "2",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_black_leather",
      category: "medium_shield",
      name: C("ブラックレザーシールド", "黑皮盾"),
      rarity: "C",
      roll: "3",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_large_leather",
      category: "medium_shield",
      name: C("ラージレザーシールド", "大皮盾"),
      rarity: "C",
      roll: "4",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_guide",
      category: "medium_shield",
      name: C("ガイドシールド", "嚮導盾"),
      rarity: "C",
      roll: "5",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_kite",
      category: "medium_shield",
      name: C("カイトシールド", "風箏盾"),
      rarity: "C",
      roll: "6",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_twin_bird_guide",
      category: "medium_shield",
      name: C("双鳥のガイドシールド", "雙鳥的嚮導盾"),
      rarity: "U",
      roll: "1〜3",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_silver_bird",
      category: "medium_shield",
      name: C("しろがねの盾", "白銀之盾"),
      rarity: "U",
      roll: "4〜6",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "medium_shield_beast_man",
      category: "medium_shield",
      name: C("獣人の盾", "獸人之盾"),
      rarity: "R",
      roll: "－",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "innate", id: "medium_shield_golden_retribution" }],
    },
    {
      id: "medium_shield_guardian",
      category: "medium_shield",
      name: C("守護のガイドシールド", "守護的嚮導盾"),
      rarity: "L",
      roll: "－",
      attachedEffect: [{ kind: "note", text: UNCONFIRMED }],
      reverseArt: [{ kind: "innate", id: "medium_shield_poison_bite" }],
    },

    {
      id: "large_shield_turtle",
      category: "large_shield",
      name: C("大亀の甲羅", "大龜的龜殼"),
      rarity: "C",
      roll: "1",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "large_shield_guardian",
      category: "large_shield",
      name: C("守護者の大盾", "守護者的大盾"),
      rarity: "C",
      roll: "2",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "large_shield_carian_knight",
      category: "large_shield",
      name: C("カーリアの騎士盾", "卡利亞的騎士盾"),
      rarity: "C",
      roll: "3",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "large_shield_iron_thorn",
      category: "large_shield",
      name: C("鉄茨の大盾", "鐵茨的大盾"),
      rarity: "C",
      roll: "4",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "large_shield_silver",
      category: "large_shield",
      name: C("白銀の盾", "白銀之盾"),
      rarity: "C",
      roll: "5",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "large_shield_twin_bird_kite",
      category: "large_shield",
      name: C("双鳥のカイトシールド", "雙鳥的風箏盾"),
      rarity: "C",
      roll: "6",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "large_shield_holy_tree",
      category: "large_shield",
      name: C("聖樹の大盾", "聖樹的大盾"),
      rarity: "U",
      roll: "1〜3",
      attachedEffect: [{ kind: "random" }],
      reverseArt: [{ kind: "random" }],
    },
    {
      id: "large_shield_golden_tree",
      category: "large_shield",
      name: C("黄金樹の大盾", "黃金樹的大盾"),
      rarity: "U",
      roll: "4〜6",
      attachedEffect: [{ kind: "element", element: C("聖", "聖") }],
      reverseArt: [{ kind: "innate", id: "large_shield_flame_belch" }],
    },
    {
      id: "large_shield_pointing_finger",
      category: "large_shield",
      name: C("指皮石の盾", "指皮石的盾"),
      rarity: "R",
      roll: "－",
      attachedEffect: [{ kind: "note", text: UNCONFIRMED }],
      reverseArt: [{ kind: "innate", id: "large_shield_flame_spit" }],
    },
    {
      id: "large_shield_single_eye",
      category: "large_shield",
      name: C("単眼の盾", "單眼之盾"),
      rarity: "L",
      roll: "－",
      attachedEffect: [{ kind: "note", text: UNCONFIRMED }],
      reverseArt: [{ kind: "innate", id: "large_shield_contagious_fury" }],
    },

    // ▼杖（staff）：装備品スキル欄は魔術（spell_*）を参照する。※ランダム魔術（A/B表）は
    // random 扱いとし、固有に紐付く魔術が判読できたものは art 参照とした。
    {
      id: "staff_hermit",
      category: "staff",
      name: C("隠者の杖", "隱者的杖"),
      rarity: "C",
      roll: "－",
      skills: [{ kind: "art", id: "spell_glintstone_pebble" }, { kind: "art", id: "spell_arc_of_sin" }, { kind: "random" }],
    },
    {
      id: "staff_stargazer",
      category: "staff",
      name: C("星見の杖", "觀星的杖"),
      rarity: "U",
      roll: "1",
      skills: [{ kind: "art", id: "spell_glintstone_quick_pebble" }, { kind: "random" }],
    },
    {
      id: "staff_glintstone",
      category: "staff",
      name: C("輝石の杖", "輝石之杖"),
      rarity: "U",
      roll: "2",
      skills: [{ kind: "art", id: "spell_glintstone_big_pebble" }, { kind: "random" }],
    },
    {
      id: "staff_academy",
      category: "staff",
      name: C("学院の輝石杖", "學院的輝石杖"),
      rarity: "U",
      roll: "3",
      skills: [{ kind: "art", id: "spell_carian_slicer" }, { kind: "random" }],
    },
    {
      id: "staff_demihuman_queen",
      category: "staff",
      name: C("亜人女王の杖", "亞人女王的杖"),
      rarity: "U",
      roll: "4",
      skills: [{ kind: "note", text: UNCONFIRMED }, { kind: "random" }],
    },
    {
      id: "staff_meteorite",
      category: "staff",
      name: C("石撮りの杖", "拾石者的杖"),
      rarity: "U",
      roll: "5",
      skills: [{ kind: "art", id: "spell_rock_sling" }, { kind: "random" }],
    },
    {
      id: "staff_carian_glintstone",
      category: "staff",
      name: C("カーリアの輝石杖", "卡利亞的輝石杖"),
      rarity: "U",
      roll: "6",
      skills: [{ kind: "art", id: "spell_carian_retaliation" }, { kind: "random" }],
    },
    {
      id: "staff_carian_glintblade",
      category: "staff",
      name: C("カーリアの輝剣杖", "卡利亞的輝劍杖"),
      rarity: "R",
      roll: "1〜2",
      skills: [{ kind: "art", id: "spell_night_comet" }, { kind: "random" }],
    },
    {
      id: "staff_loss",
      category: "staff",
      name: C("喪失の杖", "喪失之杖"),
      rarity: "R",
      roll: "3",
      skills: [{ kind: "art", id: "spell_lava_bolt" }, { kind: "random" }],
    },
    {
      id: "staff_gelmir_glintstone",
      category: "staff",
      name: C("ゲルミアの輝石杖", "格爾米爾的輝石杖"),
      rarity: "R",
      roll: "4",
      skills: [{ kind: "art", id: "spell_gelmirs_wrath" }, { kind: "random" }],
    },
    {
      id: "staff_crystal",
      category: "staff",
      name: C("結晶杖", "結晶杖"),
      rarity: "R",
      roll: "5",
      skills: [{ kind: "art", id: "spell_shattering_thorns" }, { kind: "random" }],
    },
    {
      id: "staff_sinner",
      category: "staff",
      name: C("咎人の杖", "咎人之杖"),
      rarity: "R",
      roll: "6",
      skills: [{ kind: "art", id: "spell_thorns_of_punishment" }, { kind: "random" }],
    },
    {
      id: "staff_azur_glintstone",
      category: "staff",
      name: C("アズールの輝石杖", "阿祖爾的輝石杖"),
      rarity: "L",
      roll: "1〜2",
      skills: [{ kind: "art", id: "spell_azur_comet" }],
    },
    {
      id: "staff_lusat_glintstone",
      category: "staff",
      name: C("ルーサットの輝石杖", "盧薩特的輝石杖"),
      rarity: "L",
      roll: "3",
      skills: [{ kind: "art", id: "spell_ruinous_meteor" }],
    },
    {
      id: "staff_meteor",
      category: "staff",
      name: C("隕石の杖", "隕石之杖"),
      rarity: "L",
      roll: "4",
      skills: [{ kind: "art", id: "spell_rennalas_full_moon" }],
    },
    {
      id: "staff_death_prince",
      category: "staff",
      name: C("死王子の杖", "死亡王子的杖"),
      rarity: "L",
      roll: "5",
      skills: [{ kind: "note", text: UNCONFIRMED }],
    },
    {
      id: "staff_carian_regal_scepter",
      category: "staff",
      name: C("カーリアの正笏", "卡利亞的正笏"),
      rarity: "L",
      roll: "6",
      skills: [{ kind: "random" }],
    },

    // ▼聖印（sacred_seal）：写真からアイコンギャラリーで確認できた9種を収録。
    {
      id: "seal_finger",
      category: "sacred_seal",
      name: C("指の聖印", "手指的聖印"),
      rarity: "C",
      roll: "－",
      skills: [{ kind: "random" }],
    },
    {
      id: "seal_giant",
      category: "sacred_seal",
      name: C("巨人の聖印", "巨人的聖印"),
      rarity: "U",
      roll: "1〜2",
      skills: [{ kind: "art", id: "prayer_giants_flame_burn" }, { kind: "random" }],
    },
    {
      id: "seal_thorn",
      category: "sacred_seal",
      name: C("さされ石の聖印", "刺石的聖印"),
      rarity: "U",
      roll: "3〜4",
      skills: [{ kind: "random" }],
    },
    {
      id: "seal_golden_order",
      category: "sacred_seal",
      name: C("黄金律の聖印", "黃金律的聖印"),
      rarity: "U",
      roll: "5〜6",
      skills: [{ kind: "art", id: "prayer_golden_order_fundamentalism_halo" }, { kind: "random" }],
    },
    {
      id: "seal_erdtree",
      category: "sacred_seal",
      name: C("黄金樹の聖印", "黃金樹的聖印"),
      rarity: "R",
      roll: "1〜3",
      skills: [{ kind: "art", id: "prayer_erdtree_blessing" }, { kind: "random" }],
    },
    {
      id: "seal_frenzied_flame",
      category: "sacred_seal",
      name: C("狂い火の聖印", "狂火的聖印"),
      rarity: "R",
      roll: "4〜6",
      skills: [{ kind: "art", id: "prayer_shabrirris_scream" }, { kind: "random" }],
    },
    {
      id: "seal_dragon_communion",
      category: "sacred_seal",
      name: C("竜餐の聖印", "龍餐的聖印"),
      rarity: "L",
      roll: "1〜2",
      skills: [{ kind: "art", id: "prayer_dragon_feast" }],
    },
    {
      id: "seal_claw_mark",
      category: "sacred_seal",
      name: C("爪痕の聖印", "爪痕的聖印"),
      rarity: "L",
      roll: "3〜4",
      skills: [{ kind: "art", id: "prayer_bloody_claw_mark" }],
    },
    {
      id: "seal_godslayer",
      category: "sacred_seal",
      name: C("神狩りの聖印", "狩神的聖印"),
      rarity: "L",
      roll: "5〜6",
      skills: [{ kind: "art", id: "prayer_gods_slaying_venom" }],
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

  // 登録済み戦技の全件（{id, ...skill}[]）。ランダム戦技の手動割り当て検索に使う。
  function allSkills() {
    return Object.keys(SKILLS).map(function (id) {
      var s = SKILLS[id];
      return { id: id, name: s.name, kind: s.kind, body: s.body };
    });
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
    allSkills: allSkills,
    categories: categories,
    search: search,
    localizedText: T,
    statusSkillBody: statusSkillBody,
    elementSkillBody: elementSkillBody,
  };
})();
