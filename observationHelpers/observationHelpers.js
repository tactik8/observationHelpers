


import { jsonldHelpers as h } from './helpers/jsonldHelpers/jsonldHelpers.js'

/**
 * Observations helpers
 * Allows mergin of differnet jsonld data sources into a single jsonld data source, keeping the best values
 *
 * Base properties:
 * object: The thing updated by new observation
 * action: The action performed by the observation (set, delete)
 * propertyID: The property of the object that was observed
 * value: The value of the property that was observed
 *
 * Properties associated to the source and collection methods:
 * observationDate: The date of the observation
 * source: The source of the observation (system, etc) (NOT SCHEMA_ORG)
 * instrument: The thing used to make the observation
 * agent: The thing that made the observation
 * observationGroup: The group of observations that this observation belongs to  (NOT SCHEMA_ORG)
 * position: The position of the observation in the observation group  (NOT SCHEMA_ORG)
 * 
 * Properties associated to the observation:
 * credibility: The credibility of the observation (NOT SCHEMA_ORG)
 * observationDate: The date of the observation
 * systemDate: The date the observation was added to the system (NOT SCHEMA_ORG)
 * 
 */

export const observationHelpers = {
    getRecord: getExampleObservation,
    new: createNewObservation,
    to: objectToObservation,
    lt: lt,
    le: le,
    gt: gt,
    ge: ge,
    sort: sort,
    filter: filter,
    compile: compile,
    analyseRecord: analyseRecord,
    analyseRecords: analyseRecords,
    toString: toString,

}


// -----------------------------------------------------
//  Set constants 
// -----------------------------------------------------


let increment = 0

const COMPARISON_PROPERTIES = ['credibility', 'observationDate', 'systemDate', 'position']

const OBSERVATION_PROPERTIES = ['@type', '@id', 'propertyID', 'value', 'observationDate', 'object', 'instrument', 'agent', 'credibility', 'observationGroup', 'action', 'position']

const OBSERVATION_PROPERTIES_SHORTCUTS = {
    "@type": [""],
    "@id": [""],
    propertyID: ["p"],
    value: ["v"],
    observationDate: ["d", "od"],
    object: ["o", "obj"],
    observationAbout: ["oa", 'about'],
    instrument: ["i", "inst"],
    agent: ["a"],
    credibility: ["c"],
    systemDate: ["sd"],
    action: ["act"],
    position: ["pos"]
}


// -----------------------------------------------------
//  Comment 
// -----------------------------------------------------



function getExampleObservation(n) {
    /**
     * get an example observation
     * @param {number} n
     * @returns {object}
     */

    n = n || 0

    let example = {
        "@type": "Observation",
        "@id": "obs1",
        propertyID: "key1",
        value: "value1",
        observationDate: new Date('2025-01-01'),
        object: {
            "@type": "Thing",
            "@id": "object1",
        },
        instrument: {
            "@type": "Thing",
            "@id": "instrument1",
        },
        agent: {
            "@type": "Thing",
            "@id": "agent1",
        },
        credibility: 0.5,
        systemDate: new Date('2025-01-01').toISOString(),
        observationGroup: "observationGroup"
    }
    return example
}



// -----------------------------------------------------
//  Hygiene functions 
// -----------------------------------------------------

function toString(observation){
    /**
     * convert an observation to a string
     * @param {object} observation
     * @returns {string}
     */

    // Deal with array of observations
    if (Array.isArray(observation)){

        let keys = ['object.@type', 'object.@id', 'propertyID', 'value']

        let lines = ['']
        for(let o of observation){
            lines.push('')
        }
        
        for(let k of keys){
            let values = observation.map(x => h.value.get(x, k) || '')
            values.push(k)
            let maxLength = Math.max(...values.map(x => x.length))

            let spacer = 
            lines[0] = lines[0]  + k + ' '.repeat(maxLength - k.length) + '  '
            for(let i=1; i < observation.length; i++){
                let v =  h.value.get(observation[i], k)
                lines[i] = lines[i] +  v + ' '.repeat(maxLength - v.length) + '  '
            }
        }
        
 
        let content = lines.join('\n')
        let line1 = `Observations (${lines.length})`
        let line2 = '-------------------------------------------'
        content =  line2 + '\n' +line1 + '\n' + line2 + '\n' + content + '\n' + line2 + '\n'
        return content
    }

    // Deal with single observation

    let content = ''
    content += '@type: ' + observation?.object?.["@type"] + ' '
    content += '@id: ' + observation?.object?.["@id"] + ' '
    content += 'pID: ' + observation?.propertyID + ' '
    content += 'v: ' + observation?.value+ ' '

    return content    

    
    
}

