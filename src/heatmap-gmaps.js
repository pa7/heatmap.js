/* 
 * heatmap.js GMaps overlay
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 */ 
 
function HeatmapOverlay(map, cfg){

	this.heatmap = null;
	this.conf = cfg;
	this.latlngs = [];
	this.setMap(map);	
}

HeatmapOverlay.prototype = new google.maps.OverlayView();

HeatmapOverlay.prototype.onAdd = function(){
	
	var el = document.createElement("div");
	el.style.cssText = "position:absolute;top:0;left:0;width:800px;height:600px;border:0;";
	
	this.conf.element = el;
	var panes = this.getPanes();
	panes.overlayLayer.appendChild(el);

	this.heatmap = h337.create(this.conf);
}

HeatmapOverlay.prototype.draw = function(){

	if(this.latlngs.length > 0){
		this.heatmap.clear();
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

}

HeatmapOverlay.prototype.pixelTransform = function(p){
	var w = this.heatmap.get("width"),
	h = this.heatmap.get("height");

	while(p.x < 0)
		p.x+=w;
	
	while(p.x > w)
		p.x-=w;
		
	while(p.y < 0)
		p.y+=h;
	
	while(p.y > h)
		p.y-=h;
	
	// fast rounding - thanks to Seb Lee-Delisle for this neat hack
	p.x = ~~ (p.x+0.5);
	p.y = ~~ (p.y+0.5);
	
	return p;
}

HeatmapOverlay.prototype.setDataSet = function(data){

	var mapdata = {};
	mapdata.max = data.max;
	mapdata.data = [];
	var d = data.data,
	dlen = d.length;
	var projection = this.getProjection();
	
	while(dlen--){
		
		var latlng = new google.maps.LatLng(d[dlen].lat, d[dlen].lng);
		this.latlngs.push({latlng: latlng, c: d[dlen].count});
		var point = this.pixelTransform(projection.fromLatLngToDivPixel(latlng));
		mapdata.data.push({x: point.x, y: point.y, count: d[dlen].count});
	}
	this.heatmap.clear();
	this.heatmap.store.setDataSet(mapdata);

}

HeatmapOverlay.prototype.addDataPoint = function(lat, lng, count){

	var projection = this.getProjection(),
	latlng = new google.maps.LatLng(lat, lng),
	point = this.pixelTransform(projection.fromLatLngToDivPixel(latlng));
	
	
	
	this.heatmap.store.addDataPoint(point.x, point.y, count);
	
	this.latlngs.push({latlng: latlng, c: count});
}

HeatmapOverlay.prototype.toggle = function(){
	this.heatmap.toggleDisplay();
}