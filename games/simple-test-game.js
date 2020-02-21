// TODO: Find a better way than a global var?
var gameName = "Simple Test Game";
var gameState = new Object();

// Declare rooms
roomFoyer = new Object();
roomFoyer.desc = "You are in the foyer.";
roomFoyer.shortName = "foyer";

roomLivingRoom = new Object();
roomLivingRoom.desc = "You are in the living room."
roomLivingRoom.shortName = "living room";

// Connect rooms
roomFoyer.exits = [ roomLivingRoom ];
roomLivingRoom.exits = [ roomFoyer ];

// Set initial game state
gameState['currentRoom'] = roomFoyer;

