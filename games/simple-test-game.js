// TODO: Find a better way than a global var?
var gameName = "Simple Test Game";
var gameState = new Object();

// Declare rooms
roomFoyer = new GameRoom("foyer");
roomFoyer.desc = "You are in the foyer.";

roomLivingRoom = new GameRoom("living room");
roomLivingRoom.desc = "You are in the living room."

// Connect rooms
roomFoyer.exits = [ roomLivingRoom ];
roomLivingRoom.exits = [ roomFoyer ];

// Add room objects
sponge = new GameObject("sponge");
roomFoyer.objects = [ sponge ];

// Set initial game state
gameState['initialRoom'] = roomFoyer;

