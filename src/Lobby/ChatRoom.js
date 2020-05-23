import React from 'react'
export default class ChatRoom extends React.Component{
  constructor(props){
    super(props)
    this.state={
      message: "",
      messages: [],
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.postChat = this.postChat.bind(this)
    this.sendChat = this.sendChat.bind(this)
  }
  componentDidMount(){
    this.props.socket.on('chat recv msg', (arg)=>this.postChat(arg.msg));
  }
  handleSubmit(e){
    if(e.keyCode == 13){
      this.sendChat(this.state.message);
    }
  }
  handleChange(e){
    this.setState({message: e.target.value})
  }
  postChat(msg){
    const messages = this.state.messages;
    this.setState({
      messages: messages.concat([msg]),
    })
  }
  sendChat(){
    if(this.state.message == ''){return};
    let msg = {
      username: this.props.username,
      message: this.state.message,
    }
    this.props.socket.emit('chat send msg', {msg: msg});
    this.setState({
      message: ""
    });
  }
  render(){
    let chats = this.state.messages.map((msg, i)=>(
      <p key={i} className="message">
        <strong>{msg.username}: </strong>{msg.message}
      </p>
    ));
    return(
      <div className="chat-window">
        <h3>Chat</h3>
        <input className="chat-input" value={this.state.message} onKeyDown={this.handleSubmit} onChange={this.handleChange}/>
        <button onClick={this.sendChat}>Send</button>
        <div className="sent-messages">
          {chats}
        </div>
      </div>
    )
  }
}