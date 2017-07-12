window.db = "http://opv_master:5000";
window.fm = "http://opv_master:5050";
window.campaign = 1;
window.cul = 1;

var lotService = LotService();

var mapManager = MapManager();
mapManager.initMap();
mapManager.displayMap(lotService);

var pannellumConfig = PannellumConfig();
pannellumConfig.makeConfigScene(lotService);
var sceneConfig = pannellumConfig.getSceneConfig();

// -- loading pannellums
var viewers = ViewersManagers();
var pt, pf;
viewers.initViewers(sceneConfig, function(){ alert("inited");});
pt = viewers.getPanTo();
pf = viewers.getPanFrom();

// dirty event manager
var loadPanorama = function(sceneId, viewerId){
    // -- Viewer part
    if(viewerId==="from"){
        pf.loadScene(sceneId);
    }
    if(viewerId==="to"){
        pt.loadScene(sceneId);
    }

    // -- Map part
    mapManager.focusPanorama(sceneId, viewerId);
}