function cleanObservation(observation) {
    /**
     * clean an observation
     * @param {object} observation
     * @returns {object}
     * @description
     * 
     */

    // Input validation
    if (!observation) {
        return undefined
    }

    // Deal with array of observations
    if (Array.isArray(observation)) {
        return observation.map(x => cleanObservation(x))
    }

    // Copy the objects to avoid mutating them
    observation = structuredClone(observation)

    // Harmonize the keys    
    observation = cleanObservationKeys(observation)

    // Clean the references
    observation = cleanObservationRefs(observation)

    // Convert dates
    observation = cleanObservationDates(observation)

    // Return the cleaned observation
    return observation
}

function cleanObservationDates(observation) {
    /**
     * clean the dates of an observation
     * @param {object} observation
     * @returns {object}
     */


    if (observation.observationDate) {
        observation.observationDate = toDate(observation.observationDate)
    }
    if (observation.systemDate) {
        observation.systemDate = toDate(observation.systemDate)
    }
    return observation
}


function cleanObservationKeys(observation) {
    /**
     * harmonize the keys of an observation
     * @param {object} observation
     * @returns {object}
     */

    let newObservation = {}

    for (let key of Object.keys(observation)) {

        for (let k2 of Object.keys(OBSERVATION_PROPERTIES_SHORTCUTS)) {

            let shortcuts = OBSERVATION_PROPERTIES_SHORTCUTS[k2]
            if (shortcuts.includes(key)) {
                newObservation[k2] = observation[key]
            } else {
                newObservation[key] = observation[key]
            }
        }
    }

    return newObservation
}

function cleanObservationRefs(observation) {
    /**
     * clean the references of an observation
     * @param {object} observation
     * @returns {object}
     * 
     */

    // Copy the objects to avoid mutating them
    observation = structuredClone(observation)

    let properties = ['object', 'instrument', 'agent', 'observationGroup']
    for (let p of properties) {
        if (observation[p]) {
            observation[p] = h.ref.get(observation[p])
        }
    }
    return observation
}

function toDate(value, defaultValue) {
    /**
     * convert a value to a date
     * @param {*} value
     * @returns {datetime}
     * @description
     * If the value is a string, it will be converted to a date.
     * If the value is a date, it will be returned as is.
     * If the value is a number, it will be converted to a date.
     * 
     */

    if (typeof value === 'date') {
        return value
    }

    try {
        return new Date(value)
    } catch (err) {
        if (!defaultValue) {
            throw (err)
        }
        return defaultValue
    }

}


// -----------------------------------------------------
//  New Observations 
// -----------------------------------------------------


function createNewObservation(actionOrMetadata, object, propertyID, value, observationDate, source, instrument, agent, credibility, observationGroup) {
    /**
     * create a new observation
     * @param {string} propertyID
     * @param {*} value
     * @param {datetime} date
     * @param {object} object
     * @param {object} instrument
     * @param {object} agent
     * 
     */

    // Deal with values provided as object
    let record = {}
    let action
    if (typeof actionOrMetadata === 'object') {
        record = actionOrMetadata
        actionOrMetadata = undefined
        record = cleanObservation(record)
    } else {
        action = actionOrMetadata
    }


    // Create a new observation from the inputs
    let observation = {
        "@type": "Observation",
        "@id": h.uuid.new(),
        action: action,
        object: object,
        propertyID: propertyID,
        value: value,
        observationDate: observationDate,
        observationGroup: observationGroup,
        position: increment++,
        source: source,
        instrument: instrument,
        agent: agent,
        credibility: credibility,
        systemDate: new Date().toISOString()
    }

    // Merge the record with the observation record (if provided))
    for (let key of Object.keys(record)) {
        observation[key] = record?.[key] || observation[key]
    }

    // Clean the observation
    observation = cleanObservation(observation)

    // Return the observation
    return observation


}


