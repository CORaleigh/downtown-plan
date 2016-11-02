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
    "esri/widgets/Home",
    "esri/widgets/Compass",
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
    Home,
    Compass,
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
    function addHomeButton() {
        var homeWidget = new Home({
          view: view
        });
        view.ui.add(homeWidget, "top-left");
    }
    function addCompassButton() {
        var compass = new Compass({
          view: view
        });
        view.ui.add(compass, "top-left");        
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
            //if (d.selectedFeature.layer.title === "Downtown Plan Projects") {
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
                var theme = themeLyr.fields[4].domain.codedValues[d.selectedFeature.attributes.Theme].name;
                d._titleNode.parentNode.style.backgroundColor = setBackgroundColor(theme);
            } else {
                d.actions.splice(1, 1);                
            }
       // }
    }

    function mapLoaded(a, b, c, d) {
        document.documentElement.querySelector('.logo').style.display = 'block';
        document.documentElement.querySelector('.logo').style.opacity = 1;
        document.documentElement.querySelector('#titleDiv').style.display = 'block';
        document.documentElement.querySelector('#titleDiv').style.opacity = 1;

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
            view.watch('stationary', function (val) {
                if (val && areaLyr) {
                    var queryParams = areaLyr.createQuery();
                    queryParams.geometry = view.extent.center;                    
                    areaLyr.queryFeatures(queryParams).then(function (results) {
                        var area = null;
                        if (results.features.length > 0) {
                            area = results.features[0].attributes.Name;
                        }
                        var renderer = areaLyr.renderer.clone();
                        renderer.uniqueValueInfos.forEach(function (uvi, i) {
                            if (area != null && view.scale < 10000) {
                                if (uvi.value === area.toString() && view.scale < 10000) {
                                    removeFill(uvi);
                                    document.querySelectorAll('.area-svg rect')[i].style.fillOpacity = 0;
                                } else {
                                    addFill(uvi);
                                    document.querySelectorAll('.area-svg rect')[i].style.fillOpacity = 1;
                                }
                            } else {
                                addFill(uvi);
                                document.querySelectorAll('.area-svg rect')[i].style.fillOpacity = 1;

                            }
                        });
                        areaLyr.renderer = renderer;
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
    addHomeButton();
    addCompassButton();
    addSearch();
});
function removeFill(uvi) {
    'use strict';
    uvi.symbol.outline.width = 10;
    uvi.symbol.outline.opacity = 1;
    uvi.symbol.style = 'none';
}
function addFill(uvi) {
    'use strict';
    uvi.symbol.outline.width = 0;
    uvi.symbol.outline.opacity = 0;
    uvi.symbol.style = 'solid';
}
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
    var renderer = areaLyr.renderer.clone();
    renderer.uniqueValueInfos.forEach(function (uvi, i) {
        if (uvi.value === area.toString() && uvi.symbol.style === 'solid') {
            removeFill(uvi);
            element.querySelector('svg rect').style.fillOpacity = 0;
        } else {
            addFill(uvi);
            element.parentElement.querySelectorAll('svg rect')[i].style.fillOpacity = 1;
        }
    });
    areaLyr.renderer = renderer;
    var queryParams = areaLyr.createQuery();
    queryParams.where = "Name = " + area;
    areaLyr.queryFeatures(queryParams).then(function (results) {
        if (results.features.length > 0) {
            view.goTo(results.features[0].geometry.extent.expand(1.25));
        }
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

