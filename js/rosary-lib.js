function parseCommand() {
	clearErrorMessage();

  // TODO: Pass this in somehow, don"t grab it from the DOM. And write tests.
  input = document.getElementById("gameInput").value.toLowerCase();
  doInternalParsing(input);
}

function doInternalParsing(text) {
  words = text.split(/\s+/)
  words = words.filter(function(word) {
    return !PREPOSITIONS.includes(word);
  });
  console.log("Words: ", words);

  parseCommandFromWords(words);
}

function parseCommandFromWords(words) {
  parsedObj = new Object();

  verb = words[0];
  if (!VERB_TYPES.has(verb)) {
    displayError("Unknown verb: " + verb);
    return;
  }

  parsedObj.verb = VERB_TYPES.get(verb);

  var identifyResult = identifyObjects(words.slice(1));
  parsedObj.objOne = identifyResult.objOne;
  parsedObj.objTwo = identifyResult.objTwo;

  console.log("Parsed command: " + objToString(parsedObj));
  if (identifyResult.error !== null) {
    displayError(identifyResult.error);
  } else {
    performCommand(parsedObj);
  }
}


function performCommand(commandObj) {
  if (commandObj.verb === "GO") {
    performGo(commandObj);
  } else {
    displayError("Sorry, I don't know how to do that.");
  }
}


function performGo(commandObj) {
  if (commandObj.objOne === null || commandObj.objTwo !== null) {
    displayError("Failed to parse 'go' command!");
  } else {
    changeRoom(commandObj.objOne);
  }
}

function changeRoom(roomObj) {
  gameState["currentRoom"] = roomObj;

  displayString = roomObj.desc;
  displayString += "\n\n";
  displayString += "Exits are: ";
  for (let i = 0; i < roomObj.exits.length; ++i) {
      displayString += roomObj.exits[i].shortName.toUpperCase() + ", ";
  }

  display = document.getElementById("gameDisplay");
  display.innerHTML = displayString;
}


// TODO: Figure out the general system of "registering" the existence or
// nonexistence of objects, rooms, characters, etc.
function identifyObjects(words) {
  result = new Object();
  result.objOne = null;
  result.objTwo = null;
  result.error = null;

  allGameObjects = findAllCurrentObjects();

  for (let i = 0; i < words.length; i++) {
    console.log("i: " + i);
    match = lookForOneWordMatches(allGameObjects, words[i]);
    console.log("One-word match result: " + match);
    if (match === null && i < words.length - 1) {
      match = lookForTwoWordMatches(allGameObjects, words[i], words[i+1]);
    } else {
      console.log("SKIPPING two-word check.");
    }

    if (match !== null) {
      if (result.objOne === null) {
        result.objOne = match;
      } else if (result.objTwo === null) {
        result.objTwo = match;
      } else {
        result.error = "3+ objs TODO";
        return result;
      }
    }
  }

  if (result.objOne === null) {
    result.error = "No matching objects found!";
  }
  return result;
}

function findAllCurrentObjects() {
  room = gameState["currentRoom"];
  return room.findAllObjects();
  //return gameState["currentRoom"].exits;
}

// TODO: Maybe we should have a base GameObject class with methods like
// getSynonyms(), for these comparisons?
function lookForOneWordMatches(objects, word) {
  console.log("Matching: " + word);
  console.log("Matching: " + objToString(objects));
  for (let i = 0; i < objects.length; i++) {
    if (word.localeCompare(objects[i].shortName) === 0) {
      return objects[i];
    }
  }
  return null;
}

function lookForTwoWordMatches(objects, word1, word2) {
  word = word1 + " " + word2;
  return lookForOneWordMatches(objects, word);
}

// Thanks to: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value#Examples
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
				if (value.hasOwnProperty("shortName")) {
          return "[Circular: " + value.shortName + "]";
        } else {
          return "[Circular]";
        }
      }
      seen.add(value);
    }
    return value;
  };
};

function objToString(obj) {
  return JSON.stringify(obj, getCircularReplacer(), 4);
}

// TODO: Clear the input box?
function displayError(message) {
  // TODO: Find a better way than grabbing from the DOM.
  errorDisplay = document.getElementById("gameErrorDisplay");
  errorDisplay.innerHTML = message;
}

function clearErrorMessage() {
  // TODO: Find a better way than grabbing from the DOM.
  errorDisplay = document.getElementById("gameErrorDisplay");
  errorDisplay.innerHTML = "";
}


/////// CLASSES

class GameObject {
  constructor(shortName) {
    this.shortName = shortName;
  }
}

class GameRoom extends GameObject {
  constructor(shortName) {
    super(shortName);
  }

  findAllObjects() {
    // This is temporary.
    return this.exits;
  }
}

/////// END CLASSES



/////// GRAMMAR CONSTANTS
const PREPOSITIONS = [
  "to",
];

const VERB_TYPES = new Map();
VERB_TYPES.set("go", "GO");
VERB_TYPES.set("enter", "GO");
/////// END GRAMMAR CONSTANTS

