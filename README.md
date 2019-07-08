Package for generating HTML from an RDF ontology
==============================

## Generate documentation
The generator accepts the following arguments:

Argument | Data type | Required | Description
--|--|--|--
`ontologyUrl` | URI | Yes | URL of the ontology, pointing to a Turtle file
`templateFile` | Text | Yes | File containing the [Handlebars](https://handlebarsjs.com/)-compliant template
`outputFile` | Text | Yes | File to write the generated documentation to
`debug` | Boolean | No | Print debug messages

Example calls:

    bin/run docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html --outputFile ./output/example01.html

Or:

    bin/run docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html --outputFile ./output/example01.html --debug

## Development

### Build image
    docker-compose build --no-cache

### Logon to container
    docker-compose run --rm node /bin/bash

### Run tests
    npm test

### Coding conventions
https://hapijs.com/styleguide
