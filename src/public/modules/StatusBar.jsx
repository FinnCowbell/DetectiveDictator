function StatusBar(props){
  //Will be a bunch of Strings with values to fill in based on our event name.
  let gameStatus;
  return(
    <div className="status-bar">
      <h2 className="status">
        {gameStatus}
      </h2>
    </div>
  );
}
export {StatusBar};