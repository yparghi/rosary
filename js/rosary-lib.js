function parseCommand() {
    clearErrorMessage();

    if (world.isEnded()) {
        return;
    }

    // TODO: Pass this in somehow, don"t grab it from the DOM. And write tests.
    input = document.getElementById("gameInput").value.toLowerCase();
    doInternalParsing(input);
}

function doInternalParsing(text) {
    words = text.split(/\s+/)
    words = words.filter(function (word) {
        return !PREPOSITIONS.includes(word);
    });

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
    } else if (commandObj.verb === "USE") {
        performUse(commandObj);
    } else if (commandObj.verb === "TAKE") {
        performTake(commandObj);
    } else if (commandObj.verb === "VIEW_INVENTORY") {
        performInv(commandObj);
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
        displayText(world.currentRoom.getDisplayText());
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

function performUse(commandObj) {
    // ...Until we need 'use X with Y'?
    if (commandObj.objOne === null) {
        displayError("Failed to parse 'use' command!");
    } else {
        displayText(commandObj.objOne.doInteract(commandObj));
    }
}


function performTake(commandObj) {
    if (commandObj.objOne === null || commandObj.objTwo !== null) {
        displayError("Failed to parse 'take' command!");
    } else {
        displayText(commandObj.objOne.doTake(commandObj));
    }
}

function performInv(commandObj) {
    if (commandObj.objOne !== null) {
        displayError("Type 'inv' to view your inventory.");
    } else {
        let str = "Inventory:";
        world.inventory.forEach(obj => {
            str += "<p>" + obj.shortName + "</p>";
        });
        displayText(str);
    }
}


function changeRoom(roomObj) {
    world.currentRoom = roomObj;
    // TODO! hook text *BEFORE* exits text -- break up that logic?
    let roomText = world.currentRoom.getDisplayText();

    world.currentRoom.entryHooks.forEach((entryHook) => {
        let hookText = entryHook();
        if (hookText != null) {
            roomText += "<br/>";
            roomText += hookText;
        }
    });

    // TODO(Yash): Is this the right place to fire alerts? Should it be more often?
    world.alerts.forEach((alert) => {
        let alertText = alert();
        if (alertText != null) {
            roomText += "<br/>";
            roomText += alertText;
        }
    });
    displayText(roomText);
}

function startInitialRoom(roomObj) {
    world.currentRoom = roomObj;
    displayText(world.introText + `<hr/><p class="spacer">&nbsp;</p>` + roomObj.getDisplayText());
}

function displayText(message) {
    if (message == null) {
        return;
    }

    paragraphId = "game_" + world.paragraphCounter;
    if (world.paragraphCounter != 0) {
        world.displayHtml += "<hr/>";
    }

    generatedDiv = `<div id="${paragraphId}">
    <p class="spacer">&nbsp;</p>
    <p>${message}</p>
    <p class="spacer">&nbsp;</p>
    </div>`;

    world.displayHtml += generatedDiv;
    world.paragraphCounter += 1;

    // Padding to allow scrolling the latest paragraph to the top.
    // TODO(Yash): Derive the necessary height programmatically?
    let bottomBuffer = "<br/>".repeat(20);

    display = document.getElementById("gameDisplay");
    display.innerHTML = world.displayHtml + bottomBuffer;

    document.getElementById(paragraphId).scrollIntoView({
        block: "start",
        behavior: "smooth",
        inline: "start",
    });
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
        match = lookForOneWordMatches(allGameObjects, words[i]);
        if (match === null && i < words.length - 1) {
            match = lookForTwoWordMatches(allGameObjects, words[i], words[i + 1]);
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
    room = world.currentRoom;
    return room.objectsInThisRoom()
        .concat(world.inventory)
        .filter((obj) => { return obj.isVisible() });
}

// TODO: Maybe we should have a base GameObject class with methods like
// getSynonyms(), for these comparisons?
function lookForOneWordMatches(objects, word) {
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

// Helper utility for state dict .get() behavior
function getState(key, defaultValue) {
    state = world.state;
    if (key in state) {
        return state[key];
    } else {
        return defaultValue;
    }
}


/////// CLASSES

// The entire game, in an object.
class GameWorld {
    constructor(gameName) {
        this.gameName = gameName;
        this.state = {};
        this.inventory = [];
        this.alerts = [];
        this.introText = "TODO: Write an intro.";
        this.initialRoom = null;
        this.currentRoom = null;
        this.displayHtml = "";
        this.paragraphCounter = 0;
        this.isEndedBool = false;
    }

    addInv(invItem) {
        this.inventory.push(invItem);
    }

    removeObjFromCurrentRoom(gameObj) {
        this.currentRoom.objects = this.currentRoom.objects.filter(obj => {
            return obj.shortName != gameObj.shortName;
        });
    }

    isEnded() {
        return this.isEndedBool;
    }

    endGame(message) {
        displayText(message + "<hr/>" + "<p>THE END</p>");
        this.isEndedBool = true;
    }
}

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

    // Should this supplant doTalk() and similar methods?
    doInteract(commandObj) {
        return "It is unresponsive.";
    }

    doTake(commandObj) {
        return "You can't take this. It's bolted down, or something.";
    }
}

class GameRoom extends GameObject {
    constructor(shortName) {
        super(shortName);
        this.exits = [];
        this.objects = [];
        this.entryHooks = [];
    }

    objectsInThisRoom() {
        return this.exits
            .concat(this.objects)
            .filter((obj) => {
                return obj.isVisible();
            });
    }

    getDisplayText() {
        var displayString = this.desc;

        // TODO! function for spacer para.
        displayString += "<br/><br/>";
        if (this.objects.length > 0) {
            displayString += this.formatObjectsList("You see: ", this.objects);
        }

        displayString += this.formatObjectsList("Exits are: ", this.exits);

        return displayString;
    }

    formatObjectsList(prefix, objectsList) {
        let displayString = prefix;
        let objList = [];
        for (let i = 0; i < objectsList.length; ++i) {
            let object = objectsList[i];
            if (!object.isVisible()) {
                continue;
            }
            objList.push(this.formatObjectSpan(object.shortName));
        }
        displayString += objList.join(", ");
        displayString += "<br/><br/>";
        return displayString;
    }

    formatObjectSpan(objectName) {
        return `<span class="objectName">${objectName.toUpperCase()}</span>`;
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
        for (const [key, value] of Object.entries(this.conversations)) {
            if (key == "default") {
                continue;
            }
            if (getState(key, false)) {
                return this.conversations[key]();
            }
        }
        // NOTE: Is a function w/ side effects really the best way?...
        return this.conversations["default"]();
    }
}


class InventoryItem extends GameObject {
    constructor(shortName) {
        super(shortName);
    }

    static fromGameObj(gameObj) {
        let inv = new InventoryItem(gameObj.shortName);
        inv.desc = gameObj.desc;
        return inv;
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

VERB_TYPES.set("use", "USE");

VERB_TYPES.set("get", "TAKE");
VERB_TYPES.set("take", "TAKE");

VERB_TYPES.set("inv", "VIEW_INVENTORY");
VERB_TYPES.set("inventory", "VIEW_INVENTORY");
/////// END GRAMMAR CONSTANTS
