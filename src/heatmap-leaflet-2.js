/* 
 * heatmap.js 0.0.0.1 Leaflet overlay
 *
 * Copyright (c) 2012, Dominik Moritz
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */
 
L.TileLayer.HeatMap = L.TileLayer.Canvas.extend({
    addData: function(dataset) {
        this._data = dataset;
    },

    drawTile: function(tile, tilePoint, zoom) {
        var ctx = tile.getContext('2d');

        var nwPoint = tilePoint.multiplyBy(this.options.tileSize);
        var sePoint = nwPoint.add(new L.Point(this.options.tileSize, this.options.tileSize));
        var nwCoord = this._map.unproject(nwPoint, ctx.zoom, true);
        var seCoord = this._map.unproject(sePoint, ctx.zoom, true);
        var bounds = [nwCoord.lng, seCoord.lat, seCoord.lng, nwCoord.lat];

        var tileSize = this.options.tileSize;
        tile.style.width = tileSize+"px";
        tile.style.height = tileSize+"px";
        tile.width = parseInt(tile.style.width);
        tile.height = parseInt(tile.style.height);

        var options = this.options;
        var config = {
            "radius": options.radius,
            "element": tile,
            "visible": true,
            "opacity": options.opacity * 100,
            "gradient": options.gradient
        };

        heatmap = h337.create(config);

        // todo clip
        if (this._data.length > 0) {
            for (var i=0, l=this._data.length; i<l; i++) {
                var lonlat = new L.LatLng(this._data[i].lat, this._data[i].lon);
                var localXY = this._map.latLngToLayerPoint(lonlat);
                localXY = this._map.layerPointToContainerPoint(localXY);
                heatmap.store.addDataPoint(
                    Math.floor(localXY.x),
                    Math.floor(localXY.y),
                    this._data[i].v);
            }
        }

        ctx.restore();
    }
});

L.TileLayer.heatMap = function (options) {
    return new L.TileLayer.HeatMap(options);
};
