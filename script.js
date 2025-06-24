

import { observationHelpers as oh } from './observationHelpers/observationHelpers.js'

import { jsonldHelpers as h } from './src/libraries/jsonldHelpers/src/jsonldHelpers.js'

function test1() {

    console.log('-------------------------------------------')

    // Test comp

    let t1 = {
        "@context": "https://schema.org/",
        "@type": "Thing",
        "@id": "thing1",
        "name": "thing1"
    }

    let t2 = {
        "@context": "https://schema.org/",
        "@type": "Thing",
        "@id": "thing1",
        "name": "thing11"
    }
    let t3 = {
        "@context": "https://schema.org/",
        "@type": "Thing",
        "@id": "thing1",
        "name": "thing111"
    }

    let t4 = {
        "@context": "https://schema.org/",
        "@type": "Thing",
        "@id": "thing1",
        "name": "thing1111"
    }
    let obs1 = oh.to(t1, { c: 0.3, d: '2025-01-01' })
    let obs2 = oh.to(t2, { c: 0.5, d: '2024-01-01' })
    let obs3 = oh.to(t3, { c: 0.7, d: '2023-01-01' })
    let obs4 = oh.to(t4, { c: 0.8, d: '2022-01-01' })
   
    
    let obs = obs1.concat(obs2)
    obs = obs.concat(obs3)
    obs = obs.concat(obs4)


    let filterParams = {
        'credibility': {
            '$le': 0.5
        },
        'observationDate': {
            '$ge': '2024-01-01'
        }
    }

    console.log(oh.toString(obs))
    let r1 = oh.compile(obs, filterParams)

    console.log('-------------------------------------------')
    console.log(JSON.stringify(r1, null, 4))


}


test1()