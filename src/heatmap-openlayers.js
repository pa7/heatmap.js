/* 
 * heatmap.js OpenLayers Heatmap Class
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 * 
 * Modified on Jun,06 2011 by Antonio Santiago (http://www.acuriousanimal.com)
 * - Heatmaps as independent map layer.
 * - Points based on OpenLayers.LonLat.
 * - Data initialization in constructor.
 * - Improved 'addDataPoint' to add new lonlat based points.
 */ 
OpenLayers.Layer.Heatmap = OpenLayers.Class(OpenLayers.Layer, {
    isBaseLayer: false,
    heatmap: null,
    // we store the pixel data, because we have to redraw with new positions on zoomend|dragend
    tmpData: {},    
    initialize: function(name, map, data, hmoptions, options){
        OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);
        var heatdiv = document.createElement("div");
        heatdiv.style.cssText = "position:absolute;width:"+map.size.w+"px;height:"+map.size.h+"px;";
        // this will be the heatmaps element
        this.div.appendChild(heatdiv);
        // store data
        if(data) this.tmpData = data;
        // add to our heatmap.js config
        hmoptions.element = heatdiv;
        // create the heatmap with passed heatmap-options
        this.heatmap = h337.create(hmoptions);
        var handler = function(){
            if(this.tmpData.max) this.updateLayer();
        };
        // on zoomend we have to redraw the datapoints with new positions
        map.events.register("zoomend", this, handler);
    },
    updateLayer: function(){
        this.setDataSet(this.tmpData);
    },
    setDataSet: function(obj){
        var set = {},
        dataset = obj.data
        dlen = dataset.length;
        set.max = obj.max;
        set.data = [];
        // converting from {max: <num>, data: [{lon: <num>, lat: <num>, count: <num>}] }
        // to lonlat objects in order to get the pixelpositions on the map
        while(dlen--){
            // Get lotlan transforming from layer projection to map projection.
            var lonlat = dataset[dlen].lonlat.clone().transform(this.projection, this.map.getProjectionObject());
            var pixel = this.roundPixels(this.getViewPortPxFromLonLat(lonlat));
            if(pixel)
                set.data.push({
                    x: pixel.x, 
                    y: pixel.y, 
                    count: dataset[dlen].count
                    });
        }
        this.tmpData = obj;
        this.heatmap.store.setDataSet(set);
    },
    // we don't want to have decimal numbers such as xxx.9813212 since they slow canvas performance down + don't look nice
    roundPixels: function(p){
        if(p.x < 0 || p.y < 0)
            return false;
			
        // fast rounding - thanks to Seb Lee-Delisle for this neat hack
        p.x = ~~ (p.x+0.5);
        p.y = ~~ (p.y+0.5);
        return p;
    },
    // same procedure as setDataSet
    addDataPoint: function(srclonlat, c){
        this.tmpData.data.push({lonlat: srclonlat, count: c});
        // Get lotlan transforming from layer projection to map projection.
        var lonlat = srclonlat.clone().transform(this.projection, this.map.getProjectionObject());
        var pixel = this.roundPixels(this.getViewPortPxFromLonLat(lonlat));		
        var args = [pixel.x, pixel.y];
        if(pixel){
            if(arguments.length == 2){
                args.push(arguments[1]);
            }
            this.heatmap.store.addDataPoint.apply(this.heatmap.store, args);
        }
    },
    toggle: function(){
        this.heatmap.toggleDisplay();
    },
    destroy: function() {
        // for now, nothing special to do here. 
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);  
    },
    CLASS_NAME: "OpenLayers.Layer.Heatmap"
});