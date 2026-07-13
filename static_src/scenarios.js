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
        { pos: 5, suit: "C", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 6, suit: "S", rank: "K", name: { zh: "教會（商人）", ja: "教会（商人）", en: "Church (Merchant)" } },
      ],
    },
    {
      id: "sentient_pest",
      name: { zh: "知性之蟲", ja: "知性の蟲", en: "Sentient Pest" },
      bossName: { zh: "夜之織、塔諾斯特", ja: "夜の織、タノスター", en: "Night's Weave, Tanoster" },
      relicName: { zh: "識之夜", ja: "識の夜", en: "Night of Knowledge" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "D", rank: "2", name: { zh: "大教會（隨機）", ja: "大教会（ランダム）", en: "Grand Cathedral (Random)" } },
        { pos: 2, suit: "D", rank: "3", name: { zh: "小塔（隨機）", ja: "小塔（ランダム）", en: "Small Tower (Random)" } },
        { pos: 3, suit: "D", rank: "4", name: { zh: "大野營地（隨機）", ja: "大野営地（ランダム）", en: "Main Camp (Random)" } },
        { pos: 4, suit: "D", rank: "5", name: { zh: "遺跡（隨機）", ja: "遺跡（ランダム）", en: "Ruins (Random)" } },
        { pos: 5, suit: "C", rank: "6", name: { zh: "坑道（3）", ja: "坑道（3）", en: "Tunnel (3)" } },
        { pos: 6, suit: "H", rank: "8", name: { zh: "鍛造村（隨機）", ja: "鍛冶村（ランダム）", en: "Smithing Village (Random)" } },
        { pos: 7, suit: "H", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 8, suit: "C", rank: "10", name: { zh: "魔術師之塔", ja: "魔術師塔", en: "Sorcerer's Tower" } },
        { pos: 9, suit: "C", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      day2: [
        { pos: 1, suit: "C", rank: "3", name: { zh: "小砦（隨機）", ja: "小砦（ランダム）", en: "Small Fort (Random)" } },
        { pos: 2, suit: "D", rank: "5", name: { zh: "遺跡", ja: "遺跡", en: "Ruins" } },
        { pos: 3, suit: "H", rank: "7", name: { zh: "濕沼（隨機）", ja: "湿沼（ランダム）", en: "Swamp (Random)" } },
        { pos: 4, suit: "C", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 5, suit: "D", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 6, suit: "D", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
    },
    {
      id: "augur",
      name: { zh: "兆頭", ja: "兆し", en: "Augur" },
      bossName: { zh: "深海之夜、瑪莉絲", ja: "深海の夜、マリス", en: "Night of the Deep, Maris" },
      relicName: { zh: "深海之夜", ja: "深海の夜", en: "Night of the Deep" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "D", rank: "2", name: { zh: "大教會（隨機）", ja: "大教会（ランダム）", en: "Grand Cathedral (Random)" } },
        { pos: 2, suit: "D", rank: "3", name: { zh: "小塔（隨機）", ja: "小塔（ランダム）", en: "Small Tower (Random)" } },
        { pos: 3, suit: "D", rank: "4", name: { zh: "大野營地（隨機）", ja: "大野営地（ランダム）", en: "Main Camp (Random)" } },
        { pos: 4, suit: "D", rank: "5", name: { zh: "遺跡（隨機）", ja: "遺跡（ランダム）", en: "Ruins (Random)" } },
        { pos: 5, suit: "C", rank: "6", name: { zh: "坑道（隨機）", ja: "坑道（ランダム）", en: "Tunnel (Random)" } },
        { pos: 6, suit: "C", rank: "7", name: { zh: "濕沼（隨機）", ja: "湿沼（ランダム）", en: "Swamp (Random)" } },
        { pos: 7, suit: "H", rank: "8", name: { zh: "鍛造村（隨機）", ja: "鍛冶村（ランダム）", en: "Smithing Village (Random)" } },
        { pos: 8, suit: "H", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 9, suit: "C", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      day2: [
        { pos: 1, suit: "C", rank: "2", name: { zh: "大教會（隨機）", ja: "大教会（ランダム）", en: "Grand Cathedral (Random)" } },
        { pos: 2, suit: "H", rank: "4", name: { zh: "大野營地（隨機）", ja: "大野営地（ランダム）", en: "Main Camp (Random)" } },
        { pos: 3, suit: "D", rank: "6", name: { zh: "坑道（隨機）", ja: "坑道（ランダム）", en: "Tunnel (Random)" } },
        { pos: 4, suit: "D", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 5, suit: "C", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 6, suit: "H", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
    },
    {
      id: "equilibrious_beast",
      name: { zh: "調律的魔物", ja: "調律の魔物", en: "Equilibrious Beast" },
      bossName: { zh: "夜之魔、莉絲拉", ja: "夜の魔、リスラ", en: "Night's Devil, Risura" },
      relicName: { zh: "魔之夜", ja: "魔の夜", en: "Night of the Devil" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "D", rank: "2", name: { zh: "大教會（隨機）", ja: "大教会（ランダム）", en: "Grand Cathedral (Random)" } },
        { pos: 2, suit: "H", rank: "4", name: { zh: "大野營地（隨機）", ja: "大野営地（ランダム）", en: "Main Camp (Random)" } },
        { pos: 3, suit: "D", rank: "6", name: { zh: "坑道（狂）", ja: "坑道（狂）", en: "Tunnel (Madness)" } },
        { pos: 4, suit: "C", rank: "7", name: { zh: "濕沼（隨機）", ja: "湿沼（ランダム）", en: "Swamp (Random)" } },
        { pos: 5, suit: "D", rank: "8", name: { zh: "鍛造村（隨機）", ja: "鍛冶村（ランダム）", en: "Smithing Village (Random)" } },
        { pos: 6, suit: "C", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 7, suit: "C", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 8, suit: "C", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
        { pos: 9, suit: "H", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      day2: [
        { pos: 1, suit: "D", rank: "4", name: { zh: "大野營地（狂）", ja: "大野営地（狂）", en: "Main Camp (Madness)" } },
        { pos: 2, suit: "C", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 3, suit: "H", rank: "10", name: { zh: "魔術師之塔", ja: "魔術師塔", en: "Sorcerer's Tower" } },
        { pos: 4, suit: "H", rank: "Q", name: { zh: "地變｜腐朽森林(1)", ja: "地変｜腐れ森(1)", en: "Terrain Shift｜Rotten Forest (1)" } },
        { pos: 5, suit: "D", rank: "Q", name: { zh: "地變｜腐朽森林(2)", ja: "地変｜腐れ森(2)", en: "Terrain Shift｜Rotten Forest (2)" } },
        { pos: 6, suit: "C", rank: "Q", name: { zh: "地變｜腐朽森林(3)", ja: "地変｜腐れ森(3)", en: "Terrain Shift｜Rotten Forest (3)" } },
      ],
      note: {
        zh: "「地變」（135頁）會自動與場地列5的3張卡置換配置，無須另外抽選。",
        ja: "「地変」（135頁）は、自動的にフィールドライン5の3枚と入れ替えて配置されることに注意。",
      },
    },
    {
      id: "darkdrift_knight",
      name: { zh: "闇馳騁的獵人", ja: "闇駆ける狩人", en: "Darkdrift Knight" },
      bossName: { zh: "夜光騎士、弗爾戈爾", ja: "夜光の騎士、フルゴール", en: "Knight of Nightglow, Fulgor" },
      relicName: { zh: "獵人之夜", ja: "狩人の夜", en: "Night of the Hunter" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "D", rank: "3", name: { zh: "小砦（隨機）", ja: "小砦（ランダム）", en: "Small Fort (Random)" } },
        { pos: 2, suit: "H", rank: "4", name: { zh: "大野營地（隨機）", ja: "大野営地（ランダム）", en: "Main Camp (Random)" } },
        { pos: 3, suit: "D", rank: "5", name: { zh: "遺跡（隨機）", ja: "遺跡（ランダム）", en: "Ruins (Random)" } },
        { pos: 4, suit: "D", rank: "6", name: { zh: "坑道（隨機）", ja: "坑道（ランダム）", en: "Tunnel (Random)" } },
        { pos: 5, suit: "H", rank: "7", name: { zh: "濕沼（隨機）", ja: "湿沼（ランダム）", en: "Swamp (Random)" } },
        { pos: 6, suit: "D", rank: "8", name: { zh: "鍛造村（雷2）", ja: "鍛冶村（雷2）", en: "Smithing Village (Lightning 2)" } },
        { pos: 7, suit: "H", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 8, suit: "D", rank: "10", name: { zh: "魔術師之塔", ja: "魔術師塔", en: "Sorcerer's Tower" } },
        { pos: 9, suit: "H", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      day2: [
        { pos: 1, suit: "C", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 2, suit: "C", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 3, suit: "H", rank: "Q", name: { zh: "地變｜山嶺(山頂)", ja: "地変｜山嶺(山頂)", en: "Terrain Shift｜Mountains (Peak)" } },
        { pos: 4, suit: "C", rank: "Q", name: { zh: "地變｜山嶺(山腰)", ja: "地変｜山嶺(中腹)", en: "Terrain Shift｜Mountains (Midslope)" } },
        { pos: 5, suit: "D", rank: "Q", name: { zh: "地變｜山嶺(山麓)", ja: "地変｜山嶺(麓)", en: "Terrain Shift｜Mountains (Foothills)" } },
        { pos: 6, suit: "C", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      note: {
        zh: "「地變」（135頁）會自動與場地列5的3張卡置換配置，無須另外抽選。",
        ja: "「地変」（135頁）は、自動的にフィールドライン5の3枚と入れ替えて配置されることに注意。",
      },
    },
    {
      id: "fissure_in_the_fog",
      name: { zh: "霧之裂縫", ja: "霧の裂け目", en: "Fissure in the Fog" },
      bossName: { zh: "夜之霞、卡里戈", ja: "夜の霞、カリゴ", en: "Night's Haze, Caligo" },
      relicName: { zh: "霞之夜", ja: "霞の夜", en: "Night of Haze" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "D", rank: "3", name: { zh: "小砦（隨機）", ja: "小砦（ランダム）", en: "Small Fort (Random)" } },
        { pos: 2, suit: "C", rank: "4", name: { zh: "大野營地（隨機）", ja: "大野営地（ランダム）", en: "Main Camp (Random)" } },
        { pos: 3, suit: "C", rank: "5", name: { zh: "遺跡（隨機）", ja: "遺跡（ランダム）", en: "Ruins (Random)" } },
        { pos: 4, suit: "C", rank: "6", name: { zh: "坑道（隨機）", ja: "坑道（ランダム）", en: "Tunnel (Random)" } },
        { pos: 5, suit: "H", rank: "7", name: { zh: "濕沼（隨機）", ja: "湿沼（ランダム）", en: "Swamp (Random)" } },
        { pos: 6, suit: "H", rank: "8", name: { zh: "鍛造村（隨機）", ja: "鍛冶村（ランダム）", en: "Smithing Village (Random)" } },
        { pos: 7, suit: "D", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 8, suit: "C", rank: "9", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 9, suit: "H", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
      ],
      day2: [
        { pos: 1, suit: "C", rank: "8", name: { zh: "鍛造村（炎）", ja: "鍛冶村（炎）", en: "Smithing Village (Fire)" } },
        { pos: 2, suit: "C", rank: "Q", name: { zh: "地變｜諾克拉提歐(最深處)", ja: "地変｜ノクラテオ(最奥)", en: "Terrain Shift｜Noklateo (Depths)" } },
        { pos: 3, suit: "D", rank: "Q", name: { zh: "地變｜諾克拉提歐(市街地)", ja: "地変｜ノクラテオ(市街地)", en: "Terrain Shift｜Noklateo (City)" } },
        { pos: 4, suit: "H", rank: "Q", name: { zh: "地變｜諾克拉提歐(入口)", ja: "地変｜ノクラテオ(玄関口)", en: "Terrain Shift｜Noklateo (Entrance)" } },
        { pos: 5, suit: "C", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
        { pos: 6, suit: "H", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      note: {
        zh: "「地變」（135頁）會自動與場地列5的3張卡置換配置，無須另外抽選。",
        ja: "「地変」（135頁）は、自動的にフィールドライン5の3枚と入れ替えて配置されることに注意。",
      },
    },
    {
      id: "balancers",
      name: { zh: "安寧者們", ja: "安寧者たち", en: "Balancers" },
      bossName: { zh: "救贖的旗手 安寧護器之女、哈爾摩妮亞", ja: "救いの旗手 安寧護器の娘たち、ハルモニア", en: "Herald of Salvation, Harmonia" },
      relicName: { zh: "安寧者的遺志", ja: "安寧者の遺志", en: "Will of the Balancers" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "H", rank: "5", name: { zh: "崖上遺跡（血）", ja: "崖上の遺跡（血）", en: "Cliffside Ruins (Blood)" } },
        { pos: 2, suit: "C", rank: "7", name: { zh: "倒下的大結晶", ja: "倒れた大結晶", en: "Fallen Great Crystal" } },
        { pos: 3, suit: "D", rank: "J", name: { zh: "西方地下砦", ja: "西の地下砦", en: "Western Underground Fort" } },
        { pos: 4, suit: "H", rank: "K", name: { zh: "教會（大空洞）", ja: "教会（大空洞）", en: "Church (Great Cavern)" } },
        { pos: 5, suit: "C", rank: "Q", name: { zh: "大結晶", ja: "大結晶", en: "Great Crystal" } },
        { pos: 6, suit: "D", rank: "9", name: { zh: "神殿", ja: "神殿", en: "Temple" } },
        { pos: 7, suit: "D", rank: "2", name: { zh: "水邊的大教會", ja: "水辺の大教会", en: "Waterside Cathedral" } },
        { pos: 8, suit: "C", rank: "J", name: { zh: "東方地下砦", ja: "東の地下砦", en: "Eastern Underground Fort" } },
        { pos: 9, suit: "C", rank: "K", name: { zh: "教會（大空洞）", ja: "教会（大空洞）", en: "Church (Great Cavern)" } },
      ],
      day2: [
        { pos: 1, suit: "H", rank: "2", name: { zh: "丘上遺跡", ja: "丘の上の遺跡", en: "Hilltop Ruins" } },
        { pos: 2, suit: "C", rank: "10", name: { zh: "魔術師之塔", ja: "魔術師塔", en: "Sorcerer's Tower" } },
        { pos: 3, suit: "C", rank: "5", name: { zh: "下層遺跡", ja: "下層の遺跡", en: "Lower Ruins" } },
        { pos: 4, suit: "C", rank: "K", name: { zh: "教會（大空洞）", ja: "教会（大空洞）", en: "Church (Great Cavern)" } },
      ],
      note: {
        zh: "【不確定/資料可能不完整】1日目的卡片須依原書圖示的位置固定配置；2日目僅置換4張卡（本表僅列出4張，其餘場地格將維持1日目配置，與其他副本的6張置換不同）。1日目的「Q♣大結晶」不可被置換。因照片解析度限制，本副本花色判讀信心較低，建議對照原書243頁再行確認。",
        ja: "【未確認/データ不完全の可能性あり】1日目のカードは、位置も含め原書の図の通りに配置すること。2日目の入れ替えは4枚のみ（本表は4枚のみ記載、他の副本のような6枚置換ではない）。1日目の「Q♣大結晶」は入れ替えることはできない。写真解像度の都合上、本副本のスートの判読信頼度は低め。原書247頁を参照して確認することを推奨する。",
      },
    },
    {
      id: "dreglord",
      name: { zh: "瓦礫之王", ja: "瓦礫の王", en: "Dreglord" },
      bossName: { zh: "反叛的斯特拉格達斯（衝動）", ja: "反逆のストラグダス（衝動）", en: "Rebellious Stagumadus (Impulse)" },
      relicName: { zh: "瓦礫之夜", ja: "瓦礫の夜", en: "Night of Rubble" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "D", rank: "K", name: { zh: "教會（大空洞）", ja: "教会（大空洞）", en: "Church (Great Cavern)" } },
        { pos: 2, suit: "C", rank: "7", name: { zh: "倒下的大結晶", ja: "倒れた大結晶", en: "Fallen Great Crystal" } },
        { pos: 3, suit: "H", rank: "2", name: { zh: "水邊的大教會", ja: "水辺の大教会", en: "Waterside Cathedral" } },
        { pos: 4, suit: "C", rank: "J", name: { zh: "東方地下砦", ja: "東の地下砦", en: "Eastern Underground Fort" } },
        { pos: 5, suit: "H", rank: "9", name: { zh: "神殿", ja: "神殿", en: "Temple" } },
        { pos: 6, suit: "C", rank: "K", name: { zh: "教會（大空洞）", ja: "教会（大空洞）", en: "Church (Great Cavern)" } },
        { pos: 7, suit: "C", rank: "Q", name: { zh: "大結晶", ja: "大結晶", en: "Great Crystal" } },
      ],
      day2: [
        { pos: 1, suit: "D", rank: "2", name: { zh: "丘上遺跡", ja: "丘の上の遺跡", en: "Hilltop Ruins" } },
        { pos: 2, suit: "C", rank: "10", name: { zh: "魔術師之塔", ja: "魔術師塔", en: "Sorcerer's Tower" } },
        { pos: 3, suit: "C", rank: "5", name: { zh: "崖上遺跡", ja: "崖上の遺跡", en: "Cliffside Ruins" } },
        { pos: 4, suit: "C", rank: "K", name: { zh: "教會（大空洞）", ja: "教会（大空洞）", en: "Church (Great Cavern)" } },
      ],
      note: {
        zh: "【不確定/資料可能不完整】1日目的卡片須依原書圖示的位置固定配置，本表可能未收錄完整9張（僅辨識出7張）；2日目僅置換4張卡。1日目的「Q♣大結晶」不可被置換。因照片解析度與角度限制，本副本資料信心度為本次匯入中最低，強烈建議對照原書241頁再行確認。",
        ja: "【未確認/データ不完全の可能性あり】1日目のカードは位置も含め原書の図の通りに配置すること。本データは9枚中7枚のみ判読できている可能性がある。2日目の入れ替えは4枚のみ。1日目の「Q♣大結晶」は入れ替えることはできない。写真の解像度・角度の都合上、今回インポートした中で最も信頼度が低いデータ。原書241頁を参照して確認することを強く推奨する。",
      },
    },
    {
      id: "night_aspect",
      name: { zh: "夜之側影", ja: "夜を衆る者", en: "Night Aspect" },
      bossName: { zh: "夜之輪廓、夜之奧梅雷斯", ja: "夜の輪郭、夜のオメレス", en: "Night's Outline, Night Aspect Omerus" },
      relicName: { zh: "王之夜", ja: "王の夜", en: "Night of the King" },
      start: { suit: "D", rank: "A" },
      end: { suit: "H", rank: "A" },
      day1: [
        { pos: 1, suit: "D", rank: "2", name: { zh: "大教會（隨機）", ja: "大教会（ランダム）", en: "Grand Cathedral (Random)" } },
        { pos: 2, suit: "D", rank: "3", name: { zh: "小塔（隨機）", ja: "小塔（ランダム）", en: "Small Tower (Random)" } },
        { pos: 3, suit: "C", rank: "5", name: { zh: "遺跡（隨機）", ja: "遺跡（ランダム）", en: "Ruins (Random)" } },
        { pos: 4, suit: "C", rank: "6", name: { zh: "坑道（隨機）", ja: "坑道（ランダム）", en: "Tunnel (Random)" } },
        { pos: 5, suit: "C", rank: "7", name: { zh: "沼澤（隨機）", ja: "沼沢（ランダム）", en: "Marsh (Random)" } },
        { pos: 6, suit: "D", rank: "8", name: { zh: "鍛造村（隨機）", ja: "鍛冶村（ランダム）", en: "Smithing Village (Random)" } },
        { pos: 7, suit: "H", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 8, suit: "C", rank: "J", name: { zh: "砦（隨機）", ja: "砦（ランダム）", en: "Fort (Random)" } },
        { pos: 9, suit: "C", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      day2: [
        { pos: 1, suit: "D", rank: "9", name: { zh: "封牢（隨機）", ja: "封牢（ランダム）", en: "Sealed Prison (Random)" } },
        { pos: 2, suit: "D", rank: "8", name: { zh: "地變｜火口(上層)", ja: "地変｜火口(上層)", en: "Terrain Shift｜Crater (Upper)" } },
        { pos: 3, suit: "D", rank: "10", name: { zh: "地變｜火口(空洞內)", ja: "地変｜火口(空洞内)", en: "Terrain Shift｜Crater (Cavern)" } },
        { pos: 4, suit: "D", rank: "Q", name: { zh: "地變｜火口(最深處)", ja: "地変｜火口(最奥)", en: "Terrain Shift｜Crater (Depths)" } },
        { pos: 5, suit: "C", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
        { pos: 6, suit: "D", rank: "K", name: { zh: "教會", ja: "教会", en: "Church" } },
      ],
      note: {
        zh: "【不確定】1日目第9張卡片因照片判讀限制以「教會」補上，實際花色/等級請對照原書249頁確認。「地變」（135頁）會自動與場地列5的3張卡置換配置。",
        ja: "【未確認】1日目9枚目のカードは写真判読の都合で「教会」として補完している。実際のスート/ランクは原書249頁を参照して確認すること。「地変」（135頁）は自動的にフィールドライン5の3枚と入れ替えて配置される。",
      },
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
