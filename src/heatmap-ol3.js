
var HeatMap = (function () {

  var HeatMap = function HeatMap(map, options) {

    this.throttle_      = true;
    this.redrawTimeout_ = null;
    this.hideOnRedraw_  = true;

    this.set_ = {
      data : [],
      max  : undefined
    };

    this.map_ = map;

    this.el_  = document.createElement('div');
    this.el_.style.position = 'absolute';

    map.on('change:size', this.updateHeatmapSize_.bind(this));
    this.updateHeatmapSize_();

    this.overlay_ = new ol.Overlay({ 
      element     : this.el_,
      stopEvent   : false,
      positioning : ol.OverlayPositioning.TOP_LEFT
    });

    map.addOverlay(this.overlay_);

    options = options || {};
    options.element = this.el_;
    this.heatmap_ = heatmapFactory.create(options);

    map.on('postrender', this.schedualRedraw_.bind(this));
  };

  HeatMap.prototype.addCoordinate = function (coordinate) {
    coordinate = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:3857');
    this.set_.data.push(coordinate);
    this.schedualRedraw_();
  };

  HeatMap.prototype.addDataPoint = function (lon, lat) {
    this.addCoordinate([lon, lat]);
  };

  HeatMap.prototype.setCoordinateDataSet = function (obj) {
    this.set_ = {
      data:  obj.data.map(function (coordinate) {
        return ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:3857');
      }),
      max: obj.max
    };
    this.schedualRedraw_();
  };

  HeatMap.prototype.setDataSet = function (obj) {
    this.set_ = {
      data: obj.data.map(function (point) {
        return ol.proj.transform([point.x, point.y], 'EPSG:4326', 'EPSG:3857');
      }),
      max: obj.max
    };
    this.schedualRedraw_();
  };

  HeatMap.prototype.schedualRedraw_ = function () {
    if (this.hideOnRedraw_) {
      this.el_.style.display = 'none';
    }
    if (this.throttle_) {
      clearTimeout(this.redrawTimeout_);
      this.redrawTimeout_ = setTimeout(this.redraw.bind(this), 100);
    } else {
      this.redraw();
    }
  };

  HeatMap.prototype.redraw = function () {
    if (this.hideOnRedraw_) {
      this.el_.style.display = 'block';
    }
    // update the overlap placement
    var position = this.map_.getCoordinateFromPixel([0, 0]);
    this.overlay_.setPosition(position);
    // redraw the data
    var pixels = this.set_.data.map(function (coordinate) {
      var pixel = this.roundPixel_(
        this.map_.getPixelFromCoordinate(coordinate));
      return { x: pixel[0], y: pixel[1] };
    }.bind(this));
    this.heatmap_.store.setDataSet({
      max  : this.set_.max,
      data : pixels
    });
  };

  HeatMap.prototype.updateHeatmapSize_ = function () {
    var style = this.el_.style,
        size  = this.map_.getSize();
    style.width    = size[0] + 'px';
    style.height   = size[1] + 'px';
  };

  HeatMap.prototype.roundPixel_ = function (pixel) {
    return pixel;
    var x = pixel[1],
        y = pixel[0];
    if (x < 0 || y < 0) {
      return pixel;
    }
    pixel[1] = (x >> 0);
    pixel[0] = (y >> 0);
    return pixel;
  };

  return HeatMap;
}).call(null);
