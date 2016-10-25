var themeLyr = null,
    areaLyr = null,
    themes = [0, 1, 2, 3],
    areas = [0, 1, 2, 3, 4],
    map = null,
    view = null;
document.documentElement.addEventListener('touchstart', function (event) {
    'use strict';
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, false);
document.documentElement.querySelector('.mdl-layout__content').addEventListener('touchmove', function (e) {
    'use strict';
    e.preventDefault();
    console.log('test');
}, false);


require([
    "esri/views/MapView",
    "esri/WebMap",
    "esri/layers/VectorTileLayer",
    "esri/symbols/PictureMarkerSymbol",
    "dojo/domReady!"
], function (
    MapView,
    WebMap,
    VectorTileLayer,
    PictureMarkerSymbol
) {

    /************************************************************
     * Creates a new WebMap instance. A WebMap must reference
     * a PortalItem ID that represents a WebMap saved to
     * arcgis.com or an on-premise portal.
     *
     * To load a WebMap from an on-premise portal, set the portal
     * url in esriConfig.portalUrl.
     ************************************************************/
    'use strict';
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

    map.watch('loaded', function (a, b, c, d) {

        view.popup.watch('selectedFeature', function (a, b, c, d) {

            if (d.selectedFeature) {
                d.actions.splice(1, 1);
                if (d.selectedFeature.attributes.URL) {
                    d.actions.push({
                        id: 'view-website',
                        title: 'View Website',
                        className: 'esri-icon-link-external'
                    });
                }
                var action = d.viewModel.on("trigger-action", function (event) {
                    if (event.action.id === 'view-website') {
                        window.open(event.target.selectedFeature.attributes.URL);
                    }
                    if (action.next) {
                        action.next.remove();
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


        d.layers.forEach(function (l) {
            if (l.title === 'Downtown Plan Projects') {
                themeLyr = l;
            }
            if (l.title === 'Catalytic Project Areas') {
                areaLyr = l;
            }
        });


        themeLyr.on('layerview-create', function (e) {
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
        map.basemap.baseLayers = [];
        var tileLyr = new VectorTileLayer({
            url: "https://www.arcgis.com/sharing/rest/content/items/3981b4e8cabb4b0fb6d4a8c94379532b/resources/styles/root.json"
        });
        map.add(tileLyr, 0);
    });

});

function filterTheme(element, theme) {
    'use strict';
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
    'use strict';
    if (areas.indexOf(area) > -1) {
        areas.splice(areas.indexOf(area), 1);
        element.querySelector('svg').classList.add('unselected');
    } else {
        areas.push(area);
        element.querySelector('svg').classList.remove('unselected');
    }
    areaLyr.definitionExpression = "Name in (" + areas.toString() + ")";
    view.goTo({target: areaLyr.extent});

}
var xmlhttp;

function searchForAddresses(element) {
    'use strict';
    var node = document.getElementById('list');
    if (xmlhttp) {
        xmlhttp.abort();
    }
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            while (node.hasChildNodes()) {
                node.removeChild(node.lastChild);
            }
            document.getElementById("list").style.display = 'block';

            var data = JSON.parse(xmlhttp.responseText);
            data.features.forEach(function (d) {
                document.getElementById('list')
                    .insertAdjacentHTML('beforeend', '<li onclick="itemSelected(event)" class="mdl-list__item"><span data-x="' + d.geometry.x + '" data-y="' + d.geometry.y + '" class="address mdl-list__item-primary-content">' + d.attributes.ADDRESS + '</span></li>');
            });
            searchForNeighborhoods(element);
        }
    };
    xmlhttp.open("GET", "https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/query?f=json&outSR=4326&returnGeometry=true&outFields=ADDRESS&orderByFields=ADDRESS&resultRecordCount=5&where=ADDRESSU LIKE '" + element.value.toUpperCase() + "%'", true);
    if (element.value.length > 3) {
        xmlhttp.send();
    }
}
var neighborhoods = [];

function searchForNeighborhoods(element) {
    'use strict';
    var node = document.getElementById('list');
    // compatible with IE7+, Firefox, Chrome, Opera, Safari
    if (xmlhttp) {
        xmlhttp.abort();
    }
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            document.getElementById("list").style.display = 'block';

            var data = JSON.parse(xmlhttp.responseText);
            neighborhoods = data;
            data.features.forEach(function (d) {
                document.getElementById('list')
                    .insertAdjacentHTML('beforeend', '<li onclick="itemSelected(event)" class="mdl-list__item"><span class="address mdl-list__item-primary-content">' + d.attributes.NAME + '</span></li>');
            });
        }
    };
    xmlhttp.open("GET", "https://maps.raleighnc.gov/arcgis/rest/services/HousingNeighborhoods/HousingNeighborhoods/MapServer/0/query?f=json&outSR=4326&returnGeometry=true&outFields=NAME&orderByFields=NAME&resultRecordCount=5&where=UPPER(NAME) LIKE '" + element.value.toUpperCase() + "%'", true);
    if (element.value.length > 3) {
        xmlhttp.send();
    }
}

function searchEntered(element) {
    'use strict';
    searchForAddresses(element)


}

document.addEventListener('click', hideList);
document.getElementById('inputHolder').addEventListener("transitionend", inputResize, false);

function itemSelected(event) {
    'use strict';
    require(['esri/geometry/Polygon', 'esri/geometry/Point'], function (Polygon, Point) {
        var x = null,
            y = null;
        if (event.target.children.length > 0) {
            x = event.target.children[0].getAttribute('data-x');
            y = event.target.children[0].getAttribute('data-y');
        } else {
            x = event.target.getAttribute('data-x');
            y = event.target.getAttribute('data-y');
        }

        // -> and re-adding the class
        if (x) {
            zoomToLocation(new Point([parseFloat(x), parseFloat(y)]), 18);
        } else {
            var name = '';
            if (event.target.children.length > 0) {
                name = event.target.children[0].innerHTML;
            } else {
                name = event.target.innerHTML;
            }
            neighborhoods.features.forEach(function (n) {
                if (n.attributes.NAME === name) {
                    view.goTo({
                        target: new Polygon(n.geometry)
                    });
                }
            });
        }

        document.getElementById("search").value = '';
        document.getElementById("title").style.display = 'block';
        document.getElementById("inputHolder").style.maxWidth = '.1px';
    });

}

function searchClicked() {
    'use strict';
    if (document.getElementById("title").style.display === 'block' || document.getElementById("title").style.display === '') {
        document.getElementById("title").style.display = 'none';
        document.getElementById("inputHolder").style.maxWidth = '600px';
    } else {
        document.getElementById("title").style.display = 'block';
        document.getElementById("inputHolder").style.maxWidth = '.1px';
        document.getElementById("search").blur();
    }
}

function zoomToLocation(center, zoom) {
    'use strict';
    require(["esri/geometry/geometryEngine", "esri/Graphic", "esri/symbols/PictureMarkerSymbol"], function (geometryEngine, Graphic, PictureMarkerSymbol) {
        var buffer = geometryEngine.geodesicBuffer(center, 200, 'meters');
        view.goTo({
            target: buffer
        });
        var graphic = new Graphic({geometry: center, symbol: new PictureMarkerSymbol({
            width: 30,
            height: 30,
            url: 'location.svg'
        })});
        view.graphics.removeAll();
        view.graphics.add(graphic);

    });
    // view.goTo({
    //     center: center,
    //     zoom: zoom
    // });
}

function inputResize(event) {
    'use strict';
    if (event.target.clientWidth === 0) {
        document.getElementById("title").style.display = 'block';
    }
}

function hideList(event) {
    'use strict';
    if (event.target.id !== "list") {
        document.getElementById("list").style.display = 'none';
    }
}