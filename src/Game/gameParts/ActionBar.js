import React from 'react'
let liberalPolicy = './media/liberal-policy.png';
let fascistPolicy = './media/fascist-policy.png';
let liberalMembership = liberalPolicy;
let fascistMembership = fascistPolicy;
let ja = './media/ja.png';
let nein = './media/nein.png';

export default class ActionBar extends React.Component{
  constructor(props){
    super(props)
    // this.confirmAction = this.confirmAction.bind(this);
    this.pickPresident = this.pickPresident.bind(this);
    this.pickChancellor = this.pickChancellor.bind(this);
    this.discardPolicy = this.discardPolicy.bind(this);
    this.castVote = this.castVote.bind(this);
    this.viewPlayer = this.viewPlayer.bind(this);
    this.doneViewing = this.doneViewing.bind(this);
  }
  pickChancellor(){
    let socket = this.props.socket;
    let selectedPlayer = this.props.selectedPlayer;
    if(this.props.selectedPlayer != null){
      socket.emit('chancellor picked', {
        pickedChancellor: selectedPlayer,
      });
    }
  }
  castVote(isJa = null){
    if(isJa == null){
      return;
    }
    this.props.socket.emit('cast vote', {vote: isJa});
  }
  discardPolicy(policyIndex){
    if(policyIndex == null){
      return;
    }
    let actions = {
      "your president discard": (()=>this.props.socket.emit('president discarding', {policyIndex : policyIndex})),
      "your chancellor discard": (()=>this.props.socket.emit('chancellor discarding', {policyIndex : policyIndex})),
    }
    actions[this.props.action]();
  }
  //Executive Actions
  doneViewing(){
    this.props.socket.emit('president done');
  }
  viewPlayer(PID){
    if(PID != null){
      this.props.socket.emit('president investigate request', {investigatee: PID})
    }
  }
  pickPresident(){
    let selectedPlayer = this.props.selectedPlayer;
    if(this.props.selectedPlayer != null){
      this.props.socket.emit('president picked', {
        pickedPresident: selectedPlayer,
      });
    }
  }
  killPlayer(PID){
    let selectedPlayer = this.props.selectedPlayer;
    if(this.props.selectedPlayer != null){
      this.props.socket.emit('president kill request', {victim: PID})
    }
  }
  render(){
    let content;
    let details = this.props.event.details;
    let selectedPlayer =  this.props.players[this.props.selectedPlayer] || null;
    let selectedUsername = selectedPlayer && selectedPlayer.username;
    let uiInfo = this.props.uiInfo;
    switch(this.props.action){
      case 'your chancellor pick':
        content = (<PickPlayer
          verb="Pick"
          selected={this.props.selectedPlayer}
          confirm={this.pickChancellor}
          username={selectedUsername}
        />)
        break;
      case 'chancellor vote':
        content = (
          <JaNein confirm={this.castVote} voteReceived={uiInfo.voteReceived} />
        )
        break;
      case 'your president discard':
        content = (
          <DiscardPresident
            confirm={this.discardPolicy} 
            policies={details.secret.policies}/>
        );
        break;
      case 'your chancellor discard':
        content = (
          <DiscardChancellor 
            confirm={this.discardPolicy} 
            policies={details.secret.policies}/>
        );
        break;
      case 'your president peek':
        content = (
          <PresidentPeek
            policies={details.secret.policies}
            confirm={this.doneViewing}
          />
        )
        break;
      case 'your president pick':
        content = (
          <PickPlayer
            verb="Nominate"
            confirm={this.doneViewing}
            selected={this.props.selectedPlayer}
            confirm={this.pickPresident}
            username={selectedUsername}
          />
        )
        break;
      case 'your president kill':
        content = (
          // <div className="bullet"/>
          <PickPlayer
            verb="Murder"
            confirm={this.doneViewing}
            selected={this.props.selectedPlayer}
            confirm={()=>this.killPlayer(this.props.selectedPlayer)}
            username={selectedUsername}
          />
        )
        break;
      case 'your president investigate':
        //Reusing pick chancellor window.
        content = (
          <PickPlayer
            verb="Investigate"
            username={selectedUsername}
            selected={this.props.selectedPlayer}
            confirm={()=>this.viewPlayer(this.props.selectedPlayer)}
          />
        )
        break;
      case 'your president investigated':
        content = (
          <ViewMembership
            membership={details.secret.membership}
            confirm={this.doneViewing}
          />
        )
        break;
      case 'liberal win hitler':
      case 'liberal win cards':
      case 'fascist win hitler':
      case 'fascist win cards':
        content = (
          <LeaveGame
            leaveLobby={this.props.leaveLobby}/>
        )
        break;
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

function PickPlayer(props){
  let verb = props.verb;
  let username = props.username;
  return (
    <div className="action pick-player">
      <button className={"pick-button " + !props.selected ? "disabled" : ""} onClick={props.confirm}>
        <h1>
          {props.username ? `${verb} ${username}` : "Select a player"}
        </h1>
      </button>
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
    if(this.props.voteReceived){
      return(
        <div className="action ja-nein">
        <div className="vote-options">
        {isJa ? (
          <div className={`option`}>
            <img className={"selected"} src={ja}/>
          </div>
        ):(
          <div  className={`option`}>
            <img className={"selected"} src={nein}/>
          </div>
        )}
        </div>
      </div>        
      )
    }
    return (
      <div className="action ja-nein">
        <div className="vote-options">
          <div className={`option ${(isJa && this.props.voteReceived) ? "hidden" : ""}`}>
            <img className={isJa ? "selected" : ""} onClick={this.setJa} src={ja}/>
          </div>
          <div  className={`option  ${(!isJa && this.props.voteReceived) ? "hidden" : ""}`}>
            <img className={isJa === false ? "selected" : ""} onClick={this.setNein} src={nein}/>
          </div>
        </div>
        <button onClick={this.tryConfirm} className={`vote-button ${this.props.voteReceived ? "hidden" : ""}`}>
          <h2>
            Cast Vote
          </h2>
        </button>
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
    if(i < 0 || i > this.props.policies.length){return;};
    this.setState({selectedCard: i});
  }
  trySubmit(){
    const selectedCard = this.state.selectedCard
    if(selectedCard !== null){
      this.props.confirm(selectedCard)
    }
  }
  render(){
    let policyValues = this.props.policies;
    let cards = policyValues.map((value, index)=>(
      <PolicyCard
        key={index}
        isSelected={index == this.state.selectedCard}
        isFascist={value}
        onClick={()=>this.selectCard(index)}
      />
    ))
    return (
      <div className="action discard">
        <div className="policy-cards">
          {cards}
        </div>
        <div className="discard-button" onClick={this.trySubmit}>
          <h2>
            Discard
          </h2>
        </div>
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
    if(i < 0 || i > this.props.policies.length){return;};
    this.setState({selectedCard: i});
  }
  trySubmit(){
    const selectedCard = this.state.selectedCard
    if(selectedCard !== null){
      this.props.confirm(selectedCard)
    }
  }
  render(){
    let policyValues = this.props.policies;
    let cards = policyValues.map((value, index)=>(
      <PolicyCard
        key={index}
        isSelected={index == this.state.selectedCard}
        isFascist={value}
        onClick={()=>this.selectCard(index)}
      />
    ))
    return (
      <div className="action discard">
        <div className="policy-cards">
          {cards}
        </div>
        <div className="discard-button" onClick={this.trySubmit}>
          <h2>
            Discard
          </h2>
        </div>
      </div>
    )
  }
}

function PolicyCard(props){
  //Takes Select, Index, and isFascist.
  return(
  <div onClick={props.onClick} className={`policy ${props.isFascist ? "fascist" : "liberal"} ${props.isSelected ? "selected" : ""}`}>
    <img src={props.isFascist ? fascistPolicy : liberalPolicy}>
    </img>
  </div>
  )
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

function PresidentPeek(props){
  let policyValues = props.policies;
  let cards = policyValues.map((value, index)=>(
    <PolicyCard
      key={index}
      isSelected={false}
      isFascist={value}
    />
  ))
  return(
    <div className="action view-three">
      <div className="policy-cards">
        {cards}
      </div>
      <div className="continue-button" onClick={props.confirm}>
        <h2>Continue</h2>
      </div>
    </div>
  )
}
function ViewMembership(props){
  return(
    <div className="action membership">
      <div className="membership-card">
        <img src={props.membership ? liberalMembership : fascistMembership}/>
      </div>
      <div className="continue-button" onClick={props.confirm}>
        <h2>Continue</h2>
      </div>
    </div>
  )
}

function LeaveGame(props){
  return (
    <div className="action exit">
      <button className="leaveGame" onClick={props.leaveLobby}>
        <h2>Leave Lobby</h2>
      </button>
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