(function () {
  // characters.js（角色一覧ページ）と night.js（盤面ページ）の両方から
  // 使う共通のキャラクタードロワー（編集モーダル）ロジック。
  // 呼び出し側は init({ characters, save, onChange }) でこのモジュールに
  // 自分の characters 配列（参照）と永続化関数を渡す。
  var CharacterTypes = window.PriTestCharacterTypes;
  var Weapons = window.PriTestWeapons;
  var WeaponRulebook = window.PriTestWeaponRulebook;
  var Talismans = window.PriTestTalismans;
  var Consumables = window.PriTestConsumables;
  var TAG_FIELDS = ["notes", "status", "equipment", "weapons", "skills", "items", "talismans", "buildup"];
  var MAX_DICE_POOL = 20;

  // 共通武器スキル（規則書154-155頁、カテゴリを問わず武器に付与され得る汎用テンプレート）。
  // 抽選のランダム戦技枠でも、武器カード上の追加戦技欄でも、同じ候補一覧から選べるようにする。
  var COMMON_SKILL_ELEMENT_OPTIONS = [
    { ja: "炎", zh: "火" },
    { ja: "雷", zh: "雷" },
    { ja: "聖", zh: "聖" },
    { ja: "魔", zh: "魔" },
  ];
  var COMMON_SKILL_STATUS_OPTIONS = [
    { ja: "猛毒", zh: "猛毒" },
    { ja: "腐敗", zh: "腐敗" },
    { ja: "出血", zh: "出血" },
    { ja: "凍傷", zh: "凍傷" },
    { ja: "発狂", zh: "發狂" },
    { ja: "睡眠", zh: "睡眠" },
    { ja: "呪死", zh: "呪死" },
  ];
  var COMMON_SKILL_SPECIAL_TARGET_OPTIONS = [
    { ja: "死に生きる者", zh: "死而復生者" },
    { ja: "竜", zh: "龍" },
    { ja: "星の眷属", zh: "星之眷屬" },
  ];
  var COMMON_SKILL_TYPES = [
    { kind: "element", field: "element", labelKey: "weapon_common_skill_type_element", options: COMMON_SKILL_ELEMENT_OPTIONS },
    { kind: "status", field: "status", labelKey: "weapon_common_skill_type_status", options: COMMON_SKILL_STATUS_OPTIONS },
    {
      kind: "element_minus5",
      field: "element",
      labelKey: "weapon_common_skill_type_element_minus5",
      options: COMMON_SKILL_ELEMENT_OPTIONS,
    },
    {
      kind: "status_minus5",
      field: "status",
      labelKey: "weapon_common_skill_type_status_minus5",
      options: COMMON_SKILL_STATUS_OPTIONS,
    },
    { kind: "special", field: "target", labelKey: "weapon_common_skill_type_special", options: COMMON_SKILL_SPECIAL_TARGET_OPTIONS },
  ];

  function rollD6() {
    return 1 + Math.floor(Math.random() * 6);
  }

  // 骰子池（1-6の出目配列）をアイコン＋削除ボタンで描画する。
  // night.js の共有骰子池、このファイル自身のキャラクター別骰子池の両方から使う。
  function renderDicePool(listEl, pool, onRemove, addBtnEl) {
    listEl.innerHTML = "";
    pool.forEach(function (value, index) {
      var die = document.createElement("span");
      die.className = "dice-item";
      die.textContent = value;

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "dice-remove";
      remove.textContent = "×";
      remove.addEventListener("click", function () {
        onRemove(index);
      });

      die.appendChild(remove);
      listEl.appendChild(die);
    });
    if (addBtnEl) addBtnEl.disabled = pool.length >= MAX_DICE_POOL;
  }

  // 出目のみを表示する（削除ボタン無し）。レベルアップ遺物効果の擲骰結果表示に使う。
  function renderDiceDisplay(listEl, values) {
    listEl.innerHTML = "";
    values.forEach(function (v) {
      var die = document.createElement("span");
      die.className = "dice-item";
      die.textContent = v;
      listEl.appendChild(die);
    });
  }

  // --- 附帯効果（装備品から獲得する、キャラクタータイプに依存しない共通の付帯効果） ---
  // 出典:「付帯効果決定表」。全24種、6個ずつ4ブロックに分かれる。
  var ATTACHED_EFFECT_BLOCKS = [
    [
      {
        id: "attack_dmg",
        name: { zh: "攻擊傷害+", ja: "アタックダメージ+" },
        body: {
          zh: "將自身近戰武器與射擊武器所產生的攻擊傷害設為「1Hit：+5／2Hit：+10」。",
          ja: "自身の近接武器と射撃武器から発生するアタックによるダメージを「1Hit：+5／2Hit：+10」する。",
        },
      },
      {
        id: "arts_dmg",
        name: { zh: "戰技傷害+5", ja: "戦技ダメージ+5" },
        body: { zh: "將自身戰技造成的傷害「+5」。", ja: "自身の戦技から発生するダメージを「+5」する。" },
      },
      {
        id: "sorcery_dmg",
        name: { zh: "魔術傷害+5", ja: "魔術ダメージ+5" },
        body: { zh: "將自身魔術造成的傷害「+5」。", ja: "自身の魔術から発生するダメージを「+5」する。" },
      },
      {
        id: "incant_dmg",
        name: { zh: "祈禱傷害+5", ja: "祈祷ダメージ+5" },
        body: { zh: "將自身祈禱造成的傷害「+5」。", ja: "自身の祈祷から発生するダメージを「+5」する。" },
      },
      {
        id: "max_hp_up",
        name: { zh: "最大HP上升", ja: "最大HP上昇" },
        body: { zh: "將自身「最大HP：+□」。", ja: "自身を「最大HP：+□」する。" },
      },
      {
        id: "max_fp_up",
        name: { zh: "最大FP上升", ja: "最大FP上昇" },
        body: { zh: "將自身「最大FP：+□」。", ja: "自身を「最大FP：+□」する。" },
      },
    ],
    [
      {
        id: "hp_regen",
        name: { zh: "HP持續回復", ja: "HP持続回復" },
        body: {
          zh: "於戰鬥結束時與防禦階段結束時，對自身施加「HP回復□」的效果。",
          ja: "戦闘終了時とディフェンスフェイズ終了時に、自身に「HP回復□」の効果を処理する。",
        },
      },
      {
        id: "fp_regen",
        name: { zh: "FP持續回復", ja: "FP持続回復" },
        body: {
          zh: "於戰鬥結束時與防禦階段結束時，對自身施加「FP回復□」的效果。",
          ja: "戦闘終了時とディフェンスフェイズ終了時に、自身に「FP回復□」の効果を処理する。",
        },
      },
      {
        id: "guard_hp_regen",
        name: { zh: "防禦成功時HP回復", ja: "ガード成功時HP回復" },
        body: {
          zh: "「防禦」敵人的傷害成功時，先施加「HP回復□」後，再處理HP損害。",
          ja: "エネミーからのダメージを「ガード」したとき、まず「HP回復□」した後、HP損害を処理する。",
        },
      },
      {
        id: "guard_counter_up",
        name: { zh: "防禦反擊強化", ja: "ガードカウンター強化" },
        body: {
          zh: "將遺物效果「防禦反擊」造成的傷害「+15」。",
          ja: "遺物効果「ガードカウンター」から発生するダメージを「+15」する。",
        },
      },
      {
        id: "jump_atk_up",
        name: { zh: "跳躍攻擊強化", ja: "ジャンプ攻撃強化" },
        body: {
          zh: "將遺物效果「跳躍攻擊」造成的傷害「+10」。",
          ja: "遺物効果「ジャンプ攻撃」から発生するダメージを「+10」する。",
        },
      },
      {
        id: "dash_atk_up",
        name: { zh: "衝刺攻擊強化", ja: "ダッシュ攻撃強化" },
        body: {
          zh: "將遺物效果「衝刺攻擊」造成的傷害「+10」。",
          ja: "遺物効果「ダッシュ攻撃」から発生するダメージを「+10」する。",
        },
      },
    ],
    [
      {
        id: "crit_up",
        name: { zh: "致命一擊強化", ja: "致命の一撃強化" },
        body: {
          zh: "將遺物效果「致命一擊」造成傷害的上限值「+10」。",
          ja: "遺物効果「致命の一撃」から発生するダメージの上限値を「+10」する。",
        },
      },
      {
        id: "status_resist",
        name: { zh: "狀態異常耐性", ja: "状態異常耐性" },
        body: {
          zh: "習得此附帶效果時選擇1種狀態異常。自身承受所選狀態異常的蓄積值，將原本的「□×8」變更為「□×9」，變得較不容易陷入該狀態異常。",
          ja: "この付帯効果の獲得時に状態異常を1つ選ぶ。自身に適用される選んだ状態異常の蓄積値は、通常「□×8」のところ「□×9」になり、状態異常になりにくくなる。",
        },
      },
      {
        id: "element_resist",
        name: { zh: "屬性耐性", ja: "属性耐性" },
        body: {
          zh: "習得此附帶效果時選擇1種屬性。自身承受所選屬性的蓄積值上限，將原本的「□×8」變更為「□×9」，變得較不容易受到屬性損害。",
          ja: "この付帯効果の獲得時に属性を1つ選ぶ。自身に適用される選んだ属性の蓄積値の上限を、通常「□×8」のところ「□×9」にし、属性損害を受けにくくする。",
        },
      },
      {
        id: "easy_target",
        name: { zh: "容易被盯上", ja: "狙われやすい" },
        body: { zh: "將自身常時設為「敵視：+1」。", ja: "自身を常に「敵視：+1」する。" },
      },
      {
        id: "hard_target",
        name: { zh: "不易被盯上", ja: "狙われにくい" },
        body: { zh: "將自身常時設為「敵視：-1」。", ja: "自身を常に「敵視：-1」する。" },
      },
      {
        id: "phys_cut",
        name: { zh: "物理減傷+", ja: "物理カット値+" },
        body: { zh: "將自身的「物理減傷值：+10」。", ja: "自身を「物理カット値：+10」する。" },
      },
    ],
    [
      {
        id: "arts_revive_regen",
        name: { zh: "復歸時恢復技藝", ja: "復帰時アーツ回復" },
        body: {
          zh: "從瀕死狀態復歸時，回復自身技藝的使用次數1次份。",
          ja: "瀕死状態から復帰した時、自身のアーツの使用回数1回分を回復する。",
        },
      },
      {
        id: "sprint_fire",
        name: { zh: "疾跑時發生火焰", ja: "疾走で赤い落雷が発生" },
        body: {
          zh: "行動階段開始時，若自身從「後衛移動至前衛」，則對敵人造成「火：1D」。此附帶效果每個行動階段中僅發揮1次。（原文判讀不易，內容待確認）",
          ja: "アクションフェイズ開始時に自身が「後衛から前衛」に変化した場合、エネミーに「炎：1D」を与える。この付帯効果はアクションフェイズ中に1回しか発揮されない。（原文判読が難しく、内容要確認）",
        },
      },
      {
        id: "walk_lightning",
        name: { zh: "步行時發生落雷", ja: "歩きで溶岩が発生" },
        body: {
          zh: "行動階段開始時若位於前衛，則給予敵人造成「雷：1D」。此附帶效果每個行動階段中僅發揮1次。",
          ja: "アクションフェイズ開始時に前衛の場合、エネミーに「雷：1D」を与える。この付帯効果はアクションフェイズ中に1回しか発揮されない。",
        },
      },
      {
        id: "time_gem",
        name: { zh: "一定時間後產生輝石", ja: "一定時間で輝石が発生" },
        body: {
          zh: "行動階段開始時若自身「敵視：1以上」，則給予敵人造成「魔：1D」。此附帶效果每個行動階段中僅發揮1次。",
          ja: "アクションフェイズ開始時に自身が「敵視：1以上」の場合、エネミーに「魔：1D」を与える。この付帯効果はアクションフェイズ中に1回しか発揮されない。",
        },
      },
      {
        id: "two_hand_up",
        name: { zh: "雙手持握強化", ja: "両手持ち強化" },
        body: {
          zh: "僅在自身只裝備1把武器時，將攻擊造成的傷害設為「1Hit：+5／2Hit：+10」，戰技傷害設為「+5」。",
          ja: "自身が武器を1つしか装備状態にしていないとき、アタックのダメージを「1Hit：+5／2Hit：+10」し、戦技ダメージを「+5」する。",
        },
      },
      {
        id: "dual_wield_up",
        name: { zh: "雙刀持握強化", ja: "二刀持ち強化" },
        body: {
          zh: "僅在自身同時裝備2把同類別近戰武器時，將攻擊造成的傷害設為「1Hit：+5／2Hit：+10」，戰技傷害設為「+5」。",
          ja: "自身が同じカテゴリの近接武器を2つ装備状態にしているとき、アタックから発生するダメージを「1Hit：+5／2Hit：+10」し、戦技ダメージを「+5」する。",
        },
      },
    ],
  ];
  var MAX_ATTACHED_EFFECTS = 3;
  var attachedRollResult = null; // { dice: [x,y], block: 0-3, candidates: [effect] } | null
  var attachedPendingCandidate = null; // 上限到達時、置き換え対象を選ぶまで保留する新規候補

  // 1個目の骰子の出目からブロック(0-3)を決める: 1→0 / 2,3→1 / 4,5→2 / 6→3
  function attachedBlockForValue(value) {
    if (value === 1) return 0;
    if (value === 2 || value === 3) return 1;
    if (value === 4 || value === 5) return 2;
    return 3;
  }

  function attachedEffectById(id) {
    for (var b = 0; b < ATTACHED_EFFECT_BLOCKS.length; b++) {
      for (var i = 0; i < ATTACHED_EFFECT_BLOCKS[b].length; i++) {
        if (ATTACHED_EFFECT_BLOCKS[b][i].id === id) return ATTACHED_EFFECT_BLOCKS[b][i];
      }
    }
    return null;
  }

  function renderAttachedCandidateCard(container, effect, c) {
    var card = document.createElement("div");
    card.className = "relic-candidate-card";
    var title = document.createElement("div");
    title.className = "relic-candidate-name";
    title.textContent = CharacterTypes.localizedText(effect.name) + "［Passive］";
    card.appendChild(title);
    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = CharacterTypes.localizedText(effect.body);
    card.appendChild(body);
    var learnBtn = document.createElement("button");
    learnBtn.type = "button";
    learnBtn.textContent = window.I18N.t("relic_learn_button");
    learnBtn.addEventListener("click", function () {
      if (!c.learnedAttachedEffects) c.learnedAttachedEffects = [];
      if (c.learnedAttachedEffects.length >= MAX_ATTACHED_EFFECTS) {
        attachedPendingCandidate = effect;
        renderAttachedSection();
        return;
      }
      c.learnedAttachedEffects.push(effect.id);
      saveFn();
      attachedRollResult = null;
      renderAttachedSection();
    });
    card.appendChild(learnBtn);
    container.appendChild(card);
  }

  function renderAttachedCandidates() {
    var c = findCharacter(activeCharacterId);
    var container = document.getElementById("attached-candidates");
    if (!container) return;
    container.innerHTML = "";
    if (!c || !attachedRollResult) return;

    var learned = c.learnedAttachedEffects || [];
    var candidates = attachedRollResult.candidates.filter(function (e) {
      return learned.indexOf(e.id) === -1;
    });

    var label = document.createElement("p");
    label.className = "threat-ref-body";
    label.textContent = window.I18N.t("attached_choose_one_label");
    container.appendChild(label);

    if (candidates.length === 0) {
      var freeLabel = document.createElement("p");
      freeLabel.className = "threat-ref-body";
      freeLabel.textContent = window.I18N.t("relic_free_choice_label");
      container.appendChild(freeLabel);
      candidates = ATTACHED_EFFECT_BLOCKS[attachedRollResult.block].filter(function (e) {
        return learned.indexOf(e.id) === -1;
      });
      if (candidates.length === 0) {
        // 同ブロックが全て習得済みの場合は、全24種の未習得から自由に選ぶ
        candidates = [].concat.apply([], ATTACHED_EFFECT_BLOCKS).filter(function (e) {
          return learned.indexOf(e.id) === -1;
        });
      }
    }

    candidates.forEach(function (e) {
      renderAttachedCandidateCard(container, e, c);
    });
  }

  function renderAttachedLearnedList() {
    var c = findCharacter(activeCharacterId);
    var container = document.getElementById("attached-learned-list");
    if (!container) return;
    container.innerHTML = "";
    if (!c) return;

    if (attachedPendingCandidate) {
      var prompt = document.createElement("p");
      prompt.className = "threat-ref-body";
      prompt.textContent = window.I18N.t("attached_replace_prompt", {
        name: CharacterTypes.localizedText(attachedPendingCandidate.name),
      });
      container.appendChild(prompt);

      var cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = window.I18N.t("cancel_button");
      cancelBtn.addEventListener("click", function () {
        attachedPendingCandidate = null;
        renderAttachedSection();
      });
      container.appendChild(cancelBtn);
    }

    (c.learnedAttachedEffects || []).forEach(function (id) {
      var effect = attachedEffectById(id);
      if (!effect) return;
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent = CharacterTypes.localizedText(effect.name) + "［Passive］";
      details.appendChild(summary);
      var body = document.createElement("p");
      body.className = "threat-ref-body";
      body.textContent = CharacterTypes.localizedText(effect.body);
      details.appendChild(body);

      if (attachedPendingCandidate) {
        var replaceBtn = document.createElement("button");
        replaceBtn.type = "button";
        replaceBtn.textContent = window.I18N.t("attached_replace_button");
        replaceBtn.addEventListener("click", function () {
          var idx = c.learnedAttachedEffects.indexOf(id);
          if (idx !== -1) c.learnedAttachedEffects.splice(idx, 1, attachedPendingCandidate.id);
          saveFn();
          attachedPendingCandidate = null;
          attachedRollResult = null;
          renderAttachedSection();
        });
        details.appendChild(replaceBtn);
      }

      container.appendChild(details);
    });
  }

  // 「顯示全部」: 全24種の付帯効果を、ブロック位置・習得済みかどうか付きで一覧表示する（閲覧専用）。
  var attachedShowAll = false;

  function renderAttachedAllList() {
    var c = findCharacter(activeCharacterId);
    var container = document.getElementById("attached-all-list");
    var toggleBtn = document.getElementById("btn-attached-toggle-all");
    if (!container) return;
    if (toggleBtn) {
      toggleBtn.textContent = window.I18N.t(attachedShowAll ? "relic_hide_all_button" : "relic_show_all_button");
    }
    container.hidden = !attachedShowAll;
    container.innerHTML = "";
    if (!attachedShowAll || !c) return;

    var learned = c.learnedAttachedEffects || [];
    var BLOCK_LABEL = ["A", "B", "C", "D"];
    ATTACHED_EFFECT_BLOCKS.forEach(function (block, bi) {
      block.forEach(function (e, ei) {
        var isLearned = learned.indexOf(e.id) !== -1;
        var details = document.createElement("details");
        details.className = "ability-entry";
        var summary = document.createElement("summary");
        summary.textContent =
          CharacterTypes.localizedText(e.name) +
          "［Passive］　" +
          (BLOCK_LABEL[bi] || bi) +
          (ei + 1) +
          "　" +
          window.I18N.t(isLearned ? "relic_learned_tag" : "relic_unlearned_tag");
        details.appendChild(summary);
        var body = document.createElement("p");
        body.className = "threat-ref-body";
        body.textContent = CharacterTypes.localizedText(e.body);
        details.appendChild(body);
        container.appendChild(details);
      });
    });
  }

  function renderAttachedSection() {
    var c = findCharacter(activeCharacterId);
    var progressEl = document.getElementById("attached-progress-text");
    var roll2Btn = document.getElementById("btn-attached-roll-2d");
    var diceEl = document.getElementById("attached-dice-display");
    if (!progressEl) return;

    if (!c) {
      progressEl.textContent = "";
      if (roll2Btn) roll2Btn.disabled = true;
      if (diceEl) diceEl.innerHTML = "";
      document.getElementById("attached-candidates").innerHTML = "";
      document.getElementById("attached-learned-list").innerHTML = "";
      renderAttachedAllList();
      return;
    }

    var learned = (c.learnedAttachedEffects || []).length;
    progressEl.textContent = window.I18N.t("attached_progress_text", { learned: learned, max: MAX_ATTACHED_EFFECTS });
    if (roll2Btn) roll2Btn.disabled = false;
    if (diceEl) {
      if (attachedRollResult) renderDiceDisplay(diceEl, attachedRollResult.dice);
      else diceEl.innerHTML = "";
    }
    renderAttachedCandidates();
    renderAttachedLearnedList();
    renderAttachedAllList();
  }

  function handleAttachedRoll2D() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    attachedPendingCandidate = null;
    var x = rollD6();
    var y = rollD6();
    var block = attachedBlockForValue(x);
    var effect = ATTACHED_EFFECT_BLOCKS[block][y - 1];
    attachedRollResult = { dice: [x, y], block: block, candidates: [effect] };
    renderAttachedSection();
  }

  // --- レベルアップ遺物効果の習得（骰子2個で正選／逆選） ---
  // レベル4-15の12回分、群A(1-2)/B(3-4)/C(5-6)＋群内位置(1-6)で対象を決める。
  var RELIC_LEVEL_START = 4;
  var RELIC_LEVEL_END = 15;
  var relicRolledDice = null; // { x, y } | null

  function relicEffectKey(typeId, groupIndex, effectIndex) {
    return typeId + "-r" + groupIndex + "-" + effectIndex;
  }

  function relicThird(value) {
    if (value <= 2) return 0;
    if (value <= 4) return 1;
    return 2;
  }

  function relicMaxLearnable(level) {
    return Math.max(0, Math.min(level - (RELIC_LEVEL_START - 1), RELIC_LEVEL_END - RELIC_LEVEL_START + 1));
  }

  // groupValue で群（A/B/C）、indexValue（1-6）で群内の位置を決める。
  // 該当位置が存在しない、または既に習得済みなら null（=選択不可）を返す。
  function relicCandidateFor(type, c, groupValue, indexValue) {
    var group = type.relicEffectGroups[relicThird(groupValue)];
    var idx = indexValue - 1;
    if (!group || idx >= group.effects.length) return null;
    var key = relicEffectKey(type.id, relicThird(groupValue), idx);
    if ((c.learnedRelicEffects || []).indexOf(key) !== -1) return null;
    return { key: key, effect: group.effects[idx] };
  }

  function relicAllUnlearned(type, c) {
    var out = [];
    (type.relicEffectGroups || []).forEach(function (g, gi) {
      g.effects.forEach(function (e, ei) {
        var key = relicEffectKey(type.id, gi, ei);
        if ((c.learnedRelicEffects || []).indexOf(key) === -1) out.push({ key: key, effect: e });
      });
    });
    return out;
  }

  function relicEffectForKey(type, key) {
    var groups = type.relicEffectGroups || [];
    for (var gi = 0; gi < groups.length; gi++) {
      for (var ei = 0; ei < groups[gi].effects.length; ei++) {
        if (relicEffectKey(type.id, gi, ei) === key) return groups[gi].effects[ei];
      }
    }
    return null;
  }

  // 誤クリックで習得してしまった遺物効果を、個別に未習得の状態へ戻せるようにする一覧。
  function renderRelicLearnedList() {
    var c = findCharacter(activeCharacterId);
    var type = c && c.typeId ? CharacterTypes.get(c.typeId) : null;
    var container = document.getElementById("relic-learned-list");
    if (!container) return;
    container.innerHTML = "";
    if (!c || !type || !(c.learnedRelicEffects || []).length) return;

    var title = document.createElement("p");
    title.className = "boss-subheading";
    title.textContent = window.I18N.t("relic_learned_list_title");
    container.appendChild(title);

    c.learnedRelicEffects.forEach(function (key) {
      var effect = relicEffectForKey(type, key);
      if (!effect) return;
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent = CharacterTypes.localizedText(effect.name) + "［" + effect.kind + "］";
      details.appendChild(summary);
      var body = document.createElement("p");
      body.className = "threat-ref-body";
      body.textContent = CharacterTypes.localizedText(effect.body);
      details.appendChild(body);

      var resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "danger-btn";
      resetBtn.textContent = window.I18N.t("relic_reset_button");
      resetBtn.addEventListener("click", function () {
        if (!window.confirm(window.I18N.t("relic_reset_confirm", { name: CharacterTypes.localizedText(effect.name) }))) return;
        var idx = c.learnedRelicEffects.indexOf(key);
        if (idx !== -1) c.learnedRelicEffects.splice(idx, 1);
        saveFn();
        relicRolledDice = null;
        renderRelicSection();
        renderTypeReference(c);
      });
      details.appendChild(resetBtn);

      container.appendChild(details);
    });
  }

  function renderRelicCandidateCard(container, candidate, c) {
    var card = document.createElement("div");
    card.className = "relic-candidate-card";

    var title = document.createElement("div");
    title.className = "relic-candidate-name";
    title.textContent = CharacterTypes.localizedText(candidate.effect.name) + "［" + candidate.effect.kind + "］";
    card.appendChild(title);

    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = CharacterTypes.localizedText(candidate.effect.body);
    card.appendChild(body);

    var learnBtn = document.createElement("button");
    learnBtn.type = "button";
    learnBtn.textContent = window.I18N.t("relic_learn_button");
    learnBtn.addEventListener("click", function () {
      if (!c.learnedRelicEffects) c.learnedRelicEffects = [];
      c.learnedRelicEffects.push(candidate.key);
      saveFn();
      relicRolledDice = null;
      renderRelicSection();
      renderTypeReference(c);
    });
    card.appendChild(learnBtn);

    container.appendChild(card);
  }

  function renderRelicCandidates() {
    var c = findCharacter(activeCharacterId);
    var type = c && c.typeId ? CharacterTypes.get(c.typeId) : null;
    var candidatesEl = document.getElementById("relic-candidates");
    if (!candidatesEl) return;
    candidatesEl.innerHTML = "";
    if (!c || !type || !relicRolledDice) return;
    if ((c.learnedRelicEffects || []).length >= relicMaxLearnable(c.level)) return;

    var forward = relicCandidateFor(type, c, relicRolledDice.x, relicRolledDice.y);
    var reverse = relicCandidateFor(type, c, relicRolledDice.y, relicRolledDice.x);
    if (forward && reverse && forward.key === reverse.key) reverse = null;

    if (forward || reverse) {
      var label = document.createElement("p");
      label.className = "threat-ref-body";
      label.textContent = window.I18N.t("relic_choose_one_label");
      candidatesEl.appendChild(label);
      if (forward) renderRelicCandidateCard(candidatesEl, forward, c);
      if (reverse) renderRelicCandidateCard(candidatesEl, reverse, c);
    } else {
      var freeLabel = document.createElement("p");
      freeLabel.className = "threat-ref-body";
      freeLabel.textContent = window.I18N.t("relic_free_choice_label");
      candidatesEl.appendChild(freeLabel);
      relicAllUnlearned(type, c).forEach(function (cand) {
        renderRelicCandidateCard(candidatesEl, cand, c);
      });
    }
  }

  function renderRelicSection() {
    var c = findCharacter(activeCharacterId);
    var type = c && c.typeId ? CharacterTypes.get(c.typeId) : null;
    var progressEl = document.getElementById("relic-progress-text");
    var rollBtn = document.getElementById("btn-relic-roll");
    var diceEl = document.getElementById("relic-dice-display");
    if (!progressEl) return;

    if (!c || !type) {
      progressEl.textContent = "";
      if (rollBtn) rollBtn.disabled = true;
      if (diceEl) diceEl.innerHTML = "";
      document.getElementById("relic-candidates").innerHTML = "";
      var learnedListEl = document.getElementById("relic-learned-list");
      if (learnedListEl) learnedListEl.innerHTML = "";
      return;
    }

    var learned = (c.learnedRelicEffects || []).length;
    var maxLearnable = relicMaxLearnable(c.level);
    progressEl.textContent = window.I18N.t("relic_progress_text", { learned: learned, max: maxLearnable });
    if (rollBtn) rollBtn.disabled = learned >= maxLearnable;
    if (diceEl) {
      if (relicRolledDice) renderDiceDisplay(diceEl, [relicRolledDice.x, relicRolledDice.y]);
      else diceEl.innerHTML = "";
    }
    renderRelicCandidates();
    renderRelicLearnedList();
    renderRelicAllList();
  }

  function handleRelicRoll() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    if ((c.learnedRelicEffects || []).length >= relicMaxLearnable(c.level)) return;
    relicRolledDice = { x: rollD6(), y: rollD6() };
    renderRelicSection();
  }

  // 「顯示全部」: そのタイプの全アビリティ/スキル/アーツ/遺物効果を、
  // レベル条件・群/位置・習得済みかどうか付きで一覧表示する（閲覧専用、参照用）。
  var relicShowAll = false;

  function renderRelicAllEntry(container, entry, tagText, learnedTag) {
    var details = document.createElement("details");
    details.className = "ability-entry";
    var summary = document.createElement("summary");
    summary.textContent =
      CharacterTypes.localizedText(entry.name) +
      "［" + entry.kind + "］　" + tagText + (learnedTag ? "　" + learnedTag : "");
    details.appendChild(summary);
    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = CharacterTypes.localizedText(entry.body);
    details.appendChild(body);
    container.appendChild(details);
  }

  function renderRelicAllList() {
    var c = findCharacter(activeCharacterId);
    var type = c && c.typeId ? CharacterTypes.get(c.typeId) : null;
    var container = document.getElementById("relic-all-list");
    var toggleBtn = document.getElementById("btn-relic-toggle-all");
    if (!container) return;
    if (toggleBtn) {
      toggleBtn.textContent = window.I18N.t(relicShowAll ? "relic_hide_all_button" : "relic_show_all_button");
    }
    container.hidden = !relicShowAll;
    container.innerHTML = "";
    if (!relicShowAll || !c || !type) return;

    var learned = c.learnedRelicEffects || [];
    var GROUP_LABEL = ["A", "B", "C"];

    [].concat(type.abilities || [], type.skills || [], type.arts || []).forEach(function (entry) {
      renderRelicAllEntry(container, entry, window.I18N.t("ability_level_label", { level: entry.level }), null);
    });
    (type.relicEffectGroups || []).forEach(function (g, gi) {
      g.effects.forEach(function (e, ei) {
        var key = relicEffectKey(type.id, gi, ei);
        var isLearned = learned.indexOf(key) !== -1;
        var tag = (GROUP_LABEL[gi] || gi) + (ei + 1);
        renderRelicAllEntry(container, e, tag, window.I18N.t(isLearned ? "relic_learned_tag" : "relic_unlearned_tag"));
      });
    });
  }

  // レベルアップで得られるHP/FP/加護上限の累加値（2等→HP、3等→FP、4等→加護、以降繰り返し、
  // 上限15等）を、該当する項目のラベル横に「(+N)」として表示する（Lv15なら+5/+5/+4）。
  var LEVEL_CAP = 15;

  function renderLevelBonusMarkers(c) {
    var hpEl = document.getElementById("char-hp-level-bonus");
    var fpEl = document.getElementById("char-fp-level-bonus");
    var blessingEl = document.getElementById("char-blessing-level-bonus");
    if (!hpEl || !fpEl || !blessingEl) return;
    var counts = [0, 0, 0];
    var level = c ? Math.min(c.level || 0, LEVEL_CAP) : 0;
    for (var lv = 2; lv <= level; lv++) counts[(lv - 2) % 3]++;
    [hpEl, fpEl, blessingEl].forEach(function (el, i) {
      el.textContent = counts[i] > 0 ? window.I18N.t("level_bonus_marker", { count: counts[i] }) : "";
    });
  }

  // 次の等級に上げるために必要な盧恩を、等級欄の横に「(-N)」として表示する。
  // 等級Lから等級L+1に上げるのに必要な盧恩は「L+1」（等級1なら次の2等へ「-2」）。上限等級では非表示。
  function renderLevelNextCostMarker(c) {
    var el = document.getElementById("char-level-next-cost");
    if (!el) return;
    var level = c ? c.level || 0 : 0;
    el.textContent = level > 0 && level < LEVEL_CAP ? window.I18N.t("level_next_cost_marker", { cost: level + 1 }) : "";
  }

  // 復歸次数（死亡→再挑戦した回数）に応じたHP/FP/加護ボーナスの目安を表示する。
  // 0回: +20/+20/+20、1回: +30/+30/+30、2回以上: +40/+40/+40（常に3項目とも同値）。
  function renderRevivalBonusMarkers(c) {
    var el = document.getElementById("char-revival-bonus-marker");
    if (!el) return;
    var count = c ? c.revivalCount || 0 : 0;
    var n = count >= 2 ? 40 : count === 1 ? 30 : 20;
    el.textContent = window.I18N.t("revival_bonus_marker", { n: n });
  }

  // --- 武器データベース検索＆選択（武器欄に既存の自由記述タグとは別枠で追加する） ---
  // ※ランダム戦技: 決定表が未確認のため、既知の戦技一覧から検索して手動で割り当てる
  // ランダム戦技枠（c.weaponRandomSkills[weaponId]）の解決済み値は、名称武器戦技を検索して
  // 決めた場合は文字列（SKILLSのid）、共通戦技を直接選んだ場合はskill ref（オブジェクト）になる。
  // どちらの形でも表示できるようにする。
  function resolveRandomSkillDisplay(resolvedValue) {
    if (!resolvedValue) return null;
    if (typeof resolvedValue === "string") {
      var resolved = Weapons.getSkill(resolvedValue);
      return resolved
        ? { name: Weapons.localizedText(resolved.name), body: Weapons.localizedText(resolved.body), kind: resolved.kind }
        : { name: resolvedValue, body: "", kind: null };
    }
    return resolveWeaponSkillDisplay(resolvedValue);
  }

  function renderRandomSkillPicker(container, weaponId, c) {
    var resolvedValue = c.weaponRandomSkills && c.weaponRandomSkills[weaponId];
    if (resolvedValue) {
      var display = resolveRandomSkillDisplay(resolvedValue);
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent =
        window.I18N.t("weapon_random_skill_label") + "　→　" + display.name + (display.kind ? "［" + display.kind + "］" : "");
      details.appendChild(summary);
      if (display.body) {
        var p = document.createElement("p");
        p.className = "threat-ref-body";
        p.textContent = display.body;
        details.appendChild(p);
      }
      var clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "danger-btn";
      clearBtn.textContent = window.I18N.t("weapon_random_skill_clear_button");
      clearBtn.addEventListener("click", function () {
        var clearedName = display.name;
        if (!window.confirm(window.I18N.t("weapon_random_skill_clear_confirm", { name: clearedName }))) return;
        delete c.weaponRandomSkills[weaponId];
        if (!c.weaponNotes) c.weaponNotes = {};
        var appended = window.I18N.t("weapon_cleared_skill_note", { name: clearedName });
        c.weaponNotes[weaponId] = c.weaponNotes[weaponId] ? c.weaponNotes[weaponId] + "\n" + appended : appended;
        saveFn();
        renderWeaponList();
      });
      details.appendChild(clearBtn);
      container.appendChild(details);
      return;
    }

    var wrap = document.createElement("div");
    wrap.className = "weapon-random-picker";
    var label = document.createElement("p");
    label.className = "threat-ref-body";
    label.textContent = window.I18N.t("weapon_random_skill_label");
    wrap.appendChild(label);

    var searchBox = document.createElement("div");
    searchBox.className = "weapon-search-box";
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = window.I18N.t("weapon_random_skill_search_placeholder");
    var results = document.createElement("div");
    results.className = "weapon-search-results";
    results.hidden = true;

    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      results.innerHTML = "";
      if (!q) {
        results.hidden = true;
        return;
      }
      var matches = Weapons.allSkills().filter(function (entry) {
        return Weapons.localizedText(entry.name).toLowerCase().indexOf(q) !== -1;
      });
      if (matches.length === 0) {
        results.hidden = true;
        return;
      }
      results.hidden = false;
      matches.slice(0, 8).forEach(function (entry) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "weapon-search-item";
        item.textContent = Weapons.localizedText(entry.name);
        item.addEventListener("click", function () {
          if (!c.weaponRandomSkills) c.weaponRandomSkills = {};
          c.weaponRandomSkills[weaponId] = entry.id;
          saveFn();
          renderWeaponList();
        });
        results.appendChild(item);
      });
    });

    searchBox.appendChild(input);
    searchBox.appendChild(results);
    wrap.appendChild(searchBox);

    var orLabel = document.createElement("p");
    orLabel.className = "threat-ref-body";
    orLabel.textContent = window.I18N.t("weapon_common_skill_or_label");
    wrap.appendChild(orLabel);

    renderCommonSkillPicker(wrap, function (ref) {
      if (!c.weaponRandomSkills) c.weaponRandomSkills = {};
      c.weaponRandomSkills[weaponId] = ref;
      saveFn();
      renderWeaponList();
    });

    container.appendChild(wrap);
  }

  // skill ref（weapon.skills／attachedEffect／reverseArt／共通戦技いずれも同じ形）から
  // 表示用の{name, body, kind}を求める。ランダム枠（kind:"random"）はここでは扱わない。
  function resolveWeaponSkillDisplay(ref) {
    var body;
    var name;
    var kind = null;
    if (ref.kind === "art") {
      var art = Weapons.getSkill(ref.id);
      name = art ? Weapons.localizedText(art.name) : ref.id;
      body = art ? Weapons.localizedText(art.body) : "";
      kind = art ? art.kind : null;
    } else if (ref.kind === "innate") {
      var innate = null;
      Weapons.categories().forEach(function (cat) {
        (cat.innateSkills || []).forEach(function (s) {
          if (s.id === ref.id) innate = s;
        });
      });
      name = innate ? Weapons.localizedText(innate.name) : ref.id;
      body = innate ? Weapons.localizedText(innate.body) : "";
      kind = innate ? innate.kind : null;
    } else if (ref.kind === "status") {
      name = window.I18N.t("weapon_status_skill_label", { status: Weapons.localizedText(ref.status) });
      body = Weapons.localizedText(Weapons.statusSkillBody(ref.status));
      kind = "Passive";
    } else if (ref.kind === "element") {
      name = window.I18N.t("weapon_element_skill_label", { element: Weapons.localizedText(ref.element) });
      body = Weapons.localizedText(Weapons.elementSkillBody(ref.element));
      kind = "Passive";
    } else if (ref.kind === "element_minus5") {
      name = window.I18N.t("weapon_element_minus5_skill_label", { element: Weapons.localizedText(ref.element) });
      body = Weapons.localizedText(Weapons.elementMinus5SkillBody(ref.element));
      kind = "Passive";
    } else if (ref.kind === "status_minus5") {
      name = window.I18N.t("weapon_status_minus5_skill_label", { status: Weapons.localizedText(ref.status) });
      body = Weapons.localizedText(Weapons.statusMinus5SkillBody(ref.status));
      kind = "Passive";
    } else if (ref.kind === "special") {
      name = window.I18N.t("weapon_special_skill_label", { target: Weapons.localizedText(ref.target) });
      body = Weapons.localizedText(Weapons.specialEffectSkillBody(ref.target));
      kind = "Passive";
    } else if (ref.kind === "bonus") {
      name = Weapons.localizedText(ref.text);
      body = "";
    } else {
      name = window.I18N.t("weapon_note_label");
      body = Weapons.localizedText(ref.text);
    }
    return { name: name, body: body, kind: kind };
  }

  function renderWeaponSkillEntry(container, ref, weaponId, c) {
    if (ref.kind === "random") {
      renderRandomSkillPicker(container, weaponId, c);
      return;
    }
    var display = resolveWeaponSkillDisplay(ref);
    var details = document.createElement("details");
    details.className = "ability-entry";
    var summary = document.createElement("summary");
    summary.textContent = display.name + (display.kind ? "［" + display.kind + "］" : "");
    details.appendChild(summary);
    if (display.body) {
      var p = document.createElement("p");
      p.className = "threat-ref-body";
      p.textContent = display.body;
      details.appendChild(p);
    }
    container.appendChild(details);
  }

  // 共通戦技（規則書154-155頁）を選ぶ2段階ピッカー：①種類（属性／状態異常／各々の威力-5版／特効）
  // ②その種類内の具体的な対象（魔／炎／雷／聖、猛毒／腐敗…等）。決定したskill refをonPickへ渡す。
  function renderCommonSkillPicker(container, onPick) {
    var wrap = document.createElement("div");
    wrap.className = "weapon-common-skill-picker";

    var typeLabel = document.createElement("label");
    typeLabel.textContent = window.I18N.t("weapon_common_skill_type_label");
    var typeSelect = document.createElement("select");
    COMMON_SKILL_TYPES.forEach(function (t, idx) {
      var opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = window.I18N.t(t.labelKey);
      typeSelect.appendChild(opt);
    });
    typeLabel.appendChild(typeSelect);
    wrap.appendChild(typeLabel);

    var valueLabel = document.createElement("label");
    valueLabel.textContent = window.I18N.t("weapon_common_skill_value_label");
    var valueSelect = document.createElement("select");
    valueLabel.appendChild(valueSelect);
    wrap.appendChild(valueLabel);

    function renderValueOptions() {
      var t = COMMON_SKILL_TYPES[Number(typeSelect.value)];
      valueSelect.innerHTML = "";
      t.options.forEach(function (opt, idx) {
        var o = document.createElement("option");
        o.value = String(idx);
        o.textContent = Weapons.localizedText(opt);
        valueSelect.appendChild(o);
      });
    }
    renderValueOptions();
    typeSelect.addEventListener("change", renderValueOptions);

    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = window.I18N.t("weapon_common_skill_add_button");
    addBtn.addEventListener("click", function () {
      var t = COMMON_SKILL_TYPES[Number(typeSelect.value)];
      var value = t.options[Number(valueSelect.value)];
      var ref = { kind: t.kind };
      ref[t.field] = value;
      onPick(ref);
    });
    wrap.appendChild(addBtn);

    container.appendChild(wrap);
  }

  function renderWeaponCard(container, weaponId, c, onRemoved) {
    var weapon = Weapons.get(baseWeaponId(weaponId));
    if (!weapon) return;
    var category = Weapons.getCategory(weapon.category);

    var card = document.createElement("div");
    card.className = "relic-candidate-card";

    var title = document.createElement("div");
    title.className = "relic-candidate-name";
    title.textContent =
      Weapons.localizedText(weapon.name) +
      "（" + (category ? Weapons.localizedText(category.name) : weapon.category) + "・" + weapon.rarity + "）";
    card.appendChild(title);

    if (category && category.isShield) {
      var shieldHp = weapon.rarity === "R" || weapon.rarity === "L" ? category.basicStats.guardHpRL : category.basicStats.guardHpCU;
      var shieldStats = document.createElement("p");
      shieldStats.className = "threat-ref-body";
      shieldStats.textContent = [
        window.I18N.t("weapon_guard_cost_label") + window.I18N.t("colon_separator") + Weapons.localizedText(category.basicStats.guardCost),
        window.I18N.t("weapon_guard_hp_label") + window.I18N.t("colon_separator") + shieldHp,
        window.I18N.t("weapon_power_mod_label") +
          window.I18N.t("colon_separator") +
          (weapon.powerModOverride ? Weapons.localizedText(weapon.powerModOverride) : Weapons.localizedText(category.basicStats.powerMod)),
      ].join("\n");
      card.appendChild(shieldStats);
    } else if (category) {
      var stats = document.createElement("p");
      stats.className = "threat-ref-body";
      stats.textContent = [
        window.I18N.t("weapon_attack_cost_label") + window.I18N.t("colon_separator") + Weapons.localizedText(category.basicStats.attackCost),
        window.I18N.t("weapon_power_label") + window.I18N.t("colon_separator") + category.basicStats.weaponPower,
        window.I18N.t("weapon_power_mod_label") +
          window.I18N.t("colon_separator") +
          (weapon.powerModOverride ? Weapons.localizedText(weapon.powerModOverride) : Weapons.localizedText(category.basicStats.powerMod)),
      ].join("\n");
      card.appendChild(stats);
    }

    if (category && category.twoHitBonus && category.twoHitBonus.length) {
      var twoHitTitle = document.createElement("p");
      twoHitTitle.className = "boss-subheading";
      twoHitTitle.textContent = window.I18N.t("weapon_two_hit_bonus_label");
      card.appendChild(twoHitTitle);
      category.twoHitBonus.forEach(function (bonus) {
        var bonusP = document.createElement("p");
        bonusP.className = "threat-ref-body";
        bonusP.textContent = Weapons.localizedText(bonus.name) + window.I18N.t("colon_separator") + Weapons.localizedText(bonus.body);
        card.appendChild(bonusP);
      });
    }

    if (category && category.isShield) {
      // 盾は「付随効果」と「逆手の戦技（ガード時戦技）」の2種類のスキル欄を持つ。武器の単一skills欄とは構造が異なる。
      if (weapon.attachedEffect && weapon.attachedEffect.length) {
        var attachedTitle = document.createElement("p");
        attachedTitle.className = "boss-subheading";
        attachedTitle.textContent = window.I18N.t("weapon_attached_effect_label");
        card.appendChild(attachedTitle);
        weapon.attachedEffect.forEach(function (ref) {
          renderWeaponSkillEntry(card, ref, weaponId, c);
        });
      }
      if (weapon.reverseArt && weapon.reverseArt.length) {
        var reverseTitle = document.createElement("p");
        reverseTitle.className = "boss-subheading";
        reverseTitle.textContent = window.I18N.t("weapon_reverse_art_label");
        card.appendChild(reverseTitle);
        weapon.reverseArt.forEach(function (ref) {
          renderWeaponSkillEntry(card, ref, weaponId, c);
        });
      }
    } else {
      // 装備品スキル欄（weapon.skills）に載っているものだけがこの武器の戦技・固有技能。
      // カテゴリの固有戦技一覧を無条件に全部表示することはしない。
      (weapon.skills || []).forEach(function (ref) {
        renderWeaponSkillEntry(card, ref, weaponId, c);
      });
    }

    // 共通戦技（規則書154-155頁）：抽選や検索での直接追加後に、プレイヤーが手動で
    // 属性／状態異常／特効などを1つずつ追加していける（シナリオイベント等での後天的な習得を想定）。
    var commonTitle = document.createElement("p");
    commonTitle.className = "boss-subheading";
    commonTitle.textContent = window.I18N.t("weapon_common_skill_section_title");
    card.appendChild(commonTitle);
    (c.weaponExtraSkills && c.weaponExtraSkills[weaponId] ? c.weaponExtraSkills[weaponId] : []).forEach(function (ref, idx) {
      var display = resolveWeaponSkillDisplay(ref);
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent = display.name + (display.kind ? "［" + display.kind + "］" : "");
      details.appendChild(summary);
      if (display.body) {
        var p = document.createElement("p");
        p.className = "threat-ref-body";
        p.textContent = display.body;
        details.appendChild(p);
      }
      var removeExtraBtn = document.createElement("button");
      removeExtraBtn.type = "button";
      removeExtraBtn.className = "danger-btn";
      removeExtraBtn.textContent = window.I18N.t("weapon_remove_button");
      removeExtraBtn.addEventListener("click", function () {
        c.weaponExtraSkills[weaponId].splice(idx, 1);
        saveFn();
        renderWeaponList();
      });
      details.appendChild(removeExtraBtn);
      card.appendChild(details);
    });
    renderCommonSkillPicker(card, function (ref) {
      if (!c.weaponExtraSkills) c.weaponExtraSkills = {};
      if (!c.weaponExtraSkills[weaponId]) c.weaponExtraSkills[weaponId] = [];
      c.weaponExtraSkills[weaponId].push(ref);
      saveFn();
      renderWeaponList();
    });

    var noteLabel = document.createElement("p");
    noteLabel.className = "boss-subheading";
    noteLabel.textContent = window.I18N.t("weapon_note_label");
    card.appendChild(noteLabel);
    var noteInput = document.createElement("textarea");
    noteInput.className = "weapon-note-input";
    noteInput.placeholder = window.I18N.t("weapon_note_placeholder");
    noteInput.value = (c.weaponNotes && c.weaponNotes[weaponId]) || "";
    noteInput.addEventListener("change", function () {
      if (!c.weaponNotes) c.weaponNotes = {};
      c.weaponNotes[weaponId] = noteInput.value;
      saveFn();
    });
    card.appendChild(noteInput);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "danger-btn";
    removeBtn.textContent = window.I18N.t("weapon_remove_button");
    removeBtn.addEventListener("click", function () {
      if (!window.confirm(window.I18N.t("weapon_remove_confirm", { name: Weapons.localizedText(weapon.name) }))) return;
      c.weaponIds.splice(c.weaponIds.indexOf(weaponId), 1);
      if (c.weaponRandomSkills) delete c.weaponRandomSkills[weaponId];
      if (c.weaponNotes) delete c.weaponNotes[weaponId];
      if (c.weaponExtraSkills) delete c.weaponExtraSkills[weaponId];
      if (c.equippedWeaponIds) {
        var eqIdx = c.equippedWeaponIds.indexOf(weaponId);
        if (eqIdx !== -1) c.equippedWeaponIds.splice(eqIdx, 1);
      }
      saveFn();
      (onRemoved || renderWeaponList)();
    });
    card.appendChild(removeBtn);

    container.appendChild(card);
  }

  function renderWeaponList() {
    var c = findCharacter(activeCharacterId);
    var container = document.getElementById("weapon-list");
    if (!container) return;
    container.innerHTML = "";
    if (!c) return;
    (c.weaponIds || []).forEach(function (id) {
      renderWeaponCard(container, id, c);
    });
  }

  // 盤面ロスター用：戦技名だけを簡潔に取り出す（本文・ランダム決定表UIは含めない）。
  // ランダム戦技は、既に抽出済み（c.weaponRandomSkills[weaponId]が設定済み）ならその
  // 戦技名だけを表示し、未決定の間は何も表示しない（冗長な案内文を出さない）。
  function weaponSkillRefName(ref, c, weaponId) {
    if (ref.kind === "random") {
      var resolvedValue = c && c.weaponRandomSkills && c.weaponRandomSkills[weaponId];
      if (!resolvedValue) return null;
      var display = resolveRandomSkillDisplay(resolvedValue);
      return display ? display.name : null;
    }
    if (ref.kind === "art") {
      var art = Weapons.getSkill(ref.id);
      return art ? Weapons.localizedText(art.name) : ref.id;
    }
    if (ref.kind === "innate") {
      var innate = null;
      Weapons.categories().forEach(function (cat) {
        (cat.innateSkills || []).forEach(function (s) {
          if (s.id === ref.id) innate = s;
        });
      });
      return innate ? Weapons.localizedText(innate.name) : ref.id;
    }
    if (ref.kind === "status") return window.I18N.t("weapon_status_skill_label", { status: Weapons.localizedText(ref.status) });
    if (ref.kind === "element") return window.I18N.t("weapon_element_skill_label", { element: Weapons.localizedText(ref.element) });
    if (ref.kind === "element_minus5")
      return window.I18N.t("weapon_element_minus5_skill_label", { element: Weapons.localizedText(ref.element) });
    if (ref.kind === "status_minus5")
      return window.I18N.t("weapon_status_minus5_skill_label", { status: Weapons.localizedText(ref.status) });
    if (ref.kind === "special") return window.I18N.t("weapon_special_skill_label", { target: Weapons.localizedText(ref.target) });
    if (ref.kind === "bonus") return Weapons.localizedText(ref.text);
    return null; // "note" 等、要約に含める意味のないもの
  }

  // 盤面ロスター（キャラクターの下）に出す武器要約1行：[装備チェック][名前(攻撃消耗)・戦技名, クリックで詳細][転交]
  function renderRosterWeaponList(c, container) {
    container.innerHTML = "";
    if (!c || !(c.weaponIds || []).length) return;
    if (!c.equippedWeaponIds) c.equippedWeaponIds = [];
    c.weaponIds.forEach(function (weaponId) {
      var weapon = Weapons.get(baseWeaponId(weaponId));
      if (!weapon) return;
      var category = Weapons.getCategory(weapon.category);
      var row = document.createElement("div");
      row.className = "roster-weapon-row";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "roster-weapon-equip-check";
      checkbox.checked = c.equippedWeaponIds.indexOf(weaponId) !== -1;
      checkbox.title = window.I18N.t("weapon_equipped_label");
      checkbox.addEventListener("change", function () {
        var idx = c.equippedWeaponIds.indexOf(weaponId);
        if (checkbox.checked && idx === -1) c.equippedWeaponIds.push(weaponId);
        if (!checkbox.checked && idx !== -1) c.equippedWeaponIds.splice(idx, 1);
        saveFn();
      });
      row.appendChild(checkbox);

      var attackCost =
        category && !category.isShield ? Weapons.localizedText(category.basicStats.attackCost) : category ? Weapons.localizedText(category.basicStats.guardCost) : "";
      var skillRefs = (
        category && category.isShield ? (weapon.attachedEffect || []).concat(weapon.reverseArt || []) : weapon.skills || []
      ).concat((c.weaponExtraSkills && c.weaponExtraSkills[weaponId]) || []);
      var skillNames = skillRefs
        .map(function (ref) {
          return weaponSkillRefName(ref, c, weaponId);
        })
        .filter(function (n) {
          return n;
        });

      var nameBtn = document.createElement("button");
      nameBtn.type = "button";
      nameBtn.className = "roster-weapon-name-btn";
      nameBtn.textContent =
        Weapons.localizedText(weapon.name) +
        (attackCost ? "（" + attackCost + "）" : "") +
        (skillNames.length ? " ｜ " + skillNames.join("・") : "");
      nameBtn.addEventListener("click", function () {
        openWeaponDetailDrawer(c.id, weaponId);
      });
      row.appendChild(nameBtn);

      var transferBtn = document.createElement("button");
      transferBtn.type = "button";
      transferBtn.className = "roster-weapon-transfer-btn";
      transferBtn.textContent = window.I18N.t("weapon_transfer_button");
      var transferSelect = document.createElement("select");
      transferSelect.className = "roster-weapon-transfer-select";
      transferSelect.hidden = true;
      transferBtn.addEventListener("click", function () {
        if (!transferSelect.hidden) {
          transferSelect.hidden = true;
          return;
        }
        transferSelect.innerHTML = "";
        var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = window.I18N.t("weapon_transfer_select_placeholder");
        transferSelect.appendChild(placeholder);
        characters
          .filter(function (other) {
            return other.entered && other.id !== c.id;
          })
          .forEach(function (other) {
            var opt = document.createElement("option");
            opt.value = other.id;
            opt.textContent = other.name;
            transferSelect.appendChild(opt);
          });
        transferSelect.hidden = false;
      });
      transferSelect.addEventListener("change", function () {
        var targetId = transferSelect.value;
        if (!targetId) return;
        var target = findCharacter(targetId);
        if (!target) return;
        c.weaponIds.splice(c.weaponIds.indexOf(weaponId), 1);
        var eqIdx = c.equippedWeaponIds.indexOf(weaponId);
        if (eqIdx !== -1) c.equippedWeaponIds.splice(eqIdx, 1);
        if (!target.weaponIds) target.weaponIds = [];
        // 移転先が既に同じid（枝番込み）の武器を持っている場合のみ、衝突を避けるため
        // 新しい枝番付きidへ振り直す（通常はそのままのidで移転する）。
        var newWeaponId =
          target.weaponIds.indexOf(weaponId) === -1 ? weaponId : makeWeaponInstanceId(baseWeaponId(weaponId), target);
        target.weaponIds.push(newWeaponId);
        if (c.weaponRandomSkills && c.weaponRandomSkills[weaponId] !== undefined) {
          if (!target.weaponRandomSkills) target.weaponRandomSkills = {};
          target.weaponRandomSkills[newWeaponId] = c.weaponRandomSkills[weaponId];
          delete c.weaponRandomSkills[weaponId];
        }
        if (c.weaponNotes && c.weaponNotes[weaponId] !== undefined) {
          if (!target.weaponNotes) target.weaponNotes = {};
          target.weaponNotes[newWeaponId] = c.weaponNotes[weaponId];
          delete c.weaponNotes[weaponId];
        }
        if (c.weaponExtraSkills && c.weaponExtraSkills[weaponId] !== undefined) {
          if (!target.weaponExtraSkills) target.weaponExtraSkills = {};
          target.weaponExtraSkills[newWeaponId] = c.weaponExtraSkills[weaponId];
          delete c.weaponExtraSkills[weaponId];
        }
        saveFn();
        renderRosterFn();
        if (activeCharacterId === c.id || activeCharacterId === target.id) renderWeaponList();
      });
      row.appendChild(transferBtn);
      row.appendChild(transferSelect);

      container.appendChild(row);
    });
  }

  // 盤面ロスターに出す裝飾品（タリスマン）要約1行：[名前][転交]
  function renderRosterTalismanList(c, container) {
    container.innerHTML = "";
    if (!c || !(c.talismanIds || []).length) return;
    c.talismanIds.forEach(function (talismanId) {
      var talisman = Talismans.get(talismanId);
      if (!talisman) return;
      var row = document.createElement("div");
      row.className = "roster-weapon-row";

      var nameBtn = document.createElement("button");
      nameBtn.type = "button";
      nameBtn.className = "roster-weapon-name-btn";
      nameBtn.textContent = Talismans.localizedText(talisman.name);
      nameBtn.addEventListener("click", function () {
        openTalismanDetailDrawer(c.id, talismanId);
      });
      row.appendChild(nameBtn);

      var transferBtn = document.createElement("button");
      transferBtn.type = "button";
      transferBtn.className = "roster-weapon-transfer-btn";
      transferBtn.textContent = window.I18N.t("weapon_transfer_button");
      var transferSelect = document.createElement("select");
      transferSelect.className = "roster-weapon-transfer-select";
      transferSelect.hidden = true;
      transferBtn.addEventListener("click", function () {
        if (!transferSelect.hidden) {
          transferSelect.hidden = true;
          return;
        }
        transferSelect.innerHTML = "";
        var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = window.I18N.t("weapon_transfer_select_placeholder");
        transferSelect.appendChild(placeholder);
        characters
          .filter(function (other) {
            return other.entered && other.id !== c.id;
          })
          .forEach(function (other) {
            var opt = document.createElement("option");
            opt.value = other.id;
            opt.textContent = other.name;
            transferSelect.appendChild(opt);
          });
        transferSelect.hidden = false;
      });
      transferSelect.addEventListener("change", function () {
        var targetId = transferSelect.value;
        if (!targetId) return;
        var target = findCharacter(targetId);
        if (!target) return;
        c.talismanIds.splice(c.talismanIds.indexOf(talismanId), 1);
        if (!target.talismanIds) target.talismanIds = [];
        if (target.talismanIds.indexOf(talismanId) === -1) target.talismanIds.push(talismanId);
        saveFn();
        renderRosterFn();
        if (activeCharacterId === c.id || activeCharacterId === target.id) renderTalismanList();
      });
      row.appendChild(transferBtn);
      row.appendChild(transferSelect);

      container.appendChild(row);
    });
  }

  // 盤面ロスターに出す消耗品要約1行：[名前(所持數)][転交数量][対象][確定]
  function renderRosterConsumableList(c, container) {
    container.innerHTML = "";
    if (!c) return;
    var ids = Object.keys(c.consumableCounts || {}).filter(function (id) {
      return (c.consumableCounts[id] || 0) > 0;
    });
    if (!ids.length) return;
    ids.forEach(function (consumableId) {
      var consumable = Consumables.get(consumableId);
      if (!consumable) return;
      var row = document.createElement("div");
      row.className = "roster-weapon-row";

      var nameBtn = document.createElement("button");
      nameBtn.type = "button";
      nameBtn.className = "roster-weapon-name-btn";
      nameBtn.textContent = Consumables.localizedText(consumable.name) + "（" + c.consumableCounts[consumableId] + "）";
      nameBtn.addEventListener("click", function () {
        openConsumableDetailDrawer(c.id, consumableId);
      });
      row.appendChild(nameBtn);

      var transferBtn = document.createElement("button");
      transferBtn.type = "button";
      transferBtn.className = "roster-weapon-transfer-btn";
      transferBtn.textContent = window.I18N.t("weapon_transfer_button");
      row.appendChild(transferBtn);

      var transferWrap = document.createElement("span");
      transferWrap.className = "roster-consumable-transfer-wrap";
      transferWrap.hidden = true;

      var qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = "1";
      qtyInput.title = window.I18N.t("consumable_transfer_qty_label");
      qtyInput.className = "roster-consumable-transfer-qty";

      var transferSelect = document.createElement("select");
      transferSelect.className = "roster-weapon-transfer-select";

      var confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.textContent = window.I18N.t("consumable_transfer_confirm_button");

      transferBtn.addEventListener("click", function () {
        if (!transferWrap.hidden) {
          transferWrap.hidden = true;
          return;
        }
        transferSelect.innerHTML = "";
        var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = window.I18N.t("weapon_transfer_select_placeholder");
        transferSelect.appendChild(placeholder);
        characters
          .filter(function (other) {
            return other.entered && other.id !== c.id;
          })
          .forEach(function (other) {
            var opt = document.createElement("option");
            opt.value = other.id;
            opt.textContent = other.name;
            transferSelect.appendChild(opt);
          });
        qtyInput.max = String(c.consumableCounts[consumableId] || 1);
        qtyInput.value = "1";
        transferWrap.hidden = false;
      });

      confirmBtn.addEventListener("click", function () {
        var targetId = transferSelect.value;
        if (!targetId) return;
        var target = findCharacter(targetId);
        if (!target) return;
        var have = c.consumableCounts[consumableId] || 0;
        var qty = parseInt(qtyInput.value, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        if (qty > have) qty = have;
        if (qty <= 0) return;
        c.consumableCounts[consumableId] = have - qty;
        if (c.consumableCounts[consumableId] <= 0) delete c.consumableCounts[consumableId];
        if (!target.consumableCounts) target.consumableCounts = {};
        target.consumableCounts[consumableId] = (target.consumableCounts[consumableId] || 0) + qty;
        saveFn();
        renderRosterFn();
        if (activeCharacterId === c.id || activeCharacterId === target.id) renderConsumableList();
      });

      transferWrap.appendChild(qtyInput);
      transferWrap.appendChild(transferSelect);
      transferWrap.appendChild(confirmBtn);
      row.appendChild(transferWrap);

      container.appendChild(row);
    });
  }

  function renderWeaponSearchResults(query) {
    var results = document.getElementById("weapon-search-results");
    if (!results) return;
    results.innerHTML = "";
    var matches = Weapons.search(query);
    if (matches.length === 0) {
      results.hidden = true;
      return;
    }
    results.hidden = false;
    matches.slice(0, 8).forEach(function (w) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "weapon-search-item";
      item.textContent = Weapons.localizedText(w.name) + "（" + w.rarity + "）";
      item.addEventListener("click", function () {
        var c = findCharacter(activeCharacterId);
        if (!c) return;
        if (!c.weaponIds) c.weaponIds = [];
        c.weaponIds.push(makeWeaponInstanceId(w.id, c));
        saveFn();
        renderWeaponList();
        var input = document.getElementById("weapon-search-input");
        input.value = "";
        results.innerHTML = "";
        results.hidden = true;
      });
      results.appendChild(item);
    });
  }

  // --- 武器の抽選入手（〔任意〕大分類→小分類 → 稀有度 → 武器 → ランダム戦技） ---
  // カテゴリを「武器」（大分類未指定）で始めた場合のみ、weapon_rulebook.js の
  // 「武器」大カテゴリ決定表〔4-1〕→小カテゴリ決定表〔4-2〕に従って先にカテゴリそのものを
  // 決定する（杖・聖印はこの手順の対象外＝最初からカテゴリ指定で選ぶ）。
  // 稀有度は「weapon_rulebook.js」のレア度決定表（★の数だけD6を振り、合計値で判定）に、
  // 武器決定は各WEAPONS項目の roll 範囲（例："1〜2"）に、戦技決定は各カテゴリの
  // randomSkillTable（単純な1D6）または namedSkillTables（"1・2／3"形式の複合ロール、杖・聖印用。
  // 個々の武器項目が持つ skills の {kind:"random", table:"A"} で使用する決定表が指定されている）に
  // それぞれ準拠する。各段階は「ロール結果を表示した上で手動でも上書きできる」形にし、
  // 既存の手動検索（renderWeaponSearchResults）とは独立して共存する。
  var ANY_WEAPON_CATEGORY = "__any_weapon__";
  var weaponRollState = null;

  function resetWeaponRollState() {
    var firstCat = Weapons.categories()[0];
    weaponRollState = {
      categoryId: firstCat ? firstCat.id : null,
      categoryResolved: true,
      majorDie: null,
      majorIndex: null,
      minorDie: null,
      minorRerollNote: false,

      starCount: 2,
      rarityDice: null,
      raritySum: null,
      rarity: null,
      rarityConfirmed: false,

      itemDie: null,
      item: null,
      itemMissMessage: false,
      itemMissNote: null,

      skillTableLetter: null,
      skillDice: null,
      skillId: null,
      skillMissMessage: false,
    };
  }

  function parseRollRange(roll) {
    var m = String(roll || "").match(/^(\d+)(?:\s*[〜~]\s*(\d+))?/);
    if (!m) return null;
    var lo = parseInt(m[1], 10);
    var hi = m[2] ? parseInt(m[2], 10) : lo;
    return [lo, hi];
  }

  function getRarityBreakpoints() {
    if (!WeaponRulebook) return null;
    var table = WeaponRulebook.rarityTable();
    var headers = table.columns.slice(1);
    var rarityCells = table.rows[0].slice(1);
    return headers.map(function (h, i) {
      var text = Weapons.localizedText(h);
      var m = text.match(/^(\d+)(?:[〜~](\d+))?/);
      var lo = m ? parseInt(m[1], 10) : 0;
      var hi = m && m[2] ? parseInt(m[2], 10) : text.indexOf("以上") !== -1 || text.indexOf("+") !== -1 ? Infinity : lo;
      var rarityText = Weapons.localizedText(rarityCells[i]);
      var rarityLetter = (rarityText.match(/[CURL]/) || [])[0] || "C";
      return { lo: lo, hi: hi, rarity: rarityLetter };
    });
  }

  function lookupRarityBySum(sum) {
    var bps = getRarityBreakpoints();
    if (!bps) return null;
    for (var i = 0; i < bps.length; i++) {
      if (sum >= bps[i].lo && sum <= bps[i].hi) return bps[i].rarity;
    }
    return bps[bps.length - 1].rarity;
  }

  function pickWeaponByRoll(categoryId, rarity, dieValue) {
    var candidates = Weapons.list().filter(function (w) {
      return w.category === categoryId && w.rarity === rarity;
    });
    var ranged = candidates.filter(function (w) {
      var range = parseRollRange(w.roll);
      return range && dieValue >= range[0] && dieValue <= range[1];
    });
    if (ranged.length) return ranged[0];
    // この区分にダイス範囲を持つ武器が1つも無い場合（例:大弓の各稀有度のように、そもそも
    // その稀有度に武器が1種類しか無くロール自体が不要な区分）は、ノート専用のプレースホルダー
    // （「該当武器なし」等）を除いた唯一の実武器があれば、それをそのまま自動選出する。
    var hasAnyRangedWeapon = candidates.some(function (w) {
      return !!parseRollRange(w.roll);
    });
    if (!hasAnyRangedWeapon) {
      var realCandidates = candidates.filter(function (w) {
        return !isNotePlaceholderWeapon(w);
      });
      if (realCandidates.length === 1) return realCandidates[0];
    }
    return null;
  }

  function resolveSimpleTableRoll(category, d1) {
    var row = (category.randomSkillTable || []).filter(function (r) {
      return String(r.roll) === String(d1);
    })[0];
    return row || null;
  }

  function resolveNamedTableRoll(table, d1, d2) {
    for (var i = 0; i < table.rows.length; i++) {
      var row = table.rows[i];
      var parts = String(row.roll).split("／");
      if (parts.length !== 2) continue;
      var leftVals = parts[0].split("・").map(function (s) {
        return parseInt(s, 10);
      });
      var rightVal = parseInt(parts[1], 10);
      if (leftVals.indexOf(d1) !== -1 && rightVal === d2) return row;
    }
    return null;
  }

  // weapon_rulebook.js の小カテゴリ決定表セル（例："短剣（158頁）"）からページ参照を除いた
  // 名称で Weapons.categories() と突き合わせ、実データ上のカテゴリidを求める。
  function findCategoryIdByMinorLabel(label) {
    var name = String(label || "")
      .replace(/[（(].*?[）)]/g, "")
      .trim();
    if (!name) return null;
    var match = Weapons.categories().filter(function (c) {
      return Weapons.localizedText(c.name) === name;
    })[0];
    return match ? match.id : null;
  }

  // 盾は skills ではなく attachedEffect／reverseArt にランダム枠を持つ（renderWeaponCard の
  // skillRefs 判定と同じルール）。抽選フローでもここを見落とすとランダム戦技の解決漏れになる。
  function getItemSkillRefs(category, item) {
    if (category && category.isShield) {
      return (item.attachedEffect || []).concat(item.reverseArt || []);
    }
    return item.skills || [];
  }

  // 1人が同じ武器を複数所持できるように、c.weaponIdsの要素はカタログid（例:"rapier_x"）そのもの
  // か、2つ目以降の複製に付けた枝番付きid（例:"rapier_x::2"）のどちらかになる。カタログ参照時は
  // baseWeaponIdで枝番を取り除き、ランダム戦技／備考／装備状態のキーには常に完全なid（枝番込み）
  // を使うことで、複製ごとに独立した状態を持たせる（既存セーブの枝番なしidともそのまま互換）。
  function baseWeaponId(weaponId) {
    var idx = String(weaponId || "").indexOf("::");
    return idx === -1 ? weaponId : weaponId.slice(0, idx);
  }

  function makeWeaponInstanceId(catalogId, target) {
    var existing = (target.weaponIds || []).filter(function (id) {
      return id === catalogId || id.indexOf(catalogId + "::") === 0;
    });
    return existing.length === 0 ? catalogId : catalogId + "::" + (existing.length + 1);
  }

  // ノート専用（kind:"note"のみ）のプレースホルダー武器（例:「該当武器なし」）かどうか。
  // 実際に入手可能な武器（スキル無しの物も含む）と区別するために使う。
  function isNotePlaceholderWeapon(w) {
    var skills = (w && w.skills) || [];
    return skills.length === 1 && skills[0].kind === "note";
  }

  function findNotePlaceholderWeapon(categoryId, rarity) {
    return (
      Weapons.list().filter(function (w) {
        return w.category === categoryId && w.rarity === rarity && isNotePlaceholderWeapon(w);
      })[0] || null
    );
  }

  function renderWeaponRollField() {
    var field = document.getElementById("weapon-roll-field");
    if (!field) return;
    if (!weaponRollState) resetWeaponRollState();
    var st = weaponRollState;

    field.innerHTML = "";

    var toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "weapon-roll-toggle-btn";
    toggleBtn.textContent = window.I18N.t(field.dataset.open === "1" ? "weapon_roll_toggle_hide" : "weapon_roll_toggle_button");
    toggleBtn.addEventListener("click", function () {
      field.dataset.open = field.dataset.open === "1" ? "0" : "1";
      renderWeaponRollField();
    });
    field.appendChild(toggleBtn);

    if (field.dataset.open !== "1") return;

    var panel = document.createElement("div");
    panel.className = "weapon-roll-panel";

    // カテゴリ選択（「武器」を選ぶと大分類→小分類の抽選が挟まる／個別カテゴリなら即決定）
    var configRow = document.createElement("div");
    configRow.className = "weapon-roll-row";
    var catLabel = document.createElement("label");
    catLabel.textContent = window.I18N.t("weapon_roll_category_label");
    var catSelect = document.createElement("select");
    var anyOpt = document.createElement("option");
    anyOpt.value = ANY_WEAPON_CATEGORY;
    anyOpt.textContent = window.I18N.t("weapon_roll_category_any_option");
    catSelect.appendChild(anyOpt);
    Weapons.categories().forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = Weapons.localizedText(cat.name);
      catSelect.appendChild(opt);
    });
    catSelect.value = st.categoryId === null ? ANY_WEAPON_CATEGORY : st.categoryId;
    catSelect.addEventListener("change", function () {
      var newValue = catSelect.value;
      resetWeaponRollState();
      if (newValue === ANY_WEAPON_CATEGORY) {
        weaponRollState.categoryId = null;
        weaponRollState.categoryResolved = false;
      } else {
        weaponRollState.categoryId = newValue;
        weaponRollState.categoryResolved = true;
      }
      renderWeaponRollField();
    });
    catLabel.appendChild(catSelect);
    configRow.appendChild(catLabel);
    panel.appendChild(configRow);

    // 〔4-1〕〔4-2〕カテゴリ自体の抽選（「武器」を選んだときのみ）
    if (!st.categoryResolved) {
      if (st.majorIndex === null) {
        var majorBtn = document.createElement("button");
        majorBtn.type = "button";
        majorBtn.className = "primary-btn";
        majorBtn.textContent = window.I18N.t("weapon_roll_major_button");
        majorBtn.addEventListener("click", function () {
          var die = rollD6();
          st.majorDie = die;
          st.majorIndex = die - 1;
          renderWeaponRollField();
        });
        panel.appendChild(majorBtn);
      } else {
        var majorTable = WeaponRulebook.majorTable();
        var majorRow = majorTable.rows[st.majorIndex];
        var majorResult = document.createElement("p");
        majorResult.className = "threat-ref-body weapon-roll-result";
        majorResult.textContent = window.I18N.t("weapon_roll_major_result", {
          die: st.majorDie,
          label: Weapons.localizedText(majorRow[1]),
        });
        panel.appendChild(majorResult);

        var minorTable = WeaponRulebook.minorTables()[st.majorIndex];
        var minorBtn = document.createElement("button");
        minorBtn.type = "button";
        minorBtn.className = "primary-btn";
        minorBtn.textContent = window.I18N.t("weapon_roll_minor_button");
        minorBtn.addEventListener("click", function () {
          var die = rollD6();
          st.minorDie = die;
          var row = null;
          for (var i = 0; i < minorTable.rows.length; i++) {
            var range = parseRollRange(Weapons.localizedText(minorTable.rows[i][0]));
            if (range && die >= range[0] && die <= range[1]) {
              row = minorTable.rows[i];
              break;
            }
          }
          var resolvedId = row ? findCategoryIdByMinorLabel(Weapons.localizedText(row[1])) : null;
          if (resolvedId) {
            st.categoryId = resolvedId;
            st.categoryResolved = true;
            st.minorRerollNote = false;
          } else {
            st.minorRerollNote = true;
          }
          renderWeaponRollField();
        });
        panel.appendChild(minorBtn);

        if (st.minorRerollNote) {
          var rerollMsg = document.createElement("p");
          rerollMsg.className = "threat-ref-body weapon-roll-result";
          rerollMsg.textContent = window.I18N.t("weapon_roll_minor_reroll_note", { die: st.minorDie });
          panel.appendChild(rerollMsg);
        }
      }
      field.appendChild(panel);
      return;
    }

    if (st.majorIndex !== null) {
      var categoryResolvedMsg = document.createElement("p");
      categoryResolvedMsg.className = "threat-ref-body weapon-roll-result";
      var resolvedCat = Weapons.getCategory(st.categoryId);
      categoryResolvedMsg.textContent = window.I18N.t("weapon_roll_category_resolved", {
        name: resolvedCat ? Weapons.localizedText(resolvedCat.name) : st.categoryId,
      });
      panel.appendChild(categoryResolvedMsg);
    }

    // ★選択・稀有度決定
    var starRow = document.createElement("div");
    starRow.className = "weapon-roll-row";
    var starLabel = document.createElement("label");
    starLabel.textContent = window.I18N.t("weapon_roll_star_label");
    var starSelect = document.createElement("select");
    [1, 2, 3, 4].forEach(function (n) {
      var opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = "★".repeat(n);
      if (n === st.starCount) opt.selected = true;
      starSelect.appendChild(opt);
    });
    starSelect.disabled = st.rarityConfirmed;
    starSelect.addEventListener("change", function () {
      st.starCount = parseInt(starSelect.value, 10);
    });
    starLabel.appendChild(starSelect);
    starRow.appendChild(starLabel);
    panel.appendChild(starRow);

    var category = Weapons.getCategory(st.categoryId);

    // ①稀有度決定（ロール後も手動で上書きし、「次へ」で確定するまでは編集可能）
    var step1Btn = document.createElement("button");
    step1Btn.type = "button";
    step1Btn.className = "primary-btn";
    step1Btn.textContent = window.I18N.t("weapon_roll_step1_button");
    step1Btn.disabled = st.rarityConfirmed;
    step1Btn.addEventListener("click", function () {
      var dice = [];
      for (var i = 0; i < st.starCount; i++) dice.push(rollD6());
      var sum = dice.reduce(function (a, b) {
        return a + b;
      }, 0);
      st.rarityDice = dice;
      st.raritySum = sum;
      st.rarity = lookupRarityBySum(sum);
      renderWeaponRollField();
    });
    panel.appendChild(step1Btn);

    if (st.rarityDice) {
      var rarityResult = document.createElement("p");
      rarityResult.className = "threat-ref-body weapon-roll-result";
      rarityResult.textContent = window.I18N.t("weapon_roll_rarity_result", {
        dice: st.rarityDice.join("、"),
        sum: st.raritySum,
        rarity: st.rarity,
      });
      panel.appendChild(rarityResult);
    }

    if (st.rarity && !st.rarityConfirmed) {
      var rarityOverrideRow = document.createElement("div");
      rarityOverrideRow.className = "weapon-roll-row";
      var rarityOverrideLabel = document.createElement("label");
      rarityOverrideLabel.textContent = window.I18N.t("weapon_roll_rarity_override_label");
      var raritySelect = document.createElement("select");
      ["C", "U", "R", "L"].forEach(function (r) {
        var opt = document.createElement("option");
        opt.value = r;
        opt.textContent = r;
        if (r === st.rarity) opt.selected = true;
        raritySelect.appendChild(opt);
      });
      raritySelect.addEventListener("change", function () {
        st.rarity = raritySelect.value;
      });
      rarityOverrideLabel.appendChild(raritySelect);
      rarityOverrideRow.appendChild(rarityOverrideLabel);
      panel.appendChild(rarityOverrideRow);

      var rarityNextBtn = document.createElement("button");
      rarityNextBtn.type = "button";
      rarityNextBtn.className = "primary-btn";
      rarityNextBtn.textContent = window.I18N.t("weapon_roll_rarity_next_button");
      rarityNextBtn.addEventListener("click", function () {
        st.rarityConfirmed = true;
        renderWeaponRollField();
      });
      panel.appendChild(rarityNextBtn);
    }

    if (st.rarity && st.rarityConfirmed) {
      var rarityConfirmedResult = document.createElement("p");
      rarityConfirmedResult.className = "threat-ref-body weapon-roll-result";
      rarityConfirmedResult.textContent = window.I18N.t("weapon_roll_rarity_confirmed", { rarity: st.rarity });
      panel.appendChild(rarityConfirmedResult);

      // ②武器決定
      var step2Btn = document.createElement("button");
      step2Btn.type = "button";
      step2Btn.className = "primary-btn";
      step2Btn.textContent = window.I18N.t("weapon_roll_step2_button");
      step2Btn.disabled = !!st.item;
      step2Btn.addEventListener("click", function () {
        var die = rollD6();
        st.itemDie = die;
        var picked = pickWeaponByRoll(st.categoryId, st.rarity, die);
        if (!picked) {
          st.item = null;
          st.itemMissMessage = true;
          var placeholder = findNotePlaceholderWeapon(st.categoryId, st.rarity);
          st.itemMissNote = placeholder ? Weapons.localizedText(placeholder.skills[0].text) : null;
        } else {
          st.item = picked;
          st.itemMissMessage = false;
          st.itemMissNote = null;
          st.skillId = null;
          st.skillDice = null;
          var randomRef = getItemSkillRefs(category, picked).filter(function (s) {
            return s.kind === "random";
          })[0];
          st.skillTableLetter = randomRef && randomRef.table ? randomRef.table : null;
        }
        renderWeaponRollField();
      });
      panel.appendChild(step2Btn);

      if (st.itemMissMessage) {
        var missMsg = document.createElement("p");
        missMsg.className = "threat-ref-body weapon-roll-result";
        missMsg.textContent = st.itemMissNote || window.I18N.t("weapon_roll_item_none");
        panel.appendChild(missMsg);
      }

      if (st.item) {
        var itemResult = document.createElement("p");
        itemResult.className = "threat-ref-body weapon-roll-result";
        itemResult.textContent = window.I18N.t("weapon_roll_item_result", {
          die: st.itemDie,
          name: Weapons.localizedText(st.item.name),
          rarity: st.item.rarity,
        });
        panel.appendChild(itemResult);

        var noteSkill = getItemSkillRefs(category, st.item).filter(function (s) {
          return s.kind === "note";
        })[0];
        if (noteSkill) {
          var noteP = document.createElement("p");
          noteP.className = "threat-ref-body weapon-roll-result weapon-roll-note";
          noteP.textContent = Weapons.localizedText(noteSkill.text);
          panel.appendChild(noteP);
        }

        var needsSkillRoll = getItemSkillRefs(category, st.item).some(function (s) {
          return s.kind === "random";
        });

        if (needsSkillRoll) {
          var hasNamedTables = category.namedSkillTables && category.namedSkillTables.length;

          if (hasNamedTables && !st.skillId) {
            var tableIndexByLetter = {};
            category.namedSkillTables.forEach(function (t, idx) {
              var letter = (Weapons.localizedText(t.title).match(/[（(]([A-Z])[）)]/) || [])[1];
              if (letter) tableIndexByLetter[letter] = idx;
            });
            if (st.skillTableLetter && !(st.skillTableLetter in tableIndexByLetter)) st.skillTableLetter = null;
            if (!st.skillTableLetter) {
              var firstLetter = Object.keys(tableIndexByLetter)[0];
              st.skillTableLetter = firstLetter || null;
            }

            if (st.skillTableLetter) {
              var tableNoteP = document.createElement("p");
              tableNoteP.className = "threat-ref-body weapon-roll-result weapon-roll-note";
              tableNoteP.textContent = window.I18N.t("weapon_roll_skill_table_auto_note", { table: st.skillTableLetter });
              panel.appendChild(tableNoteP);
            }

            var tableSelectRow = document.createElement("div");
            tableSelectRow.className = "weapon-roll-row";
            var tblLabel = document.createElement("label");
            tblLabel.textContent = window.I18N.t("weapon_roll_skill_table_label");
            var tblSelect = document.createElement("select");
            category.namedSkillTables.forEach(function (t) {
              var letter = (Weapons.localizedText(t.title).match(/[（(]([A-Z])[）)]/) || [])[1];
              var opt = document.createElement("option");
              opt.value = letter || Weapons.localizedText(t.title);
              opt.textContent = Weapons.localizedText(t.title);
              if (opt.value === st.skillTableLetter) opt.selected = true;
              tblSelect.appendChild(opt);
            });
            tblSelect.addEventListener("change", function () {
              st.skillTableLetter = tblSelect.value;
            });
            tblLabel.appendChild(tblSelect);
            tableSelectRow.appendChild(tblLabel);
            panel.appendChild(tableSelectRow);
          }

          var step3Btn = document.createElement("button");
          step3Btn.type = "button";
          step3Btn.className = "primary-btn";
          step3Btn.textContent = window.I18N.t("weapon_roll_step3_button");
          step3Btn.disabled = !!st.skillId;
          step3Btn.addEventListener("click", function () {
            if (hasNamedTables) {
              var d1 = rollD6();
              var d2 = rollD6();
              st.skillDice = [d1, d2];
              var tableIndexByLetter2 = {};
              category.namedSkillTables.forEach(function (t, idx) {
                var letter = (Weapons.localizedText(t.title).match(/[（(]([A-Z])[）)]/) || [])[1];
                if (letter) tableIndexByLetter2[letter] = idx;
              });
              var idx = st.skillTableLetter !== null ? tableIndexByLetter2[st.skillTableLetter] : undefined;
              var table = idx !== undefined ? category.namedSkillTables[idx] : null;
              var row = table ? resolveNamedTableRoll(table, d1, d2) : null;
              st.skillId = row ? row.id : null;
              st.skillMissMessage = !row;
            } else {
              var d = rollD6();
              st.skillDice = [d];
              var row2 = resolveSimpleTableRoll(category, d);
              st.skillId = row2 ? row2.id : null;
              st.skillMissMessage = !row2;
            }
            renderWeaponRollField();
          });
          panel.appendChild(step3Btn);

          if (st.skillMissMessage) {
            var skillMissMsg = document.createElement("p");
            skillMissMsg.className = "threat-ref-body weapon-roll-result";
            skillMissMsg.textContent = window.I18N.t("weapon_roll_item_none");
            panel.appendChild(skillMissMsg);
          }

          if (st.skillId) {
            var resolvedSkill = Weapons.getSkill(st.skillId);
            var skillResult = document.createElement("p");
            skillResult.className = "threat-ref-body weapon-roll-result";
            skillResult.textContent = window.I18N.t("weapon_roll_skill_result", {
              dice: st.skillDice.join("、"),
              name: resolvedSkill ? Weapons.localizedText(resolvedSkill.name) : st.skillId,
            });
            panel.appendChild(skillResult);
          }
        }

        var confirmReady = !needsSkillRoll || !!st.skillId;
        var confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.className = "primary-btn";
        confirmBtn.textContent = window.I18N.t("weapon_roll_confirm_button");
        confirmBtn.disabled = !confirmReady;
        confirmBtn.addEventListener("click", function () {
          var c = findCharacter(activeCharacterId);
          if (!c) return;
          if (!c.weaponIds) c.weaponIds = [];
          var newInstanceId = makeWeaponInstanceId(st.item.id, c);
          c.weaponIds.push(newInstanceId);
          if (st.skillId) {
            if (!c.weaponRandomSkills) c.weaponRandomSkills = {};
            c.weaponRandomSkills[newInstanceId] = st.skillId;
          }
          saveFn();
          resetWeaponRollState();
          field.dataset.open = "0";
          renderWeaponRollField();
          renderWeaponList();
        });
        panel.appendChild(confirmBtn);
      }
    }

    var resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = window.I18N.t("weapon_roll_reset_button");
    resetBtn.addEventListener("click", function () {
      var keepCategoryId = st.categoryId;
      var keepStarCount = st.starCount;
      resetWeaponRollState();
      weaponRollState.categoryId = keepCategoryId;
      weaponRollState.starCount = keepStarCount;
      renderWeaponRollField();
    });
    panel.appendChild(resetBtn);

    field.appendChild(panel);
  }

  // タリスマン（装飾品）：武器と異なり単体でPassive効果を1つ持つだけの単純な構造。
  function renderTalismanCard(container, talismanId, c, onRemoved) {
    var talisman = Talismans.get(talismanId);
    if (!talisman) return;

    var card = document.createElement("div");
    card.className = "relic-candidate-card";

    var title = document.createElement("div");
    title.className = "relic-candidate-name";
    title.textContent = Talismans.localizedText(talisman.name);
    card.appendChild(title);

    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = Talismans.localizedText(talisman.body);
    card.appendChild(body);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = window.I18N.t("weapon_remove_button");
    removeBtn.addEventListener("click", function () {
      c.talismanIds.splice(c.talismanIds.indexOf(talismanId), 1);
      saveFn();
      (onRemoved || renderTalismanList)();
    });
    card.appendChild(removeBtn);

    container.appendChild(card);
  }

  function renderTalismanList() {
    var c = findCharacter(activeCharacterId);
    var container = document.getElementById("talisman-list");
    if (!container) return;
    container.innerHTML = "";
    if (!c) return;
    (c.talismanIds || []).forEach(function (id) {
      renderTalismanCard(container, id, c);
    });
  }

  function renderTalismanSearchResults(query) {
    var results = document.getElementById("talisman-search-results");
    if (!results) return;
    results.innerHTML = "";
    var matches = Talismans.search(query);
    if (matches.length === 0) {
      results.hidden = true;
      return;
    }
    results.hidden = false;
    matches.slice(0, 8).forEach(function (t) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "weapon-search-item";
      item.textContent = Talismans.localizedText(t.name);
      item.addEventListener("click", function () {
        var c = findCharacter(activeCharacterId);
        if (!c) return;
        if (!c.talismanIds) c.talismanIds = [];
        if (c.talismanIds.indexOf(t.id) === -1) c.talismanIds.push(t.id);
        saveFn();
        renderTalismanList();
        var input = document.getElementById("talisman-search-input");
        input.value = "";
        results.innerHTML = "";
        results.hidden = true;
      });
      results.appendChild(item);
    });
  }

  // 消耗品：タリスマンと似た単純な構造だが、持有數（所持数）を持つ点が異なる。
  function renderConsumableCard(container, consumableId, c, onRemoved) {
    var consumable = Consumables.get(consumableId);
    if (!consumable) return;

    var card = document.createElement("div");
    card.className = "relic-candidate-card";

    var title = document.createElement("div");
    title.className = "relic-candidate-name";
    title.textContent = Consumables.localizedText(consumable.name);
    card.appendChild(title);

    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = Consumables.localizedText(consumable.body);
    card.appendChild(body);

    var countRow = document.createElement("div");
    countRow.className = "consumable-count-row";
    var countLabel = document.createElement("span");
    countLabel.textContent = window.I18N.t("consumable_count_label");
    countRow.appendChild(countLabel);
    var countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = "0";
    countInput.value = String(c.consumableCounts[consumableId] || 0);
    countInput.addEventListener("change", function () {
      var n = parseInt(countInput.value, 10);
      if (isNaN(n) || n < 0) n = 0;
      c.consumableCounts[consumableId] = n;
      saveFn();
    });
    countRow.appendChild(countInput);
    card.appendChild(countRow);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = window.I18N.t("weapon_remove_button");
    removeBtn.addEventListener("click", function () {
      delete c.consumableCounts[consumableId];
      saveFn();
      (onRemoved || renderConsumableList)();
    });
    card.appendChild(removeBtn);

    container.appendChild(card);
  }

  function renderConsumableList() {
    var c = findCharacter(activeCharacterId);
    var container = document.getElementById("consumable-list");
    if (!container) return;
    container.innerHTML = "";
    if (!c) return;
    Object.keys(c.consumableCounts || {}).forEach(function (id) {
      renderConsumableCard(container, id, c);
    });
  }

  function renderConsumableSearchResults(query) {
    var results = document.getElementById("consumable-search-results");
    if (!results) return;
    results.innerHTML = "";
    var matches = Consumables.search(query);
    if (matches.length === 0) {
      results.hidden = true;
      return;
    }
    results.hidden = false;
    matches.slice(0, 8).forEach(function (i) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "weapon-search-item";
      item.textContent = Consumables.localizedText(i.name);
      item.addEventListener("click", function () {
        var c = findCharacter(activeCharacterId);
        if (!c) return;
        if (!c.consumableCounts) c.consumableCounts = {};
        if (!c.consumableCounts[i.id]) c.consumableCounts[i.id] = 1;
        saveFn();
        renderConsumableList();
        var input = document.getElementById("consumable-search-input");
        input.value = "";
        results.innerHTML = "";
        results.hidden = true;
      });
      results.appendChild(item);
    });
  }

  var characters = [];
  var activeCharacterId = null;
  var activeSkillsCharacterId = null;
  var activeWeaponDetailCharacterId = null;
  var activeWeaponDetailWeaponId = null;
  var activeTalismanDetailCharacterId = null;
  var activeTalismanDetailTalismanId = null;
  var activeConsumableDetailCharacterId = null;
  var activeConsumableDetailConsumableId = null;
  var saveFn = function () {};
  var onChangeFn = function () {};
  var renderRosterFn = function () {};

  function newCharacter(name, typeId) {
    return {
      id: "c" + Date.now() + Math.floor(Math.random() * 1000),
      name: name,
      typeId: typeId || null,
      entered: false,
      hp: { current: 0, max: 0 },
      fp: { current: 0, max: 0 },
      notes: [],
      status: [],
      equipment: [],
      weapons: [],
      skills: [],
      items: [],
      level: 1,
      hpValue: 30,
      runes: 0,
      blessingSlots: { current: 0, max: 0 },
      flaskBase: { used: 0, max: 3 },
      flaskExtra: { used: 0, max: 0 },
      revivalCount: 0,
      talismans: [],
      buildup: [],
      abilityUses: {},
      dicePool: [],
      learnedRelicEffects: [],
      learnedAttachedEffects: [],
      weaponIds: [],
      weaponRandomSkills: {},
      weaponNotes: {},
      weaponExtraSkills: {},
      equippedWeaponIds: [],
      talismanIds: [],
      consumableCounts: {},
    };
  }

  // 旧データ互換: 新フィールドが無い既存キャラクターに初期値を補完する
  function ensureDefaults(c) {
    var fallback = newCharacter(c.name, c.typeId);
    Object.keys(fallback).forEach(function (key) {
      if (c[key] === undefined) c[key] = fallback[key];
    });
    return c;
  }

  function findCharacter(id) {
    return (
      characters.filter(function (c) {
        return c.id === id;
      })[0] || null
    );
  }

  function renderTagList(field) {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    var container = document.getElementById("tag-list-" + field);
    if (!container) return;
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
        saveFn();
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
    saveFn();
    renderTagList(field);
  }

  // 1つのアビリティ/スキル/アーツ/遺物効果を折りたたみ表示（クリックで詳細展開）で描画する。
  // レベル未到達なら表示しない。使用回数がある場合は残り回数の増減ボタンも付ける。
  function renderAbilityEntry(container, entry, c) {
    if (entry.level && c.level < entry.level) return;
    var details = document.createElement("details");
    details.className = "ability-entry";
    var summary = document.createElement("summary");
    summary.textContent =
      CharacterTypes.localizedText(entry.name) +
      "［" + entry.kind + "］" +
      (entry.level ? "　" + window.I18N.t("ability_level_label", { level: entry.level }) : "");
    details.appendChild(summary);

    var body = document.createElement("p");
    body.className = "threat-ref-body";
    body.textContent = CharacterTypes.localizedText(entry.body);
    details.appendChild(body);

    if (entry.uses && entry.id) {
      var usesRow = document.createElement("div");
      usesRow.className = "level-control ability-uses";

      var label = document.createElement("span");
      label.className = "ability-uses-label";
      label.textContent = window.I18N.t("ability_uses_label");

      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "level-btn";
      minus.textContent = "-";

      var value = document.createElement("span");
      value.className = "level-value";

      var plus = document.createElement("button");
      plus.type = "button";
      plus.className = "level-btn";
      plus.textContent = "+";

      function remaining() {
        var v = c.abilityUses && c.abilityUses[entry.id];
        return typeof v === "number" ? v : entry.uses;
      }
      function renderVal() {
        value.textContent = remaining() + "/" + entry.uses;
      }
      renderVal();
      minus.addEventListener("click", function () {
        if (!c.abilityUses) c.abilityUses = {};
        c.abilityUses[entry.id] = Math.max(0, remaining() - 1);
        renderVal();
        saveFn();
      });
      plus.addEventListener("click", function () {
        if (!c.abilityUses) c.abilityUses = {};
        c.abilityUses[entry.id] = Math.min(entry.uses, remaining() + 1);
        renderVal();
        saveFn();
      });

      usesRow.appendChild(label);
      usesRow.appendChild(minus);
      usesRow.appendChild(value);
      usesRow.appendChild(plus);
      details.appendChild(usesRow);
    }

    container.appendChild(details);
  }

  // type（夜渡りタイプ）の全アビリティ/スキル/アーツ/遺物効果を
  // 「可発動技能（Action/Defense）」「被動能力（Passive）」の2コンテナに振り分けて描画する。
  function renderAbilitySections(c, type, activeContainer, passiveContainer) {
    activeContainer.innerHTML = "";
    passiveContainer.innerHTML = "";
    if (!type) return;
    var entries = [].concat(type.abilities || []).concat(type.skills || []).concat(type.arts || []);
    var learned = c.learnedRelicEffects || [];
    (type.relicEffectGroups || []).forEach(function (g, gi) {
      g.effects.forEach(function (e, ei) {
        if (learned.indexOf(relicEffectKey(type.id, gi, ei)) !== -1) entries.push(e);
      });
    });
    entries.forEach(function (entry) {
      renderAbilityEntry(entry.kind === "Passive" ? passiveContainer : activeContainer, entry, c);
    });
  }

  // タイプの基本数値（体力骰・リソース枠数・判定値・威力補正・得意武器＋任意で初期装備）を、
  // 本体ドロワーの参照欄と、画像クリックで開くスキル発動ウィンドウの両方から使う共通の行配列。
  function buildTypeStatLines(type, includeStartingEquipment) {
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
      window.I18N.t("stat_favored_weapons") + window.I18N.t("colon_separator") + CharacterTypes.localizedText(type.favoredWeapons),
    ];
    if (includeStartingEquipment) {
      lines.push(
        window.I18N.t("stat_starting_equipment") + window.I18N.t("colon_separator") + CharacterTypes.localizedText(type.startingEquipment)
      );
    }
    return lines;
  }

  function renderTypeReference(c) {
    var block = document.getElementById("type-reference-block");
    var type = c.typeId ? CharacterTypes.get(c.typeId) : null;
    var badge = document.getElementById("character-type-badge");
    if (badge) {
      badge.textContent = type
        ? window.I18N.t("character_type_label") + window.I18N.t("colon_separator") + CharacterTypes.localizedName(type.name)
        : "";
    }
    var portrait = document.getElementById("character-portrait");
    if (portrait) {
      var src = type ? CharacterTypes.imagePath(type) : null;
      if (src) {
        portrait.src = src;
        portrait.alt = CharacterTypes.localizedName(type.name);
        portrait.hidden = false;
      } else {
        portrait.hidden = true;
      }
    }
    if (!block) return;
    if (!type) {
      block.hidden = true;
      document.getElementById("type-active-skills").innerHTML = "";
      document.getElementById("type-passives").innerHTML = "";
      return;
    }
    block.hidden = false;
    document.getElementById("type-reference-title").textContent = CharacterTypes.localizedName(type.name);
    document.getElementById("type-reference-stats").textContent = buildTypeStatLines(type, true).join("\n");

    renderAbilitySections(c, type, document.getElementById("type-active-skills"), document.getElementById("type-passives"));
  }

  function renderCharacterDicePool() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    var listEl = document.getElementById("char-dice-pool-list");
    if (!listEl) return;
    renderDicePool(
      listEl,
      c.dicePool,
      function (index) {
        c.dicePool.splice(index, 1);
        saveFn();
        renderCharacterDicePool();
      },
      document.getElementById("btn-char-dice-add")
    );
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
    document.getElementById("char-level").value = c.level;
    document.getElementById("char-runes").value = c.runes;
    document.getElementById("char-hp-value").value = c.hpValue;
    document.getElementById("char-blessing-current").value = c.blessingSlots.current;
    document.getElementById("char-blessing-max").value = c.blessingSlots.max;
    document.getElementById("char-flask-base-used").value = c.flaskBase.used;
    document.getElementById("char-flask-base-max").value = c.flaskBase.max;
    document.getElementById("char-flask-extra-used").value = c.flaskExtra.used;
    document.getElementById("char-flask-extra-max").value = c.flaskExtra.max;
    document.getElementById("char-revival-count").value = c.revivalCount;
    TAG_FIELDS.forEach(renderTagList);
    relicRolledDice = null;
    relicShowAll = false;
    attachedRollResult = null;
    attachedPendingCandidate = null;
    attachedShowAll = false;
    renderTypeReference(c);
    renderCharacterDicePool();
    renderRelicSection();
    renderLevelBonusMarkers(c);
    renderLevelNextCostMarker(c);
    renderRevivalBonusMarkers(c);
    renderAttachedSection();
    renderWeaponList();
    resetWeaponRollState();
    var weaponRollField = document.getElementById("weapon-roll-field");
    if (weaponRollField) weaponRollField.dataset.open = "0";
    renderWeaponRollField();
    var weaponSearchInput = document.getElementById("weapon-search-input");
    if (weaponSearchInput) {
      weaponSearchInput.value = "";
      weaponSearchInput.placeholder = window.I18N.t("weapon_search_placeholder");
    }
    var weaponSearchResults = document.getElementById("weapon-search-results");
    if (weaponSearchResults) weaponSearchResults.hidden = true;

    renderTalismanList();
    var talismanSearchInput = document.getElementById("talisman-search-input");
    if (talismanSearchInput) {
      talismanSearchInput.value = "";
      talismanSearchInput.placeholder = window.I18N.t("talisman_search_placeholder");
    }
    var talismanSearchResults = document.getElementById("talisman-search-results");
    if (talismanSearchResults) talismanSearchResults.hidden = true;

    renderConsumableList();
    var consumableSearchInput = document.getElementById("consumable-search-input");
    if (consumableSearchInput) {
      consumableSearchInput.value = "";
      consumableSearchInput.placeholder = window.I18N.t("consumable_search_placeholder");
    }
    var consumableSearchResults = document.getElementById("consumable-search-results");
    if (consumableSearchResults) consumableSearchResults.hidden = true;

    document.getElementById("character-drawer").classList.add("open");
  }

  function closeDrawer() {
    document.getElementById("character-drawer").classList.remove("open");
    activeCharacterId = null;
    onChangeFn();
  }

  // 角色画像クリックで左からスライドインする、可発動技能／被動能力だけの閲覧専用パネル
  function openSkillsDrawer(id) {
    var c = findCharacter(id);
    if (!c) return;
    activeSkillsCharacterId = id;
    // 補充説明タグ（notes）はこのスキル発動ウィンドウ最上部に表示するため、
    // ここから直接開かれた場合（本体ドロワーを経由しない盤面ロスターからの導線）にも
    // 対象キャラクターを反映できるよう、activeCharacterIdもここで合わせておく。
    activeCharacterId = id;
    var type = c.typeId ? CharacterTypes.get(c.typeId) : null;
    document.getElementById("skills-drawer-name").textContent =
      c.name + (type ? "（" + CharacterTypes.localizedName(type.name) + "）" : "");
    var statsBlock = document.getElementById("skills-drawer-stats-block");
    if (statsBlock) {
      if (type) {
        statsBlock.hidden = false;
        document.getElementById("skills-drawer-stats-title").textContent = window.I18N.t("stat_block_title");
        document.getElementById("skills-drawer-stats").textContent = buildTypeStatLines(type, false).join("\n");
      } else {
        statsBlock.hidden = true;
      }
    }
    renderTagList("notes");
    renderAbilitySections(c, type, document.getElementById("skills-drawer-active"), document.getElementById("skills-drawer-passive"));
    document.getElementById("skills-drawer").classList.add("open");
  }

  function closeSkillsDrawer() {
    document.getElementById("skills-drawer").classList.remove("open");
    activeSkillsCharacterId = null;
  }

  // 盤面ロスターの武器要約をクリックすると左からスライドインする、単一武器の詳細閲覧パネル
  function openWeaponDetailDrawer(characterId, weaponId) {
    var c = findCharacter(characterId);
    if (!c) return;
    activeWeaponDetailCharacterId = characterId;
    activeWeaponDetailWeaponId = weaponId;
    renderWeaponDetailDrawer();
    document.getElementById("weapon-detail-drawer").classList.add("open");
  }

  function renderWeaponDetailDrawer() {
    var c = findCharacter(activeWeaponDetailCharacterId);
    var container = document.getElementById("weapon-detail-drawer-body");
    if (!container) return;
    container.innerHTML = "";
    if (!c || !activeWeaponDetailWeaponId) return;
    renderWeaponCard(container, activeWeaponDetailWeaponId, c, function () {
      closeWeaponDetailDrawer();
      renderWeaponList();
      if (renderRosterFn) renderRosterFn();
    });
  }

  function closeWeaponDetailDrawer() {
    document.getElementById("weapon-detail-drawer").classList.remove("open");
    activeWeaponDetailCharacterId = null;
    activeWeaponDetailWeaponId = null;
  }

  // 盤面ロスターの裝飾品要約をクリックすると左からスライドインする、単一タリスマンの詳細閲覧パネル
  function openTalismanDetailDrawer(characterId, talismanId) {
    var c = findCharacter(characterId);
    if (!c) return;
    activeTalismanDetailCharacterId = characterId;
    activeTalismanDetailTalismanId = talismanId;
    renderTalismanDetailDrawer();
    document.getElementById("talisman-detail-drawer").classList.add("open");
  }

  function renderTalismanDetailDrawer() {
    var c = findCharacter(activeTalismanDetailCharacterId);
    var container = document.getElementById("talisman-detail-drawer-body");
    if (!container) return;
    container.innerHTML = "";
    if (!c || !activeTalismanDetailTalismanId) return;
    renderTalismanCard(container, activeTalismanDetailTalismanId, c, function () {
      closeTalismanDetailDrawer();
      renderTalismanList();
      if (renderRosterFn) renderRosterFn();
    });
  }

  function closeTalismanDetailDrawer() {
    document.getElementById("talisman-detail-drawer").classList.remove("open");
    activeTalismanDetailCharacterId = null;
    activeTalismanDetailTalismanId = null;
  }

  // 盤面ロスターの消耗品要約をクリックすると左からスライドインする、単一消耗品の詳細閲覧パネル
  function openConsumableDetailDrawer(characterId, consumableId) {
    var c = findCharacter(characterId);
    if (!c) return;
    activeConsumableDetailCharacterId = characterId;
    activeConsumableDetailConsumableId = consumableId;
    renderConsumableDetailDrawer();
    document.getElementById("consumable-detail-drawer").classList.add("open");
  }

  function renderConsumableDetailDrawer() {
    var c = findCharacter(activeConsumableDetailCharacterId);
    var container = document.getElementById("consumable-detail-drawer-body");
    if (!container) return;
    container.innerHTML = "";
    if (!c || !activeConsumableDetailConsumableId) return;
    renderConsumableCard(container, activeConsumableDetailConsumableId, c, function () {
      closeConsumableDetailDrawer();
      renderConsumableList();
      if (renderRosterFn) renderRosterFn();
    });
  }

  function closeConsumableDetailDrawer() {
    document.getElementById("consumable-detail-drawer").classList.remove("open");
    activeConsumableDetailCharacterId = null;
    activeConsumableDetailConsumableId = null;
  }

  function bindFieldSave(elId, apply) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.addEventListener("change", function (e) {
      var c = findCharacter(activeCharacterId);
      if (!c) return;
      apply(c, e.target);
      saveFn();
      if (elId === "char-entered") onChangeFn();
      if (elId === "char-level") {
        relicRolledDice = null;
        renderTypeReference(c);
        renderRelicSection();
        renderLevelBonusMarkers(c);
        renderLevelNextCostMarker(c);
      }
    });
  }

  function handleDeleteCharacter() {
    var c = findCharacter(activeCharacterId);
    if (!c) return;
    if (!window.confirm(window.I18N.t("character_confirm_delete", { name: c.name }))) return;
    characters.splice(characters.indexOf(c), 1);
    saveFn();
    closeDrawer();
  }

  function bindEvents() {
    // 各ドロワー中央の細長い折りたたみタブ：data-close-btnが指す既存の閉じるボタンを
    // クリックしたことにして、状態リセットを含む既存のクローズ処理をそのまま再利用する。
    document.querySelectorAll(".drawer-close-tab[data-close-btn]").forEach(function (tab) {
      var targetBtn = document.getElementById(tab.dataset.closeBtn);
      if (targetBtn) tab.addEventListener("click", targetBtn.click.bind(targetBtn));
    });
    document.getElementById("btn-character-close").addEventListener("click", closeDrawer);
    document.getElementById("character-drawer-backdrop").addEventListener("click", closeDrawer);
    document.getElementById("btn-delete-character").addEventListener("click", handleDeleteCharacter);
    document.getElementById("character-portrait").addEventListener("click", function () {
      if (activeCharacterId) openSkillsDrawer(activeCharacterId);
    });
    document.getElementById("btn-skills-drawer-close").addEventListener("click", closeSkillsDrawer);
    document.getElementById("skills-drawer-backdrop").addEventListener("click", closeSkillsDrawer);
    var weaponDetailCloseBtn = document.getElementById("btn-weapon-detail-drawer-close");
    var weaponDetailBackdrop = document.getElementById("weapon-detail-drawer-backdrop");
    if (weaponDetailCloseBtn) weaponDetailCloseBtn.addEventListener("click", closeWeaponDetailDrawer);
    if (weaponDetailBackdrop) weaponDetailBackdrop.addEventListener("click", closeWeaponDetailDrawer);
    var talismanDetailCloseBtn = document.getElementById("btn-talisman-detail-drawer-close");
    var talismanDetailBackdrop = document.getElementById("talisman-detail-drawer-backdrop");
    if (talismanDetailCloseBtn) talismanDetailCloseBtn.addEventListener("click", closeTalismanDetailDrawer);
    if (talismanDetailBackdrop) talismanDetailBackdrop.addEventListener("click", closeTalismanDetailDrawer);
    var consumableDetailCloseBtn = document.getElementById("btn-consumable-detail-drawer-close");
    var consumableDetailBackdrop = document.getElementById("consumable-detail-drawer-backdrop");
    if (consumableDetailCloseBtn) consumableDetailCloseBtn.addEventListener("click", closeConsumableDetailDrawer);
    if (consumableDetailBackdrop) consumableDetailBackdrop.addEventListener("click", closeConsumableDetailDrawer);
    document.getElementById("btn-char-dice-add").addEventListener("click", function () {
      var c = findCharacter(activeCharacterId);
      if (!c || c.dicePool.length >= MAX_DICE_POOL) return;
      c.dicePool.push(rollD6());
      saveFn();
      renderCharacterDicePool();
    });
    document.getElementById("btn-relic-roll").addEventListener("click", handleRelicRoll);
    document.getElementById("btn-relic-toggle-all").addEventListener("click", function () {
      relicShowAll = !relicShowAll;
      renderRelicAllList();
    });
    document.getElementById("btn-attached-roll-2d").addEventListener("click", handleAttachedRoll2D);
    document.getElementById("btn-attached-toggle-all").addEventListener("click", function () {
      attachedShowAll = !attachedShowAll;
      renderAttachedAllList();
    });
    var weaponSearchEl = document.getElementById("weapon-search-input");
    if (weaponSearchEl) {
      weaponSearchEl.addEventListener("input", function (e) {
        renderWeaponSearchResults(e.target.value);
      });
    }
    var talismanSearchEl = document.getElementById("talisman-search-input");
    if (talismanSearchEl) {
      talismanSearchEl.addEventListener("input", function (e) {
        renderTalismanSearchResults(e.target.value);
      });
    }
    var consumableSearchEl = document.getElementById("consumable-search-input");
    if (consumableSearchEl) {
      consumableSearchEl.addEventListener("input", function (e) {
        renderConsumableSearchResults(e.target.value);
      });
    }

    document.querySelectorAll(".tag-add-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addTag(btn.getAttribute("data-field"));
      });
    });
    TAG_FIELDS.forEach(function (field) {
      var input = document.getElementById("tag-input-" + field);
      if (!input) return;
      input.addEventListener("keydown", function (e) {
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
    bindFieldSave("char-level", function (c, el) {
      c.level = Math.max(1, Math.min(LEVEL_CAP, Number(el.value) || 1));
      el.value = c.level;
    });
    bindFieldSave("char-runes", function (c, el) {
      c.runes = Number(el.value) || 0;
    });
    bindFieldSave("char-hp-value", function (c, el) {
      c.hpValue = Number(el.value) || 0;
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
      renderRevivalBonusMarkers(c);
    });

    window.addEventListener("i18n:change", function () {
      if (activeCharacterId) openDrawer(activeCharacterId);
      if (activeSkillsCharacterId) openSkillsDrawer(activeSkillsCharacterId);
      if (activeWeaponDetailCharacterId && activeWeaponDetailWeaponId) renderWeaponDetailDrawer();
      if (activeTalismanDetailCharacterId && activeTalismanDetailTalismanId) renderTalismanDetailDrawer();
      if (activeConsumableDetailCharacterId && activeConsumableDetailConsumableId) renderConsumableDetailDrawer();
    });
  }

  function init(options) {
    characters = options.characters;
    saveFn = options.save;
    onChangeFn = options.onChange || function () {};
    renderRosterFn = options.renderRoster || function () {};
    bindEvents();
  }

  window.PriTestCharacterDrawer = {
    init: init,
    open: openDrawer,
    close: closeDrawer,
    openSkills: openSkillsDrawer,
    closeSkills: closeSkillsDrawer,
    newCharacter: newCharacter,
    ensureDefaults: ensureDefaults,
    renderAbilitySections: renderAbilitySections,
    rollD6: rollD6,
    renderDicePool: renderDicePool,
    renderDiceDisplay: renderDiceDisplay,
    MAX_DICE_POOL: MAX_DICE_POOL,
    renderRosterWeaponList: renderRosterWeaponList,
    renderRosterTalismanList: renderRosterTalismanList,
    renderRosterConsumableList: renderRosterConsumableList,
  };
})();
