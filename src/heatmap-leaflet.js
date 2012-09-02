/*
 * heatmap.js 0.2 Leaflet overlay
 *
 * Copyright (c) 2012, Dominik Moritz
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 *
 * Attribution for snippets: https://gist.github.com/2566567
 */

 L.TileLayer.HeatMap = L.TileLayer.Canvas.extend({
    options: {
        // calculate the maximum value on a per view basis instead of global
        // this creates issues when moving the map
        maxPerView: false,
        debug: false
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);

        this._cache = {
            max: 0,
            bounds: {}
        };

        this.drawTile = function (tile, tilePoint, zoom) {
            var ctx = {
                tile: tile,
                tilePoint: tilePoint,
                zoom: zoom,
                heatmap: tile.heatmap
            };

            if (this.options.debug) {
                this._drawDebugInfo(ctx);
            }
            this._draw(ctx);
        };
    },

    // Add a dataset to be drawn. You might want to redraw() if you had previeous datasets.
    addData: function(dataset) {
        this._data = dataset;
        this._cache.max = this._calculateMaxValue(dataset);
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
            "gradient": options.gradient
        };

        tile.heatmap = h337.create(config);

        return tile;
    },

    _drawDebugInfo: function (ctx) {
        var canvas = L.DomUtil.create('canvas', 'leaflet-tile-debug');
        var tileSize = this.options.tileSize;
        canvas.width = tileSize;
        canvas.height = tileSize;
        ctx['tile'].appendChild(canvas);
        ctx['canvas'] = canvas;

        var max = tileSize;
        var g = ctx.canvas.getContext('2d');
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

        this._drawPoint(ctx, [0,0])
    },

    _drawPoint: function (ctx, geom) {
        var p = this._tilePoint(ctx, geom);
        var c = ctx.canvas;
        var g = c.getContext('2d');
        g.beginPath();
        g.fillStyle = '#FF0000';
        g.arc(p.x, p.y, 4, 0, Math.PI * 2);
        g.closePath();
        g.fill();
        g.restore();
    },

    _tilePoint: function (ctx, coords) {
        // start coords to tile 'space'
        var s = ctx.tilePoint.multiplyBy(this.options.tileSize);

        // actual coords to tile 'space'
        var p = this._map.project(new L.LatLng(coords[1], coords[0]));

        // point to draw
        var x = Math.round(p.x - s.x);
        var y = Math.round(p.y - s.y);
        return {
            x: x,
            y: y
        };
    },

    // checks whether the point is inside a tile
    _isInTile: function(localXY, padding) {
        padding = padding || this.options.radius;
        var bounds = this._cache.bounds[padding];
        if (!bounds) {
            var tileSize = this.options.tileSize;
            var p1 = new L.Point(-padding, -padding); //topLeft
            var p2 = new L.Point(padding+tileSize, padding+tileSize); //bottomRight
            bounds = this._cache.bounds[padding] = new L.Bounds(p1, p2);
        };
        return bounds.contains([localXY.x, localXY.y]);
    },

    // get the max value of the dataset
    _getMaxValue: function() {
        if (this.options.maxPerView) {
            var dataset = [];
            var mapBounds = this._map.getBounds();
            this._data.forEach(function(item){
                if (mapBounds.contains([item.lat, item.lon])) {
                    dataset.push(item);
                };
            });

            return this._calculateMaxValue(dataset)
        } else {
            return this._cache.max;
        }
    },

    _calculateMaxValue: function(dataset) {
        array = [];
        dataset.forEach(function(item){
            array.push(item.value || item.count);
        });
        return Math.max.apply(Math, array);
    },

    // removes previous heatmap and draws a new one
    _redrawTile: function (tile) {
        $('canvas', tile).remove();
        L.TileLayer.Canvas.prototype._redrawTile.call(this, tile);
    },

    _draw: function(ctx) {

        var heatmap = ctx.heatmap
        var pointsInTile = [];
        if (this._data.length > 0) {
            for (var i=0, l=this._data.length; i<l; i++) {

                var lonlat = [this._data[i].lon, this._data[i].lat];
                var localXY = this._tilePoint(ctx, lonlat);

                if (this._isInTile(localXY)) {
                    pointsInTile.push({
                        x: localXY.x,
                        y: localXY.y,
                        count: this._data[i].value
                    });
                };
            }
        }

        heatmap.store.setDataSet({max: this._getMaxValue(), data: pointsInTile});

        return this;
    },

    tileDrawn: function (tile) {
        this._tileOnLoad.call(tile);
    }
});

L.TileLayer.heatMap = function (options) {
    return new L.TileLayer.HeatMap(options);
};

