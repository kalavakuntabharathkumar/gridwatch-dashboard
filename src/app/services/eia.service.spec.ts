import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EiaService } from './eia.service';
import { environment } from '@env/environment';

// Mock environment
jest.mock('@env/environment', () => ({
  environment: { eiaApiKey: 'test-key', pollingIntervalMs: 300000, alertSlaHours: 4, sentryDsn: '', production: false }
}));

describe('EiaService', () => {
  let service: EiaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EiaService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EiaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch balancing authorities', () => {
    const mockResponse = {
      response: { data: [
        { respondent: 'PJM', respondentName: 'PJM Interconnection', regionName: 'Mid-Atlantic' },
        { respondent: 'CAISO', respondentName: 'California ISO', regionName: 'West' }
      ]}
    };

    service.getBalancingAuthorities().subscribe(bas => {
      expect(bas.length).toBe(2);
      expect(bas[0].code).toBe('PJM');
      expect(bas[1].name).toBe('California ISO');
    });

    const req = httpMock.expectOne(r => r.url.includes('/region-data/data/'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle API errors gracefully', () => {
    service.getBalancingAuthorities().subscribe(bas => {
      expect(bas).toEqual([]);
    });

    const req = httpMock.expectOne(r => r.url.includes('/region-data/data/'));
    req.error(new ErrorEvent('Network error'));
  });
});