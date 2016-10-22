var themeLyr = null,
    areaLyr = null,
    themes = [0, 1, 2, 3],
    areas = [0, 1, 2, 3, 4];
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
    var map = new WebMap({
        portalItem: { // autocasts as new PortalItem()
            id: "05e67378902b4128b31ce7f07f3808a7"
        }
    });

    /************************************************************
     * Set the WebMap instance to the map property in a MapView.
     ************************************************************/
    var view = new MapView({
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