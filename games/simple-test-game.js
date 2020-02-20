// TODO: Find a better way than a global var?
var gameName = "Simple Test Game";
var gameState = new Object();

// Declare rooms
roomFoyer = new Object();
roomFoyer.desc = "You are in the foyer.";

// Set initial game state
gameState['currentRoom'] = roomFoyer;

