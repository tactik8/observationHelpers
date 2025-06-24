# observationHelpers

JS library observations

## Location

### Source code
https://github.com/tactik8/observationHelpers

### repl.it
https://replit.com/@tactik8/observationHelpers


## Install

### From github
```
git clone https://github.com/tactik8/observationHelpers ./helpers
```

## Test and publish

```
npm install --save-dev jest

npm install --save-dev babel-jest @babel/core @babel/preset-env
npm install --save-dev jest-environment-jsdom

node --experimental-vm-modules node_modules/.bin/jest

npx parcel build
npm adduser
npm publish

```

git clone https://github.com/tactik8/jsonldHelpers ./helpers




## How to use

```
import { observationHelpers as h } from './helpers/observationHelpers/observationHelpers.js'

let record = {
	"@context": "https://schema.org/",
	"@type": "Thing",
	"@id": "thing1",
	"name": "thing1"
}

let k = observationHelpers.to(record)


```

## Examples

```
'




```

## Tests

Prompt:
```
please write unit tests for all functions in arrayHelpers.js. Please separate the tests one file by function. Please consider edge cases.
```


## Running tests
node --experimental-vm-modules node_modules/.bin/jest





