// TODO: Find a better way than a global var?
var gameName = "Simple Test Game";
var gameObj = new Object();

// Declare rooms
roomFoyer = new GameRoom("foyer");
roomFoyer.desc = "You are in the foyer.";

roomLivingRoom = new GameRoom("living room");
roomLivingRoom.desc = "You are in the living room."

// Connect rooms
roomFoyer.exits = [ new RoomExit(roomLivingRoom) ];
roomLivingRoom.exits = [ new RoomExit(roomFoyer) ];

// Add room objects
sponge = new GameObject("sponge");
sponge.desc = "It is yellow and porous."
roomFoyer.objects = [ sponge ];

// Set initial game state
gameObj['initialRoom'] = roomFoyer;

