import React, { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../SocketContext";

export const Alert = () => {
  const { alertMessage, setAlertMessage: _setAlertMessage } = useSocketContext();
  const [isOpen, setIsOpen] = useState(false);
  const interval = useRef<NodeJS.Timeout | undefined>(undefined);

  const setAlertMessage = React.useCallback((msg: string) => {
    if (msg === '') {
      setIsOpen(false);
      setTimeout(() => {
        _setAlertMessage('');
      }, 200)
    } else {
      _setAlertMessage(msg);
    }
  }, [_setAlertMessage]);

  useEffect(() => {
    if (alertMessage != '') {
      setIsOpen(true);
    }
  }, [alertMessage]);

  useEffect(() => {
    if (isOpen && alertMessage != '') {
      clearInterval(interval.current);
      interval.current = setTimeout(() => {
        setAlertMessage('');
      }, 5000)
    }
  }, [isOpen, setIsOpen, setAlertMessage])

  return (
    <div className={`alert-bar ${!isOpen ? "closed" : ""}`}>
      <h2 className="alert-message">{alertMessage}</h2>
    </div>
  );
}