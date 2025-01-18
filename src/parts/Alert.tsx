import React, { useEffect, useRef, useState } from "react";
import { useLobbyContext } from "../LobbyContext";

export const Alert = () => {
  const { alertMessage, setAlertMessage } = useLobbyContext();
  const [isOpen, setIsOpen] = useState(false);
  const interval = useRef<NodeJS.Timeout |undefined>();

  useEffect(() => {
    if (alertMessage != '') {
      setIsOpen(true);
    }
  }, [alertMessage]);

  useEffect(() => {
    if (isOpen && alertMessage != '') {
      clearInterval(interval.current);
      interval.current = setTimeout(() => {
        setIsOpen(false)
        setTimeout(() => {
          setAlertMessage('');
        }, 200)
      }, 5000)
    }
  }, [isOpen, setIsOpen, setAlertMessage])

  return (
    <div className={`alert-bar ${!isOpen ? "closed" : ""}`}>
      <h2 className="alert-message">{alertMessage}</h2>
    </div>
  );
}