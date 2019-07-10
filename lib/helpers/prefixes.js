'use strict';

const Debug = require('debug')('app:prefixes');
const Joi = require('@hapi/joi');
const Wreck = require('@hapi/wreck');

const internals = {};

internals.schemas = {
    loadFromUrl: Joi.object({
        url: Joi.string().uri({ scheme: ['http', 'https'] }).default('http://prefix.cc/popular/all.file.json')
    }).default(),
    loadFromUrlResponse: Joi.object().pattern(/.*/, Joi.string().required())
};

exports = module.exports = internals.Prefixes = class {

    constructor() {

        this.prefixToUri = new Map();
        this.uriToPrefix = new Map();
    }

    async loadFromUrl(options) {

        options = await Joi.validate(options, internals.schemas.loadFromUrl);

        const requestOptions = {
            json: 'strict' // Throws if content type is not JSON
        };

        Debug('Loading prefixes from "%s"', options.url);

        const response = await Wreck.get(options.url, requestOptions);
        const prefixes = await Joi.validate(response.payload, internals.schemas.loadFromUrlResponse);

        for (const prefix in prefixes) {
            this.prefixToUri.set(prefix, prefixes[prefix]);
            this.uriToPrefix.set(prefixes[prefix], prefix);
        }
    }

    getBaseUriFromPropertyUri(propertyUri) {

        for (const uri of this.prefixToUri.values()) {
            if (propertyUri.startsWith(uri)) {
                return uri;
            }
        }

        return undefined;
    }
};
