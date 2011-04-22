/* 
 * heatmap.js 1.0 -	JavaScript Heatmap Library
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */ 

(function(w){
	// the heatmapFactory creates heatmap instances
	var heatmapFactory = (function(){
	
	// store object constructor
	// a heatmap contains a store
	// the store has to know about the heatmap in order to trigger heatmap updates when datapoints get added
	function store(hmap){

		var _ = {
			// data is a two dimensional array 
			// a datapoint gets saved as data[point-x-value][point-y-value]
			// the value at [point-x-value][point-y-value] is the occurrence of the datapoint
			data: [],
			// tight coupling of the heatmap object
			heatmap: hmap
		};
		// the max occurrence - the heatmaps radial gradient alpha transition is based on it
		this.max = 0;
		
		this.get = function(key){
			return _[key];
		},
		this.set = function(key, value){
			_[key] = value;
		};
	};
	
	store.prototype = {
		// function for adding datapoints to the store
		// datapoints are usually defined by x and y but could also contain a third parameter which represents the occurrence
		addDataPoint: function(x, y){
			var heatmap = this.get("heatmap"),
			data = this.get("data");
			
			if(!data[x]) data[x] = [];
			if(!data[x][y]) data[x][y] = 1;
			// if count parameter is set increment by count otherwise by 1
			data[x][y]+=(arguments.length<3)?1:arguments[2];
			
			// do we have a new maximum?
			if(this.max < data[x][y]){
				this.max = data[x][y];
				// max changed, we need to redraw all existing(lower) datapoints
				heatmap.get("actx").clearRect(0,0,heatmap.get("width"),heatmap.get("height"));
				for(var one in data)					
					for(var two in data[one])
						heatmap.drawAlpha(one, two, data[one][two]);

				// @TODO
				// implement feature
				// heatmap.drawLegend(); ? 
				return;
			}
			heatmap.drawAlpha(x, y, data[x][y]);
		},
		setDataSet: function(obj){
			
			this.max = obj.max;
			var heatmap = this.get("heatmap"),
			data = this.get("data"),
			d = obj.data,
			dlen = d.length;
			// clear the heatmap before the data set gets drawn
			heatmap.clear();
			
			while(dlen--){
				var point = d[dlen];
				heatmap.drawAlpha(point.x, point.y, point.count);
				if(!data[point.x]) data[point.x] = [];
				if(!data[point.x][point.y]) data[point.x][point.y] = 1;
				data[point.x][point.y]+=point.count;
			}
		},
		exportDataSet: function(){
			var data = this.get("data");
			var exportData = [];
			for(var one in data){
				// jump over undefined indexes
				if(one === undefined)
					continue;
				for(var two in data[one]){
					if(two === undefined)
						continue;
					// if both indexes are defined, push the values into the array
					exportData.push({x: parseInt(one), y: parseInt(two), count: data[one][two]});
				}
			}
					
			return exportData;
		},
		generateRandomDataSet: function(points){
			var heatmap = this.get("heatmap"),
			w = heatmap.get("width"),
			h = heatmap.get("height");
			var randomset = {},
			max = Math.floor(Math.random()*1000+1);
			randomset.max = max;
			var data = [];
			while(points--){
				data.push({x: Math.floor(Math.random()*w+1), y: Math.floor(Math.random()*h+1), count: Math.floor(Math.random()*max+1)});
			}
			randomset.data = data;
			this.setDataSet(randomset);
		}
	};
	
	
	// heatmap object constructor
	function heatmap(config){
		// private variables
		var _ = {
			radiusIn : 20,
			radiusOut : 40,
			element : {},
			canvas : {},
			acanvas: {},
			ctx : {},
			actx : {},
			visible : true,
			width : 0,
			height : 0,
			max : false,
			gradient : false,
			opacity: 180
		};
		// heatmap store containing the datapoints and information about the maximum
		// accessible via instance.store
		this.store = new store(this);
		
		this.get = function(key){
			return _[key];
		},
		this.set = function(key, value){
			_[key] = value;
		};
		// configure the heatmap when an instance gets created
		this.configure(config);
		// and initialize it
		this.init();
	};
	
	// public functions
	heatmap.prototype = {
		configure: function(config){
				if(config.radius){
					var rout = config.radius,
					rin = parseInt(rout/2);					
				}
				this.set("radiusIn", rin || 15),
				this.set("radiusOut", rout || 40),
				this.set("element", (config.element instanceof Object)?config.element:document.getElementById(config.element));
				this.set("visible", config.visible);
				this.set("max", config.max || false);
				this.set("gradient", config.gradient || { 0.45: "rgb(0,0,255)", 0.55: "rgb(0,255,255)", 0.65: "rgb(0,255,0)", 0.95: "yellow", 1.0: "rgb(255,0,0)"});	// default is the common blue to red gradient
				this.set("opacity", parseInt(255/(100/config.opacity)) || 180);
		},
		init: function(){
				this.initColorPalette();
				var canvas = document.createElement("canvas"),
				acanvas = document.createElement("canvas"),
				element = this.get("element");
				this.set("canvas", canvas);
				this.set("acanvas", acanvas);
				canvas.width = acanvas.width = element.style.width.replace(/px/,"") || this.getWidth(element);
				this.set("width", canvas.width);
				canvas.height = acanvas.height = element.style.height.replace(/px/,"") || this.getHeight(element);
				this.set("height", canvas.height);
				canvas.style.position = acanvas.style.position = "absolute";
				canvas.style.top = acanvas.style.top = "0";
				canvas.style.left = acanvas.style.left = "0";
				canvas.style.zIndex = 1000000;
				if(!this.get("visible"))
					canvas.style.display = "none";

				this.get("element").appendChild(canvas);
				this.set("ctx", canvas.getContext("2d"));
				this.set("actx", acanvas.getContext("2d"));
		},
		initColorPalette: function(){
				
			var canvas = document.createElement("canvas");
			canvas.width = "1";
			canvas.height = "256";
			var ctx = canvas.getContext("2d");
			var grad = ctx.createLinearGradient(0,0,1,256),
			gradient = this.get("gradient");
			for(var x in gradient){
				grad.addColorStop(x, gradient[x]);
			}
			
			ctx.fillStyle = grad;
			ctx.fillRect(0,0,1,256);
			
			this.set("gradient", ctx.getImageData(0,0,1,256).data);
			delete canvas;
			delete grad;
			delete ctx;
		},
		getWidth: function(element){
			var width = element.offsetWidth;
			if(element.style.paddingLeft)
				width+=element.style.paddingLeft;
			if(element.style.paddingRight)
				width+=element.style.paddingRight;
			
			return width;
		},
		getHeight: function(element){
			var height = element.offsetHeight;
			if(element.style.paddingTop)
				height+=element.style.paddingTop;
			if(element.style.paddingBottom)
				height+=element.style.paddingBottom;
			
			return height;
		},
		colorize: function(x, y){
				// get the private variables
				var width = this.get("width"),
				radiusOut = this.get("radiusOut"),
				height = this.get("height"),
				actx = this.get("actx"),
				ctx = this.get("ctx");
				
				var x2 = radiusOut*2;
				
				if(x+x2>width)
					x=width-x2;
				if(x<0)
					x=0;
				if(y<0)
					y=0;
				if(y+x2>height)
					y=height-x2;
				// get the image data for the mouse movement area
				var image = actx.getImageData(x,y,x2,x2),
				// some performance tweaks
					imageData = image.data,
					length = imageData.length,
					palette = this.get("gradient"),
					opacity = this.get("opacity");
				// loop thru the area
				for(var i=3; i < length; i+=4){
					
					// [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
					var alpha = imageData[i],
					offset = alpha*4;
					
					if(!offset)
						continue;
	
					// we ve started with i=3
					// set the new r, g and b values
					imageData[i-3]=palette[offset];
					imageData[i-2]=palette[offset+1];
					imageData[i-1]=palette[offset+2];
					// we want the heatmap to have a gradient from transparent to the colors
					// as long as alpha is lower than the defined opacity (maximum), we'll use the alpha value
					imageData[i] = (alpha < opacity)?alpha:opacity;
				}
				// the rgb data manipulation didn't affect the ImageData object(defined on the top)
				// after the manipulation process we have to set the manipulated data to the ImageData object
				image.data = imageData;
				ctx.putImageData(image,x,y);	
		},
		drawAlpha: function(x, y, count){
				// storing the variables because they will be often used
				var r1 = this.get("radiusIn"),
				r2 = this.get("radiusOut"),
				ctx = this.get("actx"),
				max = this.get("max"),
				// create a radial gradient with the defined parameters. we want to draw an alphamap
				rgr = ctx.createRadialGradient(x,y,r1,x,y,r2),
				xb = x-r2, yb = y-r2, mul = 2*r2;
				// the center of the radial gradient has .1 alpha value
				rgr.addColorStop(0, 'rgba(0,0,0,'+((count)?(count/this.store.max):'0.1')+')');  
				// and it fades out to 0
				rgr.addColorStop(1, 'rgba(0,0,0,0)');
				// drawing the gradient
				ctx.fillStyle = rgr;  
				ctx.fillRect(xb,yb,mul,mul);
				// finally colorize the area
				this.colorize(xb,yb);

		},
		toggleDisplay: function(){
				var visible = this.get("visible"),
				canvas = this.get("canvas");
				
				if(!visible)
					canvas.style.display = "block";
				else
					canvas.style.display = "none";
					
				this.set("visible", !visible);
		},
		// dataURL export
		getImageData: function(){
				return this.get("canvas").toDataURL();
		},
		clear: function(){
			var w = this.get("width"),
			h = this.get("height");
			this.store.set("data",[]);
			this.get("ctx").clearRect(0,0,w,h);
			this.get("actx").clearRect(0,0,w,h);
		}
	};
		
	return {
			create: function(config){
				return new heatmap(config);
			},
			util: {
				mousePosition: function(ev){
					var x, y;
					if (ev.layerX) { // Firefox
						x = ev.layerX;
						y = ev.layerY;
					} else if (ev.offsetX) { // Opera
						x = ev.offsetX;
						y = ev.offsetY;
					}
					if(typeof(x)=='undefined')
						return;
					
					return [x,y];
				}
			}
		};
	})();
	window.h337 = window.heatmapFactory = heatmapFactory;
})(window);
