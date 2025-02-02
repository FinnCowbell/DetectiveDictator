import React, { useRef, useState } from "react";
import eye from "../../media/eye.png";
import { css } from "../../helpers/css";

export const Eye: React.FC<{ toggle: (arg: boolean) => void }> = ({ toggle }) => {
  // toggle(true) is called after the button has been held for more than 500ms. 
  // toggle(false) is called after the button has been released.

  const [pressed, setPressed] = useState(false);
  const [holding, setHolding] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  const handleMouseDown = React.useCallback(() => {
    setPressed(true);
    timeout.current = setTimeout(() => {
      setHolding(true);
      toggle(true);
    }, 400);
  }, []);
  const handleMouseUp = React.useCallback(() => {
    clearTimeout(timeout.current);
    toggle(false);
    setPressed(false);
    setHolding(false);
  }, []);

  return (
    <div
      className={css('eye', { 'holding': holding, 'pressed': !holding && pressed })}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onTouchStart={handleMouseDown}
    >
      <div>
        <img draggable={false} src={eye} />
      </div>
    </div>
  );
};