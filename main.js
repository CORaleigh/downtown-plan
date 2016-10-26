var themeLyr = null,
    areaLyr = null,
    themes = [0, 1, 2, 3],
    areas = [0, 1, 2, 3, 4],
    map = null,
    view = null,
    action = null;
require([
    "esri/views/MapView",
    "esri/WebMap",
    "esri/layers/VectorTileLayer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/widgets/Locate",
    "esri/widgets/Search",
    "esri/layers/FeatureLayer",
    "esri/Graphic",
    "dojo/domReady!"
], function (
    MapView,
    WebMap,
    VectorTileLayer,
    PictureMarkerSymbol,
    Locate,
    Search,
    FeatureLayer,
    Graphic
) {
    'use strict';
    function addLocateButton() {
        var locateSymbol = new PictureMarkerSymbol({
            width: 30,
            height: 30,
            url: 'location.svg'
        });
        var locateBtn = new Locate({
            view: view,
            graphic: new Graphic({
                symbol: locateSymbol
            })
        });
        locateBtn.startup();
        view.ui.add(locateBtn, {
            position: "top-left",
            index: 0
        });
    }
    function addSearchSource(url, field, name, symbol) {
        return {
            featureLayer: new FeatureLayer({
                url: url
            }),
            searchFields: [field],
            displayField: field,
            exactMatch: false,
            outFields: [field],
            name: name,
            placeholder: name,
            resultSymbol: symbol
        };
    }
    function addSearch() {
        var resultSymbol = new PictureMarkerSymbol({
            width: 30,
            height: 30,
            url: 'result.svg'
        });
        var searchWidget = new Search({
            view: view,
            popupEnabled: false,
            allPlaceholder: "address, project, neighborhood",
            maxSuggestions: 4,
            sources: [
                addSearchSource("https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Addresses/FeatureServer/0", "ADDRESS", "Address", resultSymbol),
                addSearchSource("https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/DowntownPlan_WFL/FeatureServer/0", "Name", "Project", resultSymbol),
                addSearchSource("https://maps.raleighnc.gov/arcgis/rest/services/HousingNeighborhoods/HousingNeighborhoods/MapServer/0", "NAME", "Neighborhood", resultSymbol)
            ]
        }, 'searchDiv');
        view.ui.add(searchWidget, {
            position: "top-right",
            index: 2
        });
        //prevent over-zoom to avoid possible ArcGIS API bug with settting maxZoom
        view.watch('scale', function (a) {
            if (a < 1144.7034353781848) {
                view.scale = 1144.7034353781848;
            }
        });
    }
    function setBackgroundColor(theme) {
        if (theme === 'Move') {
            return '#f79310';
        }
        if (theme === 'Stay') {
            return '#8f369f';
        }
        if (theme === 'Breathe') {
            return '#7eca29';
        }
        if (theme === 'Link') {
            return '#d21e25';
        }
    }
    function featureSelected(a, b, c, d) {
        if (d.selectedFeature) {
            d.actions.splice(1, 1);
            if (d.selectedFeature.attributes.URL) {
                d.actions.push({
                    id: 'view-website',
                    title: 'View Website',
                    className: 'esri-icon-link-external'
                });
            }
            if (action) {
                action.remove();
            }
            action = d.viewModel.on("trigger-action", function (event) {
                if (event.action.id === 'view-website') {
                    window.open(event.target.selectedFeature.attributes.URL);
                }
            });
            var theme = themeLyr.fields[5].domain.codedValues[d.selectedFeature.attributes.Theme].name;
            d._titleNode.parentNode.style.backgroundColor = setBackgroundColor(theme);
        }
    }
    function mapLoaded(a, b, c, d) {
        document.documentElement.querySelector('.logo').style.display = 'block';
        document.documentElement.querySelector('.logo').style.opacity = 1;
        document.documentElement.querySelector('#title').style.display = 'block';
        document.documentElement.querySelector('#title').style.opacity = 1;

        view.popup.dockOptions = {
            position: 'bottom-left'
        };
        map.basemap.baseLayers = [];
        var tileLyr = new VectorTileLayer({
            url: "https://www.arcgis.com/sharing/rest/content/items/3981b4e8cabb4b0fb6d4a8c94379532b/resources/styles/root.json"
        });
        map.add(tileLyr, 0);
        view.popup.watch('selectedFeature', featureSelected);
        d.layers.forEach(function (l) {
            if (l.title === 'Downtown Plan Projects') {
                themeLyr = l;
            }
            if (l.title === 'Catalytic Project Areas') {
                areaLyr = l;
            }
        });
        themeLyr.on('layerview-create', function () {
            themeLyr.renderer.uniqueValueInfos.forEach(function (uvi) {
                uvi.symbol = new PictureMarkerSymbol({
                    height: 30,
                    width: 18.75,
                    url: uvi.label.toLowerCase() + ".svg"
                });
            });
        });
        areaLyr.on('layerview-create', function (e) {
            e.layerView.watch('updating', function (val) {
                if (!val) {
                    areaLyr.queryFeatures().then(function (results) {
                        view.goTo(results.features);
                    });
                }
            });
        });
    }
    function createMap() {
        map = new WebMap({
            portalItem: {
                id: "05e67378902b4128b31ce7f07f3808a7"
            }
        });
        view = new MapView({
            map: map,
            container: "map"
        });
        map.watch('loaded', mapLoaded);
    }
    createMap();
    addLocateButton();
    addSearch();
});
function filterTheme(element, theme) {
    'use strict';
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
    'use strict';
    if (areas.indexOf(area) > -1) {
        areas.splice(areas.indexOf(area), 1);
        element.querySelector('svg').classList.add('unselected');
    } else {
        areas.push(area);
        element.querySelector('svg').classList.remove('unselected');
    }
    areaLyr.definitionExpression = "Name in (" + areas.toString() + ")";
    view.goTo({
        target: areaLyr.extent
    });
}
document.documentElement.addEventListener('touchstart', function (event) {
    'use strict';
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, false);
document.documentElement.querySelector('.mdl-layout__content').addEventListener('touchmove', function (e) {
    'use strict';
    e.preventDefault();
}, false);

