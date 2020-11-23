import React from "react";
import SingleInputForm from "./SingleInputForm";
export default class ChatRoom extends React.Component {
  constructor(props) {
    super(props);
    this.sent = React.createRef();
    this.state = {
      position: "closed",
      messages: [],
      newChat: false,
      notifyClass: "",
    };
    this.MAX_LENGTH = 120;
    this.postChat = this.postChat.bind(this);
    this.sendChat = this.sendChat.bind(this);
    this.setMessages = this.setMessages.bind(this);
    this.toggleWindow = this.toggleWindow.bind(this);
  }
  componentDidMount() {
    let socket = this.props.socket;
    socket.on("chat incoming", (arg) => this.postChat(arg));
    socket.on("full chat history", (chats) => this.setMessages(chats));
    socket.emit("full chat request");
  }

  setMessages(newMessages) {
    this.setState({
      messages: newMessages,
    });
  }

  toggleWindow() {
    const oldPos = this.state.position;
    this.setState({
      position: oldPos == "open" ? "closed" : "open",
      notifyClass: "",
    });
  }

  postChat(msg) {
    const messages = this.state.messages;
    let sentWindow = this.sent.current;
    let notify = this.state.notifyClass;
    if (this.state.position == "closed") {
      notify = "notify";
    }
    this.setState({
      messages: messages.concat([msg]),
      notifyClass: notify,
    });
    sentWindow.scrollTo({ behavior: "smooth", top: sentWindow.scrollHeight });
  }

  sendChat(message) {
    if (message == "") {
      return false;
    }
    this.props.socket.emit("chat send", { message: message });
    return true;
  }

  render() {
    let chats = this.state.messages.map((msg, i) => (
      <div key={i} className="message">
        <p>
          <strong>{msg.username}: </strong>
          {msg.message}
        </p>
        <hr />
      </div>
    ));
    let position = this.state.position;
    let spectating = this.props.spectating;
    let notifyClass = this.state.notifyClass;
    return (
      <div className={`chat-window ${this.state.position}`}>
        <h3>Chat</h3>
        <div ref={this.sent} className="sent-messages">
          {chats}
        </div>
        {!this.props.spectating && (
          <SingleInputForm
            className="chat-input"
            button="Send"
            MAX_LENGTH={this.MAX_LENGTH}
            submit={this.sendChat}
          />
        )}
        <button
          className={`toggle-button ${notifyClass}`}
          onClick={this.toggleWindow}
        >
          {this.state.position == "open" ? "Close" : "Open"} Chat
        </button>
      </div>
    );
  }
}
