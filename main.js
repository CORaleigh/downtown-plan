var themeLyr = null,
    areaLyr = null,
    themes = [0, 1, 2, 3],
    areas = [0, 1, 2, 3, 4],
    map = null,
    view = null;




document.documentElement.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, false);
document.documentElement.querySelector('.mdl-layout__content').addEventListener('touchmove', function(e) {
    e.preventDefault();

}, false);
require([
    "esri/views/MapView",
    "esri/WebMap",
    "esri/layers/VectorTileLayer",
    "dojo/domReady!"
], function(
    MapView, WebMap, VectorTileLayer
) {

    /************************************************************
     * Creates a new WebMap instance. A WebMap must reference
     * a PortalItem ID that represents a WebMap saved to
     * arcgis.com or an on-premise portal.
     *
     * To load a WebMap from an on-premise portal, set the portal
     * url in esriConfig.portalUrl.
     ************************************************************/
    map = new WebMap({
        portalItem: { // autocasts as new PortalItem()
            id: "05e67378902b4128b31ce7f07f3808a7"
        }
    });

    /************************************************************
     * Set the WebMap instance to the map property in a MapView.
     ************************************************************/
    view = new MapView({
        map: map,
        container: "map"
    });
    var handle = map.watch('loaded', function(a, b, c, d) {
        themeLyr = d;

        d.layers.forEach(function(l) {
            if (l.title === 'Downtown Plan Projects') {
                themeLyr = l;
            }
            if (l.title === 'Catalytic Project Areas') {
                areaLyr = l;
            }
        });
        map.basemap.baseLayers = [];
        var tileLyr = new VectorTileLayer({
            url: "https://www.arcgis.com/sharing/rest/content/items/3981b4e8cabb4b0fb6d4a8c94379532b/resources/styles/root.json"
        });
        map.add(tileLyr, 0);
    });

});

function filterTheme(element, theme) {
    console.log(theme);
    if (themes.indexOf(theme) > -1) {
        themes.splice(themes.indexOf(theme), 1);
        element.querySelector('svg').classList.add('unselected');

    } else {
        themes.push(theme);
        element.querySelector('svg').classList.remove('unselected');

    }
    themeLyr.definitionExpression = "Theme in (" + themes.toString() + ")";
}

function filterArea(element, area) {
    if (areas.indexOf(area) > -1) {
        areas.splice(areas.indexOf(area), 1);
        element.querySelector('svg').classList.add('unselected');
    } else {
        areas.push(area);
        element.querySelector('svg').classList.remove('unselected');
    }
    areaLyr.definitionExpression = "Name in (" + areas.toString() + ")";
}

function searchEntered(element) {
    var node = document.getElementById('list');


    var xmlhttp;
    // compatible with IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            while (node.hasChildNodes()) {
                node.removeChild(node.lastChild);
            }
            document.getElementById("list").style.display = 'block';

            var data = JSON.parse(xmlhttp.responseText);
            data.features.forEach(function(d) {
                document.getElementById('list')
                    .insertAdjacentHTML('beforeend', '<li onclick="itemSelected(event)" class="mdl-list__item"><span data-x="' + d.geometry.x + '" data-y="' + d.geometry.y + '" class="address mdl-list__item-primary-content">' + d.attributes.ADDRESS + '</span></li>');
            });
        }
    }
    xmlhttp.open("GET", "https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/query?f=json&outSR=4326&returnGeometry=true&outFields=ADDRESS&orderByFields=ADDRESS&resultRecordCount=5&where=ADDRESSU LIKE '" + element.value.toUpperCase() + "%'", true);
    if (element.value.length > 3)
        xmlhttp.send();
}

document.addEventListener('click', hideList);
document.getElementById('inputHolder').addEventListener("transitionend", inputResize, false);
function itemSelected(event) {
    var x = null, y = null;
    if (event.target.children.length > 0) {
        x = event.target.children[0].getAttribute('data-x');
        y = event.target.children[0].getAttribute('data-y');        
    } else {
        x = event.target.getAttribute('data-x');
        y = event.target.getAttribute('data-y'); 
    }
    document.getElementById("search").value = '';
    document.getElementById("title").style.display = 'block';
    document.getElementById("inputHolder").style.maxWidth = '.1px';
  
  // -> and re-adding the class
    zoomToLocation([parseFloat(x),parseFloat(y)], 18);
};

function searchClicked() {
    if (document.getElementById("title").style.display === 'block' || document.getElementById("title").style.display === '') {
        document.getElementById("title").style.display = 'none';
        document.getElementById("inputHolder").style.maxWidth = '600px';
    } else {
        
    }
};

function zoomToLocation(center, zoom) {
    view.goTo({
        center: center,
        zoom: zoom
    });
    view.zoom = zoom;
};

function inputResize(event) {
    if (event.target.clientWidth === 0) {
        document.getElementById("title").style.display = 'block';
    }
}

function hideList(event) {
    if (event.target.id != "list")
        document.getElementById("list").style.display = 'none';
}