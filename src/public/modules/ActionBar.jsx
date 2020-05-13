class ActionBar extends React.Component{
  constructor(props){
    super(props)
    this.state={
      
    }
  }
  render(){
    <div className="action-bar">
      
    </div>
  }
}

function PickChancellor(props){
  return (
    <div className="action pick-chancellor">
      <button className={!this.props.selected ? "disabled" : ""} onClick={this.props.confirm}>Pick {this.props.selected || ""}</button>
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
      this.props.confirm("vote", isJa);
    }
  }
  render(){
    return (
      <div className="action ja-nein">
        <button onClick={this.setJa} className={"ja " + isJa ? "selected" : ""}>Ja</button>
        <button onClick={this.setNein} className={"nein " + !isJa ? "selected" : ""}>Nein</button>
        <button onClick={this.props.tryConfirm} className="nein">Cast Vote</button>
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

export {ActionBar};