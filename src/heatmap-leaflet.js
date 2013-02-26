/*
 * heatmap.js 0.2 Leaflet overlay
 *
 * Copyright (c) 2012, Dominik Moritz
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 *
 * Attribution
 *  - Some snippets for canvas layer: https://gist.github.com/2566567
 *  - QuadTree: https://github.com/jsmarkus/ExamplesByMesh/tree/master/JavaScript/QuadTree
 */

 L.TileLayer.HeatMap = L.TileLayer.Canvas.extend({
	options: {
        debug: false,
        /*
         * [EXPERIMENTAL]
         * true means that the maxValue is calculated per view.
         * This leads to wrong reporoduction of colors if the map is moved!
         */
        useRelativeMaxValue: false
	},

	initialize: function (options, data) {
        var self = this;
        L.Util.setOptions(this, options);

        this.drawTile = function (tile, tilePoint, zoom) {
            var ctx = {
                canvas: tile,
                tilePoint: tilePoint,
                zoom: zoom,
                heatmap: tile.heatmap
            };

            if (self.options.debug) {
                self._drawDebugInfo(ctx);
            }
            this._draw(ctx);
        };
    },

    _drawDebugInfo: function (ctx) {
        var canvas = L.DomUtil.create('canvas', 'leaflet-tile-debug');
        var tileSize = this.options.tileSize;
        canvas.width = tileSize;
        canvas.height = tileSize;
        ctx.canvas.appendChild(canvas);
        ctx.dbgcanvas = canvas;

        var max = tileSize;
        var g = canvas.getContext('2d');
        g.strokeStyle = '#000000';
        g.fillStyle = '#FFFF00';
        g.strokeRect(0, 0, max, max);
        g.font = "12px Arial";
        g.fillRect(0, 0, 5, 5);
        g.fillRect(0, max - 5, 5, 5);
        g.fillRect(max - 5, 0, 5, 5);
        g.fillRect(max - 5, max - 5, 5, 5);
        g.fillRect(max / 2 - 5, max / 2 - 5, 10, 10);
        g.strokeText(ctx.tilePoint.x + ' ' + ctx.tilePoint.y + ' ' + ctx.zoom, max / 2 - 30, max / 2 - 10);

        this._drawPoint(ctx, [0,0]);
    },

    _drawPoint: function (ctx, geom) {
        var p = this._tilePoint(ctx, geom);
        var c = ctx.dbgcanvas;
        var g = c.getContext('2d');
        g.beginPath();
        g.fillStyle = '#FF0000';
        g.arc(p.x, p.y, 4, 0, Math.PI * 2);
        g.closePath();
        g.fill();
        g.restore();
    },

    _createTileProto: function () {
        var proto = this._tileProto = L.DomUtil.create('div', 'leaflet-tile');

        var tileSize = this.options.tileSize;
        proto.style.width = tileSize+"px";
        proto.style.height = tileSize+"px";
        proto.width = tileSize;
        proto.height = tileSize;
    },

    _createTile: function () {
        var tile = this._tileProto.cloneNode(false);
        tile.onselectstart = tile.onmousemove = L.Util.falseFn;

        var options = this.options;
        var config = {
            "radius": options.radius,
            "element": tile,
            "visible": true,
            "opacity": options.opacity * 100,
            "gradient": options.gradient,
            "debug": options.debug
        };
        tile.heatmap = h337.create(config);

        return tile;
    },

    /**
     * Inserts data into quadtree and redraws heatmap canvas
     */
    setData: function(dataset) {
        var self = this;
        var latLngs = [];
        this._maxValue = 0;
        dataset.forEach(function(d) {
            latLngs.push(new L.LatLng(d.lat, d.lon));
            self._maxValue = Math.max(self._maxValue, d.value);
        });
        this._bounds = new L.LatLngBounds(latLngs);

        this._quad = new QuadTree(this._boundsToQuery(this._bounds), false, 6, 6);

        dataset.forEach(function(d) {
            self._quad.insert({
                x: d.lon,
                y: d.lat,
                value: d.value
            });
        });
        this.redraw();
    },

    /**
     * Transforms coordinates to tile space
     */
    _tilePoint: function (ctx, coords) {
        // start coords to tile 'space'
        var s = ctx.tilePoint.multiplyBy(this.options.tileSize);

        // actual coords to tile 'space'
        var p = this._map.project(new L.LatLng(coords[1], coords[0]));

        // point to draw
        var x = Math.round(p.x - s.x);
        var y = Math.round(p.y - s.y);
        return [x, y];
    },

    /**
     * Creates a query for the quadtree from bounds
     */
    _boundsToQuery: function(bounds) {
        return {
            x: bounds.getSouthWest().lng,
            y: bounds.getSouthWest().lat,
            width: bounds.getNorthEast().lng-bounds.getSouthWest().lng,
            height: bounds.getNorthEast().lat-bounds.getSouthWest().lat
        };
    },

    _getMaxValue: function() {
        if (this.options.useRelativeMaxValue) {
            var bounds = this._map.getBounds();
            var maxValue = 0;
            this._quad.retrieveInBounds(this._boundsToQuery(bounds)).forEach(function(obj) {
                maxValue = Math.max(maxValue, obj.value);
            });
            return maxValue;
        } else {
            return this._maxValue;
        }
    },

    _draw: function (ctx) {
        if (!this._quad || !this._map) {
            return;
        }

        var self = this;
        var localXY, value;
        var pointsInTile = [];

        var tileSize = this.options.tileSize;
        var nwPoint = ctx.tilePoint.multiplyBy(tileSize);
        var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));

        // padding
        var pad = new L.Point(this._getMaxValue(), this._getMaxValue());
        nwPoint = nwPoint.subtract(pad);
        sePoint = sePoint.add(pad);

        var bounds = new L.LatLngBounds(this._map.unproject(sePoint), this._map.unproject(nwPoint));
        this._quad.retrieveInBounds(this._boundsToQuery(bounds)).forEach(function(obj) {
            localXY = self._tilePoint(ctx, [obj.x, obj.y]);
            value = obj.value;
            pointsInTile.push({
                x: localXY[0],
                y: localXY[1],
                count: value
            });
        });

        ctx.heatmap.store.setDataSet({max: this._getMaxValue(), data: pointsInTile});

        return this;
    }
});

L.TileLayer.heatMap = function (options) {
    return new L.TileLayer.HeatMap(options);
};