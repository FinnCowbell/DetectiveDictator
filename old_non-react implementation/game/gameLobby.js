var returnBox = document.getElementById("join-lobby");
var errorBox = document.getElementById("error-box");
var loadingText = document.getElementById("loading-lobby");
var lobbyNameField = document.getElementById("lobbyName");
var lobbyNameField = document.getElementById("lobbyName");
var newUsersBox = document.getElementById("new-user");
var availableUsersBox = document.getElementById("available-users");
var newUserConnect = document.getElementById("new-user-connect");
var usernameField = document.getElementById("name-field");
const lobbyID = window.location.pathname.split("/")[2]; // pathname is /lobby/words/, so words are in index 2.
socket = io('/'+lobbyID);
// console.log(socket);
//Unique Player ID
if(!document.cookie || document.cookie == "undefined"){ //"undefined for manual resets"
  document.cookie = Math.floor(Math.random() * 999999999999);;
}
var PID = document.cookie;
console.log("Player ID:" + PID);

setTimeout(function(){
  if(!socket.connected){
    loadingText.style.display = "none";
    errorBox.style.display = "block";
  }
},500);
//If we don't connect in .5 seconds, assume we wont.

socket.on('lobby found', (theLobby) =>{
  loadingText.style.display = "none";
  if(theLobby){
    lobbyNameField.innerHTML = theLobby.lobbyID;
    returnBox.style.display = "block";
    if(theLobby.gameRunning){
      availableUsersBox.style.display = "block";
      //Show buttons for each disconnected user, put that logic here.
    }else{
      newUsersBox.style.display = "block"
    }
  }
})


newUserConnect.onclick = function(){
  let username = usernameField.value;
  socket.emit("join lobby", {"username": username, "PID": PID});
}