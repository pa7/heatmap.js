;(function(global){ 
// this is the heatmap default config.
// all values you provide in the heatmapinstance config will be merged into this object
var HeatmapConfig = {
  defaultRadius: 40,
  defaultRenderer: 'canvas2d',
  defaultGradient: { 0.25: "rgb(0,0,255)", 0.35: "rgb(0,255,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
  defaultMaxOpacity: 1
};
var Store = (function StoreClosure() {

  var Store = function Store() {
    this._coordinator = {};
    this._data = [];
    this._radi = [];
    this._min = 0;
    this._max = 1;
  };

  var defaultRadius = HeatmapConfig.defaultRadius;


  Store.prototype = {
    _organiseData: function(dataPoint) {
        var x = dataPoint['x'];
        var y = dataPoint['y'];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var count = dataPoint.count;
        var radius = dataPoint.radius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = count || 1;
          radi[x][y] = radius;
        } else {
          store[x][y] += count;
        }
        if (store[x][y] > max) {
          this.setDataMax(store[x][y]);
          return false;
        } else{
          return { x: x, y: y, count: count, radius: radius, min: min, max: max };
        }
    },
    addData: function() {
      if (arguments[0].length > 0) {
        var dataArr = arguments[0];
        var dataLen = dataArr.length;
        while (dataLen--) {
          this.addData.call(this, dataArr[dataLen]);
        }
      } else {
        // add to store  
        var organisedEntry = this._organiseData(arguments[0]);
        if (organisedEntry) {
          this._coordinator.emit('renderpartial', organisedEntry);
        }
      }
    },
    setData: function(data) {
      var dataPoints = data.data;
      var pointsLen = dataPoints.length;

      this._max = data.max;
      this._min = data.min || 0;
      // reset data arrays
      this._data = [];
      this._radi = [];

      for(var i = 0; i < pointsLen; i++) {
        this._organiseData(dataPoints[i]);
      }


      this._coordinator.emit('renderall', this._getInternalData());
    },
    subtractData: function() {

    },
    setDataMax: function(max) {
      this._max = max;
      this._coordinator.emit('renderall', this._getInternalData());
    },
    setDataMin: function(min) {
      this._min = min;
      this._coordinator.emit('renderall', this._getInternalData());
    },
    setCoordinator: function(coordinator) {
      this._coordinator = coordinator;
    },
    _getInternalData: function() {
      return { 
        max: this._max,
        min: this._min, 
        data: this._data,
        radi: this._radi 
      };
    }
  };


  return Store;
})();

var Canvas2dRenderer = (function Canvas2dRendererClosure() {
  
  var _initColorPalette = function(config) {
    var gradientConfig = config.gradientConfig || config.defaultGradient;
    var paletteCanvas = document.createElement('canvas');
    var paletteCtx = paletteCanvas.getContext('2d');

    paletteCanvas.width = 256;
    paletteCanvas.height = 1;

    var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
    for (var key in gradientConfig) {
      gradient.addColorStop(key, gradientConfig[key]);
    }

    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  };


  function Canvas2dRenderer(config) {
    var container = config.container;
    var shadowCanvas = document.createElement('canvas');
    var canvas = document.createElement('canvas');

    var computed = getComputedStyle(config.container);

    this._width = canvas.width = shadowCanvas.width = +(computed.width.replace(/px/,''));
    this._height = canvas.height = shadowCanvas.height = +(computed.height.replace(/px/,''));

    this.shadowCtx = shadowCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');

    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';
    container.style.position = 'relative';
    container.appendChild(canvas);

    this._palette = _initColorPalette(config);

    this._opacity = (config.opacity || 0) * 255;
    this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;


  };

  var renderBoundaries = [1000, 1000, 0, 0];

  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      this._drawAlpha(data, false);
    },
    renderAll: function(data) {
      // reset render boundaries
      renderBoundaries = [1000, 1000, 0, 0];
      this._clear();
      this._drawAlpha(data, true);
    },
    _clear: function() {
      this.shadowCtx.clearRect(0, 0, this._width, this._height);
    },
    _drawAlpha: function(data, colorizeLater) {
      var min = data.min;
      var max = data.max;

      if (data['data']) {
        for (var key in data.data) {
          var list = data.data[key];
          for (var key2 in list) {
            var point = { x: key, y: key2, min: min, max: max, radius: data.radi[key][key2], count: list[key2] };
            this._drawAlpha(point, true);
          }
        }
        this._colorize(renderBoundaries[0], renderBoundaries[1], renderBoundaries[2] - renderBoundaries[0], renderBoundaries[3] - renderBoundaries[1]);
        return;
      } else {

      var x = data.x;
      var y = data.y;
      var radius = data.radius;
      var count = data.count;
      var rectX = x - radius;
      var rectY = y - radius;


      var radialGradient = this.shadowCtx.createRadialGradient(x, y, radius/8, x, y, radius);
      radialGradient.addColorStop(0, ['rgba(0,0,0, ', count/(Math.abs(max-min)), ')'].join(''));
      radialGradient.addColorStop(1, 'rgba(0,0,0,0)');

      this.shadowCtx.fillStyle = radialGradient;
      this.shadowCtx.fillRect(rectX, rectY, radius*2, radius*2); 
      
      /*
      
      old shadow-blur technique.

      this.shadowCtx.shadowColor = ('rgba(0,0,0,'+((count)?(count/Math.abs(max-min)):'0.1')+')');

      this.shadowCtx.shadowOffsetX = 15000;
      this.shadowCtx.shadowOffsetY = 15000;
      this.shadowCtx.shadowBlur = 15;

      this.shadowCtx.beginPath();
      this.shadowCtx.arc(x - 15000, y - 15000, radius, 0, Math.PI * 2, true);
      this.shadowCtx.closePath();
      this.shadowCtx.fill(); 

      */


      if (!colorizeLater) {
        this._colorize(rectX, rectY, data['radius'] * 2, data['radius'] * 2);
      } else {
        if (rectX < renderBoundaries[0]) {
          renderBoundaries[0] = rectX;
        } 
        if (rectY < renderBoundaries[1]) {
          renderBoundaries[1] = rectY;
        }
        if (rectX + 2*radius > renderBoundaries[2]) {
          renderBoundaries[2] = rectX + 2*radius;
        }
        if (rectY + 2*radius > renderBoundaries[3]) {
          renderBoundaries[3] = rectY + 2*radius;
        }
      }
    }
    },
    _colorize: function(x, y, width, height) {
      var maxWidth = this._width;
      var maxHeight = this._height;
      var opacity = this._opacity;
      var maxOpacity = this._maxOpacity;

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      if (x + width > maxWidth) {
        width = maxWidth - x;
      }
      if (y + height > maxHeight) {
        height = maxHeight - y;
      }

      var img = this.shadowCtx.getImageData(x, y, width, height);
      var imgData = img.data;
      var len = imgData.length;
      var palette = this._palette;


      for (var i = 3; i < len; i+= 4) {
        var alpha = imgData[i];
        var offset = alpha * 4;


        if (!offset) {
          continue;
        }

        var finalAlpha;
        if (opacity > 0) {
          finalAlpha = opacity;
        } else {
          if (alpha < maxOpacity) {
            finalAlpha = alpha;
          } else {
            finalAlpha = maxOpacity;
          }
        }

        imgData[i-3] = palette[offset];
        imgData[i-2] = palette[offset + 1];
        imgData[i-1] = palette[offset + 2];
        imgData[i] = finalAlpha;

      }

      img.data = imgData;
      this.ctx.putImageData(img, x, y);

    }
  };


  return Canvas2dRenderer;
})();

