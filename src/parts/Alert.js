import React, { useEffect, useState } from "react";
import { useGameContext } from "../AppContext";

export const Alert = () => {
  const { alertMessage, setAlertMessage } = useGameContext();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (alertMessage != '') {
      setIsOpen(true);
    }
  }, [alertMessage]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
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