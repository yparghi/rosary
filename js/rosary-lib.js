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

// TODO: What if a 'look' command matches no object? It shouldn't just be
// parsed as 'look' i.e. current room -- it should show an error.
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
  } else if (commandObj.verb === "LOOK") {
    performLook(commandObj);
  } else if (commandObj.verb === "TALK") {
    performTalk(commandObj);
  } else {
    displayError("Sorry, I don't know how to do that.");
  }
}


function performGo(commandObj) {
  if (commandObj.objOne === null || commandObj.objTwo !== null) {
    displayError("Failed to parse 'go' command!");
  } else {
    // TODO: Handle if you 'go' to the current room.
    changeRoom(commandObj.objOne.getRoom());
  }
}

function performLook(commandObj) {
  if (commandObj.objOne === null && commandObj.objTwo === null) {
    displayText(gameObj["currentRoom"].getDisplayText());
  } else if (commandObj.objOne !== null && commandObj.objTwo === null) {
    displayText(commandObj.objOne.getDisplayText());
  }
}

function performTalk(commandObj) {
  if (commandObj.objOne === null || commandObj.objTwo !== null) {
    displayError("Failed to parse 'talk' command!");
    return;
  }

  if (!commandObj.objOne.isTalkable()) {
      displayText("It has little to say.");
      return;
  }

  displayText(commandObj.objOne.doTalk());
}

function changeRoom(roomObj) {
  gameObj["currentRoom"] = roomObj;
  displayText(roomObj.getDisplayText());
}

function startInitialRoom(roomObj) {
  gameObj["currentRoom"] = roomObj;
  displayText(gameObj.introText + "<br/>" + roomObj.getDisplayText());
}

function displayText(message) {
  display = document.getElementById("gameDisplay");
  display.innerHTML = message;
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

  return result;
}

function findAllCurrentObjects() {
  room = gameObj["currentRoom"];
  return room.findAllObjects();
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

  getDisplayText() {
    return this.desc;
  }

  isTalkable() {
    return false;
  }

  isVisible() {
    return true;
  }
}

class GameRoom extends GameObject {
  constructor(shortName) {
    super(shortName);
    this.exits = [];
    this.objects = [];
  }

  findAllObjects() {
    return this.exits
        .concat(this.objects);
  }

  getDisplayText() {
    var displayString = this.desc;

    displayString += "<br/><br/>";
    displayString += "You see these objects: ";
    for (let i = 0; i < this.objects.length; ++i) {
        let object = this.objects[i];
        if (!object.isVisible()) {
            continue;
        }
        displayString += object.shortName.toUpperCase() + ", ";
    }

    displayString += "<br/><br/>";
    displayString += "Exits are: ";
    for (let i = 0; i < this.exits.length; ++i) {
        let exit = this.exits[i];
        if (!exit.isVisible()) {
            continue;
        }
        displayString += exit.shortName.toUpperCase() + ", ";
    }

    return displayString;
  }
}

class RoomExit extends GameObject {
  constructor(room) {
    super(room.shortName);
    this.room = room;
  }

  // For 'go' commands
  getRoom() {
    return this.room;
  }

  getDisplayText() {
    return "You can't see from here. Just go.";
  }
}


class Character extends GameObject {
  constructor(shortName, conversations) {
    super(shortName);
    this.conversations = conversations;
  }

  isTalkable() {
    return true;
  }

  doTalk() {
    return this.conversations["default"];
  }
}

/////// END CLASSES



/////// GRAMMAR CONSTANTS
const PREPOSITIONS = [
  "at",
  "to",
];

const VERB_TYPES = new Map();
VERB_TYPES.set("go", "GO");
VERB_TYPES.set("enter", "GO");
VERB_TYPES.set("look", "LOOK");
VERB_TYPES.set("see", "LOOK");
VERB_TYPES.set("talk", "TALK");
/////// END GRAMMAR CONSTANTS

