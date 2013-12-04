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