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
  verb = words[0];
}

const PREPOSITIONS = [
  "to",
];

