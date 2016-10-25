var themeLyr = null,
    areaLyr = null,
    themes = [0, 1, 2, 3],
    areas = [0, 1, 2, 3, 4],
    map = null,
    view = null,
    action = null;
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
require([
    "esri/views/MapView",
    "esri/WebMap",
    "esri/layers/VectorTileLayer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/widgets/Locate",
    "esri/widgets/Search",
    "esri/layers/FeatureLayer",
    "esri/tasks/Locator",
    "esri/Graphic",
    "dojo/domReady!"
], function(
    MapView,
    WebMap,
    VectorTileLayer,
    PictureMarkerSymbol,
    Locate,
    Search,
    FeatureLayer,
    Locator,
    Graphic
) {
    'use strict';
    map = new WebMap({
        portalItem: {
            id: "05e67378902b4128b31ce7f07f3808a7"
        }
    });

    view = new MapView({
        map: map,
        container: "map"
    });
    var locateSymbol = new PictureMarkerSymbol({
        width: 30,
        height: 30,
        url: 'location.svg'
    });
    var locateBtn = new Locate({
        view: view,
        graphic: Graphic({
            symbol: locateSymbol
        })
    });
    locateBtn.startup();
    view.ui.add(locateBtn, {
        position: "top-left",
        index: 0
    });
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
        sources: [{
            featureLayer: new FeatureLayer({
                url: "http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Addresses/FeatureServer/0",
            }),
            searchFields: ["ADDRESS"],
            displayField: "ADDRESS",
            exactMatch: false,
            outFields: ["ADDRESS"],
            name: "Address",
            placeholder: "Address",
            resultSymbol: resultSymbol
        }, {
            featureLayer: new FeatureLayer({
                url: "http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/DowntownPlan_WFL/FeatureServer/0",
            }),
            searchFields: ["Name"],
            displayField: "Name",
            exactMatch: false,
            outFields: ["Name"],
            name: "Project",
            placeholder: "Project",
            resultSymbol: resultSymbol
        }, {
            featureLayer: new FeatureLayer({
                url: "https://maps.raleighnc.gov/arcgis/rest/services/HousingNeighborhoods/HousingNeighborhoods/MapServer/0",
            }),
            searchFields: ["NAME"],
            displayField: "NAME",
            exactMatch: false,
            outFields: ["NAME"],
            name: "Neighborhood",
            placeholder: "Neighborhood",
            resultSymbol: resultSymbol
        }]
    });
    // Adds the search widget below other elements in
    // the top left corner of the view
    view.ui.add(searchWidget, {
        position: "top-right",
        index: 2
    });

    view.watch('scale', function(a) {
        if (a < 1144.7034353781848) {
            view.scale = 1144.7034353781848;
        }
    });
    map.watch('loaded', function(a, b, c, d) {

        view.popup.watch('selectedFeature', function(a, b, c, d) {

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
                action = d.viewModel.on("trigger-action", function(event) {
                    if (event.action.id === 'view-website') {
                        window.open(event.target.selectedFeature.attributes.URL);
                    }
                });
                var theme = themeLyr.fields[5].domain.codedValues[d.selectedFeature.attributes.Theme].name;
                if (theme === 'Move') {

                    d._titleNode.parentNode.style.backgroundColor = '#f79310';
                }
                if (theme === 'Stay') {
                    d._titleNode.parentNode.style.backgroundColor = '#8f369f';
                }
                if (theme === 'Breathe') {
                    d._titleNode.parentNode.style.backgroundColor = '#7eca29';
                }
                if (theme === 'Link') {
                    d._titleNode.parentNode.style.backgroundColor = '#d21e25';
                }

            }
        });
        themeLyr = d;


        d.layers.forEach(function(l) {
            if (l.title === 'Downtown Plan Projects') {
                themeLyr = l;
            }
            if (l.title === 'Catalytic Project Areas') {
                areaLyr = l;
            }
        });


        themeLyr.on('layerview-create', function(e) {
            themeLyr.renderer.uniqueValueInfos.forEach(function(uvi) {
                uvi.symbol = new PictureMarkerSymbol({
                    height: 30,
                    width: 18.75,
                    url: uvi.label.toLowerCase() + ".svg"
                });
            });
        });
        areaLyr.on('layerview-create', function(e) {
            e.layerView.watch('updating', function(val) {
                if (!val) {
                    areaLyr.queryFeatures().then(function(results) {
                        view.goTo(results.features);
                    });
                }
            });
        });
        map.basemap.baseLayers = [];
        var tileLyr = new VectorTileLayer({
            url: "https://www.arcgis.com/sharing/rest/content/items/3981b4e8cabb4b0fb6d4a8c94379532b/resources/styles/root.json"
        });
        map.add(tileLyr, 0);

    });

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