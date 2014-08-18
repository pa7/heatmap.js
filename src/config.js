
// Heatmap Config stores default values and will be merged with instance config
var HeatmapConfig = {
  defaultRadius: 40,
  defaultRenderer: 'canvas2d',
  defaultGradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
  defaultMaxOpacity: 1,
  defaultMinOpacity: 0,
  defaultBlur: .85,
  defaultXField: 'x',
  defaultYField: 'y',
  // default origin of points is top-left, but sometime the origin of point may be top-center or others
  // one of ['left', 'center', 'right']
  defaultXOrigin: 'left', 
  // one of ['top', 'middle', 'bottom']
  defaultYOrigin: 'top',
  defaultValueField: 'value', 
  plugins: {}
};