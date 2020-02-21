function parseCommand() {
  // TODO: Pass this in somehow, don't grab it from the DOM. And write tests.
  input = document.getElementById("gameInput").value.toLowerCase();
  doInternalParsing(input);
}

function doInternalParsing(text) {
  words = text.split(/\s+/)
  words = words.filter(function(word) {
    return !PREPOSITIONS.includes(word);
  });
  console.log('Words: ', words);

  parseCommandFromWords(words);
}

function parseCommandFromWords(words) {
  parsedObj = new Object();

  verb = words[0];
  if (!VERB_TYPES.has(verb)) {
    displayError('Unknown verb: ' + verb);
    return;
  }

  parsedObj.verb = VERB_TYPES.get(verb);

  var identifyResult = identifyObjects(words.slice(1));
  parsedObj.objOne = identifyResult.objOne;
  parsedObj.objTwo = identifyResult.objTwo;

  if (identifyResult.error !== null) {
    displayError(identifyResult.error);
  }
  console.log('Parsed command: ' + objToString(parsedObj));
}

// TODO: Figure out the general system of 'registering' the existence or
// nonexistence of objects, rooms, characters, etc.
function identifyObjects(words) {
  result = new Object();
  result.objOne = null;
  result.objTwo = null;
  result.error = null;

  // This is temporary.
  allGameObjects = gameState["currentRoom"].exits.map(function(room) {
    return room.shortName.toLowerCase();
  });

  for (let i = 0; i < words.length; i++) {
    console.log('i: ' + i);
    match = lookForOneWordMatches(allGameObjects, words[i]);
    console.log('One-word match result: ' + match);
    if (match === null && i < words.length - 1) {
      match = lookForTwoWordMatches(allGameObjects, words[i], words[i+1]);
    }

    if (match !== null) {
      if (result.objOne === null) {
        result.objOne = match;
      } else if (result.objTwo === null) {
        result.objTwo = match;
      } else {
        result.error = '3+ objs TODO';
        return result;
      }
    }
  }

  if (result.objOne === null) {
    result.error = "No matching objects found!";
  }
  return result;
}

// TODO: Maybe we should have a base GameObject class with methods like
// getSynonyms(), for these comparisons?
function lookForOneWordMatches(objects, word) {
  console.log('Matching: ' + word);
  console.log('Matching: ' + JSON.stringify(objects));
  for (let i = 0; i < objects.length; i++) {
    if (word.localeCompare(objects[i]) === 0) {
      return objects[i];
    }
  }
  return null;
}

function lookForTwoWordMatches(objects, word1, word2) {
  word = word1 + " " + word2;
  return lookForOneWordMatches(objects, word);
}

function objToString(obj) {
  return JSON.stringify(obj, null, 4);
}

// TODO: Clear the input box?
function displayError(message) {
  // TODO: Find a better way than grabbing from the DOM.
  errorDisplay = document.getElementById("gameErrorDisplay");
  errorDisplay.innerHTML = message;
}

const PREPOSITIONS = [
  "to",
];

const VERB_TYPES = new Map();
VERB_TYPES.set('go', 'GO');
VERB_TYPES.set('enter', 'GO');

