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
	// the heatmap isn't a basic layer by default - you usually want to display the heatmap over another map ;)
	isBaseLayer: false,
	heatmap: null,
	// we store the lon lat data, because we have to redraw with new positions on zoomend|moveend
	tmpData: {},
        initialize: function(name, map, hmoptions, options){
            var heatdiv = document.createElement("div"),
                handler;

            OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);

	    heatdiv.style.cssText = "position:absolute;width:"+map.size.w+"px;height:"+map.size.h+"px;";
	    // this will be the heatmaps element
	    this.div.appendChild(heatdiv);
	    // add to our heatmap.js config
	    hmoptions.element = heatdiv;
	    this.map = map;
            // create the heatmap with passed heatmap-options
	    this.heatmap = h337.create(hmoptions);

            handler = function(){
                this.updateLayer();
            };
	    // on zoomend and moveend we have to move the canvas element and redraw the datapoints with new positions
	    map.events.register("zoomend", this, handler);
	    map.events.register("moveend", this, handler);
        },
	onMapResize: function(){
		var el = this.heatmap.get('element');
		el.style.width = this.map.size.w+'px';
		el.style.height = this.map.size.h+'px';
		this.heatmap.resize();
	},
	updateLayer: function(){
                var zeroPx = new OpenLayers.Pixel(0,0),
                    origPx = this.map.getLayerPxFromViewPortPx(zeroPx),
                    el = this.heatmap.get('element');
                el.style.top = origPx.y+'px';
                el.style.left = origPx.x+'px';
                this.setDataSet(this.tmpData);
	},
	setDataSet: function(obj){
	    var set = {},
		dataset = obj.data,
		dlen = dataset!=undefined?dataset.length:0,
                entry, lonlat, pixel;

		set.max = obj.max;
		set.data = [];
		// get the pixels for all the lonlat entries
            while(dlen--){
                entry = dataset[dlen],
                lonlat = entry.lonlat.clone().transform(this.projection, this.map.getProjectionObject()),
                pixel = this.roundPixels(this.getViewPortPxFromLonLat(lonlat));
                
                set.data.push({x: pixel.x, y: pixel.y, count: entry.count});
            }
	    this.tmpData = obj;
	    this.heatmap.store.setDataSet(set);
	},
	// we don't want to have decimal numbers such as xxx.9813212 since they slow canvas performance down + don't look nice
	roundPixels: function(p){

	    // fast rounding - thanks to Seb Lee-Delisle for this neat hack
	    p.x = ~~ (p.x+0.5);
	    p.y = ~~ (p.y+0.5);
	
            return p;
	},
	// same procedure as setDataSet
	addDataPoint: function(lonlat){
	    var pixel = this.roundPixels(this.map.getViewPortPxFromLonLat(lonlat)),
                entry = {lonlat: lonlat},
                args;

            if(arguments.length == 2){
                entry.count = arguments[1];
            }

            this.tmpData.data.push(entry);
            
            args = [pixel.x, pixel.y];

            if(arguments.length == 2){
                args.push(arguments[1]);
            }
            this.heatmap.store.addDataPoint.apply(this.heatmap.store, args);

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
