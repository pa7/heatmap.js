require.config({
    packages: {
        "heatmap.js": "../../../build/heatmap"
    }
});
requirejs(["gmaps-heatmap"], function(gmapsHeatmap) {
   console.log('jooo'); 
});