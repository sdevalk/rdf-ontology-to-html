Package for generating HTML from an RDF ontology
==============================

## Installation
    npm install -g git://github.com/sdevalk/rdf-ontology-to-html.git

## Generate documentation
The generator accepts the following arguments:

Argument | Data type | Required | Description
--|--|--|--
`ontologyUrl` | URI | Yes | URL of the ontology, pointing to a Turtle file
`templateFile` | Text | Yes | File containing the [Handlebars](https://handlebarsjs.com/)-compliant template
`debug` | Boolean | No | Print debug messages

Example calls:

    rdf-ontology-to-html docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html > ./example01.html

Or:

    rdf-ontology-to-html docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html --debug > ./example01.html

## Development

### Build image
    docker-compose build --no-cache

### Logon to container
    docker-compose run --rm node /bin/bash

### Run tests
    npm test

### Generate documentation
    bin/run docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html > ./example01.html
    bin/run docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html --debug > ./example01.html

### Create executable
    ./node_modules/.bin/pkg .

### Coding conventions
https://hapijs.com/styleguide
