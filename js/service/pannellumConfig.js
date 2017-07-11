var PannellumConfig = function(){
  var config = new Object();

  var makeConfig = function(lot_service){
    tileLot = lot_service.getTileLot(window.campaign, function(tileLot){
      for (var i = 0; i<tileLot.length ; i++){
        config[tileLot[i].id_lot+"-"+tileLot[i].campaign.id_campaign] = {};

        config[tileLot[i].id_lot+"-"+tileLot[i].campaign.id_campaign]['title'] = tileLot[i].id_lot+"-"+tileLot[i].campaign.id_campaign;

        tile = lot_service.getTile(tileLot[i].tile.id_tile, window.cul, function(tile){
          for (var j = 0; j<tileLot.length; j++){
            if (tileLot[j].tile.id_tile == tile.id_tile){
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['preview'] = window.fm+"/v1/files/"+tile.fallback_path+"/fallback/f.jpg";
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['type'] = "multires";
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['multires'] = {};
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['multires']["path"] = tile.fallback_path+"/%l/%s%y_%x";
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['multires']["extension"] = tile.extension;
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['multires']["tileResolution"] = tile.resolution;
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['multires']["maxLevel"] = tile.max_level;
              config[tileLot[j].id_lot+"-"+tileLot[j].campaign.id_campaign]['multires']["cubeResolution"] = tile.cube_resolution;

              sensors = lot_service.getSensors(tileLot[j].sensors.id_sensors, window.cul, function(sensors){
                for (var k = 0; k<tileLot.length; k++){
                  if (tileLot[k].sensors.id_sensors == sensors.id_sensors){
                    config[tileLot[k].id_lot+"-"+tileLot[k].campaign.id_campaign]['location'] = {};
                    config[tileLot[k].id_lot+"-"+tileLot[k].campaign.id_campaign]['location']['lat'] = sensors.gps_pos.coordinates[0];
                    config[tileLot[k].id_lot+"-"+tileLot[k].campaign.id_campaign]['location']['lon'] = sensors.gps_pos.coordinates[1];
                  }
                }
              });
            }
          }
        });
      }
      window.tmp = config;
    });
  }

  return {
    makeConfig: makeConfig
  }
}
