import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideApollo } from '@apollo/client/angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { apolloProviders } from './app/graphql/apollo.config';
import { environment } from '@env/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(appRoutes),
    provideCharts(withDefaultRegisterables()),
    ...apolloProviders
  ]
}).catch(err => console.error('Bootstrap failed:', err));