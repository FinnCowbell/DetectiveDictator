class ChatRoom extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.state = {
      message: "",
      messages: []
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.postChat = this.postChat.bind(this);
    this.sendChat = this.sendChat.bind(this);
  }
  componentDidMount() {
    this.socket.on('chat recv msg', arg => this.postChat(arg.msg));
  }
  handleSubmit(e) {
    if (e.keyCode == 13) {
      console.log('handling!');
      this.sendChat(this.state.message);
    }
  }
  handleChange(e) {
    this.setState({ message: e.target.value });
  }
  postChat(msg) {
    const messages = this.state.messages;
    this.setState({
      messages: messages.concat([msg])
    });
  }
  sendChat() {
    if (this.state.message == '') {
      return;
    };
    let msg = {
      username: this.props.you.username,
      message: this.state.message
    };
    this.socket.emit('chat send msg', { msg: msg });
    this.setState({
      message: ""
    });
  }
  render() {
    let chats = this.state.messages.map((msg, i) => React.createElement(
      'p',
      { key: i, className: 'message' },
      React.createElement(
        'strong',
        null,
        msg.username,
        ': '
      ),
      msg.message
    ));
    let chatBoxStyle = {
      overflow: 'scroll',
      height: '300px'
    };
    return React.createElement(
      'div',
      { style: { border: "1px solid black" }, className: 'chat-room' },
      React.createElement(
        'h3',
        null,
        'Chat'
      ),
      React.createElement('input', { className: 'chat-input', value: this.state.message, onKeyDown: this.handleSubmit, onChange: this.handleChange }),
      React.createElement(
        'button',
        { onClick: this.sendChat },
        'Send'
      ),
      React.createElement(
        'div',
        { style: chatBoxStyle, className: 'sent-messages' },
        chats
      )
    );
  }
}
export { ChatRoom };