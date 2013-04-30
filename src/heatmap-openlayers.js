/* 
 * heatmap.js OpenLayers Heatmap Class
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 * 
 * Modified on Apr,29 2013 by Nicholas Bargovic
 * - Added maxSize and maxTime options to the constructor.
 * - Added removeDataPoints() and decayDataPoints() functions.
 * - Modified setDataSet() to only allow max items if maxSize is specified.
 * - Modified addDataPoint() to remove old items if using maxSize.
 * 
 * Modified on Jun,06 2011 by Antonio Santiago (http://www.acuriousanimal.com)
 * - Heatmaps as independent map layer.
 * - Points based on OpenLayers.LonLat.
 * - Data initialization in constructor.
 * - Improved 'addDataPoint' to add new lonlat based points.
 * 
 */ 
OpenLayers.Layer.Heatmap = OpenLayers.Class(OpenLayers.Layer, {
	// the heatmap isn't a basic layer by default - you usually want to display the heatmap over another map ;)
	isBaseLayer: false,
	heatmap: null,
	mapLayer: null,
        maxSize: -1, //max elements to hold in the tmpData store
        maxTime: -1, //time window to keep elements in tmpData store (in seconds)
	// we store the lon lat data, because we have to redraw with new positions on zoomend|moveend
	tmpData: {},
        initialize: function(name, map, mLayer, hmoptions, options){
            var heatdiv = document.createElement("div"),
                handler;

            OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);

	    heatdiv.style.cssText = "position:absolute;width:"+map.size.w+"px;height:"+map.size.h+"px;";
	    // this will be the heatmaps element
	    this.div.appendChild(heatdiv);
	    // add to our heatmap.js config
	    hmoptions.element = heatdiv;
	    this.mapLayer = mLayer;
	    this.map = map;
            // create the heatmap with passed heatmap-options
	    this.heatmap = h337.create(hmoptions);

            handler = function(){ 
                if(this.tmpData.max){
                    this.updateLayer(); 
                }
            };
	    // on zoomend and moveend we have to move the canvas element and redraw the datapoints with new positions
	    map.events.register("zoomend", this, handler);
	    map.events.register("moveend", this, handler);
        },
	updateLayer: function(){
              if( this.maxSize > 0 ){
                 this.removeDataPoints();
               }
               if( this.maxTime > 0 ){
                 this.decayDataPoints();
               }
                var pixelOffset = this.getPixelOffset(),
                    el = this.heatmap.get('element');
                // if the pixeloffset e.g. for x was positive move the canvas element to the left by setting left:-offset.y px 
                // otherwise move it the right by setting it a positive value. same for top
                el.style.top = ((pixelOffset.y > 0)?('-'+pixelOffset.y):(Math.abs(pixelOffset.y)))+'px';
                el.style.left = ((pixelOffset.x > 0)?('-'+pixelOffset.x):(Math.abs(pixelOffset.x)))+'px';
		
                this.setDataSet(this.tmpData);
	},
        getPixelOffset: function () {
            var o = this.mapLayer.map.layerContainerOrigin,
                o_lonlat = new OpenLayers.LonLat(o.lon, o.lat),
                o_pixel = this.mapLayer.getViewPortPxFromLonLat(o_lonlat),
                c = this.mapLayer.map.center,
                c_lonlat = new OpenLayers.LonLat(c.lon, c.lat),
                c_pixel = this.mapLayer.getViewPortPxFromLonLat(c_lonlat);

            return { 
                x: o_pixel.x - c_pixel.x,
                y: o_pixel.y - c_pixel.y 
            };

        },
	setDataSet: function(obj){
            //trim the dataset to only allow the max items (if max is specified).
            if (this.maxSize > 0){
              while (obj.data.length > this.maxSize){
                obj.data.shift();
              }
            }
	    var set = {},
		dataset = obj.data,
		dlen = dataset.length,
                entry, lonlat, pixel;

		set.max = obj.max;
		set.data = [];
		// get the pixels for all the lonlat entries
            while(dlen--){
                entry = dataset[dlen],
                lonlat = entry.lonlat.clone().transform(this.projection, this.map.getProjectionObject()),
                pixel = this.roundPixels(this.getViewPortPxFromLonLat(lonlat));
                    
                if(pixel){
                    set.data.push({x: pixel.x, y: pixel.y, count: entry.count});
                }
            }
	    this.tmpData = obj;
	    this.heatmap.store.setDataSet(set);
	},
	// we don't want to have decimal numbers such as xxx.9813212 since they slow canvas performance down + don't look nice
	roundPixels: function(p){
	    if(p.x < 0 || p.y < 0){
	        return false;
            }
		
            p.x = (p.x >> 0);
	    p.y = (p.y >> 0);
	
            return p;
	},
	// same procedure as setDataSet
	addDataPoint: function(lonlat){
	    var pixel = this.roundPixels(this.mapLayer.getViewPortPxFromLonLat(lonlat)),
                entry = {lonlat: lonlat, time: Math.round(new Date().getTime() / 1000)},
                args;

            if(arguments.length == 2){
                entry.count = arguments[1];
            }

            this.tmpData.data.push(entry);
            
            if(pixel){
                args = [pixel.x, pixel.y];

		if(arguments.length == 2){
		    args.push(arguments[1]);
		}
		this.heatmap.store.addDataPoint.apply(this.heatmap.store, args);
	    }
	},
        removeDataPoints: function(){
          while (this.tmpData.data.length > this.maxSize){
            this.tmpData.data.shift();
          }
        },
        decayDataPoints: function(){
            if( this.maxTime > 0 ){ 
                var oldestTime = (Math.round(new Date().getTime() / 1000)) - this.maxTime;
                var stop = false;
                while(!stop && (this.tmpData.data.length > 0) ){
                    //get the oldest data, see if its older then maxTime
                    if( this.tmpData.data[0].time < oldestTime ){
                            this.tmpData.data.shift();
                    }
                    //else stop
                    else{
                      stop = true;
                    }
                }
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
