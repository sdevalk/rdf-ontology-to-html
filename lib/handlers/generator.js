'use strict';

const Debug = require('debug')('app:generate');
const FsExtra = require('fs-extra');
const Handlebars = require('handlebars');
const HumanizeString = require('humanize-string');
const Joi = require('@hapi/joi');
const Ontology = require('../helpers/ontology');
const Prefixes = require('../helpers/prefixes');
const Titleize = require('titleize');

const internals = {};

internals.schemas = {
    constructor: {
        ontologyUrl: Joi.any().required(),
        templateFile: Joi.string().required()
    }
};

exports = module.exports = internals.Generator = class {

    constructor(options) {

        options = Joi.attempt(options, internals.schemas.constructor);

        this._ontologyUrl = options.ontologyUrl;
        this._templateFile = options.templateFile;
        this._prefixes = new Prefixes();
        this._ontology = new Ontology();
        this._ontologyCache = new Map();
    }

    makeLabelFromUri(propertyUri) {

        // E.g. http://www.w3.org/ns/prov#Activity
        let index = propertyUri.lastIndexOf('#');

        if (index === -1) { // E.g. https://schema.org/birthDate
            index = propertyUri.lastIndexOf('/');
        }

        if (index === -1) {
            return propertyUri;
        }

        const label = propertyUri.substring(index + 1);

        return label;
    }

    async getLabel(propertyUri) {

        const baseUri = this._prefixes.getBaseUriFromPropertyUri(propertyUri);

        if (baseUri === undefined) {
            return this.makeLabelFromUri(propertyUri);
        }

        if (!this._ontologyCache.has(baseUri)) {
            const ontology = new Ontology();

            try {
                await ontology.loadFromUrl({ url: baseUri });
            }
            catch (err) {
                Debug('Cannot load ontology from "%s" - not a Turtle file? Error: %s', baseUri, err.message);
            }

            this._ontologyCache.set(baseUri, ontology);
        }

        const ontology = this._ontologyCache.get(baseUri);
        let label = ontology.getLabelOfSubject(propertyUri);

        if (label === undefined) {
            label = this.makeLabelFromUri(propertyUri);
        }

        return label;
    }

    async getElements(quads) {

        const elements = [];

        for (const quad of quads) {
            const label = await this.getLabel(quad.subject.value);
            const childElements = [];
            const childQuads = this._ontology.getStore().getQuads(quad.subject);

            for (const childQuad of childQuads) {
                const labelOfElement = await this.getLabel(childQuad.predicate.value);

                childElements.push({
                    labelUri: childQuad.predicate.value,
                    label: labelOfElement,
                    language: childQuad.object.language,
                    value: childQuad.object.value
                });
            };

            childElements.sort((elementA, elementB) => elementA.label.localeCompare(elementB.label));

            elements.push({ quad, label, elements: childElements });
        };

        elements.sort((elementA, elementB) => elementA.label.localeCompare(elementB.label));

        return elements;
    }

    async getClasses() {

        Debug('Collecting OWL classes in ontology "%s"', this._ontologyUrl);

        const classes = this._ontology.getStore().getQuads(null, null, 'http://www.w3.org/2002/07/owl#Class');
        const elements = await this.getElements(classes);

        Debug('Found %d OWL classes in ontology "%s"', elements.length, this._ontologyUrl);

        return elements;
    }

    async getPropertiesByClass(classQuad) {

        Debug('Collecting properties of class "%s"', classQuad.subject.value);

        const properties = this._ontology.getStore().getQuads(null, 'http://www.w3.org/2000/01/rdf-schema#domain', classQuad.subject);
        const elements = await this.getElements(properties);

        Debug('Found %d properties of class "%s"', elements.length, classQuad.subject.value);

        return elements;
    }

    async loadTemplateFromFile(fileName) {

        Debug('Loading template file "%s"', fileName);

        const data = await FsExtra.readFile(fileName, 'utf-8');
        const template = Handlebars.compile(data);

        return template;
    }

    async run() {

        await this._prefixes.loadFromUrl();
        await this._ontology.loadFromUrl({ url: this._ontologyUrl });

        const elements = [];
        const classes = await this.getClasses();

        for (const klass of classes) {
            const properties = await this.getPropertiesByClass(klass.quad);
            elements.push({
                ...klass,
                properties
            });
        };

        Handlebars.registerHelper('humanize', (value) => HumanizeString(value));
        Handlebars.registerHelper('titleize', (value) => Titleize(value));

        const template = await this.loadTemplateFromFile(this._templateFile);
        const data = template({ classes: elements });

        Debug('Writing generated data');

        process.stdout.write(data);
    }
};
