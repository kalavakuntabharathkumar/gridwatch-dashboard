import { gql } from '@apollo/client/core';

export const GET_BALANCING_AUTHORITIES = gql`
  query GetBalancingAuthorities {
    balancingAuthorities {
      code
      name
      region
    }
  }
`;

export const GET_HOURLY_PRICES = gql`
  query GetHourlyPrices($baCode: String!, $hours: Int!) {
    hourlyPrices(baCode: $baCode, hours: $hours) {
      timestamp
      price
      demand
      baCode
    }
  }
`;

export const GET_HOURLY_DEMAND = gql`
  query GetHourlyDemand($baCode: String!, $hours: Int!) {
    hourlyDemand(baCode: $baCode, hours: $hours) {
      timestamp
      price
      demand
      baCode
    }
  }
`;

export const GET_GENERATION_BY_FUEL = gql`
  query GetGenerationByFuel($baCode: String!, $hours: Int!) {
    generationByFuel(baCode: $baCode, hours: $hours) {
      timestamp
      fuelType
      generation
      baCode
    }
  }
`;

export const GET_AGGREGATED_BA_DATA = gql`
  query GetAggregatedBAData($baCode: String!, $hours: Int!) {
    balancingAuthorities {
      code
      name
      region
    }
    hourlyPrices(baCode: $baCode, hours: $hours) {
      timestamp
      price
      demand
      baCode
    }
    hourlyDemand(baCode: $baCode, hours: $hours) {
      timestamp
      price
      demand
      baCode
    }
    generationByFuel(baCode: $baCode, hours: $hours) {
      timestamp
      fuelType
      generation
      baCode
    }
  }
`;