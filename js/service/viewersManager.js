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
            console.log("viewerManager callback called");
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

        panFrom.setHotspotDbClicCallback(function(hs){
            deleteHotspot(hs);
        });

        /*panFrom.init(function(){
            panTo.init(function(){
                cb();
            });
        });*/
    };

    var uxDisable = function(viewerId){
        document.getElementById(viewerId+"Disable").display="inline";
        document.getElementById(viewerId+"Active").display="none";
    };
    var uxActive = function(viewerId){
        document.getElementById(viewerId+"Disable").display="none";
        document.getElementById(viewerId+"Active").display="inline";
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
        var pannellumHotSpot = {
            "pitch": pitch,
            "yaw": yaw,
            "targetPitch": panTo.getPitch(),
            "targetYaw": panTo.getYaw(),
            "type": "scene",
            "text": currentSceneIdTo,
            "sceneId": currentSceneIdTo
        };
        globalSceneConfig[currentSceneIdFrom]["hotSpots"].push(pannellumHotSpot);
        trackedgeService.savePannellumHotSpot(currentSceneIdFrom, pannellumHotSpot, function(a){
            console.log("savePannellumHotSpot callback");
            console.log(a);
            pannellumHotSpot['id_track_edge']=a["id_track_edge"];
            pannellumHotSpot['id_malette']=a["id_malette"];
        });
        loadPanorama(currentSceneIdFrom, panFrom.getPitch(), panFrom.getYaw(), panFrom.getHfov(), "from");
    };

    var deleteHotspot = function(hs){
        console.log("Delete hotspot : ");
        console.log(hs);
        var hotSpots = globalSceneConfig[currentSceneIdFrom]["hotSpots"];
        for(var i=0; i < hotSpots.length; i++){
            console.log(hotSpots[i]);
            if("id_track_edge" in hotSpots[i] && hotSpots[i]["id_track_edge"]==hs["id_track_edge"]){
                console.log("found it, id_track_edge : "+hs["id_track_edge"]);
                panFrom.destroyHotSpots();
                trackedgeService.deleteHotspot(hotSpots[i]["id_track_edge"], hotSpots[i]["id_malette"])
                hotSpots.splice(i);
                loadPanorama(currentSceneIdFrom, panFrom.getPitch(), panFrom.getYaw(), panFrom.getHfov(), "from");
                break;
            }
        }
    };

    var panFromActivateCurrent = function(){
        var ids = currentSceneIdFrom.split("-");
        activate(ids[0], window.campaign, ids[1]);
    };

    var panToActivateCurrent = function(){
        var ids = currentSceneIdTo.split("-");
        activate(ids[0], window.campaign, ids[1]);
    };

    var prev = function(viewerId){
        var currentIds, currentSceneId;
        if(viewerId == 'to'){
            currentSceneId = currentSceneIdTo;
        }
        if(viewerId == 'from'){
            currentSceneId = currentSceneIdFrom;
        }
        currentIds = currentSceneId.split("-");

        var lastSceneId = null;
        for(var k in panoCfg["scenes"]){
            if(k==currentSceneId){
                loadPanorama(lastSceneId, 0, 0, 'same', viewerId);
                return lastSceneId;
            }
            lastSceneId = k;
        }
    };

    var next = function(viewerId){
        console.log('next');
        var currentIds, currentSceneId;
        if(viewerId == 'to'){
            currentSceneId = currentSceneIdTo;
        }
        if(viewerId == 'from'){
            currentSceneId = currentSceneIdFrom;
        }
        currentIds = currentSceneId.split("-");

        var found = false;
        for(var k in panoCfg["scenes"]){
            lastSceneId = k;
            if(found){
                loadPanorama(k, 0, 0, 'same', viewerId);
                return k;
            }
            found = found || k == currentSceneId;
        }
    };

    var loadScene = function(viewerId){
        sceneIdToLoad = (viewerId=='to') ? document.getElementById('toSceneId').value : document.getElementById('fromSceneId').value;
        loadPanorama(sceneIdToLoad, 0, 0, 'same', viewerId);
    };

    var getCurrentSceneId = function(viewerId){
        return (viewerId=='to') ? currentSceneIdTo : currentSceneIdFrom;
    };

    var active = function(viewerId){
        var ids = getCurrentSceneId(viewerId).split('-');
        activate(parseInt(ids[0]), window.campaign, parseInt(ids[1]));
        uxDisable(viewerId);
    };

    var disable = function(viewerId){
        var ids = getCurrentSceneId(viewerId).split('-');
        desactivate(parseInt(ids[0]), window.campaign, parseInt(ids[1]));
        uxActive(viewerId);
    };

    return{
        initViewers: initViewers,
        getPanTo: function(){ return panTo; },
        getPanFrom: function(){ return panFrom; },
        loadPanorama: loadPanorama,
        panFromActivateCurrent: panFromActivateCurrent,
        prev: prev,
        next: next,
        loadScene: loadScene,
        active: active,
        disable: disable
    };
};