function objectToObservation(object, observationDateOrMetadata, instrument, agent, credibility) {
    /**
     * create new observations from objects
     * @param {object} object
     * @param {datetime} date
     * @param {object} object
     * @param {object} instrument
     * @param {object} agent
     * 
     */


    // Deal with metadata
    let metadata = {}
    if (typeof observationDateOrMetadata === 'object') {
        metadata = observationDateOrMetadata
        metadata.object = object
    } else {
        metadata.object = object
        metadata.observationDate = observationDateOrMetadata
        metadata.instrument = instrument
        metadata.agent = agent
        metadata.credibility = credibility
    }


    // Create a new observation group
    let observationGroup = {
        "@type": "ObservationGroup",
        "@id": h.uuid.new()
    }

    // Create an array to hold the results
    let results = []


    // Flatten the object to get all the nested objects
    let objects = h.flatten(object)

    // Create a new observation for each key-value pair
    let action = "set"

    for (let o of objects) {

        for (let key of Object.keys(o)) {

            // Skip @ keys
            if (key.startsWith('@')) {
                continue
            }

            // 
            let values = o[key]
            values = Array.isArray(values) ? values : [values]

            for (let x of values) {

                let record = cleanObservation(metadata)
                record.propertyID = key
                record.value = x
                record.observationGroup = observationGroup

                let observation = createNewObservation(record)
                results.push(observation)
            }


        }

    }


    return results

}


// -----------------------------------------------------
//  Comparisons 
// -----------------------------------------------------


function le(obs1, obs2) {
    /**
     * Compare two observations
     * @param {object} obs1
     * @param {string} ob2
     * 
     */

    return lt(obs1, obs2, true)
}

function ge(obs1, obs2) {
    /**
     * Compare two observations
     * @param {object} obs1
     * @param {string} ob2
     * 
     */

    return gt(obs1, obs2, true)
}


function lt(obs1, obs2, isEqualFn = false) {
    /**
     * Compare two observations
     * @param {object} obs1
     * @param {string} ob2
     * @returns {boolean}
     * @example lt({@type: "Person", name: "John Doe"}) // "Person"
     * 
     * 
     */

    // Copy and clean the objects to avoid mutating them
    obs1 = cleanObservation(obs1)
    obs2 = cleanObservation(obs2)

    // Compare properties
    let comparisonProperties = COMPARISON_PROPERTIES

    for (let p of comparisonProperties) {

        let v1 = obs1?.[p]
        let v2 = obs2?.[p]

        // Handle if one or both are undefined or null
        let c1 = v1 !== undefined && v1 !== null
        let c2 = v2 !== undefined && v2 !== null


        if (c1 === false && c2 === false) {
            continue
        }

        if (c1 === false && c2 === true) {
            return true
        }

        if (c1 === true && c2 === false) {
            return false
        }

        // Compare property
        if (v1 < v2) {
            return true
        }
        if (v1 > v2) {
            return false
        }
        if (v1 == v2) {
            continue
        }
    }

    if (isEqualFn === true) {
        return true
    }
    return false

}

function gt(obs1, obs2, isEqualFn = false) {
    /**
     * Compare two observations
     * @param {object} obs1
     * @param {string} ob2
     * @returns {boolean}
     * @description
     * Returns true if obs1 is greater than obs2
     * @example gt({"observationDate":"2025-01-01", "credibility":0.5,"systemDate":"2025-01-01"} ,{"observationDate":"2025-01-01","credibility":0.4,"systemDate":"2025-01-01"}) // true
    
     */

    // Copy and clean the objects to avoid mutating them
    obs1 = cleanObservation(obs1)
    obs2 = cleanObservation(obs2)

    // Compare properties
    let comparisonProperties = COMPARISON_PROPERTIES

    for (let p of comparisonProperties) {

        let v1 = obs1?.[p]
        let v2 = obs2?.[p]

        // Handle if one or both are undefined or null
        let c1 = v1 !== undefined && v1 !== null
        let c2 = v2 !== undefined && v2 !== null

        if (c1 === false && c2 === false) {
            continue
        }

        if (c1 === false && c2 === true) {
            return false
        }

        if (c1 === true && c2 === false) {
            return true
        }

        // Compare property
        if (v1 > v2) {
            return true
        }
        if (v1 < v2) {
            return false
        }
        if (v1 == v2) {
            continue
        }
    }

    if (isEqualFn === true) {
        return true
    }
    return false

}


