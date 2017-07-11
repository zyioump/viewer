var MapManager = function(){
  var initMap = function(){
    map = new L.Map('map');

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 18, attribution: osmAttrib});

    map.setView(new L.LatLng(48.27219,-3.55856),9);
    map.addLayer(osm);
  }

  var redMarker = L.AwesomeMarkers.icon({
    icon: 'coffee',
    markerColor: 'red'
  });

  var blueMarker = L.AwesomeMarkers.icon({
    icon: 'coffee',
    markerColor: 'blue'
  });

  var displayMap = function(lot_service){
    allLot = lot_service.getAllLot(window.campaign, function(allLot){

    for (var i = 0; i<allLot.length; i++){
      sensors = lot_service.getSensors(allLot[i].sensors.id_sensors, window.cul, function(sensors){
        lot = lot_service.getLot(window.campaign, sensors.lot[0].id_lot, function(lot){
          if (lot.tile.id_tile == null){
            marker = L.marker([sensors.gps_pos.coordinates[0], sensors.gps_pos.coordinates[1]], {icon: redMarker}).addTo(map);
          }else{
            marker = L.marker([sensors.gps_pos.coordinates[0], sensors.gps_pos.coordinates[1]], {icon: blueMarker}).addTo(map);
          }
          marker.bindPopup(JSON.stringify(lot));
        });
      })
    }
    });
  }

  return {
    initMap: initMap,
    displayMap: displayMap
  }
}
