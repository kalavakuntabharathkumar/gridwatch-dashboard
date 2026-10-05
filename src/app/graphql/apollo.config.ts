import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { RESTLink } from '@apollo/client/link/rest';
import { provideApollo } from '@apollo/client/angular';
import { environment } from '@env/environment';

// RESTLink to wrap EIA REST endpoints as GraphQL
const restLink = new RESTLink({
  uri: 'https://api.eia.gov/v2/electricity/',
  headers: {
    'Accept': 'application/json'
  },
  // Custom response transformer to handle EIA envelope
  fieldNameNormalizer: (key) => key,
  typePatcher: {
    // Map EIA response to GraphQL types
    Query: {
      balancingAuthorities: {
        path: 'response.data',
        selector: (data: any[]) => {
          const bas = new Map();
          data.forEach(d => {
            if (!bas.has(d.respondent)) {
              bas.set(d.respondent, {
                code: d.respondent,
                name: d.respondentName,
                region: d.regionName
              });
            }
          });
          return Array.from(bas.values());
        }
      },
      hourlyPrices: {
        path: 'response.data',
        selector: (data: any[], args: any) => data.map(d => ({
          timestamp: d.period,
          price: d.value,
          demand: 0,
          baCode: args.baCode
        }))
      },
      hourlyDemand: {
        path: 'response.data',
        selector: (data: any[], args: any) => data.map(d => ({
          timestamp: d.period,
          price: 0,
          demand: d.value,
          baCode: args.baCode
        }))
      },
      generationByFuel: {
        path: 'response.data',
        selector: (data: any[], args: any) => data.map(d => ({
          timestamp: d.period,
          fuelType: d.fueltype,
          generation: d.value,
          baCode: args.baCode
        }))
      }
    }
  }
});

// HttpLink for any future GraphQL server (not used currently)
const httpLink = new HttpLink({ uri: '/graphql' });

// Split: use RESTLink for EIA queries, HttpLink for others
const link = split(
  ({ query }) => {
    const def = query.definitions[0];
    return def?.kind === 'OperationDefinition' && 
      def.selectionSet.selections.some((s: any) => 
        ['balancingAuthorities', 'hourlyPrices', 'hourlyDemand', 'generationByFuel'].includes(s.name?.value)
      );
  },
  restLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          balancingAuthorities: { merge(existing, incoming) { return incoming; } },
          hourlyPrices: { merge(existing, incoming) { return incoming; } },
          hourlyDemand: { merge(existing, incoming) { return incoming; } },
          generationByFuel: { merge(existing, incoming) { return incoming; } }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only', errorPolicy: 'all' }
  }
});

export const apolloProviders = provideApollo(() => apolloClient);