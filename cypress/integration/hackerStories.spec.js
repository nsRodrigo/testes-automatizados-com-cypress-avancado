const { stories } = require('../fixtures/stories');
const { vazio } = require('../fixtures/vazio');

describe('Hacker Stories', () => {
    const initialTerm = 'React';
    const newTerm = 'Cypress';

    context('Hitting the real API', () => {
        beforeEach(() => {
            cy.intercept({
                method: 'GET',
                pathname: '**/search',
                query: {
                    query: initialTerm,
                    page: '0',
                },
            }).as('getStories');
            cy.visit('/');
            cy.wait('@getStories');
        });

        it('shows 20 stories, then the next 20 after clicking "More"', () => {
            cy.intercept({
                method: 'GET',
                pathname: '**/search',
                query: {
                    query: initialTerm,
                    page: '1',
                },
            }).as('getNextStories');
            cy.get('.item').should('have.length', 20);
            cy.contains('More').should('be.visible').click();
            cy.wait('@getNextStories');
            cy.get('.item').should('have.length', 40);
        });

        it('searches via the last searched term', () => {
            cy.intercept('GET', `**/search?query=${newTerm}&page=0`).as('getNewTerm');
            cy.get('#search').should('be.visible').clear().type(`${newTerm}{enter}`);
            cy.wait('@getNewTerm');
            cy.getLocalStorage('search').should('be.equal', newTerm)
            cy.get(`button:contains(${initialTerm})`)
                .should('be.visible')
                .click();
            cy.wait('@getStories');
            cy.get('.item').should('have.length', 20);
            cy.get('.item').first().should('contain', initialTerm);
            cy.getLocalStorage('search').should('be.equal', initialTerm)
            cy.get(`button:contains(${newTerm})`).should('be.visible');
        });
    });

    context('Mocking API', () => {
        context('Footer and list od stories', () => {
            beforeEach(() => {
                cy.intercept('GET', `**/search?query=${initialTerm}&page=0`, {
                    body: stories,
                }).as('getStories');
                cy.visit('/');
                cy.wait('@getStories');
            });

            it('shows the footer', () => {
                cy.get('footer')
                    .should('be.visible')
                    .and('contain', 'Icons made by Freepik from www.flaticon.com');
            });

            context('List of stories', () => {
                it('shows the right data for all rendered stories', () => {
                    cy.get('.item')
                        .first()
                        .should('be.visible')
                        .and('contain', stories.hits[0].title)
                        .and('contain', stories.hits[0].author)
                        .and('contain', stories.hits[0].num_comments)
                        .and('contain', stories.hits[0].points)
                        .and('contain', stories.hits[0].author);
                    cy.get(`.item a:contains(${stories.hits[0].title})`).should('have.attr', 'href', stories.hits[0].url);

                    cy.get('.item')
                        .last()
                        .should('be.visible')
                        .and('contain', stories.hits[1].title)
                        .and('contain', stories.hits[1].author)
                        .and('contain', stories.hits[1].num_comments)
                        .and('contain', stories.hits[1].points)
                        .and('contain', stories.hits[1].author);
                    cy.get(`.item a:contains(${stories.hits[1].title})`).should('have.attr', 'href', stories.hits[1].url);
                });

                it('shows one less story after dimissing the first story', () => {
                    cy.get('.button-small').first().should('be.visible').click();
                    cy.get('.item').should('have.length', 1);
                });

                context('Order by', () => {
                    it('orders by title', () => {
                        cy.get('.list-header-button:contains(Title)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .and('contain', stories.hits[0].title);
                        cy.get(
                            `.item a:contains(${stories.hits[0].title})`
                        ).should('be.visible').and('have.attr', 'href', stories.hits[0].url);

                        cy.get('.list-header-button:contains(Title)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .and('contain', stories.hits[1].title);
                        cy.get(
                            `.item a:contains(${stories.hits[1].title})`
                        ).should('be.visible').and('have.attr', 'href', stories.hits[1].url);
                    });

                    it('orders by author', () => {
                        cy.get('.list-header-button:contains(Author)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .and('contain', stories.hits[0].author);

                        cy.get('.list-header-button:contains(Author)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .and('contain', stories.hits[1].author);
                    });

                    it('orders by comments', () => {
                        cy.get('.list-header-button:contains(Comments)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .and('contain', stories.hits[1].num_comments);

                        cy.get(
                            '.list-header-button:contains(Comments)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .and('contain', stories.hits[0].num_comments);
                    });

                    it('orders by points', () => {
                        cy.get('.list-header-button:contains(Points)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .should('contain', stories.hits[0].points);

                        cy.get('.list-header-button:contains(Points)').should('be.visible').click();
                        cy.get('.item')
                            .first().should('be.visible')
                            .should('contain', stories.hits[1].points);
                    });
                });
            });
        });

        context('Search', () => {
            beforeEach(() => {
                cy.intercept('GET', `**/search?query=${initialTerm}&page=0`, {
                    body: vazio,
                }).as('getEmptyStories');
                cy.intercept('GET', `**/search?query=${newTerm}&page=0`, {
                    body: stories,
                }).as('getStories');

                cy.visit('/');
                cy.wait('@getEmptyStories');

                cy.get('#search').should('be.visible').clear();
            });

            it('types and hits ENTER', () => {
                cy.get('#search').should('be.visible').type(`${newTerm}{enter}`);
                cy.wait('@getStories');
                cy.getLocalStorage('search').should('contain', newTerm);
                cy.get('.item').should('be.visible').and('have.length', 2);
                cy.get(`button:contains(${initialTerm})`).should('be.visible');
            });

            it('types and clicks the submit button', () => {
                cy.get('#search').should('be.visible').type(newTerm);
                cy.contains('Submit').should('be.visible').click();
                cy.wait('@getStories');
                cy.getLocalStorage('search').should('contain', newTerm);
                cy.get('.item').should('be.visible').and('have.length', 2);
                cy.get(`button:contains(${initialTerm})`).should('be.visible');
            });

            it('types and submits the form directly', () => {
                cy.get('form input[type="text"]')
                    .should('be.visible')
                    .clear()
                    .type('cypress');
                cy.get('form').should('be.visible').submit();

                // Assertion here
            });

            it('shows no story when none is returned', () => {
                cy.get('.item').should('not.exist');
            });

            context.only('Last searches', () => {
                it('shows a max of 5 buttons for the last searched terms', () => {
                    const faker = require('faker');

                    cy.intercept('GET', '**/search**', { body: vazio }).as(
                        'getRandomStories'
                    );

                    Cypress._.times(6, () => {
                        const randomWord = faker.random.word()
                        cy.get('#search').should('be.visible')
                            .clear()
                            .type(`${randomWord}{enter}`);
                        cy.wait('@getRandomStories');
                        cy.getLocalStorage('search').should('contain', randomWord);
                    });
                    cy.get('.last-searches button').should('be.visible').and('have.length', 5);
                });
            });
        });

        context('Errors', { testIsolation: true }, () => {
            it('shows "Something went wrong ..." in case of a server error', () => {
                cy.intercept('GET', `**/search**`, { statusCode: 500 }).as(
                    'getServerFailure'
                );
                cy.visit('/');
                cy.wait('@getServerFailure');
                cy.get('p:contains(Something went wrong ...)').should(
                    'be.visible'
                );
            });

            it('shows "Something went wrong ..." in case of a network error', () => {
                cy.intercept('GET', `**/search**`, { forceNetworkError: true });
                cy.visit('/');
                cy.get('p:contains(Something went wrong ...)').should(
                    'be.visible'
                );
            });
        });
    });
});

it('shows a "Loading ..." state before showing the results', () => {
    cy.visit('/')

    cy.assertLoadingIsShownAndHidden()

    cy.get('.item').should('have.length', 20)
})