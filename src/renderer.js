
var Renderer = (function RendererClosure() {

  var rendererFn = false;

  if (HeatmapConfig['renderer'] === 'canvas2d') {
    rendererFn = Canvas2dRenderer;
  }

  return rendererFn;
})();