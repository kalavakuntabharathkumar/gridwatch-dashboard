import { Component, input, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="w-full" [style.height.px]="height()">
      <canvas
        baseChart
        [data]="chartData()"
        [options]="chartOptions()"
        [type]="chartType()"
      ></canvas>
    </div>
  `,
  styles: []
})
export class ChartComponent implements OnChanges {
  chartData = input<any>(null);
  chartOptions = input<any>({});
  chartType = input<'line' | 'bar' | 'doughnut' | 'pie'>('line');
  height = input<number>(300);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && this.chartData()) {
      // Chart.js updates automatically via ng2-charts
    }
  }
}