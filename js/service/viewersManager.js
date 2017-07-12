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

        	"firstScene": "Lily_Allen"
        },

        "scenes":{}
    };



    var initViewers = function(sceneConfig, cb){

        panFrom = new PannellumViewer(document.getElementById('panFrom'));
        panTo = new PannellumViewer(document.getElementById('panTo'));

        panoCfg["scenes"] = sceneConfig;
        console.log(panoCfg);

        panFrom.setConfig( panoCfg );
        panTo.setConfig( panoCfg );

        panFrom.setHotspotCallBack = function(sceneId){
            loadPanorama(sceneId, "from"); // TODO test
        };
        panTo.setHotspotCallBack = function(){
            loadPanorama(sceneId, "to"); // TODO test
        };

        panFrom.init(function(){
            panTo.init(cb);
        });
    };

    return{
        initViewers: initViewers,
        getPanTo: function(){ return panTo; },
        getPanFrom: function(){ return panFrom; }
    };
};
