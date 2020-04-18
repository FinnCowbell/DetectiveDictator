socket = io('/menu');
//Give the user a "unique" Player ID.
if(!document.cookie || document.cookie == "undefined"){ //"undefined for manual resets"
  document.cookie = Math.floor(Math.random() * 999999999999);;
}
var PID = document.cookie;
console.log(PID);

createGameButton = document.getElementById("create-game");
createGameButton.onclick = function(){
  socket.emit("create game");
  document.getElementById("loading").style.display = "block";
}

socket.on("game created", (arg)=>{
  console.log(arg);
  window.location.href = "/lobby/" + arg.ID;
})