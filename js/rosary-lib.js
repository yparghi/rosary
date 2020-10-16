function rosary_start() {
    document.getElementById("game_input").addEventListener("keyup", (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById("command_button").focus();
            document.getElementById("command_button").click();
        }
    });

    // These 'blockers' are the only way I've found to stop an enter keypress
    // from somehow hitting the text input too, which results in a
    // double-submit.
    document.getElementById("command_button").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        parseCommand();
    });
    document.getElementById("command_button").addEventListener("keydown", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    document.getElementById("command_button").addEventListener("keyup", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.keyCode === 13) {
            parseCommand();
        }
    });

    world.start();
}

function isTesting() {
    let testParam = document.URL.match(/testing=([a-z]+)/);
    if (testParam != null) {
        return (testParam[1] === "true");
    } else {
        return false;
    }
}

function rassert(condition, message="<No assertion message>") {
    if (!condition) {
        throw new Error(message);
    }
}

function focusKeyboard() {
    if (world.playMode == PLAY_MODE_ENUM.NORMAL) {
        let commandInput = document.getElementById("game_input");
        commandInput.value = "";
        commandInput.focus();
    } else if (world.playMode = PLAY_MODE_ENUM.CUTSCENE) {
        let continueButton = document.getElementById("continue_button");
        continueButton.focus();
    }
}

function parseCommand() {
    rassert(world.playMode == PLAY_MODE_ENUM.NORMAL);

    let input = document.getElementById("game_input").value.toLowerCase();
    if (input == "") {
        focusKeyboard();
        return;
    }

    clearErrorMessage();

    if (world.isEnded()) {
        return;
    }

    // This is kind of a hack to display the typed command in story output, when ideally we'd pass the command, along with the text, to displayText();
    world.lastEnteredCommand = input;
    doInternalParsing(input);

    focusKeyboard();
}

function continueCutscene() {
    rassert(world.playMode == PLAY_MODE_ENUM.CUTSCENE);
    world.continueCutscene();
}

function doInternalParsing(text) {
    words = text.split(/\s+/);
    words = words.filter(function (word) {
        return !IGNORED_WORDS.includes(word);
    });

    parseCommandFromWords(words);
}

// TODO: What if a 'look' command matches no object? It shouldn't just be
// parsed as 'look' i.e. current room -- it should show an error.
function parseCommandFromWords(words) {
    commandObj = new Object();

    verb = words[0];
    if (!VERB_TYPES.has(verb)) {
        displayError("Unknown verb: " + verb);
        return;
    }

    commandObj.verb = VERB_TYPES.get(verb);
    commandObj.typedVerb = verb;

    if (commandObj.verb == "SAY") {
        commandObj.saidWord = words[1];
        identifyResult = identifyObjects(words.slice(2));
    } else {
        identifyResult = identifyObjects(words.slice(1));
    }
    commandObj.objOne = identifyResult.objOne;
    commandObj.objTwo = identifyResult.objTwo;

    if (identifyResult.error !== null) {
        displayError(identifyResult.error);
    } else {
        performCommand(commandObj);
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
    } else if (commandObj.verb === "SAY") {
        performSay(commandObj);
    } else if (commandObj.verb === "LEAVE") {
        performLeave(commandObj);
    } else {
        displayError("Sorry, I don't know how to do that.");
        return;
    }

    world.turnCounter += 1;
    world.runHooks();
}


