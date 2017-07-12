var viewers, lotService, mapManager, pannellumConfig, sceneConfig, confP;

function go(){
  window.db = document.getElementById("db").value;
  window.fm = document.getElementById("fm").value;
  window.campaign = document.getElementById("campaign").value;
  window.cul = document.getElementById("cul").value;
  confP = document.getElementById("confP");

  lotService = LotService();

  mapManager = MapManager();
  mapManager.initMap();
  mapManager.displayMap(lotService, 1);

  pannellumConfig = PannellumConfig();

  sceneConfig = pannellumConfig.getSceneConfig();
    // -- loading pannellums
    viewers = ViewersManagers();

}
// dirty event manager
var loadPanorama = function(sceneId, pitch, yaw, hfov, viewerId){
    viewers.loadPanorama(sceneId, pitch, yaw, hfov, viewerId);

    // -- Map part
    mapManager.focusPanorama(sceneId, viewerId);
}

function activate(id_lot, id_campaign, id_malette){
  lot = lotService.getLot(id_campaign, id_lot, function(lot){
    lot.active = true;

    $.ajax({
      url : window.db+"/lot/"+id_lot+"/"+id_malette+"/",
      data : JSON.stringify(lot),
      type : 'PATCH',
      contentType : 'application/json',
      processData: false,
      dataType: 'json'
    });

    mapManager.displayMap(lotService);
  });
}

function desactivate(id_lot, id_campaign, id_malette){
  lot = lotService.getLot(id_campaign, id_lot, function(lot){
    lot.active = null;

    $.ajax({
      url : window.db+"/lot/"+id_lot+"/"+id_malette+"/",
      data : JSON.stringify(lot),
      type : 'PATCH',
      contentType : 'application/json',
      processData: false,
      dataType: 'json'
    });

    mapManager.displayMap(lotService, lot.sensors.id_sensors);
  });
}

function initViewers(){
  viewers.initViewers(sceneConfig, function(){ });
}

function makeConf(active){
  pannellumConfig.makeConfigScene(lotService, active);
}

function printConf(){
  confP.innerHTML = JSON.stringify(window.globalSceneConfig);
}
