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
}

HeatmapOverlay.prototype.onRemove = function(){
    // Empty for now.
}

HeatmapOverlay.prototype.draw = function(){
	
    var overlayProjection = this.getProjection(),
        currentBounds = this.map.getBounds();
    
    if (currentBounds.equals(this.bounds)) {
      return;
    }
    this.bounds = currentBounds;
    
    var ne = overlayProjection.fromLatLngToDivPixel(currentBounds.getNorthEast()),
        sw = overlayProjection.fromLatLngToDivPixel(currentBounds.getSouthWest()),
        topY = ne.y,
        leftX = sw.x,
        h = sw.y - ne.y,
        w = ne.x - sw.x;

    this.conf.element.style.left = leftX + 'px';
    this.conf.element.style.top = topY + 'px';
    this.conf.element.style.width = w + 'px';
    this.conf.element.style.height = h + 'px';
    this.heatmap.store.get("heatmap").resize();
            
    if(this.latlngs.length > 0){
    	this.heatmap.clear();
    	
        var len = this.latlngs.length,
            projection = this.getProjection();
            d = {
	        max: this.heatmap.store.max,
	        data: []
	    };

        while(len--){
            var latlng = this.latlngs[len].latlng;
	    if(!currentBounds.contains(latlng)) { continue; }
	    	
	    var containerPixel = projection.fromLatLngToContainerPixel(latlng);

        d.data.push({ 
	        x: containerPixel.x,
	        y: containerPixel.y,
	        count: this.latlngs[len].c
	    });
        }
        this.heatmap.store.setDataSet(d);
    }
}

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
    	var point = projection.fromLatLngToContainerPixel(latlng);
    	mapdata.data.push({x: point.x, y: point.y, count: d[dlen].count});
    }
    this.heatmap.clear();
    this.heatmap.store.setDataSet(mapdata);

}

HeatmapOverlay.prototype.addDataPoint = function(lat, lng, count){

    var projection = this.getProjection(),
        latlng = new google.maps.LatLng(lat, lng),
        point = projection.fromLatLngToContainerPixel(latlng);
    
    this.heatmap.store.addDataPoint(point.x, point.y, count);
    this.latlngs.push({ latlng: latlng, c: count });
}

HeatmapOverlay.prototype.toggle = function(){
    this.heatmap.toggleDisplay();
}
