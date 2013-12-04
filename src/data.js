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
    _organiseData: function(data) {
      var store = this._data;
      var radi = this._radi;
      var max = this._max;
      // holy crap it's 3am in the morning
      var len = +!!data.length;

      if (len === 0) {
        var swp = [data];
        data = swp;
        len = 1;
      }
      // end of holy crap

      for (var i = 0; i < len; i++) {

        var point = data[i];
        var count = point.count;
        var radius = point['radius'] || defaultRadius;
        var x = point.x;
        var y = point.y;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = count || 1;
          radi[point] = radius;
        } else {
          store[x][y] += count;
        }
        if (store[x][y] > max) {
          this.setDataMax(store[x][y]);
        } else {
          this._coordinator.emit('renderpartial', { x: x, y: y, count: count, radius: radius });
        }
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
        this._organiseData(arguments[0]);
      }
    },
    setData: function(data) {
      this._max = data.max;
      this._min = data.min || 0;
      _organiseData(data);
      this._coordinator.emit('renderall', this.getData());
    },
    subtractData: function() {

    },
    setDataMax: function(max) {
      this._max = max;
      this._coordinator.emit('renderall', this.getData());
    },
    setDataMin: function(min) {
      this._min = min;
      this._coordinator.emit('renderall', this.getData());
    },
    setCoordinator: function(coordinator) {
      this._coordinator = coordinator;
    },
    getData: function() {
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