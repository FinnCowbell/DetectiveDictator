import React from 'react'
export default class ActionBar extends React.Component{
  constructor(props){
    super(props)
    this.socket = this.props.socket;
    this.confirmAction = this.confirmAction.bind(this);
    this.pickChancellor = this.pickChancellor.bind(this);
    this.castVote = this.castVote.bind(this);
  }
  pickChancellor(){
    let socket = this.socket;
    let selectedPlayer = this.props.selectedPlayer;
    socket.emit('chancellor picked', {
      pickedChancellor: selectedPlayer,
    });
  }
  castVote(isJa = null){
    let socket = this.socket;
    if(isJa == null){
      return;
    } else{
      console.log("voted " + isJa);
      socket.emit('cast vote', {vote: isJa})
    }
  }
  confirmAction(){
    switch(this.props.action){
      case 'your chancellor pick':
        this.pickChancellor()
        break;
      case 'chancellor vote':
        this.castVote();
        break;
      default:
        console.log("Error: Unimplemented Action Submission.")
    }
  }
  render(){
    let content;
    switch(this.props.action){
      case 'your chancellor pick':
        let selectedPlayer =  this.props.players[this.props.selectedPlayer] || null;
        let selectedUsername = selectedPlayer && selectedPlayer.username;
        content = (<PickChancellor
          selected={this.props.selectedPlayer}
          confirm={this.pickChancellor}
          username={selectedUsername}
        />)
        break;
      case 'chancellor vote':
        content = (
          <JaNein confirm={this.castVote} />
        )
        break;
      case 'your president discard':
        break;
      case 'your chancellor discard':
      default:
        content = (
          <div className="action empty"></div>
        )
        break;
    }
    return(
    <div className="action-bar-container">
      <div className="action-bar">
        {content}
      </div>
    </div>
    )
  }
}

function PickChancellor(props){
  return (
    <div className="action pick-chancellor">
      <button className={!props.selected ? "disabled" : ""} onClick={props.confirm}>{props.username ? `Pick ${props.username}` : ""}</button>
    </div>
  )
}

class JaNein extends React.Component{
  //JaNein holds its own internal state: Nothing needs its data until its ready.
  constructor(props){
    super(props)
    this.state={
      isJa: null, //Null means the vote hasnt been cast yet.
    }
    this.setJa = this.setJa.bind(this);
    this.setNein = this.setNein.bind(this);
    this.tryConfirm = this.tryConfirm.bind(this);
  }
  setJa(){
    if(this.state.isJa !== true){
      this.setState({isJa: true});
    }
  }
  setNein(){
    if(this.state.isJa !== false){
      this.setState({isJa: false});
    }
  }
  tryConfirm(){
    const isJa = this.state.isJa;
    if(isJa === null){
      return;
    } else{
      this.props.confirm(isJa);
    }
  }
  render(){
    let isJa = this.state.isJa;
    return (
      <div className="action ja-nein">
        <button onClick={this.setJa} className={"ja " + (isJa ? "selected" : "")}>Ja</button>
        <button onClick={this.setNein} className={"nein " + (!isJa ? "selected" : "")}>Nein</button>
        <button onClick={this.tryConfirm} className="nein">Cast Vote</button>
      </div>
    )
  }
}

class DiscardPresident extends React.Component{
  constructor(props){
    super(props)
    this.state={
      selectedCard: null //Will be 0, 1 or 2. 
    }
    this.selectCard = this.selectCard.bind(this);
    this.trySubmit = this.trySubmit.bind(this);
  }
  selectCard(i){
    if(i < 0 || i > 2){return;};
    this.setState({selectedCard: i});
  }
  trySubmit(){
    const selectedCard = this.state.selectedCard
    if(selectedCard !== null){
      this.props.submit('discard-president',selectedCard)
    }
  }
  render(){
    return (
      <div className="action discard-president">
        <div className="three-cards">
          {/* Map over the cards. Perhaps cards should have a handleClick passed to them.*/}
        </div>
        <button onClick={this.trySubmit}>Discard</button>
      </div>
    )
  }
}

class DiscardChancellor extends React.Component{
  constructor(props){
    super(props)
    this.state={
      selectedCard: null //Will be 0, 1 or 2. 
    }
    this.selectCard = this.selectCard.bind(this);
    this.trySubmit = this.trySubmit.bind(this);
  }
  selectCard(i){
    if(i < 0 || i > 1){return;};
    this.setState({selectedCard: i});
  }
  trySubmit(){
    const selectedCard = this.state.selectedCard
    if(selectedCard !== null){
      this.props.submit('discard-chancellor',selectedCard)
    }
  }
  render(){
    return (
      <div className="action discard-chancellor">
        <div className="two-cards">
        {/* Map over the cards. */}
        </div>
        <button onClick={this.trySubmit}>Discard</button>
      </div>
    )
  }
}

function PickPresident(props){
  //Requires: this.props.selected = Name of selected player.
  //this.props.confirm = lock in answer.
  return (
    <div className="action pick-president">
      <button className={!this.props.selected ? "disabled" : ""} onClick={this.props.confirm}>Pick {this.props.selected || ""}</button>
    </div>
  )
}

function ViewTopThree(props){
  return(
    <div className="action view-three">
      <div className="three-cards">
        {/* TODO: add card classes. */}
      </div>
      <button onClick={this.props.confirm}>Continue</button>
    </div>
  )
}

function ViewMembership(props){
  let textClass = "liberal";
  if(this.props.party == 1){
    textClass = "fascist"
  }
  return(
    <div className="action view-membership">
      <div className={textClass}>
        {this.props.party}
      </div>
      <button onClick={this.props.confirm}>Continue</button>
    </div>
  )
}

function Murder(props){
  return (
    <div className="action murder">
      <button className={!this.props.selected ? "disabled" : ""} 
              onClick={this.props.confirm}>
              {this.props.selected ? "Murder " + this.props.selected : "Choose A Target"}
      </button>
    </div>
  )
}