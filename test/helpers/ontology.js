'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const N3 = require('n3');
const Ontology = require('../../lib/helpers/ontology');
const TestHelpers = require('../test-helpers');

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('Ontology', { timeout: 10000 }, () => {

    describe('loadFromUrl', () => {

        const loadWithBadValues = (provider) => {

            it('rejects if options are invalid', async () => {

                const ontology = new Ontology();

                await expect(ontology.loadFromUrl(provider.options)).to.reject(provider.expectedMessage);
            });
        };

        loadWithBadValues({
            options: null,
            expectedMessage: '"value" must be an object'
        });

        loadWithBadValues({
            options: {},
            expectedMessage: 'child "url" fails because ["url" is required]'
        });

        loadWithBadValues({
            options: {
                url: 'badValue'
            },
            expectedMessage: 'child "url" fails because ["url" must be a valid uri with a scheme matching the http|https pattern]'
        });

        it('rejects if ontology location does not exist', async () => {

            const ontology = new Ontology();

            await expect(ontology.loadFromUrl({ url: 'https://doesnotexist1234.org' })).to.reject('Client request error: getaddrinfo ENOTFOUND doesnotexist1234.org');
        });

        it('rejects if ontology is not Turtle', async () => {

            const ontology = new Ontology();

            await expect(ontology.loadFromUrl({ url: 'http://www.w3.org/2004/02/skos/core' })).to.reject('Unexpected "<?xml" on line 1.');
        });

        it('succeeds if ontology is Turtle', async () => {

            const ontology = new Ontology();

            await expect(ontology.loadFromUrl({ url: 'http://www.w3.org/2000/01/rdf-schema' })).to.not.reject();
        });
    });

    describe('getStore', () => {

        it('returns the store', () => {

            const ontology = new Ontology();

            expect(ontology.getStore()).to.be.an.instanceOf(N3.Store);
        });
    });

    describe('getLabelOfSubject', () => {

        it('returns undefined if subject has no label', async () => {

            const ontology = new Ontology();

            await ontology.loadFromUrl({ url: 'http://www.w3.org/ns/prov' });

            expect(ontology.getLabelOfSubject('http://www.w3.org/ns/prov#category')).to.equal(undefined);
        });

        it('returns first label if subject has more than one label', async () => {

            const handler = (request, response) => {

                const { namedNode, literal, quad } = N3.DataFactory;
                const writer = new N3.Writer({ prefixes: { c: 'http://example.org/cartoons#' } });

                writer.addQuad(quad(
                    namedNode('http://example.org/cartoons#Tom'),
                    namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                    literal('Label 1')
                ));
                writer.addQuad(quad(
                    namedNode('http://example.org/cartoons#Tom'),
                    namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                    literal('Label 2')
                ));
                writer.end((err, result) => {

                    if (err) {
                        // Not reached
                    }

                    response.writeHead(200, { 'Content-Type': 'text/turtle' });
                    response.write(result);
                    response.end();
                });
            };

            const server = await TestHelpers.getServer(handler);
            const ontology = new Ontology();

            await ontology.loadFromUrl({ url: 'http://localhost:' + server.address().port });

            expect(ontology.getLabelOfSubject('http://example.org/cartoons#Tom')).to.equal('Label 1');

            server.close();
        });

        it('returns label from DC Terms', async () => {

            const ontology = new Ontology();

            await ontology.loadFromUrl({ url: 'http://purl.org/dc/terms/' });

            expect(ontology.getLabelOfSubject('http://purl.org/dc/terms/created')).to.equal('Date Created');
        });

        it('returns label from PROV-O', async () => {

            const ontology = new Ontology();

            await ontology.loadFromUrl({ url: 'http://www.w3.org/ns/prov' });

            expect(ontology.getLabelOfSubject('http://www.w3.org/ns/prov#Activity')).to.equal('Activity');
        });

        it('returns label from Schema.org', async () => {

            const ontology = new Ontology();

            await ontology.loadFromUrl({ url: 'https://schema.org/birthDate' });

            expect(ontology.getLabelOfSubject('http://schema.org/birthDate')).to.equal('birthDate');
        });
    });
});
