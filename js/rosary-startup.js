function rosary_start() {
  console.log("Rosary starting!");
  load_initial_game_state();
}

function load_initial_game_state() {
  startInitialRoom(gameObj["initialRoom"]);
}

