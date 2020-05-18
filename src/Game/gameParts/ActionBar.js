import React from 'react'
import liberalPolicy from '../media/liberal-policy.png';
import fascistPolicy from '../media/fascist-policy.png';

export default class ActionBar extends React.Component{
  constructor(props){
    super(props)
    this.socket = this.props.socket;
    // this.confirmAction = this.confirmAction.bind(this);
    this.pickChancellor = this.pickChancellor.bind(this);
    this.discardPolicy = this.discardPolicy.bind(this);
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
    if(isJa == null){
      return;
    }
    this.socket.emit('cast vote', {vote: isJa});
  }
  discardPolicy(policyIndex){
    if(policyIndex == null){
      return;
    }
    if(this.props.action == "your president discard"){
      this.socket.emit('president discarding', {policyIndex : policyIndex});
    } else if (this.props.action == "your chancellor discard"){
      this.socket.emit('chancellor discarding', {policyIndex : policyIndex});
    }
  }
  // confirmAction(){
  //   switch(this.props.action){
  //     case 'your chancellor pick':
  //       this.pickChancellor()
  //       break;
  //     case 'chancellor vote':
  //       this.castVote();
  //       break;
  //     default:
  //       console.log("Error: Unimplemented Action Submission.")
  //   }
  // }
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
        content = (
          <DiscardPresident
            confirm={this.discardPolicy} 
            policies={this.props.event.details.secret.policies}/>
        );
        break;
      case 'your chancellor discard':
        content = (
          <DiscardChancellor 
            confirm={this.discardPolicy} 
            policies={this.props.event.details.secret.policies}/>
        );
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
      <div className="action discard-president">
        <div className="policy-cards">
          {cards}
          <div className="discard-button" onClick={this.trySubmit}>
            <h2>
              Discard
            </h2>
          </div>
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
      <div className="action discard-president">
        <div className="policy-cards">
          {cards}
          <div className="discard-button" onClick={this.trySubmit}>
            <h2>
              Discard
            </h2>
          </div>
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