// -----------------------------------------------------
//  Array functions 
// -----------------------------------------------------

function sort(observations, inverse = false) {
    /**
     * Sort an array of observations
     * @param {array} observations
     * @param {boolean} inverse
     * @returns {array}
     * 
     */


    // Copy the array to avoid mutating it and clean the observations
    observations = cleanObservation(observations)

    // Sort the array
    if (inverse === true) {
        observations.sort((a, b) => lt(a, b))
    } else {
        observations.sort((a, b) => gt(a, b))
    }

    return observations

}

function filter(observations, filterConditions) {
    /**
     * Filter an array of observations
     * @param {array} observations
     * 
     */

    // Clean filter conditions
    filterConditions = cleanObservation(filterConditions)

    // Copy the array to avoid mutating it and clean the observations
    observations = cleanObservation(observations)

    // Filter the array
    observations = h.filter(observations, filterConditions)

    // Return the filtered array
    return observations

}



// -----------------------------------------------------
//  Compile 
// -----------------------------------------------------


function getActiveObservations(observations) {
    /**
     * Get the active observations from an array of observations
     * @param {array} observations
     * @returns {array}
     */

    // Input validation
    if (observations === undefined || observations === null) {
        return []
    }

    // Deal with empty array of objects
    observations = Array.isArray(observations) ? observations : [observations]
    if (observations.length === 0) {
        return []
    }

    // Copy the array to avoid mutating it and clean the observations
    observations = cleanObservation(observations)

    // Retrieve objects refs
    let refs = observations.map(x => x.object)
    refs = h.deduplicate(refs)

    // Deal with array of objects
    if (refs.length === 0) {
        return []
    }

    if (refs.length > 1) {
        let results = []
        for (let r of refs) {
            let obs = getActiveObservations(observations, r)
            results = results.concat(obs)
        }
        return results
    }


    // Get propertyIDs
    let propertyIDs = observations.map(x => x.propertyID)
    propertyIDs = [...new Set(propertyIDs)];

    let results = []

    // Cycle through propertyIDs
    for (let p of propertyIDs) {

        // Filter observations to keep only the ones for the object and property
        let obs = filter(observations, { propertyID: p })

        // Remove any obs less than set obs
        let setObs = filter(obs, { action: 'set' })
        if (setObs.length > 0) {
            for (let d of setObs) {
                obs = obs.filter(x => le(d, x) || h.isSame(x, d) === true || h.isSame(x?.observationGroup, d?.observationGroup) === true)
            }
        }

        // Remove any obs less than delete obs
        let deleteObs = obs.filter(x => x.action === 'delete')
        if (deleteObs.length > 0) {
            for (let d of deleteObs) {
                obs = obs.filter(x => (le(d, x) && h.isSame(x?.value, d?.value)) || h.isSame(x?.observationGroup, d?.observationGroup) === true)
            }
        }

        // Add to results
        results = results.concat(obs)

    }


    // Return the active observations
    return results

}


function compileObject(object, observations) {
    /**
     * Compile an array of observations
     * @param {array} observations
     * @returns {object}
     * @description
     */

    
    let record = {
        "@type": object?.['@type'],
        "@id": object?.['@id']
    }

    // Filter observations to geep only the one for the object
    observations = filter(observations, { object: h.ref.get(object) })

    // Get active observations
    observations = getActiveObservations(observations)
    observations = sort(observations, true)

    // Get propertyIDs
    let propertyIDs = observations.map(x => x.propertyID)
    propertyIDs = [...new Set(propertyIDs)];

    // Get values
    for (let p of propertyIDs) {

        let obs = filter(observations, { propertyID: p })

        let values = obs.map(x => x.value)
        if (values.length === 0) {
            continue
        }
        values = values.length === 1 ? values[0] : values
        record[p] = values

    }

    return record

}


