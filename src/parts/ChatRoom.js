import React from 'react'
import SingleInputForm from './SingleInputForm';
export default class ChatRoom extends React.Component{
  constructor(props){
    super(props);
    this.state={
      message: "",
      messages: [],
    }
    this.MAX_LENGTH = 120;
    this.postChat = this.postChat.bind(this)
    this.sendChat = this.sendChat.bind(this)
  }
  componentDidMount(){
    this.props.socket.on('chat recv msg', (arg)=>this.postChat(arg.msg));
  }
  postChat(msg){
    const messages = this.state.messages;
    let sentWindow = this.refs.sent;
    this.setState({
      messages: messages.concat([msg]),
    })
    sentWindow.scrollTo({behavior: "smooth", top: sentWindow.scrollHeight});
  }

  sendChat(message){
    if(message == ''){
      return false
    };
    let msg = {
      username: this.props.username,
      message: message,
    }
    this.props.socket.emit('chat send msg', {msg: msg});
    return true
  }
  render(){
    let chats = this.state.messages.map((msg, i)=>(
      <div className="message">
        <p key={i}>
          <strong>{msg.username}: </strong>{msg.message}
        </p>
        <hr/>
      </div>
    ));
    return(
      <div className="chat-window">
        <h3>Chat</h3>
        <div ref="sent" className="sent-messages">
          {chats}
        </div>
        {!this.props.spectating && (
          <SingleInputForm className="chat-input" button="Send"
           MAX_LENGTH={this.MAX_LENGTH} submit={this.sendChat}/>
        )}
      </div>
    )
  }
}