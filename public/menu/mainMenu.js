socket = io();
//Give the user a "unique" Player ID.
if(!document.cookie){
  document.cookie = Math.floor(Math.random() * 999999999999);;
}
var PID = document.cookie;
console.log(PID);

createGameButton = document.getElementById("create-game");
createGameButton.onclick = function(){
  // console.log("Sending Game Creation");
  socket.emit("create game",{"PID": PID});
  //Show loading div
  document.getElementById("loading").style.display = "block";
}

socket.on("game created", (arg)=>{
  console.log(arg);
  if(arg.PID == PID){
    window.location.href = "/lobby/" + arg.ID;
  }
})