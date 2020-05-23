import React from 'react';
export default class Status extends React.Component{
  constructor(props){
    super(props);
    this.state={
      open: false,
      message: this.props.message || null,
    }
    this.closeStatus = this.closeStatus.bind(this);
  }
  closeStatus(){
    this.setState({
      open: false,
    })
  }
  componentDidUpdate(){
    if(this.props.message != this.state.message ){
      let message = this.props.message
      this.setState({
        open: true,
        message: message,
      })
      setTimeout(this.closeStatus,5000);
    }
  }
  render(){
    let open = this.state.open;
    return(
      <div className={`alert-bar ${!open ? "closed" : ""}`}>
        <h2 className="alert-message">
          {this.state.message}
        </h2>
        <button className="x" onClick={this.closeStatus}>
          X
        </button>
      </div>
    )
  }
}