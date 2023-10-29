import React, { useEffect, useRef, useState } from "react";
import { useGameContext } from "../AppContext";

export const Alert = () => {
  const { alertMessage, setAlertMessage } = useGameContext();
  const [isOpen, setIsOpen] = useState(false);
  const interval = useRef(null);

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