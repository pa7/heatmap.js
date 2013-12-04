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