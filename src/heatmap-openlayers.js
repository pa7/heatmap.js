/* 
 * heatmap.js OpenLayers Heatmap Class
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */ 
OpenLayers.Layer.Heatmap = OpenLayers.Class(OpenLayers.Layer, {
	// the heatmap isn't a basic layer by default - you usually want to display the heatmap over another map ;)
	isBaseLayer: false,
	heatmap: null,
	mapLayer: null,
	// we store the lon lat data, because we have to redraw with new positions on zoomend|dragend
	tmpData: {},
	initialize: function(name, map, mLayer, hmoptions, options){
		OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);
		var heatdiv = document.createElement("div");
		heatdiv.style.cssText = "position:absolute;width:"+map.size.w+"px;height:"+map.size.h+"px;";
		// this will be the heatmaps element
		this.div.appendChild(heatdiv);
		// add to our heatmap.js config
		hmoptions.element = heatdiv;
		this.mapLayer = mLayer;
		// create the heatmap with passed heatmap-options
		this.heatmap = h337.create(hmoptions);
		var handler = function(){ if(this.tmpData.max)this.updateLayer(); };
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
			var lonlat = new OpenLayers.LonLat(dataset[dlen].lon, dataset[dlen].lat);
			var pixel = this.roundPixels(this.mapLayer.getViewPortPxFromLonLat(lonlat));
			if(pixel)
				set.data.push({x: pixel.x, y: pixel.y, count: dataset[dlen].count});
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
	addDataPoint: function(lon, lat){
		var lonlat = new OpenLayers.LonLat(lon, lat);
		var pixel = this.roundPixels(this.mapLayer.getViewPortPxFromLonLat(lonlat));
		var args = [pixel.x, pixel.y];
		if(pixel){
			if(arguments.length == 3){
				args.push(arguments[2]);
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