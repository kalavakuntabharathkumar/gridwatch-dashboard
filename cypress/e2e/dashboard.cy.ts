describe('GridWatch Dashboard', () => {
  beforeEach(() => {
    cy.intercept('**/api.eia.gov/**', { fixture: 'eia-response.json' }).as('eiaRequest');
    cy.visit('/dashboard');
    cy.wait('@eiaRequest');
  });

  it('should load and display dashboard', () => {
    cy.contains('h1', 'GridWatch Dashboard').should('be.visible');
    cy.get('select').should('be.visible');
    cy.get('canvas').should('have.length.at.least', 2);
  });

  it('should change balancing authority and refresh charts', () => {
    cy.get('select').select('CAISO');
    cy.wait('@eiaRequest');
    cy.get('select').should('have.value', 'CAISO');
  });

  it('should create and display alert rule', () => {
    cy.contains('button', 'Add Rule').click();
    cy.get('input[placeholder="Rule name"]').type('Test Price Alert');
    cy.get('select').eq(0).select('price');
    cy.get('select').eq(1).select('above');
    cy.get('input[placeholder="Threshold"]').type('150');
    cy.contains('button', 'Create').click();
    cy.contains('Test Price Alert').should('be.visible');
  });

  it('should toggle alert rule enabled state', () => {
    cy.contains('Test Price Alert').parent().find('input[type="checkbox"]').click();
    // Verify toggle persists
    cy.reload();
    cy.wait('@eiaRequest');
    cy.contains('Test Price Alert').parent().find('input[type="checkbox"]').should('not.be.checked');
  });
});