
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