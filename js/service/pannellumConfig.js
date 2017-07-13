var PannellumConfig = function(){
  var config;

  var makeConfigScene = function(lot_service, active){
    window.globalSceneConfig = "";
    config =  new Object();
    tileLot = lot_service.getTileLot(window.campaign, active, function(tileLot){
      for (var i = 0; i<tileLot.length ; i++){
        config[tileLot[i].id_lot+"-"+tileLot[i].campaign.id_malette] = {};

        config[tileLot[i].id_lot+"-"+tileLot[i].campaign.id_malette]['title'] = tileLot[i].id_lot+"-"+tileLot[i].campaign.id_malette;

        tile = lot_service.getTile(tileLot[i].tile.id_tile, window.cul, function(tile){
          for (var j = 0; j<tileLot.length; j++){
            if (tileLot[j].tile.id_tile == tile.id_tile){
              var id = tileLot[j].id_lot+"-"+tileLot[j].id_malette;
              config[id]['preview'] = window.fm+"/v1/files/"+tile.fallback_path+"/fallback/f.jpg";
              config[id]['type'] = "multires";
              config[id]['multiRes'] = {};
              config[id]['multiRes']["path"] = window.fm+"/v1/files/"+tile.param_location+"/%l/%s%y_%x";
              config[id]['multiRes']["extension"] = tile.extension;
              config[id]['multiRes']["tileResolution"] = tile.resolution;
              config[id]['multiRes']["maxLevel"] = tile.max_level;
              config[id]['multiRes']["cubeResolution"] = tile.cube_resolution;
              config[id]["hotSpots"] = [];

              sensors = lot_service.getSensors(tileLot[j].sensors.id_sensors, window.cul, function(sensors){
                for (var k = 0; k<tileLot.length; k++){
                  if (tileLot[k].sensors.id_sensors == sensors.id_sensors){
                    var k = tileLot[k].id_lot+"-"+tileLot[k].campaign.id_malette;
                    config[k]['location'] = {};
                    config[k]['location']['lat'] = sensors.gps_pos.coordinates[0];
                    config[k]['location']['lon'] = sensors.gps_pos.coordinates[1];
                  }
                }
              });

              lot_service.getTrackEdges(tileLot[j].id_lot, tileLot[j].id_malette, function(trackedges){
                  console.log("getTrackEdges callback");
                  console.log(trackedges);
                  for(var w=0; w < trackedges.length; w++){
                      if(trackedges[w].active){
                          hotspot = trackedgeService.trackEdgeToHotspot(trackedges[w]);
                          console.log(hotspot);
                          config[id]["hotSpots"].push(hotspot);
                      }
                  }
              });
            }
          }
        });

      }
      window.globalSceneConfig = config;
    });
  }

  return {
    makeConfigScene: makeConfigScene,
    getSceneConfig: function(){ return config; }
  }
}