function compile(observations, filterParams) {
    /**
     * Compile an array of observations
     * @param {array} observations
     * @returns {array}
     * 
     */

    // Observations to array 
    observations = Array.isArray(observations) ? observations : [observations]


    // Filter observations
    if(filterParams){
        observations = filter(observations, filterParams)
    }
    
    // Get refs
    let refs = observations.map(x => h.ref.get(x.object))
    refs = h.deduplicate(refs)

    // Cycle through refs
    let results = refs.map(x => compileObject(x, observations))

    // Return the compiled observations
    return results

}



function merge(record1, metadata1, record2, metadata2) {
    /**
     * Merge an array of records
     * @param {array} records
     * @returns {array}
     */

    // Generate observations
    let observations = []
    observations = observations.concat(objectToObservation(record1, metadata1))
    observations = observations.concat(objectToObservation(record2, metadata2))

    // Compile observations
    let results = compile(observations)

    // Return the merged records
    return results

}


// -----------------------------------------------------
//  Analyse - returns record withstats on record 
// -----------------------------------------------------


function analyseRecord(object, observations, activeOnly = true) {
    /**
     * Analyze a record
     * 
     */

    //
    let ref = h.ref.get(object)

    // Observations to array 
    observations = Array.isArray(observations) ? observations : [observations]

    // Filter observations to keep only the ones for the object
    observations = filter(observations, { object: ref })

    // Get active observations
    let activeObservations = observations
    if (activeOnly === true) {
        activeObservations = getActiveObservations(observations)
    }

    // Get propertyIDs
    let propertyIDs = activeObservations.map(x => x.propertyID)
    propertyIDs = [...new Set(propertyIDs)];

    // Get values
    let record = {}
    for (let p of propertyIDs) {

        let obs = filter(activeObservations, { propertyID: p })
        obs = sort(obs, true)
        let values = obs.map(x => x.value)
        if (values.length === 0) {
            continue
        }

        values = h.deduplicate(values)

        record[p] = []

        for (let v of values) {

            // Get observations for the value
            let obs = filter(activeObservations, { propertyID: p, value: v })
            obs = sort(obs, true)

            let instruments = obs.map(x => x.instrument)
            instruments = h.deduplicate(instruments)

            let agents = obs.map(x => x.agent)
            agents = h.deduplicate(agents)

            let observationDates = obs.map(x => x.observationDate)
            observationDates = h.deduplicate(observationDates)
            observationDates = observationDates.sort((a, b) => a - b)

            let systemDates = obs.map(x => x.systemDate)
            systemDates = h.deduplicate(systemDates)
            systemDates = systemDates.sort((a, b) => a - b)

            let credibilities = obs.map(x => x.credibility)
            credibilities = h.deduplicate(credibilities)
            credibilities = credibilities.sort((a, b) => a - b)

            let pv = {
                propertyID: p,
                value: v,
                nbObservations: obs.length,
                credibility: {
                    min: credibilities?.[0],
                    max: credibilities?.[credibilities.length - 1]
                },
                nbInstruments: instruments.length,
                nbAgents: agents.length,
                observationDate: {
                    min: observationDates[0],
                    max: observationDates[observationDates.length - 1],
                },
                systemDate: {
                    min: systemDates?.[0],
                    max: systemDates?.[systemDates.length - 1]
                }
            }

            record[p].push(pv)
        }



    }
    return record

}

function analyseRecords(observations, activeOnly = true) {
    /**
     * Analyze a record
     * 
     */

    // Observations to aarray 
    observations = Array.isArray(observations) ? observations : [observations]

    // Get refs
    let refs = observations.map(x => h.ref.get(x.object))
    refs = h.deduplicate(refs)


    // Cycle through refs
    let results = []
    for (let r of refs) {
        results.push(analyseRecord(r, observations, activeOnly))
    }

    return results

}
