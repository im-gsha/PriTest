(function () {
  // characters.js（角色一覧ページ）と night.js（盤面ページ）の両方から
  // 使う共通のキャラクタードロワー（編集モーダル）ロジック。
  // 呼び出し側は init({ characters, save, onChange }) でこのモジュールに
  // 自分の characters 配列（参照）と永続化関数を渡す。
  var CharacterTypes = window.PriTestCharacterTypes;
  var Weapons = window.PriTestWeapons;
  var TAG_FIELDS = ["notes", "status", "equipment", "weapons", "skills", "items", "talismans", "buildup"];
  var MAX_DICE_POOL = 20;

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

  // --- 武器データベース検索＆選択（武器欄に既存の自由記述タグとは別枠で追加する） ---
  // ※ランダム戦技: 決定表が未確認のため、既知の戦技一覧から検索して手動で割り当てる
  function renderRandomSkillPicker(container, weaponId, c) {
    var resolvedId = c.weaponRandomSkills && c.weaponRandomSkills[weaponId];
    if (resolvedId) {
      var resolved = Weapons.getSkill(resolvedId);
      var details = document.createElement("details");
      details.className = "ability-entry";
      var summary = document.createElement("summary");
      summary.textContent =
        window.I18N.t("weapon_random_skill_label") +
        "　→　" +
        (resolved ? Weapons.localizedText(resolved.name) + (resolved.kind ? "［" + resolved.kind + "］" : "") : resolvedId);
      details.appendChild(summary);
      if (resolved && resolved.body) {
        var p = document.createElement("p");
        p.className = "threat-ref-body";
        p.textContent = Weapons.localizedText(resolved.body);
        details.appendChild(p);
      }
      var clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.textContent = window.I18N.t("weapon_random_skill_clear_button");
      clearBtn.addEventListener("click", function () {
        delete c.weaponRandomSkills[weaponId];
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
    container.appendChild(wrap);
  }

  function renderWeaponSkillEntry(container, ref, weaponId, c) {
    if (ref.kind === "random") {
      renderRandomSkillPicker(container, weaponId, c);
      return;
    }
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
    } else if (ref.kind === "bonus") {
      name = Weapons.localizedText(ref.text);
      body = "";
    } else {
      name = window.I18N.t("weapon_note_label");
      body = Weapons.localizedText(ref.text);
    }

    var details = document.createElement("details");
    details.className = "ability-entry";
    var summary = document.createElement("summary");
    summary.textContent = name + (kind ? "［" + kind + "］" : "");
    details.appendChild(summary);
    if (body) {
      var p = document.createElement("p");
      p.className = "threat-ref-body";
      p.textContent = body;
      details.appendChild(p);
    }
    container.appendChild(details);
  }

  function renderWeaponCard(container, weaponId, c) {
    var weapon = Weapons.get(weaponId);
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

    if (category) {
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

    (weapon.skills || []).forEach(function (ref) {
      renderWeaponSkillEntry(card, ref, weaponId, c);
    });

    if (category && category.innateSkills && category.innateSkills.length) {
      var innateTitle = document.createElement("p");
      innateTitle.className = "boss-subheading";
      innateTitle.textContent = window.I18N.t("weapon_innate_skills_label");
      card.appendChild(innateTitle);
      category.innateSkills.forEach(function (s) {
        renderWeaponSkillEntry(card, { kind: "innate", id: s.id });
      });
    }

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = window.I18N.t("weapon_remove_button");
    removeBtn.addEventListener("click", function () {
      c.weaponIds.splice(c.weaponIds.indexOf(weaponId), 1);
      if (c.weaponRandomSkills) delete c.weaponRandomSkills[weaponId];
      saveFn();
      renderWeaponList();
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
        if (c.weaponIds.indexOf(w.id) === -1) c.weaponIds.push(w.id);
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

  var characters = [];
  var activeCharacterId = null;
  var saveFn = function () {};
  var onChangeFn = function () {};

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
      window.I18N.t("stat_starting_equipment") + window.I18N.t("colon_separator") + CharacterTypes.localizedText(type.startingEquipment),
    ];
    document.getElementById("type-reference-stats").textContent = lines.join("\n");

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
    renderAttachedSection();
    renderWeaponList();
    var weaponSearchInput = document.getElementById("weapon-search-input");
    if (weaponSearchInput) {
      weaponSearchInput.value = "";
      weaponSearchInput.placeholder = window.I18N.t("weapon_search_placeholder");
    }
    var weaponSearchResults = document.getElementById("weapon-search-results");
    if (weaponSearchResults) weaponSearchResults.hidden = true;

    document.getElementById("character-drawer").classList.add("open");
  }

  function closeDrawer() {
    document.getElementById("character-drawer").classList.remove("open");
    activeCharacterId = null;
    onChangeFn();
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
    document.getElementById("btn-character-close").addEventListener("click", closeDrawer);
    document.getElementById("character-drawer-backdrop").addEventListener("click", closeDrawer);
    document.getElementById("btn-delete-character").addEventListener("click", handleDeleteCharacter);
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

    window.addEventListener("i18n:change", function () {
      if (activeCharacterId) openDrawer(activeCharacterId);
    });
  }

  function init(options) {
    characters = options.characters;
    saveFn = options.save;
    onChangeFn = options.onChange || function () {};
    bindEvents();
  }

  window.PriTestCharacterDrawer = {
    init: init,
    open: openDrawer,
    close: closeDrawer,
    newCharacter: newCharacter,
    ensureDefaults: ensureDefaults,
    renderAbilitySections: renderAbilitySections,
    rollD6: rollD6,
    renderDicePool: renderDicePool,
    MAX_DICE_POOL: MAX_DICE_POOL,
  };
})();
