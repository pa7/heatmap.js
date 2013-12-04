
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
    container.appendChild(shadowCanvas);

    this._palette = _initColorPalette(config);
  };

  var _prepareForRender = function(data) {

    // return the boundaries
    return {
      upper: 0,
      lower: 0,
      left: 0,
      right: 0
    }
  };


  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      console.log('renderPartiaaal');
    },
    renderAll: function(data) {
      
      var points = data.data;
      var max = data.max;
      var min = data.min;
      console.log('renderaaaall');

    }
  };


  return Canvas2dRenderer;
})();