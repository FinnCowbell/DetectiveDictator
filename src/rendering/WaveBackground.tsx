import React from "react";

interface WaveBackgroundProps {
  toggle: boolean;
}

export default function WaveBackground(props: WaveBackgroundProps) {
  return (
    <div className={"wave-background" + (props.toggle ? " fade" : "")}>
      <div className="gradient"></div>
    </div>
  );
}
