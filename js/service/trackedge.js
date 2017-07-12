var TrackEdge = function(){
    var saveHotspot = function(trakedge, cb){
        $.ajax({
            type: "POST",
            url: window.db + "trackedge",
            data: trakedge,
            success: cb,
            dataType: "json"
        });
    };

    var savePannellumHotSpot = function(sceneId, pannellumHotSpot, cb){
        var fromId = sceneId.split("-");
        var toId = pannellumHotSpot.sceneId.split("-");
        trakedge = {
        	"lot_from": {
                "id_lot": fromId[0],
                "id_malette": fromId[1]
            },
        	"id_malette": fromId[1],
        	"targetPitch": pannellumHotSpot.targetPitch,
        	"targetYaw": pannellumHotSpot.targetYaw,
        	"yaw": pannellumHotSpot.yaw,
        	"pitch": pannellumHotSpot.pitch,
        	"lot_to": {
                "id_lot": toId[0],
                "id_malette": toId[1]
            }
        };
        saveHotspot(trakedge, cb);
    }

    return {
        savePannellumHotSpot: savePannellumHotSpot
    };
};
