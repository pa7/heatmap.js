/* 
 * heatmap.js 0.0.0.1 Leaflet overlay
 *
 * Copyright (c) 2012, Dominik Moritz
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */
 
L.TileLayer.HeatMap = L.Class.extend({

    initialize: function(options) {
        L.Util.setOptions(this, options);
        this.options = options;
        this.data = [];
    },

    onAdd: function(map) {
        this._map = map;
        this._initHeatMap(this._map, this.options);
        map.on("viewreset", this._redraw, this);
        map.on("moveend", this._redraw, this);
        map.on("dragend", this._redraw, this);
        map.on("zoomend", this._redraw, this);
        this._redraw();
    },

    onRemove: function(map) {
        map.getPanes().overlayPane.removeChild(this._div);
        map.off("viewreset", this._redraw, this);
        map.off("moveend", this._redraw, this);
        map.off("dragend", this._redraw, this);
        map.off("zoomend", this._redraw, this);
    },

    _initHeatMap: function(map, options){
        options = options || {};
        //this._opacity = options.opacity || 0.6;

        var container = L.DomUtil.create('div', 'leaflet-heatmap-container');
        container.style.position = 'absolute';
        container.style.width = this._map.getSize().x+"px";
        container.style.height = this._map.getSize().y+"px";

        var canv = document.createElement("div");
        canv.style.width = this._map.getSize().x+"px";
        canv.style.height = this._map.getSize().y+"px";
        canv.width = parseInt(canv.style.width);
        canv.height = parseInt(canv.style.height);
        canv.style.opacity = this._opacity;
        container.appendChild(canv);

        var config = {
            "radius": options.radius,
            "element": canv,
            "visible": true,
            "opacity": options.opacity * 100,
            "gradient": options.gradient
        };

        this.heatmap = heatmapFactory.create(config);

        this._div = container;
        this._map.getPanes().overlayPane.appendChild(this._div);
    },

    pushData: function(lat, lon, value) {
        this.data.push({"lat":lat, "lon":lon, "v":value});
        this._drawHeatmapPoint(lat, lon, value);
    },

    addData: function(dataset) {
        this.data = dataset;
    },
    
    _resetCanvasPosition: function() {
        var bounds = this._map.getBounds();
        var topLeft = this._map.latLngToLayerPoint(bounds.getNorthWest());
        //topLeft = this._map.layerPointToContainerPoint(topLeft);

        L.DomUtil.setPosition(this._div, topLeft);
    },

    _redraw: function(ctx) {
        //console.log("redraw",ctx)
        this._resetCanvasPosition();
        this.heatmap.clear();
        if (this.data.length > 0) {
            for (var i=0, l=this.data.length; i<l; i++) {
                var lonlat = new L.LatLng(this.data[i].lat, this.data[i].lon);
                var localXY = this._map.latLngToLayerPoint(lonlat);
                // todo: do once
                localXY = this._map.layerPointToContainerPoint(localXY);
                this._drawHeatmapPoint(
                        Math.floor(localXY.x),
                        Math.floor(localXY.y),
                        this.data[i].v);
            }
        }
        return this;
    },

    _drawHeatmapPoint: function(x, y, value) {
        this.heatmap.store.addDataPoint(
            Math.floor(x),
            Math.floor(y),
            value);
    }

});
