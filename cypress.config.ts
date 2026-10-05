import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    specPattern: 'cypress/e2e/**/*.cy.{ts,js}',
    setupNodeEvents(on, config) {
      // Implement custom tasks if needed
    }
  },
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'vite'
    }
  }
});