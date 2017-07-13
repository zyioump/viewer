var TrackEdge = function(){
    var saveHotspot = function(trakedge, cb){
        console.log("saveHotspot: ");
        console.log(trakedge);
        console.log(JSON.stringify(trakedge));

        $.ajax({
            type: "POST",
            url: window.db + "/trackedge",
            data: JSON.stringify(trakedge),
            success: cb,
            dataType: "json",
            contentType: "application/json"
        });
    };

    var savePannellumHotSpot = function(sceneId, pannellumHotSpot, cb){
        console.log("savePannellumHotSpot : ");
        console.log(sceneId);
        console.log(pannellumHotSpot);
        var fromId = sceneId.split("-");
        var toId = pannellumHotSpot.sceneId.split("-");
        trakedge = {
        	"lot_from": {
                "id_lot": parseInt(fromId[0]),
                "id_malette": parseInt(fromId[1])
            },
        	"id_malette": parseInt(fromId[1]),
        	"targetPitch": pannellumHotSpot.targetPitch,
        	"targetYaw": pannellumHotSpot.targetYaw,
        	"yaw": pannellumHotSpot.yaw,
        	"pitch": pannellumHotSpot.pitch,
            "active": true,
        	"lot_to": {
                "id_lot": parseInt(toId[0]),
                "id_malette": parseInt(toId[1])
            }
        };
        saveHotspot(trakedge, cb);
    }

    var deleteHotspot = function(id_track_edge, id_malette, cb){
        console.log("delete hotspot : "+id_track_edge+"/"+id_malette);
        $.ajax({
          url : window.db + "/trackedge/"+id_track_edge+"/"+id_malette+"/",
          data : JSON.stringify({"active": false}),
          type : 'PATCH',
          contentType : 'application/json',
          processData: false,
          dataType: 'json'
        });
    }

    var trackEdgeToHotspot = function(trackedge){
        return {
                "pitch": trackedge['pitch'],
                "yaw": trackedge['yaw'],
                "targetPitch": trackedge['targetPitch'],
                "targetYaw": trackedge['targetYaw'],
                "type": "scene",
                "text": trackedge["lot_to"]["id_lot"]+"-"+trackedge["lot_to"]["id_malette"],
                "sceneId": trackedge["lot_to"]["id_lot"]+"-"+trackedge["lot_to"]["id_malette"],
                "id_track_edge": trackedge["id_track_edge"],
                "id_malette": trackedge["id_malette"]
            };
    };

    return {
        savePannellumHotSpot: savePannellumHotSpot,
        deleteHotspot: deleteHotspot,
        trackEdgeToHotspot: trackEdgeToHotspot,
    };
};
