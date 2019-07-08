'use strict';

const Code = require('@hapi/code');
const Http = require('http');
const Lab = require('@hapi/lab');
const Prefixes = require('../../lib/helpers/prefixes');

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;
const internals = {};

describe('Prefixes', { timeout: 10000 }, () => {

    describe('loadFromUrl', () => {

        const loadWithBadValues = (provider) => {

            it('throws if options are invalid', async () => {

                const prefixes = new Prefixes();

                await expect(prefixes.loadFromUrl(provider.options)).to.reject(provider.expectedMessage);
            });
        };

        loadWithBadValues({
            options: null,
            expectedMessage: '"value" must be an object'
        });

        loadWithBadValues({
            options: {
                url: 'badValue'
            },
            expectedMessage: 'child "url" fails because ["url" must be a valid uri with a scheme matching the http|https pattern]'
        });

        loadWithBadValues({
            options: {
                url: 'ftp://example.org'
            },
            expectedMessage: 'child "url" fails because ["url" must be a valid uri with a scheme matching the http|https pattern]'
        });

        it('rejects if prefixes location is invalid', async () => {

            const prefixes = new Prefixes();

            await expect(prefixes.loadFromUrl({ url: 'https://doesnotexist1234.org' })).to.reject('Client request error: getaddrinfo ENOTFOUND doesnotexist1234.org');
        });

        it('rejects if response payload is not JSON', async () => {

            const handler = (request, response) => {

                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.write('1234');
                response.end();
            };

            const server = await internals.getServer(handler);
            const prefixes = new Prefixes();

            await expect(prefixes.loadFromUrl({ url: 'http://localhost:' + server.address().port })).to.reject('The content-type is not JSON compatible');

            server.close();
        });

        it('rejects if response payload is invalid', async () => {

            const handler = (request, response) => {

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify([]));
                response.end();
            };

            const server = await internals.getServer(handler);
            const prefixes = new Prefixes();

            await expect(prefixes.loadFromUrl({ url: 'http://localhost:' + server.address().port })).to.reject('"value" must be an object');

            server.close();
        });

        it('rejects if response payload has invalid values', async () => {

            const handler = (request, response) => {

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify({ someKey: 2 }));
                response.end();
            };

            const server = await internals.getServer(handler);
            const prefixes = new Prefixes();

            await expect(prefixes.loadFromUrl({ url: 'http://localhost:' + server.address().port })).to.reject('child "someKey" fails because ["someKey" must be a string]');

            server.close();
        });

        it('succeeds if prefixes are JSON', async () => {

            const prefixes = new Prefixes();

            await expect(prefixes.loadFromUrl()).to.not.reject();
            expect(prefixes.prefixToUri.get('rdf')).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
            expect(prefixes.uriToPrefix.get('http://www.w3.org/1999/02/22-rdf-syntax-ns#')).to.equal('rdf');
        });
    });

    describe('getBaseUriFromPropertyUri', () => {

        it('returns undefined if property URI does not match', async () => {

            const prefixes = new Prefixes();

            await prefixes.loadFromUrl();

            expect(prefixes.getBaseUriFromPropertyUri('http://doesnotexist1234.org/unknown')).to.equal(undefined);
        });

        it('returns URI if property URI matches', async () => {

            const prefixes = new Prefixes();

            await prefixes.loadFromUrl();

            expect(prefixes.getBaseUriFromPropertyUri('http://www.w3.org/2000/01/rdf-schema#subClassOf')).to.equal('http://www.w3.org/2000/01/rdf-schema#');
            expect(prefixes.getBaseUriFromPropertyUri('http://schema.org/birthDate')).to.equal('http://schema.org/');
        });
    });
});

internals.getServer = function (handler) {

    const server = Http.createServer(handler);

    return new Promise((resolve) => {

        server.listen(0, () => resolve(server));
    });
};
