import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { ChartComponent } from '../chart/chart.component';
import { EiaService } from '../../services/eia.service';
import { AlertService, AlertRule } from '../../services/alert.service';
import { BalancingAuthority, HourlyPriceData, GenerationByFuel, AggregatedEnergyData } from '../../models/energy.models';
import { Subject, takeUntil, combineLatest, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private apollo = inject(Apollo);
  private eiaService = inject(EiaService);
  private alertService = inject(AlertService);
  private destroy$ = new Subject<void>();

  // Signals for reactive state
  bas = signal<BalancingAuthority[]>([]);
  selectedBa = signal<string>('PJM');
  priceData = signal<HourlyPriceData[]>([]);
  demandData = signal<HourlyPriceData[]>([]);
  generationData = signal<GenerationByFuel[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  lastUpdated = signal<Date | null>(null);

  // Chart config
  priceChartData = computed(() => this.formatChartData(this.priceData(), 'price'));
  demandChartData = computed(() => this.formatChartData(this.demandData(), 'demand'));
  generationChartData = computed(() => this.formatGenerationChartData(this.generationData()));

  // Alert rules
  alertRules = this.alertService.rules$;
  alertEvents = this.alertService.events$;
  slaBreaches = computed(() => this.alertService.checkSlaBreaches());

  // New rule form
  newRule: Partial<AlertRule> = {
    metric: 'price',
    condition: 'above',
    threshold: 100,
    enabled: true,
    cooldownMinutes: 60
  };

  ngOnInit(): void {
    this.loadBalancingAuthorities();
    this.setupPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBalancingAuthorities(): void {
    this.eiaService.getBalancingAuthorities().pipe(takeUntil(this.destroy$)).subscribe({
      next: bas => this.bas.set(bas),
      error: err => this.error.set('Failed to load balancing authorities')
    });
  }

  private setupPolling(): void {
    // Initial load
    this.refreshData();
    // Poll every 5 minutes
    interval(300000).pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshData());
  }

  onBaChange(baCode: string): void {
    this.selectedBa.set(baCode);
    this.refreshData();
  }

  private refreshData(): void {
    this.loading.set(true);
    this.error.set(null);
    const baCode = this.selectedBa();

    forkJoin({
      prices: this.eiaService.getHourlyPriceDemand(baCode),
      demand: this.eiaService.getHourlyDemand(baCode),
      generation: this.eiaService.getGenerationByFuel(baCode)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ prices, demand, generation }) => {
        this.priceData.set(prices);
        this.demandData.set(demand);
        this.generationData.set(generation);
        this.lastUpdated.set(new Date());
        this.loading.set(false);

        // Evaluate alerts with new data
        this.alertService.evaluateRules(
          this.alertService.rulesSubject.value,
          prices, demand, generation
        );
      },
      error: err => {
        this.error.set('Failed to refresh data');
        this.loading.set(false);
      }
    });
  }

  private formatChartData(data: HourlyPriceData[], field: 'price' | 'demand') {
    const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const values = data.map(d => field === 'price' ? d.price : d.demand);
    return {
      labels,
      datasets: [{
        label: field === 'price' ? 'Price ($/MWh)' : 'Demand (MWh)',
        data: values,
        borderColor: field === 'price' ? '#3b82f6' : '#10b981',
        backgroundColor: field === 'price' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0
      }]
    };
  }

  private formatGenerationChartData(data: GenerationByFuel[]) {
    // Group by fuel type, get latest hour
    const latestTimestamp = data[data.length - 1]?.timestamp;
    if (!latestTimestamp) return { labels: [], datasets: [] };

    const latest = data.filter(d => d.timestamp === latestTimestamp);
    const fuelOrder = ['coal', 'naturalgas', 'nuclear', 'wind', 'solar', 'hydro', 'other'];
    const labels = fuelOrder.filter(f => latest.some(l => l.fuelType === f));
    const values = labels.map(f => latest.find(l => l.fuelType === f)?.generation || 0);

    const colors = ['#78350f', '#f59e0b', '#6366f1', '#06b6d4', '#fbbf24', '#3b82f6', '#6b7280'];
    return {
      labels,
      datasets: [{
        label: 'Generation (MWh)',
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 1
      }]
    };
  }

  addAlertRule(): void {
    if (!this.newRule.name?.trim()) return;
    const rule: AlertRule = {
      id: `custom-${Date.now()}`,
      name: this.newRule.name.trim(),
      metric: this.newRule.metric!,
      condition: this.newRule.condition!,
      threshold: this.newRule.threshold!,
      baCode: this.newRule.baCode || undefined,
      fuelType: this.newRule.fuelType || undefined,
      enabled: this.newRule.enabled!,
      cooldownMinutes: this.newRule.cooldownMinutes!
    };
    this.alertService.addRule(rule);
    this.newRule = { metric: 'price', condition: 'above', threshold: 100, enabled: true, cooldownMinutes: 60 };
  }

  acknowledgeAlert(timestamp: number): void {
    this.alertService.acknowledgeEvent(timestamp.toString());
  }

  getChartOptions(title: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: title, font: { size: 14 } },
        legend: { display: false }
      },
      scales: {
        x: { ticks: { maxTicksLimit: 12, font: { size: 10 } } },
        y: { beginAtZero: false, ticks: { font: { size: 10 } } }
      },
      interaction: { intersect: false, mode: 'index' as const }
    };
  }
}