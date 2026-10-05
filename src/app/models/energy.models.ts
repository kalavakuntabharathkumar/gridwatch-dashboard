export interface BalancingAuthority {
  code: string;
  name: string;
  region: string;
}

export interface HourlyPriceData {
  timestamp: string; // ISO 8601
  price: number;     // $/MWh
  demand: number;    // MWh
  baCode: string;
}

export interface GenerationByFuel {
  timestamp: string;
  fuelType: string;
  generation: number; // MWh
  baCode: string;
}

export interface AggregatedEnergyData {
  balancingAuthority: BalancingAuthority;
  prices: HourlyPriceData[];
  demand: HourlyPriceData[];
  generation: GenerationByFuel[];
  lastUpdated: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: 'price' | 'demand' | 'generationShare';
  condition: 'above' | 'below';
  threshold: number;
  baCode?: string; // optional: apply to all BAs if not specified
  fuelType?: string; // for generationShare
  enabled: boolean;
  cooldownMinutes: number;
}

export interface AlertEvent {
  ruleId: string;
  ruleName: string;
  baCode: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  slaDeadline: Date;
}