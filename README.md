Package for generating HTML from an RDF ontology
==============================

## Prerequisites
This package requires Node version 10 or higher

## Step 1: install package
    npm install --silent git://github.com/sdevalk/rdf-ontology-to-html.git

## Step 2: create template file
Create a template file, e.g. by copying and pasting the contents of the [example file](./templates/example01.html).

## Step 3: generate documentation
The generator accepts the following arguments:

Argument | Data type | Required | Description
--|--|--|--
`ontologyUrl` | URI | Yes | URL of the ontology, pointing to a Turtle file
`templateFile` | Text | Yes | File containing the [Handlebars](https://handlebarsjs.com/)-compliant template
`debug` | Boolean | No | Print debug messages

Example calls:

    npx rdf-ontology-to-html docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html > ./example01.html

Or:

    npx rdf-ontology-to-html docs:generate --ontologyUrl http://www.w3.org/ns/prov --templateFile ./templates/example01.html --debug > ./example01.html

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
