/*
* Leaflet Heatmap Control
*
* LePew - https://github.com/LePew
* Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
* Usage:
*   <script src="heatmapControl.js"></script>
*   <link rel="stylesheet" src="heatmapControl.css"/> 
*   ... Your leaflet init code here ...
* 
*   heatmapControl= L.control.heatmapControl({position: "topleft"});
*    map.addControl(heatmapControl);
*    var cfg= {
*      "useLocalExtrema": true,
*      onExtremaChange: function(extremeData) {
*		heatmapControl.updateLegend(extremeData);
*      }
*    };
*   heatmapLayer = new HeatmapOverlay(cfg);
*   map.addLayer(heatmapLayer);
*   heatmapLayer.setData(heatmapData); //heatmapData contains your data
*/
L.Control.HeatmapControl = L.Control.extend({
    options: {
        position: 'topright' // Choices are: topright, topleft, bottomright or bottomleft        
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this._extremeData = {min: undefined, max: undefined, gradient: {}};

    },

    extractTimestamp: function(time, options) {
        if (options.isEpoch) {
            time = (new Date(parseInt(time))).toLocaleString(); // this is local time
        }
        return time.substr(options.startTimeIdx, options.startTimeIdx + options.timeStrLength);
    },

    setPosition: function (position) {
        var map = this._map;

        if (map) {
            map.removeControl(this);
        }

        this.options.position = position;

        if (map) {
            map.addControl(this);
        }
       //We need a redraw even if values didn't change, hence this little trick...
        var data = this._extremeData; 
	this._extremeData={min: undefined, max: undefined, gradient: {}};
	console.log(data);
	console.log(this._extremeData);
        this.updateLegend(data);
        return this;
    },

    onAdd: function (map) {

        // Create a control heatmapContainer with an img for the legend and min/max values
	// You can tweak styles using heatmapControl.css
        this._heatmapControlContainer = L.DomUtil.create('div', 'heatmapLegend', this._container);
	this._legendCanvas = document.createElement('canvas');
	this._legendCanvas.width = 100;
	this._legendCanvas.height = 10;
	var legend = L.DomUtil.create('div','heatmapLegendImg', this._heatmapControlContainer);
	legend.innerHTML = "<span id='heatmapLegendMin'></span><span id='heatmapLegendMax'></span><img src='' id='heatmapLegendGradient'>";
        
        return this._heatmapControlContainer;
    },

    onRemove: function (map) { 
	
    },

    updateLegend: function (data) { // Called each time heatmap's extremas change

        if (data != this._extremeData) {
	  this._extremeData = data;
	  //We could create the img once in 'onAdd' but someone may change the gradient config...
	  var legendCtx = this._legendCanvas.getContext('2d');  
	  var gradient = legendCtx.createLinearGradient(0, 0, 100, 1);
	  var gradientImg = document.querySelector('#heatmapLegendGradient');
	  //Update min and max values
	  var min = document.querySelector('#heatmapLegendMin');
	  var max = document.querySelector('#heatmapLegendMax');
	  
	  min.innerHTML = data.min;
	  max.innerHTML = data.max;
	  	  
	  for (var key in data.gradient) {
	    gradient.addColorStop(key, data.gradient[key]);
	  }
	  
	  legendCtx.fillStyle = gradient;
	  legendCtx.fillRect(0, 0, 100, 10); 

	  gradientImg.src = this._legendCanvas.toDataURL();
	}
    }
});

L.control.heatmapControl = function (options) {
    return new L.Control.HeatmapControl(options);
};
