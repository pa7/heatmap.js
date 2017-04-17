import {AfterViewInit, Component} from '@angular/core';

declare const h337: any;

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html'
})
export class HeatmapComponent implements AfterViewInit {

  ngAfterViewInit() {
    const heatmap = h337.create({
      container: window.document.querySelector('#heatmap')
    });

    heatmap.setData({
      max: 5,
      data: [{x: 10, y: 15, value: 5}]
    });
  }
}
