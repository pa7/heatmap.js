
var Canvas2dRenderer = (function Canvas2dRendererClosure() {
  
  var _initColorPalette = function(config) {
    var gradientConfig = config.gradientConfig;
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

    this.width = canvas.width = shadowCanvas.width = +(computed.width.replace(/px/,''));
    this.height = canvas.height = shadowCanvas.height = +(computed.height.replace(/px/,''));

    this.shadowCtx = shadowCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');

    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';
    container.style.position = 'relative';

    container.appendChild(canvas);
    //container.appendChild(shadowCanvas);

    this._palette = _initColorPalette(config);
  };

  var renderBoundaries = [1000, 1000, 0, 0];

  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      this._drawAlpha(data, false);
    },
    renderAll: function(data) {
      // reset render boundaries
      renderBoundaries = [1000, 1000, 0, 0];
      this._drawAlpha(data, true);
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


      var radialGradient = this.shadowCtx.createRadialGradient(x, y, radius/3.12, x, y, radius);
      radialGradient.addColorStop(0, ['rgba(0,0,0, ', ((Math.abs(max-min)/count * 100) >> 0)/100, ')'].join(''));
      radialGradient.addColorStop(1, 'rgba(0,0,0,0)');

      this.shadowCtx.fillStyle = radialGradient;
      this.shadowCtx.fillRect(rectX, rectY, radius*2, radius*2);


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
          renderBoundaries[2] = rectX + 2 * radius;
        }
        if (rectY + 2*radius > renderBoundaries[3]) {
          renderBoundaries[3] = rectY + 2 * radius;
        }
      }
    }
    },
    _colorize: function(x, y, width, height) {
      var maxWidth = this.width;
      var maxHeight = this.height;

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

        imgData[i-3] = palette[offset];
        imgData[i-2] = palette[offset + 1];
        imgData[i-1] = palette[offset + 2];
        imgData[i] = 255;

      }

      img.data = imgData;
      this.ctx.putImageData(img, x, y);

    }
  };


  return Canvas2dRenderer;
})();