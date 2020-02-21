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
  console.log('Parsed command: ' + objToString(parsedObj));
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