function performGo(commandObj) {
    if (commandObj.objOne === null || commandObj.objTwo !== null) {
        displayError("Failed to parse 'go' command!");
    } else {
        // TODO: Handle if you 'go' to the current room.
        displayText(commandObj.objOne.doGo(commandObj));
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

    let out = commandObj.objOne.doTalk();
    if (out !== null) {
        displayText(out);
    }
}

function performUse(commandObj) {
    if (commandObj.objOne === null) {
        displayError("Failed to parse 'use' command!");
    } else {
        // This is a little hacky, but at least it uses a constant.
        let interactResult = commandObj.objOne.doInteract(commandObj);
        if (interactResult == DEFAULT_NOTHING_INTERACTION && commandObj.objTwo != null) {
            interactResult = commandObj.objTwo.receiveInteract(commandObj);
        }
        displayText(interactResult);
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

function performSay(commandObj) {
    if (commandObj.saidWord == null) {
        displayError(commandObj.typedVerb + " what?");
    } else if (commandObj.objOne == null) {
        displayError(commandObj.typedVerb + " it to who or what?");
    } else {
        displayText(commandObj.objOne.doSay(commandObj));
    }
}

function performLeave(commandObj) {
    if (commandObj.objOne === null) {
        displayError("Leave what?");
    } else {
        displayText(commandObj.objOne.doLeave(commandObj));
    }
}


function spacerParagraph() {
    return `<p class="spacer">&nbsp;</p>`;
}

/**
 * Options: {
 *    scrollToTop: true/false,
 *    showLeadingHR: true/false,
 *    addTopPadding: true/false,
 *    showEnteredCommand: true/false,
 * }
 */
function displayText(message, options=null) {
    // For no-op or side-effect-only interactions.
    if (message == null) {
        return;
    }

    if (options == null) {
        options = {};
    }
    if (!("scrollToTop" in options)) {
        options.scrollToTop = true;
    }
    if (!("showLeadingHR" in options)) {
        options.showLeadingHR = true;
    }
    if (!("addTopPadding" in options)) {
        options.addTopPadding = true;
    }
    if (!("showEnteredCommand" in options)) {
        options.showEnteredCommand = true;
    }

    paragraphId = "game_" + world.paragraphCounter;
    generatedDiv = "";
    if (options.showLeadingHR && world.paragraphCounter > 0) {
        generatedDiv += `<hr/>`;
    }
    generatedDiv += `<div id="${paragraphId}">`;
    if (options.addTopPadding) {
        generatedDiv += spacerParagraph();
    }

    let messageAsLines = lineToParagraphs(message);
    let commandText = "";
    if (options.showEnteredCommand && world.lastEnteredCommand != null) {
        commandText = `<p class="commandText">&gt; ${world.lastEnteredCommand}</p>`;
    }
    generatedDiv += `${commandText}
    ${messageAsLines}
    <p class="spacer">&nbsp;</p>
    </div>`;

    world.displayHtml += generatedDiv;
    world.paragraphCounter += 1;

    let display = document.getElementById("gameDisplay");
    display.innerHTML = world.displayHtml + bottomBuffer();

    // NOTE: For this to work, gameDisplay must have the CSS "position: relative".
    if (options.scrollToTop) {
        let para = document.getElementById(paragraphId);
        display.scroll({
            "top": para.offsetTop,
            "behavior": "smooth",
        });
    } else {
        // Just bring the element into view, say if it's cut off at the bottom.
        let para = document.getElementById(paragraphId);
        let paraBottom = para.offsetTop + para.offsetHeight;
        let cutOffPart = paraBottom - display.scrollTop - display.offsetHeight;
        if (cutOffPart > 0) {
            display.scrollBy({
                "top": cutOffPart,
                "behavior": "smooth",
            });
        }
    }
}

function lineToParagraphs(line) {
    let splitLines = line.split("\n");
    out = "";
    splitLines.forEach((line) => {
        let trimmed = line.trim();
        if (trimmed.length > 0) {
            out += `<p class="game_text">${trimmed}</p>`;
        } else {
            out += spacerParagraph();
        }
    });
    return out;
}

// Padding to allow scrolling the latest paragraph to the top.
// TODO(Yash): Derive the necessary height programmatically?
function bottomBuffer() {
    return "<br/>".repeat(20);
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
    return room.interactableObjectsInThisRoom().concat(world.inventory);
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

let PLAY_MODE_ENUM = Object.freeze({
    NORMAL: 1,
    CUTSCENE: 2,
});

// The entire game, in an object.
class GameWorld {
    constructor(gameName) {
        this.gameName = gameName;
        this.state = {};
        this.inventory = [];
        this.hooks = [];
        this.introCutscene = null;
        this.initialRoom = null;
        this.currentRoom = null;
        this.displayHtml = "";
        this.turnCounter = 0;
        this.paragraphCounter = 0;
        this.isEndedBool = false;
        this.playMode = PLAY_MODE_ENUM.NORMAL;
        this.currentCutscene = null;
        this.lastEnteredCommand = null;
    }

    addInv(invItem) {
        this.inventory.push(invItem);
    }

    removeInv(invItem) {
        this.inventory = this.inventory.filter(obj => {
            return obj.shortName != invItem.shortName;
        });
    }

    removeObjFromCurrentRoom(gameObj) {
        this.currentRoom.objects = this.currentRoom.objects.filter(obj => {
            return obj.shortName != gameObj.shortName;
        });
    }

    addObjToCurrentRoom(gameObj) {
        this.currentRoom.objects.push(gameObj);
    }

    isEnded() {
        return this.isEndedBool;
    }

    endGame(cutscene) {
        this.isEndedBool = true;
        this.playCutscene(cutscene);
    }

    playCutscene(cutscene, firstLineOptions=null) {
        if (firstLineOptions === null) {
            firstLineOptions = {
                scrollToTop: true,
                showLeadingHR: true,
                addTopPadding: true
            }
        }
        this.currentCutscene = cutscene;
        this.switchPlayMode(PLAY_MODE_ENUM.CUTSCENE);
        displayText(
            this.currentCutscene.getNextLine(),
            firstLineOptions);
        this.checkCutsceneState();
    }

    continueCutscene() {
        rassert(this.playMode == PLAY_MODE_ENUM.CUTSCENE, "Expected to be mid-cutscene");
        displayText(
            this.currentCutscene.getNextLine(),
            { scrollToTop: false, showLeadingHR: false, addTopPadding: false, showEnteredCommand: false});
        this.checkCutsceneState();
    }

    checkCutsceneState() {
        rassert(this.currentCutscene != null);
        if (this.currentCutscene.hasNextLine()) {
            return;
        } else {
            this.currentCutscene = null;
            if (this.isEnded()) {
                displayText(
                    `<p>THE END</p>`,
                    { scrollToTop: false, showLeadingHR: true, addTopPadding: true, showEnteredCommand: false});
            } else {
                this.switchPlayMode(PLAY_MODE_ENUM.NORMAL);
            }
        }
    }

    start() {
        rassert(this.introCutscene != null);
        rassert(this.currentCutscene == null);
        rassert(this.initialRoom != null);
        rassert(this.currentRoom == null);
        this.currentRoom = this.initialRoom;
        this.playCutscene(this.introCutscene);
    }

    switchPlayMode(newMode) {
        let inputDiv = document.getElementById("regular_input_container");
        let cutsceneDiv = document.getElementById("cutscene_input_container");

        if (newMode == PLAY_MODE_ENUM.CUTSCENE) {
            rassert(this.playMode == PLAY_MODE_ENUM.NORMAL,
                "Invalid state to start a cutscene: " + this.playMode);
            inputDiv.style.display = "none";
            cutsceneDiv.style.display = "block";

        } else if (newMode == PLAY_MODE_ENUM.NORMAL) {
            rassert(this.playMode == PLAY_MODE_ENUM.CUTSCENE);
            inputDiv.style.display = "block";
            cutsceneDiv.style.display = "none";
        }

        this.playMode = newMode;
        focusKeyboard();
    }

    runHooks() {
        if (this.playMode != PLAY_MODE_ENUM.NORMAL) {
            return;
        }

        this.hooks.forEach((hook) => {
            if (hook.shouldRun()) {
                hook.run();
                hook.hasRun = true;
            }
        });
    }
}


class Cutscene {
    constructor(lines) {
        rassert(lines.length > 0);
        this.lines = lines;
        this.idx = 0;
    }

    getNextLine() {
        if (this.idx >= this.lines.length) {
            return null;
        } else {
            let line = this.lines[this.idx];
            this.idx += 1;
            return line;
        }
    }

    hasNextLine() {
        return (this.idx < this.lines.length);
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

    doInteract(commandObj) {
        return DEFAULT_NOTHING_INTERACTION;
    }

    receiveInteract(commandObj) {
        return DEFAULT_NOTHING_INTERACTION;
    }

    doTake(commandObj) {
        return "You can't take this. It's bolted down, or something.";
    }

    doGo(commandObj) {
        return "This entity is not a place which can be gone to.";
    }

    doSay(commandObj) {
        return "It is unresponsive.";
    }
    
    doLeave(commandObj) {
        return "You leave it be. It is quietly appreciative.";
    }
}

class GameRoom extends GameObject {
    constructor(shortName) {
        super(shortName);
        this.exits = [];
        this.objects = [];
    }

    interactableObjectsInThisRoom() {
        return this.exits.concat(this.objects);
    }

    getDisplayText() {
        var displayString = this.desc;

        displayString += "<br/><br/>";
        if (this.objects.length > 0) {
            displayString += this.formatObjectsList("You see: ", this.objects);
        }

        if (this.exits.length > 0) {
            displayString += this.formatObjectsList("Exits are: ", this.exits);
        }

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

    doGo(commandObj) {
        world.currentRoom = this;
        return world.currentRoom.getDisplayText();
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

    doGo(commandObj) {
        return this.getRoom().doGo(commandObj);
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


class GameHook {
    constructor() {
        this.hasRun = false;
    }

    shouldRun() {
        return false;
    }

    run() {
        return null;
    }
}

/////// END CLASSES



/////// CONSTANTS

const IGNORED_WORDS = [
    "at",
    "to",
    "in",
    "on",
    "into",
    "around",
    "a",
    "an",
    "the",
    "back",  // e.g. "put bottle back"
];

const VERB_TYPES = new Map();
VERB_TYPES.set("go", "GO");
VERB_TYPES.set("enter", "GO");

VERB_TYPES.set("look", "LOOK");
VERB_TYPES.set("l", "LOOK");
VERB_TYPES.set("ls", "LOOK");
VERB_TYPES.set("see", "LOOK");

VERB_TYPES.set("talk", "TALK");

VERB_TYPES.set("use", "USE");
VERB_TYPES.set("open", "USE");
VERB_TYPES.set("search", "USE");
VERB_TYPES.set("read", "USE");
VERB_TYPES.set("put", "USE");
VERB_TYPES.set("place", "USE");
VERB_TYPES.set("give", "USE");

VERB_TYPES.set("get", "TAKE");
VERB_TYPES.set("take", "TAKE");

VERB_TYPES.set("say", "SAY");
VERB_TYPES.set("type", "SAY");

VERB_TYPES.set("leave", "LEAVE");

VERB_TYPES.set("inv", "VIEW_INVENTORY");
VERB_TYPES.set("inventory", "VIEW_INVENTORY");


DEFAULT_NOTHING_INTERACTION = `Nothing happens!`;

/////// END CONSTANTS
