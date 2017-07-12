var ViewersManagers = function(){
    var panTo;
    var panFrom;
    var panoCfg = {
        "default":{
        	"logo": "yes",
        	"logo_link": "http://openpathview.fr",
        	"logo_title": "Open Path View",
        	"title": "Vieilles Charrues 2014",
        	"author": "Open Path View",
        	"autoload": true,
        	"autoRotate": -4,
            "hotSpotDebug": true,

        	"firstScene": "Lily_Allen"
        },

        "scenes":{}
    };
    var currentSceneIdFrom;
    var currentSceneIdTo;



    var initViewers = function(sceneConfig, cb){

        panFrom = new PannellumViewer(document.getElementById('panFrom'));
        panTo = new PannellumViewer(document.getElementById('panTo'));

        panoCfg["scenes"] = sceneConfig;
        console.log(panoCfg);

        panFrom.setConfig( panoCfg );
        panTo.setConfig( panoCfg );

        panFrom.setHotspotCallBack(function(sceneId){
            loadPanorama(sceneId, "from"); // TODO test
        });
        panTo.setHotspotCallBack( function(){
            loadPanorama(sceneId, "to"); // TODO test
        });

        panFrom.init(function(){
            panTo.init(function(){
                panFrom.setCustomKeyPressed(function(event){
                    console.log("CustomKeyPressed");
                    if(event.keycode == 80){
                        console.log("Calling create hotspot");
                        createHotspot(event.pitch, event.yaw);
                    }
                });
                cb();
            });
        });
    };

    var loadPanorama = function(sceneId, viewerId){
        if(viewerId==="from"){
            pf.loadScene(sceneId);
            currentSceneIdFrom = sceneId;
        }
        if(viewerId==="to"){
            pt.loadScene(sceneId);
            currentSceneIdTo = sceneId;
        }
    };

    var createHotspot = function(pitch, yaw){
        globalSceneConfig[currentSceneIdFrom]["hotSpots"].push(
            {
                "pitch": pitch,
                "yaw": yaw,
                "targetPitch": panTo.getPitch(),
                "targetYaw": panTo.getYaw(),
                "type": "scene",
                "text": currentSceneIdTo,
                "sceneId": currentSceneIdTo
            }
        );
        panFrom.destroyHotSpots();
        panFrom.createHotspot();
    };

    return{
        initViewers: initViewers,
        getPanTo: function(){ return panTo; },
        getPanFrom: function(){ return panFrom; },
        loadPanorama: loadPanorama
    };
};
