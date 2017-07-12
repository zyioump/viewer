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
        	//"autoLoad": true,
            "hotSpotDebug": true,

        	"firstScene": "Lily_Allen"
        },

        "scenes":{}
    };
    var currentSceneIdFrom;
    var currentSceneIdTo;



    var initViewers = function(sceneConfig, cb){

        panoCfg["scenes"] = sceneConfig;
        panoCfg["default"]["firstScene"] = Object.keys(sceneConfig)[0];
        currentSceneIdTo = currentSceneIdFrom = Object.keys(sceneConfig)[0];

        console.log(panoCfg);

        panFrom = pannellum.viewer('panFrom', panoCfg);
        panTo = pannellum.viewer('panTo', panoCfg);

        panFrom.setHotspotCallBack(function(sceneId, pitch, yaw, hfov){
            loadPanorama(sceneId, pitch, yaw, hfov, "to"); // TODO test
        });
        /*panTo.setHotspotCallBack(function(sceneId, pitch, yaw, hfov){
            loadPanorama(sceneId, pitch, yaw, hfov, "to"); // TODO test
        });*/

        panFrom.setcustomKeyDownEvent(function(event){
            if(event.keycode == 80){
                console.log("Calling create hotspot");
                var coords = panFrom.getLastMouseCoords();
                createHotspot(coords[0], coords[1]);
            }
        });

        /*panFrom.init(function(){
            panTo.init(function(){
                cb();
            });
        });*/
    };

    var loadPanorama = function(sceneId, pitch, yaw, hfov, viewerId){
        console.log("loadPanorama");
        if(viewerId==="from"){
            panFrom.loadScene(sceneId, pitch, yaw, hfov);
            currentSceneIdFrom = sceneId;
        }
        if(viewerId==="to"){
            panTo.loadScene(sceneId, pitch, yaw, hfov);
            currentSceneIdTo = sceneId;
        }
    };

    var createHotspot = function(pitch, yaw){

        if(!("hotSpots" in globalSceneConfig[currentSceneIdFrom])){
            globalSceneConfig[currentSceneIdFrom]["hotSpots"] = [];
        }

        panFrom.destroyHotSpots();
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
        loadPanorama(currentSceneIdFrom, panFrom.getPitch(), panFrom.getYaw(), panFrom.getHfov(), "from");
    };

    return{
        initViewers: initViewers,
        getPanTo: function(){ return panTo; },
        getPanFrom: function(){ return panFrom; },
        loadPanorama: loadPanorama
    };
};
