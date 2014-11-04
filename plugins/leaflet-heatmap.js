/*
 * Leaflet Heatmap Overlay
 *
 * Copyright (c) 2014, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */

// Leaflet < 0.8 compatibility
if (typeof L.Layer === 'undefined') {
  L.Layer = L.Class;
}

if (!window.setImmediate) window.setImmediate = (function() {
    var head = { }, tail = head; // очередь вызовов, 1-связный список

    var ID = Math.random(); // уникальный идентификатор

    function onmessage(e) {
        if(e.data != ID) return; // не наше сообщение
        head = head.next;
        var func = head.func;
        delete head.func;
        func();
    }

    if(window.addEventListener) { // IE9+, другие браузеры
        window.addEventListener('message', onmessage, false);
    } else { // IE8
        window.attachEvent( 'onmessage', onmessage );
    }

    return window.postMessage ? function(func) {
        tail = tail.next = { func: func };
        window.postMessage(ID, "*");
    } :
        function(func) { // IE<8
            setTimeout(func, 0);
        };
}());

var HeatmapOverlay = L.Layer.extend({

    initialize: function (config) {
        this.cfg = config;
        this._el = L.DomUtil.create('div', 'leaflet-zoom-hide');
        this._data = [];
        this._max = 1;
        this._min = 0;
        this.cfg.container = this._el;
        this.zoom = -1;
    },

    onAdd: function (map) {
        this._map = map;
        this.zoom = map.getZoom();

        map.getPanes().overlayPane.appendChild(this._el);

        if (!this._heatmap) {
            this._heatmap = h337.create(this.cfg);
        }

        // reset origin and redraw after map move, zoom or resize
        map.on('moveend', this._reset, this);

        this._reset();
    },

    onRemove: function (map) {
        // remove layer's DOM elements and listeners
        map.getPanes().overlayPane.removeChild(this._el);

        map.off('moveend', this._reset, this);
    },
    _draw: function() {
        if (!this._map) { return; }

        var point = this._map.latLngToContainerPoint(this._origin);

        // reposition the layer
        this._el.style[HeatmapOverlay.CSS_TRANSFORM] = 'translate(' +
            -Math.round(point.x) + 'px,' +
            -Math.round(point.y) + 'px)';
        this._update();
    },
    _update: function() {
        var bounds, zoom, scale;

        bounds = this._map.getBounds();
        this.zoom = zoom = this._map.getZoom();
        scale = Math.pow(2, zoom);

        if (this._data.length == 0) {
            return;
        }

        var generatedData = { max: this._max, min: this._min };
        var latLngPoints = [];
        var radiusMultiplier = this.cfg.scaleRadius ? scale : 1;
        var localMax = 0;
        var localMin = 0;
        var valueField = this.cfg.valueField;
        var len = this._data.length;
    var self = this;
    var dataPerProcess = 10000;
    var processCount = Math.ceil(len / dataPerProcess);
    var processFinished = 0;

    function processData(start, end) {
        for (var i = start; i < end; i++) {
            var entry = self._data[i];
            var value = entry[valueField];
            var latlng = entry.latlng;


            // we don't wanna render points that are not even on the map ;-)
            if (!bounds.contains(latlng)) {
                continue;
            }
            // local max is the maximum within current bounds
            localMax = Math.max(value, localMax);
            localMin = Math.min(value, localMin);

            var point = self._map.latLngToContainerPoint(latlng);
            var latlngPoint = { x: Math.round(point.x), y: Math.round(point.y) };
            latlngPoint[valueField] = value;

            var radius;

            if (entry.radius) {
                radius = entry.radius * radiusMultiplier;
            } else {
                radius = (self.cfg.radius || 2) * radiusMultiplier;
            }
            latlngPoint.radius = radius;
            latLngPoints.push(latlngPoint);
        }
        processFinished++;
        if (processFinished == processCount) {
            updateLayer();
        }
    }

    for (var processNum = 0; processNum < processCount; processNum++) {
        var min = dataPerProcess * processNum;
        var max = dataPerProcess * (processNum + 1);
        if (max > len) {
            max = len;
        }
        processData(min, max);
    }

    function updateLayer() {
        if (self.cfg.useLocalExtrema) {
            generatedData.max = localMax;
            generatedData.min = localMin;
        }

        generatedData.data = latLngPoints;

        self._heatmap._renderer.setDimensions(self._width, self._height);
        self._heatmap.setData(generatedData);
    }

//        while (len--) {
//            var entry = this._data[len];
//            var value = entry[valueField];
//            var latlng = entry.latlng;
//
//
//            // we don't wanna render points that are not even on the map ;-)
//            if (!bounds.contains(latlng)) {
//                continue;
//            }
//            // local max is the maximum within current bounds
//            localMax = Math.max(value, localMax);
//            localMin = Math.min(value, localMin);
//
//            var point = this._map.latLngToContainerPoint(latlng);
//            var latlngPoint = { x: Math.round(point.x), y: Math.round(point.y) };
//            latlngPoint[valueField] = value;
//
//            var radius;
//
//            if (entry.radius) {
//                radius = entry.radius * radiusMultiplier;
//            } else {
//                radius = (this.cfg.radius || 2) * radiusMultiplier;
//            }
//            latlngPoint.radius = radius;
//            latLngPoints.push(latlngPoint);
//        }
//        if (this.cfg.useLocalExtrema) {
//            generatedData.max = localMax;
//            generatedData.min = localMin;
//        }
//
//        generatedData.data = latLngPoints;
//
//        this._heatmap._renderer.setDimensions(this._width, this._height);
//        this._heatmap.setData(generatedData);
    },
    setData: function(data) {
        this._max = data.max || this._max;
        this._min = data.min || this._min;
        var latField = this.cfg.latField || 'lat';
        var lngField = this.cfg.lngField || 'lng';
        var valueField = this.cfg.valueField || 'value';

        // transform data to latlngs
        var data = data.data;
        var len = data.length;
        var d = [];

        while (len--) {
            var entry = data[len];
            var latlng = new L.LatLng(entry[latField], entry[lngField]);
            var dataObj = { latlng: latlng };
            dataObj[valueField] = entry[valueField];
            if (entry.radius) {
                dataObj.radius = entry.radius;
            }
            d.push(dataObj);
        }
        this._data = d;

        this._draw();
    },
    // experimential... not ready.
    addData: function(pointOrArray) {
        if (pointOrArray.length > 0) {
            var len = pointOrArray.length;
            while(len--) {
                this.addData(pointOrArray[len]);
            }
        } else {
            var latField = this.cfg.latField || 'lat';
            var lngField = this.cfg.lngField || 'lng';
            var valueField = this.cfg.valueField || 'value';
            var entry = pointOrArray;
            var latlng = new L.LatLng(entry[latField], entry[lngField]);
            var dataObj = { latlng: latlng };

            dataObj[valueField] = entry[valueField];
            this._max = Math.max(this._max, dataObj[valueField]);
            this._min = Math.min(this._min, dataObj[valueField]);

            if (entry.radius) {
                dataObj.radius = entry.radius;
            }
            this._data.push(dataObj);
            this._draw();
        }
    },
    _reset: function () {
        this._origin = this._map.layerPointToLatLng(new L.Point(0, 0));

        var size = this._map.getSize();
        this._width  = size.x;
        this._height = size.y;

        this._el.style.width = this._width + 'px';
        this._el.style.height = this._height + 'px';

        var self = this;

        if (this.zoom != this._map.getZoom()) {
            setImmediate(function() {self._draw()});
        } else {
            this._draw();
        }

    }
});

HeatmapOverlay.CSS_TRANSFORM = (function() {
    var div = document.createElement('div');
    var props = [
        'transform',
        'WebkitTransform',
        'MozTransform',
        'OTransform',
        'msTransform'
    ];

    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if (div.style[prop] !== undefined) {
            return prop;
        }
    }

    return props[0];
})();