var Renderer = (function RendererClosure() {

  var rendererFn = false;

  if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
    rendererFn = Canvas2dRenderer;
  }

  return rendererFn;
})();

var Util = {
  merge: function() {
    var merged = {};
    var argsLen = arguments.length;
    for (var i = 0; i < argsLen; i++) {
      var obj = arguments[i]
      for (var key in obj) {
        merged[key] = obj[key];
      }
    }
    return merged;
  }
};
// Heatmap Constructor
var Heatmap = (function HeatmapClosure() {

  var Coordinator = (function CoordinatorClosure() {

    function Coordinator() {
      this.cStore = {};
    };

    Coordinator.prototype = {
      on: function(evtName, callback, scope) {
        var cStore = this.cStore;

        if (!cStore[evtName]) {
          cStore[evtName] = [];
        }
        cStore[evtName].push((function(data) {
            return callback.call(scope, data);
        }));
      },
      emit: function(evtName, data) {
        var cStore = this.cStore;
        if (cStore[evtName]) {
          var len = cStore[evtName].length;
          for (var i=0; i<len; i++) {
            var callback = cStore[evtName][i];
            callback(data);
          }
        }
      }
    };

    return Coordinator;
  })();


  var _connect = function(scope) {
    var renderer = scope._renderer;
    var coordinator = scope._coordinator;
    var store = scope._store;

    coordinator.on('renderpartial', renderer.renderPartial, renderer);
    coordinator.on('renderall', renderer.renderAll, renderer);
    store.setCoordinator(coordinator);
  };


  function Heatmap() {
    var config = Util.merge(HeatmapConfig, arguments[0] || {});
    this._coordinator = new Coordinator();
    this._renderer = new Renderer(config);
    this._store = new Store(config);

    _connect(this);
  };

  Heatmap.prototype = {
    addData: function() {
      this._store.addData.apply(this._store, arguments);
    },
    subtractData: function() {
      this._store.subtractData.apply(this._store, arguments);
    },
    setData: function() {
      this._store.setData.apply(this._store, arguments);
    },
    setDataMax: function() {
      this._store.setDataMax.apply(this._store, arguments);
    },
    setDataMin: function() {
      this._store.setDataMin.apply(this._store, arguments);
    }
  };

  return Heatmap;

})();


// core
var heatmapFactory = {
  create: function(config) {
    return new Heatmap(config);
  }
};

global['h337'] = heatmapFactory;

})(this || window);