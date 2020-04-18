var returnBox = document.getElementById("return-box");
var loadingText = document.getElementById("loading-lobby");
var lobbyNameField = document.getElementById("lobbyName");
const lobbyID = window.location.pathname.split("/")[2]; // pathname is /lobby/words/, so words are in index 2.
console.log(lobbyID);
socket = io();
//Give the user a "unique" Player ID.
if(!document.cookie){
  document.cookie = Math.floor(Math.random() * 999999999999);;
}
var PID = document.cookie;
console.log(PID);

lobbyParams = {
  'PID': PID,
  'lobbyID': lobbyID
};

socket.emit("find lobby", lobbyParams);

socket.on('lobby found', (theLobby) =>{
  loadingText.style.display = "none";
  if(theLobby){
    lobbyNameField.innerHTML = theLobby.ID;
    returnBox.style.display = "block";
  } else{
    lobbyNameField.innerHTML = "error!";
    returnBox.style.display = "block";
  }
})