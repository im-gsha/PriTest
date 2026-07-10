(function () {
  var GAMES_KEY = "pritest-admin-games";
  var ADMIN_SESSION_KEY = "pritest-admin-session";
  var MAX_GAMES = 5;
  var MAX_CHARACTERS = 10;
  var ADMIN_PASSWORD = "night";

  function listGames() {
    var raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveGames(games) {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  }

  function getGame(id) {
    return listGames().filter(function (g) {
      return g.id === id;
    })[0] || null;
  }

  function createGame(name) {
    var games = listGames();
    if (games.length >= MAX_GAMES) return null;
    var game = { id: "g" + Date.now() + Math.floor(Math.random() * 1000), name: name, createdAt: Date.now() };
    games.push(game);
    saveGames(games);
    return game;
  }

  function deleteGame(id) {
    var games = listGames().filter(function (g) {
      return g.id !== id;
    });
    saveGames(games);
    localStorage.removeItem("pritest-night-state-" + id);
    localStorage.removeItem("pritest-characters-" + id);
  }

  function isAdminAuthenticated() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  }

  // ブラウザタブを閉じるまで有効な管理員認証。すでに認証済みならプロンプトを出さない。
  function checkAdminPassword(promptText) {
    if (isAdminAuthenticated()) return true;
    var input = window.prompt(promptText);
    var ok = input === ADMIN_PASSWORD;
    if (ok) sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    return ok;
  }

  function getGameIdFromQuery() {
    var params = new URLSearchParams(window.location.search);
    return params.get("game");
  }

  window.PriTestGames = {
    MAX_GAMES: MAX_GAMES,
    MAX_CHARACTERS: MAX_CHARACTERS,
    list: listGames,
    save: saveGames,
    get: getGame,
    create: createGame,
    remove: deleteGame,
    checkAdminPassword: checkAdminPassword,
    isAdminAuthenticated: isAdminAuthenticated,
    getGameIdFromQuery: getGameIdFromQuery,
  };
})();
