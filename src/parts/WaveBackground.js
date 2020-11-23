import React from "react";

export default function WaveBackground(props) {
  return (
    <div className={"wave-background" + (props.toggle ? " fade" : "")}>
      <div className="gradient"></div>
    </div>
  );
}
