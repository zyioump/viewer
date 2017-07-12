var LotService = function(){

  var allLotCache = null;

  var getAllLot = function (id_campaign, cb){
    if (allLotCache == null){
      var campaign_lot = $.getJSON(window.db+"/lot?id_campaign="+id_campaign, function(){
        campaign_lot = campaign_lot.responseJSON.objects;
        allLotCache = campaign_lot
        cb(campaign_lot);
        return campaign_lot;
      })
    }
    else{
      cb(allLotCache);
      return allLotCache;
    }
  };

  var getSensors = function (id_sensors, id_cul, cb){
    var sensors = $.getJSON(window.db+"/sensors/"+id_sensors+"/"+id_cul+"/", function(sensors){
      cb(sensors);
      return sensors;
    });
  }

  var getLot = function(id_campaign, id_lot, cb){
    allLot = getAllLot(id_campaign, function(allLot){
      for (var i = 0; i < allLot.length; i++){
        if (allLot[i].id_lot == id_lot){
          var lot = allLot[i];
          cb(lot);
        }
      }
    });
  }

  var getTileLot = function(id_campaign, active, cb){
    var tileLot = [];
    var allLot = getAllLot(id_campaign, function(allLot){
      for (var i = 0; i<allLot.length; i++){
        if (allLot[i].tile.id_tile != null){
          if (active == true){
            if (allLot[i].active != null ){
              tileLot.push(allLot[i])
            }
          }else{
            tileLot.push(allLot[i])
          }
        }
      }
      cb(tileLot);
      return tileLot;
    });
  }

  var getTile = function(id_tile, id_cul, cb){
    var tile = $.getJSON(window.db+"/tile/"+id_tile+"/"+id_cul+"/", function(tile){
      cb(tile);
      return tile;
    });
  }

  return {
    getAllLot: getAllLot,
    getSensors: getSensors,
    getLot: getLot,
    getTileLot: getTileLot,
    getTile: getTile
  }
}
