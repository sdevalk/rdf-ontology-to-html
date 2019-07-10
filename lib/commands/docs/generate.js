'use strict';

const BaseCommand = require('@oclif/command');
const Debug = require('debug');
const Generator = require('../../handlers/generator');

const internals = {};

exports = module.exports = internals.Command = class extends BaseCommand.Command {

    async run() {

        const { flags } = this.parse();

        if (flags.debug) {
            Debug.enable('app:*');
        }

        try {
            const options = {
                ontologyUrl: flags.ontologyUrl,
                templateFile: flags.templateFile
            };

            const handler = new Generator(options);
            await handler.run();
        }
        catch (err) {
            this.error('Failed to run command: ' + err);
            this.exit(1);
        }
    }
};

internals.Command.description = 'Generate HTML from an RDF ontology';

internals.Command.flags = {
    version: BaseCommand.flags.version(),
    help: BaseCommand.flags.help(),
    ontologyUrl: BaseCommand.flags.string({
        description: 'URL of the ontology, pointing to a Turtle file',
        required: true
    }),
    templateFile: BaseCommand.flags.string({
        description: 'File containing the Handlebars-compliant template',
        required: true
    }),
    debug: BaseCommand.flags.boolean({
        description: 'Print debug messages',
        required: false,
        default: false
    })
};
