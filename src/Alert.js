import React from 'react';
export default class Alert extends React.Component{
  constructor(props){
    super(props);
    this.state={
      previousState: false,
      open: false,
    }
    this.closeStatus = this.closeStatus.bind(this);
  }
  closeStatus(){
    this.setState({
      open: false,
    })
  }
  openStatus(){
    this.setState({
      open: true,
    })
  }
  componentDidUpdate(){ 
    if(this.state.previousState != this.props.toggledState){
      this.openStatus();
      this.setState((state, props)=>({
        previousState: props.toggledState,
      }));
      setTimeout(this.closeStatus,5000);
    }
  }
  render(){
    let open = this.state.open;
    return(
      <div className={`alert-bar ${!open ? "closed" : ""}`}>
        <h2 className="alert-message">
          {this.props.children}
        </h2>
        <button className="x" onClick={this.closeStatus}>
          X
        </button>
      </div>
    )
  }
}