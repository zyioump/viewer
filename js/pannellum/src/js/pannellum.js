/*
 * Pannellum - An HTML5 based Panorama Viewer
 * Copyright (c) 2011-2014 Matthew Petroff
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var scriptDirPanellum = function(){
    var scripts = document.getElementsByTagName('script'),
        src = scripts[scripts.length-1].getAttribute("src"),
        regex = /^(.*[/\\])([^/\\]+)/;

    return src.match(regex)[1];
}();

window.PannellumViewer = function( panEl ){

// Declare variables
var config, tourConfig = {}, configFromURL, popoutMode = false, renderer,
    isUserInteracting = false, onMouseDownMouseX = 0, onMouseDownMouseY = 0,
    onMouseDownYaw = 0, onMouseDownPitch = 0, phi = 0, theta = 0,
    keysDown = new Array(10), fullWindowActive = false, loaded = false,
    error = false, isTimedOut = false, listenersAdded = false,
    about_box, canvas, panoImage, prevTime,
    lastSize = { width: 0, height: 0 }; // used to detect panEl resizement;

var defaultConfig = {
    hfov: 70, pitch: 0, yaw: 0, haov: 360, vaov: 180, voffset: 0,
    autoRotate: false, type: 'equirectangular'
};

//basic functions
var is_def = function(a){ return typeof a !== 'undefined'; };

//basic setters
this.setConfig = function( conf ){
	if( conf.default ){ // It is a tour
		tourConfig = conf;
		mergeConfig( ( conf.default && conf.default.firstScene ) ? conf.default.firstScene : null );
	}else{
		configFromURL = conf;
		mergeConfig( null );
	}
};

this.setYaw = function( yaw ){
    config.yaw = yaw;
    requestAnimationFrame( animate );
};

this.getYaw = function(){
	return config.yaw;
};

this.setPitch = function( pitch ){
    config.pitch = pitch;
    requestAnimationFrame( animate );
};

this.getPitch = function(){
	return config.pitch;
};

this.getHfov=function(){
	return config.hfov;
};

// load HTML template
function loadTemplate( callback ){
    panEl.innerHTML = 'Loading template ...';

    //dynamically loading template | TODO load template only once if they are severeal viewers on a single page
    var xhr = (window.XMLHttpRequest) ? new window.XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    xhr.onreadystatechange = function(){
        if( xhr.readyState==4 && xhr.status==200 ){

            panEl.innerHTML = ""; // removing loading message
			panEl.classList.add('pannellum-container'); // Fix a webkit bug

            //parsing document to get only pannellum element template
            if( window.DOMParser ){
                var parser = new DOMParser();
                var page = parser.parseFromString(xhr.responseText, 'text/html').querySelector('.pannellum');
                panEl.appendChild(page);
            }else{ // for IE
                var parser = new ActiveXObject("Microsoft.XMLDOM");
                parser.async = false;
                parser.loadXML(xhr.responseText);
                var page = parser.querySelector('#page');
                panEl.appendChild(page);
            }

            canvas = panEl.querySelector("canvas");
			about_box = panEl.querySelector("about_box");

            if(typeof(callback) !== 'undefined' && callback !== null ){ callback(); }
        }
    };
    xhr.open('GET', scriptDirPanellum+'../pannellumTemplate.htm', true);
    xhr.send();
}

// Build template in the specified element
// will also process options to display (Author, licence ...)
function initTemplate( callback ){
    //panEl = el;

    loadTemplate(function(){
        // Process options
        parseURLParameters();
        processOptions();

        panEl.getElementsByClassName('fullwindowtoggle_button')[0].addEventListener('click', toggleFullWindow, false);
        panEl.getElementsByClassName('load_button')[0].addEventListener('click', load, false);

		callback();
    });
}

function detectWebGL(){
	var canvas = document.createElement('canvas'),
	gl;
	try{
		gl = canvas.getContext("webgl");
	}catch(x){ gl = null; }

	if(gl==null){
		try{
			gl = canvas.getContext("experimental-webgl");
		}catch(x){ gl=null; }
	}

	if(gl){
		return true;
	}else {
		return false;
	}
}

// Initialize viewer
function init() {
    if(config.type == 'cubemap') {
        panoImage = new Array();
        for(var i = 0; i < 6; i++) {
            panoImage.push(new Image());
            panoImage[i].crossOrigin = "anonymous";
        }
    } else if(config.type == 'multires') {
        var c = config.multiRes;
        if (config.path) {
            c.path = config.path + config.multiRes.path;
        } else if (tourConfig.path) {
            c.path = tourConfig.path + config.multiRes.path;
        }
        panoImage = config.multiRes;
    } else {
        panoImage = new Image();
        panoImage.crossOrigin = "anonymous";
    }

    function onImageLoad() {
		if( detectWebGL() === false ){
			anError();
		}

        try {
            renderer = new libpannellum.renderer(canvas, panoImage, config.type);
        } catch (event) {
            // Show error message if WebGL is not supported
            anError();
        }

        // Only add event listeners once
        if(!listenersAdded) {
            listenersAdded = true;
            panEl.addEventListener('mousedown', onDocumentMouseDown, false);
            panEl.addEventListener('mousemove', onDocumentMouseMove, false);
            panEl.addEventListener('mouseup', onDocumentMouseUp, false);
            panEl.addEventListener('mousewheel', onDocumentMouseWheel, false);
            panEl.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
            panEl.addEventListener('resize', onDocumentResize, false);
            panEl.addEventListener('mozfullscreenchange', onFullScreenChange, false);
            panEl.addEventListener('webkitfullscreenchange', onFullScreenChange, false);
            panEl.addEventListener('msfullscreenchange', onFullScreenChange, false);
            panEl.addEventListener('fullscreenchange', onFullScreenChange, false);
            panEl.addEventListener('mozfullscreenerror', fullScreenError, false);
            panEl.addEventListener('webkitfullscreenerror', fullScreenError, false);
            panEl.addEventListener('msfullscreenerror', fullScreenError, false);
            panEl.addEventListener('fullscreenerror', fullScreenError, false);
            window.addEventListener('resize', onDocumentResize, false);
            panEl.addEventListener('keydown', onDocumentKeyPress, false);
            panEl.addEventListener('keyup', onDocumentKeyUp, false);
            panEl.focus(); // Allow user to use key, without pressing tab before
            window.addEventListener('blur', clearKeys, false);
            panEl.addEventListener('mouseout', onDocumentMouseUp, false);
            panEl.addEventListener('touchstart', onDocumentTouchStart, false);
            panEl.addEventListener('touchmove', onDocumentTouchMove, false);
            panEl.addEventListener('touchend', onDocumentTouchEnd, false);

            panEl.getElementsByClassName('zoom_in')[0].addEventListener('click', function(){ zoomIn(5); }, false);
            panEl.getElementsByClassName('zoom_out')[0].addEventListener('click', function(){ zoomOut(5); }, false);

            if(window.Hammer){ // needs hammer.js to be used : http://eightmedia.github.io/hammer.js/
                Hammer(panEl).on('pinch', onPinch);
            }

            // Display about information on right click
            panEl.addEventListener('contextmenu', onRightClick, false);
        }

        renderInit();
        var t = setTimeout('isTimedOut = true', 500);
    }

    // Configure image loading
    if(config.type == "cubemap") {
        // Quick loading counter for synchronous loading
        var itemsToLoad = 6;
        function loadCounter() {
            itemsToLoad--;
            if(itemsToLoad == 0) {
                onImageLoad();
            }
        }

        for(var i = 0; i < panoImage.length; i++) {
            panoImage[i].onload = loadCounter;
            var p = config.cubeMap[i];
            if (config.path) {
                p = config.path + p;
            } else if (tourConfig.path) {
                p = tourConfig.path + p;
            }
            panoImage[i].src = p;
        }
    } else if(config.type == "multires") {
        onImageLoad();
    } else {
        panoImage.onload = onImageLoad;
        var p = config.panorama;
        if (config.path) {
            p = config.path + p;
        } else if (tourConfig.path) {
            p = tourConfig.path + p;
        }
        panoImage.src = p;
    }

    panEl.getElementsByClassName('pannellum')[0].classList.add('grab');
}

function anError() {
    panEl.getElementsByClassName('load_box')[0].style.display = 'none';
    panEl.getElementsByClassName('nocanvas')[0].style.display = 'table';
    error = true;
}

function onRightClick(event) {
    panEl.getElementsByClassName('about')[0].style.left = event.clientX + 'px';
    panEl.getElementsByClassName('about')[0].style.top = event.clientY + 'px';
    clearTimeout(onRightClick.t1);
    clearTimeout(onRightClick.t2);
    panEl.getElementsByClassName('about')[0].style.display = 'block';
    panEl.getElementsByClassName('about')[0].style.opacity = 1;
    onRightClick.t1 = setTimeout(function() {panEl.getElementsByClassName('about')[0].style.opacity = 0;}, 2000);
    onRightClick.t2 = setTimeout(function() {panEl.getElementsByClassName('about')[0].style.display = 'none';}, 2500);
    event.preventDefault();
}

function onDocumentMouseDown(event) {
    // Override default action
    event.preventDefault();
    // But not all of it
    window.focus();

    // Turn off auto-rotation if enabled
    config.autoRotate = false;

    isUserInteracting = true;

    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;

    onPointerDownYaw = config.yaw;
    onPointerDownPitch = config.pitch;

    panEl.getElementsByClassName('pannellum')[0].classList.remove('grab');
    panEl.getElementsByClassName('pannellum')[0].classList.add('grabbing');

    requestAnimationFrame(animate);
}

function onDocumentMouseMove(event) {
    if (isUserInteracting) {
        //TODO: This still isn't quite right
        config.yaw = ((Math.atan(onPointerDownPointerX / canvas.width * 2 - 1) - Math.atan(event.clientX / canvas.width * 2 - 1)) * 180 / Math.PI * config.hfov / 90) + onPointerDownYaw;
        vfov = 2 * Math.atan(Math.tan(config.hfov/360*Math.PI) * canvas.height / canvas.width) * 180 / Math.PI;
        config.pitch = ((Math.atan(event.clientY / canvas.height * 2 - 1) - Math.atan(onPointerDownPointerY / canvas.height * 2 - 1)) * 180 / Math.PI * vfov / 90) + onPointerDownPitch;
    }
}

function onDocumentMouseUp(event) {
    isUserInteracting = false;
    panEl.getElementsByClassName('pannellum')[0].classList.add('grab');
    panEl.getElementsByClassName('pannellum')[0].classList.remove('grabbing');
}

function onDocumentTouchStart(event) {
    // Override default action
    //event.preventDefault();
    // But not all of it
    window.focus();

    // Turn off auto-rotation if enabled
    config.autoRotate = false;

    isUserInteracting = true;

    onPointerDownPointerX = event.targetTouches[0].clientX;
    onPointerDownPointerY = event.targetTouches[0].clientY;

    onPointerDownYaw = config.yaw;
    onPointerDownPitch = config.pitch;

    requestAnimationFrame(animate);
}

function onDocumentTouchMove(event) {
    // Override default action
    event.preventDefault();
    if (isUserInteracting) {
        config.yaw = (onPointerDownPointerX - event.targetTouches[0].clientX) * 0.1 + onPointerDownYaw;
        config.pitch = (event.targetTouches[0].clientY - onPointerDownPointerY) * 0.1 + onPointerDownPitch;
    }
}

function onPinch(event){
    event.preventDefault();
    if( event.gesture.scale < 1){
        zoomOut( 1/event.gesture.scale );
    }else{
        zoomIn( event.gesture.scale );
    }
}

function onDocumentTouchEnd(event) {
    // Do nothing for now
    //event.preventDefault();
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    event.preventDefault();

    if (event.wheelDeltaY) {
        // WebKit
        setHfov(config.hfov -= event.wheelDeltaY * 0.05);
    } else if (event.wheelDelta) {
        // Opera / Explorer 9
        setHfov(config.hfov -= event.wheelDelta * 0.05);
    } else if (event.detail) {
        // Firefox
        setHfov(config.hfov += event.detail * 1.5);
    }

    requestAnimationFrame(animate);
}

function onDocumentKeyPress(event) {
    // Override default action
    event.preventDefault();

    // Turn off auto-rotation if enabled
    config.autoRotate = false;

    // Record key pressed
    keynumber = event.keycode;
    if(event.which) {
        keynumber = event.which;
    }

    // If escape key is pressed
    if(keynumber == 27) {
        // If in full window / popout mode
        if(fullWindowActive || popoutMode) {
            toggleFullWindow();
        }
    } else {
        // Change key
        changeKey(keynumber, true);
    }
}

function clearKeys() {
    for(i = 0; i < 10; i++) {
        keysDown[i] = false;
    }
}

function onDocumentKeyUp(event) {
    // Override default action
    event.preventDefault();

    // Record key released
    keynumber = event.keycode;
    if(event.which) {
        keynumber = event.which;
    }

    // Change key
    changeKey(keynumber, false);
}

function changeKey(keynumber, value) {
    var keyChanged = false;
    switch(keynumber) {
        // If minus key is released
        case 109: case 189: case 17:
            if(keysDown[0] != value) { keyChanged = true; }
            keysDown[0] = value; break;

        // If plus key is released
        case 107: case 187: case 16:
            if(keysDown[1] != value) { keyChanged = true; }
            keysDown[1] = value; break;

        // If up arrow is released
        case 38:
            if(keysDown[2] != value) { keyChanged = true; }
            keysDown[2] = value; break;

        // If "w" is released
        case 87:
            if(keysDown[6] != value) { keyChanged = true; }
            keysDown[6] = value; break;

        // If down arrow is released
        case 40:
            if(keysDown[3] != value) { keyChanged = true; }
            keysDown[3] = value; break;

        // If "s" is released
        case 83:
            if(keysDown[7] != value) { keyChanged = true; }
            keysDown[7] = value; break;

        // If left arrow is released
        case 37:
            if(keysDown[4] != value) { keyChanged = true; }
            keysDown[4] = value; break;

        // If "a" is released
        case 65:
            if(keysDown[8] != value) { keyChanged = true; }
            keysDown[8] = value; break;

        // If right arrow is released
        case 39:
            if(keysDown[5] != value) { keyChanged = true; }
            keysDown[5] = value; break;

        // If "d" is released
        case 68:
            if(keysDown[9] != value) { keyChanged = true; }
            keysDown[9] = value;
    }

    if(keyChanged && value) {
        if (performance.now()) {
            prevTime = performance.now();
        } else {
            prevTime = Date.now();
        }
        requestAnimationFrame(animate);
    }
}

function keyRepeat() {
    var newTime;
    if (performance.now()) {
        newTime = performance.now();
    } else {
        newTime = Date.now();
    }
    var diff = (newTime - prevTime) * config.hfov / 1700;

    // If minus key is down
    if(keysDown[0]) {
        zoomOut(diff);
    }

    // If plus key is down
    if(keysDown[1]) {
        zoomIn(diff);
    }

    // If up arrow or "w" is down
    if(keysDown[2] || keysDown[6]) {
        // Pan up
        config.pitch += diff;
    }

    // If down arrow or "s" is down
    if(keysDown[3] || keysDown[7]) {
        // Pan down
        config.pitch -= diff;
    }

    // If left arrow or "a" is down
    if(keysDown[4] || keysDown[8]) {
        // Pan left
        config.yaw -= diff;
    }

    // If right arrow or "d" is down
    if(keysDown[5] || keysDown[9]) {
        // Pan right
        config.yaw += diff;
    }

    // If auto-rotate
    if(config.autoRotate) {
        // Pan
        if(diff > 0.000001) {
            config.yaw -= config.autoRotate / 60 * diff;
        }
    }

    prevTime = newTime;
}

function onDocumentResize() {
    if( is_def(lastSize) && is_def(lastSize.width) && is_def(lastSize.height) && (lastSize.width!=panEl.offsetWidth || lastSize.height!=panEl.offsetHeight)  // panEl was resized
        || !lastSize                                                                                                   // lastSize isn't initialized
    ){
        // Reset panorama renderer
        renderInit();

        // Kludge to deal with WebKit regression: https://bugs.webkit.org/show_bug.cgi?id=93525
        onFullScreenChange();
    }
}

function animate() {
    render();
    if(isUserInteracting) {
        requestAnimationFrame(animate);
    } else if(keysDown[0] || keysDown[1] || keysDown[2] || keysDown[3]
      || keysDown[4] || keysDown[5] || keysDown[6] || keysDown[7]
      || keysDown[8] || keysDown[9] || config.autoRotate) {
        keyRepeat();
        requestAnimationFrame(animate);
    } else if(renderer && renderer.isLoading()) {
        requestAnimationFrame(animate);
    }
}

function render() {
    try {
        if(config.yaw > 180) {
            config.yaw -= 360;
        } else if(config.yaw < -180) {
            config.yaw += 360;
        }

        config.pitch = Math.max(-85, Math.min(85, config.pitch));
        renderer.render(config.pitch * Math.PI / 180, config.yaw * Math.PI / 180, config.hfov * Math.PI / 180);

        renderHotSpots();

        // Update compass
        if (config.compass) {
            panEl.querySelector('.compass').style.transform = 'rotate(' + (-config.yaw - config.northOffset) + 'deg)';
            panEl.querySelector('.compass').style.webkitTransform = 'rotate(' + (-config.yaw - config.northOffset) + 'deg)';
        }
    } catch(event) {
        // Panorama not loaded
    }
}

function renderInit() {
    try {
        canvas.width = panEl.offsetWidth;
        canvas.height = panEl.offsetHeight;

        //updating lastSize, used to detect when panEl is resized
        lastSize.width = panEl.offsetWidth;
        lastSize.height = panEl.offsetHeight;

        renderer.init(config.haov * Math.PI / 180, config.vaov * Math.PI / 180, config.voffset * Math.PI / 180);

        animate();

        // Show compass if applicable
        if (config.compass) {
            panEl.querySelector('.compass').style.display = 'inline';
        } else {
            panEl.querySelector('.compass').style.display = 'none';
        }

        // Hide loading display
        panEl.getElementsByClassName('load_box')[0].style.display = 'none';
        loaded = true;

    } catch(event) {
        // Panorama not loaded

        // Display error if there is a bad texture
        if(event == 'bad texture') {
            anError();
        }
    }
}

function createHotSpots() {
    if(!config.hotSpots) {
        config.hotSpots = [];
    } else {
        config.hotSpots.forEach(function(hs) {
            var div = document.createElement('div');
            var span = document.createElement('span');
            div.setAttribute('class', 'hotspot tooltip sprite ' + hs.type);
            if(hs.URL) {
                var a = document.createElement('a');
                a.setAttribute('href', hs.URL);
                a.setAttribute('target', '_blank');
                panEl.getElementsByClassName('pannellum')[0].appendChild(a);
                div.style.cursor = 'pointer';
                span.style.cursor = 'pointer';
                a.appendChild(div);
            } else {
                if(hs.sceneId) {
                    div.onclick = function() {
                        //loadScene(hs.sceneId);
                        if(hotspotCb != null ){ hotspotCb(hs.sceneId); }
                        return false;
                    };
                    div.style.cursor = 'pointer';
                    span.style.cursor = 'pointer';
                }
                panEl.getElementsByClassName('pannellum')[0].appendChild(div);
            }
            span.innerHTML = hs.text;
            div.appendChild(span);
            span.style.width = span.scrollWidth - 20 + 'px';
            span.style.marginLeft = -(span.scrollWidth - 26) / 2 + 'px';
            span.style.marginTop = -span.scrollHeight - 12 + 'px';
            hs.div = div;
        });
    }
}

function destroyHotSpots() {
    if(config.hotSpots) {
        config.hotSpots.forEach(function(hs) {
            var current = hs.div;
            while( !current.parentNode.classList.contains('pannellum') ) {
                current = current.parentNode;
            }
            panEl.getElementsByClassName('pannellum')[0].removeChild(current);
        });
    }
}

function renderHotSpots() {
    config.hotSpots.forEach(function(hs) {
        var z = Math.sin(hs.pitch * Math.PI / 180) * Math.sin(config.pitch * Math.PI /
            180) + Math.cos(hs.pitch * Math.PI / 180) * Math.cos((hs.yaw + config.yaw) *
            Math.PI / 180) * Math.cos(config.pitch * Math.PI / 180);
        if((hs.yaw <= 90 && hs.yaw > -90 && z <= 0) ||
          ((hs.yaw > 90 || hs.yaw <= -90) && z <= 0)) {
            hs.div.style.visibility = 'hidden';
        } else {
            hs.div.style.visibility = 'visible';
            hs.div.style.top = -canvas.height / Math.tan(config.hfov * Math.PI / 360) *
                (Math.sin(hs.pitch * Math.PI / 180) * Math.cos(config.pitch * Math.PI /
                180) - Math.cos(hs.pitch * Math.PI / 180) * Math.cos((hs.yaw +
                config.yaw) * Math.PI / 180) * Math.sin(config.pitch * Math.PI / 180)) / z /
                2 + canvas.height / 2 - 13 + 'px';
            hs.div.style.left = -canvas.height / Math.tan(config.hfov * Math.PI / 360) *
                Math.sin((hs.yaw + config.yaw) * Math.PI / 180) * Math.cos(hs.pitch *
                Math.PI / 180) / z / 2 + canvas.width / 2 - 13 + 'px';
        }
    });
}

function parseURLParameters() {
    var URL = unescape(window.location.href).split('?');
    URL.shift();
    if( URL.length == 0 ){ return; } // no parameter in the URL
    URL = URL[0].split('&');
    var json = '{';
    for(var i = 0; i < URL.length; i++) {
        var option = URL[i].split('=')[0];
        var value = URL[i].split('=')[1];
        json += '"' + option + '":';
        switch(option) {
            case 'hfov': case 'pitch': case 'yaw': case 'haov': case 'vaov':
            case 'voffset':
                json += value;
                break;
            default:
                json += '"' + value + '"';
        }
        if(i < URL.length - 1) {
            json += ',';
        }
    }
    json += '}';
    configFromURL = JSON.parse(json);

    // Check for JSON configuration file
    if(configFromURL.config) {
        // Get JSON configuration file
        var request = new XMLHttpRequest();
        request.open('GET', configFromURL.config, false);
        request.send();
        var c = JSON.parse(request.responseText);

        // Set JSON file location
        c.path = configFromURL.config.substring(0,configFromURL.config.lastIndexOf('/')+1);

        // Merge options
        for(var k in c) {
            if(!configFromURL[k]) {
                configFromURL[k] = c[k];
            }
        }
    }

    // Check for virtual tour JSON configuration file
    var firstScene = null;
    if(configFromURL.tour) {
        // Get JSON configuration file
        var request = new XMLHttpRequest();
        request.open('GET', configFromURL.tour, false);
        request.send();
        tourConfig = JSON.parse(request.responseText);

        // Set JSON file location
        tourConfig.path = configFromURL.tour.substring(0,configFromURL.tour.lastIndexOf('/')+1);

        // Activate first scene if specified
        if(tourConfig.default.firstScene) {
            firstScene = tourConfig.default.firstScene;
        }
        if(configFromURL.firstScene) {
            firstScene = configFromURL.firstScene;
        }
    }

    mergeConfig(firstScene);
}

function mergeConfig(sceneId) {
    config = {};

    // Merge default config
    for(var k in defaultConfig) {
        config[k] = defaultConfig[k];
    }

    // Merge default scene config
    for(var k in tourConfig.default) {
        config[k] = tourConfig.default[k];
    }

    // Merge current scene config
    if((sceneId != null) && (sceneId != '') && (tourConfig.scenes) && (tourConfig.scenes[sceneId])) {
        var scene = tourConfig.scenes[sceneId];
        for(var k in scene) {
            config[k] = scene[k];
        }
        config.activeScene = sceneId;
    }

    // Merge URL and config file
    for(var k in configFromURL) {
        config[k] = configFromURL[k];
    }
}

function processOptions() {
    for(var key in config) {
        switch(key) {
            case 'logo_link':
                    panEl.querySelector('.logo a').href = config[key];
                break;

            case 'logo_title':
                    panEl.querySelector('.logo a').title = config[key];
                    panEl.querySelector('.logo a').alt = config[key];
                break;
            case 'title':
                panEl.getElementsByClassName('title_box')[0].innerHTML = config[key];
				panEl.getElementsByClassName('panorama_info')[0].style.display = 'inline';
                break;

            case 'author':
                panEl.getElementsByClassName('author_box')[0].innerHTML = 'by ' + config[key];
				panEl.getElementsByClassName('panorama_info')[0].style.display = 'inline';
                break;

            case 'popout':
                if(config[key] == 'yes') {
                    panEl.getElementsByClassName('fullwindowtoggle_button')[0].classList.add('fullwindowtoggle_button_active');
                    popoutMode = true;
                }
                break;

            case 'fallback':
                panEl.getElementsByClassName('nocanvas')[0].innerHTML = '<p>Your browser does not support WebGL.<br><a href="' + config[key] + '" target="_blank">Click here to view this panorama in an alternative viewer.</a></p>';
                break;

            case 'preview':
                var p = config[key];
                if (config.path) {
                    p = config.path + p;
                } else if (tourConfig.path) {
                    p = tourConfig.path + p;
                }
                panEl.getElementsByClassName('pannellum')[0].style.backgroundImage = "url('" + p + "')";
                panEl.getElementsByClassName('pannellum')[0].style.backgroundSize = "cover";
                break;

            case 'hfov':
                setHfov(config[key]);
                break;

            case 'pitch':
                // Keep pitch within bounds
                if(config.pitch < -85) {
                    config.pitch = -85;
                } else if(config.pitch > 85) {
                    config.pitch = 85;
                }
                break;

            case 'autoload':
                if(config[key] == 'yes') {
                    // Show loading box
                    panEl.getElementsByClassName('load_box')[0].style.display = 'inline';
                }
            case 'popoutautoload':
                // Hide load button
                panEl.getElementsByClassName('load_button')[0].style.display = 'none';
                // Initialize
                init();
                animate();
                break;

            case 'autorotate':
                // Rotation speed in degrees/second (+ccw, -cw)
                config.autoRotate = config[key];
        }
    }

    // Create hot spots
    createHotSpots();
}

function toggleFullWindow() {
    if(loaded && !error) {
        if(!fullWindowActive && !popoutMode) {
            try {
                //var page = panEl.getElementsByClassName('pannellum')[0];
                if (panEl.requestFullscreen) {
                    panEl.requestFullscreen();
                } else if (panEl.mozRequestFullScreen) {
                    panEl.mozRequestFullScreen();
                } else if (panEl.msRequestFullscreen) {
                    panEl.msRequestFullscreen();
                } else {
                    panEl.webkitRequestFullScreen();
                }
            } catch(event) {
                fullScreenError();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }

            if(popoutMode) {
                window.close();
            }
        }
    }
}

function onFullScreenChange() {
    if(document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement) {
        panEl.getElementsByClassName('fullwindowtoggle_button')[0].classList.add('fullwindowtoggle_button_active');
        fullWindowActive = true;
    } else {
        panEl.getElementsByClassName('fullwindowtoggle_button')[0].classList.remove('fullwindowtoggle_button_active');
        fullWindowActive = false;
    }
}

function fullScreenError() {
    if(!popoutMode) {
        // Open new window instead
        var windowspecs = 'width=' + screen.width + ',height=' + screen.height + ',left=0,top=0';
        var windowlocation = window.location.href + '&popout=yes';
        windowlocation += '&popoutautoload';
        window.open(windowlocation,null,windowspecs)
    } else {
        window.close();
    }
}

function zoomIn(amount) {
    if(loaded) {
        setHfov(config.hfov -= amount);
    }
}

this.zoomIn = function(amount){ zoomIn(amount); animate(); };

function zoomOut(amount) {
    if(loaded) {
        setHfov(config.hfov += amount);
    }
}

this.zoomOut = function(amount){ zoomOut(amount); animate(); };

function setHfov(i) {
    // Keep field of view within bounds
    if(i < 40 && config.type != 'multires') {
        config.hfov = 40;
    } else if(config.type == 'multires' && i < canvas.width
        / (config.multiRes.cubeResolution / 90 * 0.9)) {
        config.hfov = canvas.width / (config.multiRes.cubeResolution / 90 * 0.9);
    } else if(i > 100) {
        config.hfov = 100;
    } else {
        config.hfov = i;
    }
}

function load() {
    panEl.getElementsByClassName('load_button')[0].style.display = 'none';
    panEl.getElementsByClassName('load_box')[0].style.display = 'inline';
    init();
    animate();
}

function loadScene(sceneId) {
    loaded = false;

    // Destroy hot spots from previous scene
    destroyHotSpots();

    // Create the new config for the scene
    mergeConfig(sceneId);

    // Reload scene
    processOptions();
    load();
}

this.loadScene = function(sceneId){
	loadScene(sceneId);
};

this.init = function( callback ){
    initTemplate( callback );
};

var hotspotCb = null;
this.setHotspotCallBack = function(cb){
    hotspotCb = cb;
};

this.destroyHotSpots = function(){
    destroyHotSpots();
}

this.createHotSpots = function(){
    createHotSpots();
}

this.getConfig = function(){
    return config;
}

};
