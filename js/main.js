window.db = "http://opv_master:5000";
window.fm = "http://opv_master:5050";
window.campaign = 1;
window.cul = 1;

var lotService = LotService();

var mapManager = MapManager();
mapManager.initMap();
mapManager.displayMap(lotService);

var pannellumConfig = PannellumConfig();
pannellumConfig.makeConfig(lotService);
