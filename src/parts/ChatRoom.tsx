import React from "react";
import SingleInputForm from "./SingleInputForm";
import { useSocketContext } from "../SocketContext";
import { useGameDetails } from "../GameDetails";

interface ChatMessage {
  username: string;
  message: string;
}

const MAX_LENGTH = 120;

const ChatRoom: React.FC<{ isCard?: boolean }> = ({ isCard }) => {
  const { socket } = useSocketContext();
  const { spectating } = useGameDetails();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasNewChat, setHasNewChat] = React.useState(false);
  const sentRef = React.useRef<HTMLDivElement>(null);

  const postChat = React.useCallback((msg: ChatMessage) => {
    setMessages((prev) => prev.concat([msg]));
    const sentWindow = sentRef.current;
    setHasNewChat(true);
    sentWindow?.scrollTo({ behavior: "smooth", top: sentWindow?.scrollHeight });
  }, [isOpen]);

  const sendChat = React.useCallback((message: string) => {
    if (message == "") {
      return false;
    }
    socket.emit("chat send", { message: message });
    return true;
  }, [socket]);

  React.useEffect(() => {
    const events = {
      "chat incoming": (arg: ChatMessage) => postChat(arg),
      "full chat history": (chats: ChatMessage[]) => setMessages(chats),
    };
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    }
  }, [socket, postChat]);

  React.useEffect(() => {
    socket?.emit("full chat request");
  }, [socket]);

  const chats = React.useMemo(() => messages.map((msg, i) => (
    <div key={i} className="message">
      <p>
        <strong>{msg.username}: </strong>
        {msg.message}
      </p>
      <hr />
    </div>
  )), [messages]);

  return (
    <div className={`chat-window ${isOpen ? "open" : "closed"} ${isCard ? "card" : ""}`}>
      <h3>Chat</h3>
      <div ref={sentRef} className="sent-messages">
        {chats}
      </div>
      {!spectating && (
        <SingleInputForm
          className="chat-input"
          button="Send"
          MAX_LENGTH={MAX_LENGTH}
          submit={sendChat}
        />
      )}
      <button
        className={`toggle-button ${hasNewChat ? 'notify' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Close" : "Open"} Chat
      </button>
    </div>
  );
};

export default ChatRoom;
