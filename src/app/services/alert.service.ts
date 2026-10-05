import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, interval, filter, switchMap } from 'rxjs';
import { environment } from '@env/environment';
import { AlertRule, AlertEvent, HourlyPriceData, GenerationByFuel } from '../models/energy.models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private rulesSubject = new BehaviorSubject<AlertRule[]>(this.getDefaultRules());
  private eventsSubject = new BehaviorSubject<AlertEvent[]>([]);
  private lastAlertTime = new Map<string, number>();

  rules$ = this.rulesSubject.asObservable();
  events$ = this.eventsSubject.asObservable();

  constructor() {
    // Request notification permission on init
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Periodic evaluation (every polling interval)
    interval(environment.pollingIntervalMs).pipe(
      switchMap(() => this.rules$)
    ).subscribe(rules => this.evaluateRules(rules));
  }

  getDefaultRules(): AlertRule[] {
    return [
      { id: 'price-spike', name: 'Price Spike', metric: 'price', condition: 'above', threshold: 100, enabled: true, cooldownMinutes: 60 },
      { id: 'demand-surge', name: 'Demand Surge', metric: 'demand', condition: 'above', threshold: 50000, enabled: true, cooldownMinutes: 60 },
      { id: 'coal-dominance', name: 'High Coal Share', metric: 'generationShare', condition: 'above', threshold: 50, fuelType: 'coal', enabled: true, cooldownMinutes: 120 }
    ];
  }

  addRule(rule: AlertRule): void {
    const current = this.rulesSubject.value;
    this.rulesSubject.next([...current, rule]);
  }

  updateRule(rule: AlertRule): void {
    const current = this.rulesSubject.value.map(r => r.id === rule.id ? rule : r);
    this.rulesSubject.next(current);
  }

  removeRule(id: string): void {
    this.rulesSubject.next(this.rulesSubject.value.filter(r => r.id !== id));
  }

  acknowledgeEvent(eventId: string): void {
    const events = this.eventsSubject.value.map(e =>
      e.timestamp.getTime() === eventId ? { ...e, acknowledged: true } : e
    );
    this.eventsSubject.next(events);
  }

  /** Evaluate all enabled rules against latest data */
  evaluateRules(rules: AlertRule[], priceData?: HourlyPriceData[], demandData?: HourlyPriceData[], genData?: GenerationByFuel[]): void {
    const now = Date.now();
    rules.filter(r => r.enabled).forEach(rule => {
      const cooldownKey = `${rule.id}-${rule.baCode || 'all'}`;
      if (now - (this.lastAlertTime.get(cooldownKey) || 0) < rule.cooldownMinutes * 60 * 1000) {
        return; // Still in cooldown
      }

      let triggered = false;
      let value = 0;
      let baCode = rule.baCode || 'all';

      switch (rule.metric) {
        case 'price':
          const latestPrice = priceData?.[priceData.length - 1];
          if (latestPrice) {
            value = latestPrice.price;
            baCode = latestPrice.baCode;
            triggered = rule.condition === 'above' ? value > rule.threshold : value < rule.threshold;
          }
          break;
        case 'demand':
          const latestDemand = demandData?.[demandData.length - 1];
          if (latestDemand) {
            value = latestDemand.demand;
            baCode = latestDemand.baCode;
            triggered = rule.condition === 'above' ? value > rule.threshold : value < rule.threshold;
          }
          break;
        case 'generationShare':
          if (genData && rule.fuelType) {
            const latest = genData.filter(g => g.fuelType === rule.fuelType).pop();
            const total = genData.filter(g => g.timestamp === latest?.timestamp).reduce((s, g) => s + g.generation, 0);
            if (total > 0) {
              value = (latest!.generation / total) * 100;
              baCode = latest!.baCode;
              triggered = rule.condition === 'above' ? value > rule.threshold : value < rule.threshold;
            }
          }
          break;
      }

      if (triggered) {
        this.fireAlert(rule, baCode, value);
        this.lastAlertTime.set(cooldownKey, now);
      }
    });
  }

  private fireAlert(rule: AlertRule, baCode: string, value: number): void {
    const event: AlertEvent = {
      ruleId: rule.id,
      ruleName: rule.name,
      baCode,
      value,
      threshold: rule.threshold,
      timestamp: new Date(),
      acknowledged: false,
      slaDeadline: new Date(Date.now() + environment.alertSlaHours * 3600 * 1000)
    };

    this.eventsSubject.next([event, ...this.eventsSubject.value].slice(0, 100));

    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification(`GridWatch Alert: ${rule.name}`, {
        body: `${baCode}: ${rule.metric} ${rule.condition} ${rule.threshold} (current: ${value.toFixed(1)})`,
        icon: '/assets/icon-192.png',
        tag: rule.id
      });
    }

    // Log to Sentry (if configured)
    if (environment.sentryDsn) {
      console.log('[Sentry] Would capture alert event:', event);
      // Sentry.captureEvent({ ... });
    }
  }

  /** Check SLA breaches for unacknowledged alerts */
  checkSlaBreaches(): AlertEvent[] {
    const now = new Date();
    return this.eventsSubject.value.filter(e => !e.acknowledged && e.slaDeadline < now);
  }
}