import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, tap } from 'rxjs';
import { environment } from '@env/environment';
import {
  BalancingAuthority,
  HourlyPriceData,
  GenerationByFuel,
  AggregatedEnergyData
} from '../models/energy.models';

@Injectable({ providedIn: 'root' })
export class EiaService {
  private http = inject(HttpClient);
  private baseUrl = 'https://api.eia.gov/v2/electricity';
  private apiKey = environment.eiaApiKey;

  // Cache for balancing authority list
  private baCache: BalancingAuthority[] | null = null;

  /** Fetch all balancing authorities */
  getBalancingAuthorities(): Observable<BalancingAuthority[]> {
    if (this.baCache) return of(this.baCache);

    return this.http
      .get<any>(`${this.baseUrl}/rto/region-data/data/`, {
        params: this.buildParams({ frequency: 'hourly', data: 'value' })
      })
      .pipe(
        map(res => {
          // Extract unique BAs from response
          const bas = new Map<string, BalancingAuthority>();
          res.response.data.forEach((d: any) => {
            if (!bas.has(d.respondent)) {
              bas.set(d.respondent, {
                code: d.respondent,
                name: d.respondentName,
                region: d.regionName
              });
            }
          });
          this.baCache = Array.from(bas.values());
          return this.baCache;
        }),
        catchError(this.handleError<BalancingAuthority[]>('getBalancingAuthorities', []))
      );
  }

  /** Fetch hourly prices and demand for a BA */
  getHourlyPriceDemand(baCode: string, hours = 168): Observable<HourlyPriceData[]> {
    return this.http
      .get<any>(`${this.baseUrl}/rto/region-data/data/`, {
        params: this.buildParams({
          frequency: 'hourly',
          data: 'value',
          'facets[respondent][]': baCode,
          'facets[type][]': 'LMP', // Locational Marginal Price
          length: hours.toString()
        })
      })
      .pipe(
        map(res => this.parseHourlyData(res, baCode, 'price')),
        catchError(this.handleError<HourlyPriceData[]>(`getHourlyPriceDemand-${baCode}`, []))
      );
  }

  /** Fetch hourly demand for a BA */
  getHourlyDemand(baCode: string, hours = 168): Observable<HourlyPriceData[]> {
    return this.http
      .get<any>(`${this.baseUrl}/rto/region-data/data/`, {
        params: this.buildParams({
          frequency: 'hourly',
          data: 'value',
          'facets[respondent][]': baCode,
          'facets[type][]': 'D', // Demand
          length: hours.toString()
        })
      })
      .pipe(
        map(res => this.parseHourlyData(res, baCode, 'demand')),
        catchError(this.handleError<HourlyPriceData[]>(`getHourlyDemand-${baCode}`, []))
      );
  }

  /** Fetch generation by fuel type for a BA */
  getGenerationByFuel(baCode: string, hours = 168): Observable<GenerationByFuel[]> {
    return this.http
      .get<any>(`${this.baseUrl}/rto/fuel-type-data/data/`, {
        params: this.buildParams({
          frequency: 'hourly',
          data: 'value',
          'facets[respondent][]': baCode,
          length: hours.toString()
        })
      })
      .pipe(
        map(res => {
          const results: GenerationByFuel[] = [];
          res.response.data.forEach((d: any) => {
            results.push({
              timestamp: d.period,
              fuelType: d.fueltype,
              generation: d.value,
              baCode
            });
          });
          return results;
        }),
        catchError(this.handleError<GenerationByFuel[]>(`getGenerationByFuel-${baCode}`, []))
      );
  }

  /** Aggregate all data for a BA into single object */
  getAggregatedData(baCode: string): Observable<AggregatedEnergyData> {
    return this.getBalancingAuthorities().pipe(
      map(bas => bas.find(b => b.code === baCode)!),
      // In real app, use forkJoin to parallelize; simplified for brevity
    );
    // Actual aggregation happens in GraphQL resolvers / component
  }

  private buildParams(extra: Record<string, string | string[]>): HttpParams {
    let params = new HttpParams().set('api_key', this.apiKey);
    Object.entries(extra).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params = params.append(key, v));
      } else {
        params = params.set(key, value);
      }
    });
    return params;
  }

  private parseHourlyData(res: any, baCode: string, field: 'price' | 'demand'): HourlyPriceData[] {
    return res.response.data.map((d: any) => ({
      timestamp: d.period,
      price: field === 'price' ? d.value : 0,
      demand: field === 'demand' ? d.value : 0,
      baCode
    }));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // In production, send to Sentry here
      return of(result as T);
    };
  }
}