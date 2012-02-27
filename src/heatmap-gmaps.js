/*
 * heatmap.js GMaps overlay
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */
 
function HeatmapOverlay(map, cfg){
    var me = this;

    me.heatmap = null;
    me.conf = cfg;
    me.latlngs = [];
    me.bounds = null;
    me.setMap(map);
  
    google.maps.event.addListener(map, 'idle', function() { me.draw();});
    google.maps.event.addListener(map, 'resize', function() { me.resize();});
}

HeatmapOverlay.prototype = new google.maps.OverlayView();

HeatmapOverlay.prototype.onAdd = function(){
    var panes = this.getPanes(),
        w = this.getMap().getDiv().clientWidth,
        h = this.getMap().getDiv().clientHeight,
    	el = document.createElement("div");
    
    el.style.position = "absolute";
    el.style.top = 0;
    el.style.left = 0;
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.style.border = 0;
    
    this.conf.element = el;
    panes.overlayLayer.appendChild(el);

    this.heatmap = h337.create(this.conf);
};

HeatmapOverlay.prototype.onRemove = function(){
    // Empty for now.
    // TODO: Destroy this.conf.element?
};

HeatmapOverlay.prototype.resize = function(){
	var el = this.heatmap.get('element'),
		w = this.getMap().getDiv().clientWidth,
		h = this.getMap().getDiv().clientHeight;
	el.style.width = w + "px";
	el.style.height = h + "px";
	this.heatmap.resize();
};

HeatmapOverlay.prototype.draw = function(){
  this.projection = this.getProjection();
  this.canvasCenter = this.projection.fromLatLngToDivPixel(this.getMap().getCenter());
  this.worldWidth = this.projection.getWorldWidth();
  this.canvasWidth = Math.min(this.worldWidth, this.conf.element.offsetWidth);
  this.canvasHeight = Math.min(this.worldWidth, this.conf.element.offsetHeight);
  this.conf.element.style.left = this.canvasCenter.x - this.canvasWidth / 2 + 'px';
  this.conf.element.style.top = this.canvasCenter.y - this.canvasHeight / 2 + 'px';
    
  this.heatmap.clear();
    if(this.latlngs.length > 0){
        
        var len = this.latlngs.length,
        projection = this.getProjection();

        var d = {
            max: this.heatmap.store.max,
            data: []
        };

        while(len--){
            var latlng = this.latlngs[len].latlng;
            var point = this.pixelTransform(projection.fromLatLngToDivPixel(latlng));
            d.data.push({x: point.x, y: point.y, count: this.latlngs[len].c});
            
        }
        this.heatmap.store.setDataSet(d);
    }

};

HeatmapOverlay.prototype.pixelTransform = function(p){
  var left = this.canvasCenter.x - this.canvasWidth / 2;
  var top = this.canvasCenter.y - this.canvasHeight / 2;
  p.x -= left;
  p.y -= top;
    
    // fast rounding - thanks to Seb Lee-Delisle for this neat hack
    p.x = ~~ (p.x+0.5);
    p.y = ~~ (p.y+0.5);
    
    return p;
};

HeatmapOverlay.prototype.setDataSet = function(data){
    var mapdata = {
        max: data.max,
        data: []
    };
    var d = data.data,
        dlen = d.length,
        projection = this.getProjection();

    this.latlngs = [];
   
    while(dlen--){
        var latlng = new google.maps.LatLng(d[dlen].lat, d[dlen].lng);
        this.latlngs.push({latlng: latlng, c: d[dlen].count});
        var point = this.pixelTransform(projection.fromLatLngToDivPixel(latlng));
        mapdata.data.push({x: point.x, y: point.y, count: d[dlen].count});
    }
    this.heatmap.clear();
    this.heatmap.store.setDataSet(mapdata);

};

HeatmapOverlay.prototype.addDataPoint = function(lat, lng, count){
    var projection = this.getProjection(),
        latlng = new google.maps.LatLng(lat, lng),
        point = this.pixelTransform(projection.fromLatLngToDivPixel(latlng));
    
    this.heatmap.store.addDataPoint(point.x, point.y, count);
    this.latlngs.push({ latlng: latlng, c: count });
};

HeatmapOverlay.prototype.clear = function(){
    this.heatmap.clear();
};

HeatmapOverlay.prototype.toggle = function(){
    this.heatmap.toggleDisplay();
};

