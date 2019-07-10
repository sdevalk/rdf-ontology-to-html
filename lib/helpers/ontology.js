'use strict';

const Debug = require('debug')('app:ontology');
const Joi = require('@hapi/joi');
const N3 = require('n3');
const Stream = require('stream');
const Util = require('util');
const Wreck = require('@hapi/wreck');

const internals = {};

internals.schemas = {
    loadFromUrl: {
        url: Joi.string().uri({ scheme: ['http', 'https'] }).required()
    }
};

exports = module.exports = internals.Ontology = class {

    constructor() {

        this._store = new N3.Store();
    }

    async loadFromUrl(options) {

        options = await Joi.validate(options, internals.schemas.loadFromUrl);

        const getOutputStream = (store) => {

            const writer = new Stream.Writable({ objectMode: true });
            writer._write = (quad, encoding, next) => {

                store.addQuad(quad);
                return next();
            };

            return writer;
        };

        const headers = {
            accept: 'text/turtle'
        };

        const requestOptions = {
            headers,
            redirects: 10,
            redirect303: true, // Required for e.g. Schema.org and DC Terms
            rejectUnauthorized: false,
            beforeRedirect: (redirectMethod, statusCode, location, redirectHeaders, redirectOptions, next) => {

                redirectOptions.headers = headers;
                return next();
            }
        };

        Debug('Loading ontology from "%s"', options.url);

        const inputStream = await Wreck.request('get', options.url, requestOptions);
        const streamParser = new N3.StreamParser();
        const outputStream = getOutputStream(this._store);
        const pipeline = Util.promisify(Stream.pipeline);

        await pipeline(inputStream, streamParser, outputStream);
    }

    getStore() {

        return this._store;
    }

    getLabelOfSubject(subject) {

        const quads = this._store.getQuads(subject, 'http://www.w3.org/2000/01/rdf-schema#label');

        if (quads.length === 0) {
            return undefined;
        }

        const label = quads[0].object.value;

        return label;
    }
};
