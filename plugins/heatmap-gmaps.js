/*
* heatmap.js gmaps overlay
*
* Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
* Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
*/

function HeatmapOverlay(map, cfg){ 
  this.setMap(map);
  this.initialize(cfg || {});
};

HeatmapOverlay.prototype = new google.maps.OverlayView();


HeatmapOverlay.CSS_TRANSFORM = (function() {
  var div = document.createElement('div');
  var props = [
    'transform',
    'WebkitTransform',
    'MozTransform',
    'OTransform',
    'msTransform'
  ];

  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    if (div.style[prop] !== undefined) {
      return prop;
    }
  }

  return props[0];
})();

HeatmapOverlay.prototype.initialize = function(cfg) {
  this.cfg = cfg;
  
  var map = this.map = this.getMap();
  var container = this.container = document.createElement('div');
  var mapDiv = map.getDiv();
  var width = this.width = mapDiv.clientWidth;
  var height = this.height = mapDiv.clientHeight;

  container.style.cssText = 'width:' + width +'px;height:' + height+'px;';

  this.data = [];
  this.max = 0;

  cfg.container = container;
};

HeatmapOverlay.prototype.onAdd = function(){

  this.getPanes().overlayLayer.appendChild(this.container);

  this.changeHandler = google.maps.event.addListener(
    this.map,
    'bounds_changed',
    this.draw
  );
  this.heatmap = h337.create(this.cfg);
  this.draw();
};

HeatmapOverlay.prototype.onRemove = function() { 
  if (!this.map) { return; }

  this.map = null;

  this.container.parentElement.removeChild(this.container);

  if (this.changeHandler) {
    google.maps.event.removeListener(this.changeHandler);
    this.changeHandler = null;
  }

};

HeatmapOverlay.prototype.draw = function() {
  if (!this.map) { return; }

  var bounds = this.map.getBounds();

  var topLeft = new google.maps.LatLng(
    bounds.getNorthEast().lat(),
    bounds.getSouthWest().lng()
  );

  var projection = this.getProjection();
  var point = projection.fromLatLngToDivPixel(topLeft);

  this.container.style[HeatmapOverlay.CSS_TRANSFORM] = 'translate(' +
      Math.round(point.x) + 'px,' +
      Math.round(point.y) + 'px)';

  this.update();
};

HeatmapOverlay.prototype.resize = function() {

  if (!this.map){ return; }

  var div = this.map.getDiv(),
    width = div.clientWidth,
    height = div.clientHeight;

  if (width == this.width && height == this.height){ return; }

  this.width = width;
  this.height = height;

  // update heatmap dimensions
  this.heatmap._renderer.setDimensions(width, height);
  // then redraw all datapoints with update
  this.update();
};

HeatmapOverlay.prototype.update = function() {
  var projection = this.map.getProjection(),
    zoom, scale, bounds, topLeft;

  if (!projection){ return; }

  bounds = this.map.getBounds();

  topLeft = new google.maps.LatLng(
    bounds.getNorthEast().lat(),
    bounds.getSouthWest().lng()
  );

  zoom = this.map.getZoom();
  scale = Math.pow(2, zoom);

  this.resize();

  if (this.data.length == 0) {
    return;
  }

  var generatedData = { max: this.max };
  var latLngPoints = [];
  // iterate through data 
  var len = this.data.length;
  var layerProjection = this.getProjection();
  var layerOffset = layerProjection.fromLatLngToDivPixel(topLeft);
  var radiusMultiplier = this.cfg.scaleRadius ? scale : 1;
  var localMax = 0;


  while (len--) {
    var entry = this.data[len];
    var latlng = entry.latlng;


    // we don't wanna render points that are not even on the map ;-)
    if (!bounds.contains(latlng)) {
      continue;
    }
    // local max is the maximum within current bounds
    if (entry.value > localMax) {
      localMax = entry.value;
    }

    var point = this.pixelTransform(layerProjection.fromLatLngToDivPixel(latlng));
    var latlngPoint = { x: Math.round(point.x - layerOffset.x), y: Math.round(point.y - layerOffset.y), value: entry.value };
    
    var radius;

    if (entry.radius) {
      radius = entry.radius * radiusMultiplier;
    } else {
      radius = (this.cfg.radius || 2) * radiusMultiplier;
    }
    latlngPoint.radius = radius;
    latLngPoints.push(latlngPoint);
  }
  if (this.cfg.useLocalExtrema) {
    generatedData.max = localMax;
  }

  generatedData.data = latLngPoints;

  this.heatmap.setData(generatedData);

};

HeatmapOverlay.prototype.pixelTransform = function(point) {
  if (point.x < 0) {
    point.x += this.width;
  }
  if (point.x > this.width) {
    point.x -= this.width;
  }
  if (point.y < 0) {
    point.y += this.height;
  }
  if (point.y > this.height) {
    point.y -= this.height;
  }
  return point;
};

HeatmapOverlay.prototype.setData = function(data) { 
  this.max = data.max;

  // transform data to latlngs
  var data = data.data;
  var len = data.length;
  var d = [];
  while (len--) {
    var latlng = new google.maps.LatLng(data[len].lat, data[len].lng);
    d.push({ latlng: latlng, value: data[len].count });
  }
  this.data = d;

  this.update();
};

HeatmapOverlay.prototype.addData = function() { };

