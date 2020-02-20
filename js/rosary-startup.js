function rosary_start() {
  console.log("Rosary starting!");
  load_initial_game_state();
}

function load_initial_game_state() {
  room = gameState["currentRoom"];

  displayString = room.desc;
  displayString += "\n\n";
  displayString += "Exits are: ";
  for (i = 0; i < room.exits.length; ++i) {
      displayString += room.exits[i].shortName + ", ";
  }

  display = document.getElementById("gameDisplay");
  display.innerHTML = displayString;
}

