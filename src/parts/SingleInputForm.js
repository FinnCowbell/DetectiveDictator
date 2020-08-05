import React from "react";

export default class SingleInputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
    };
    this.DEFAULT_MAX_LENGTH = 240;
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  handleSubmit(e) {
    if (!e || (e && e.keyCode == 13)) {
      this.props.submit(this.state.text);
      this.setState({ text: "" });
    }
  }
  handleChange(e) {
    let text = e.target.value;
    const MAX_LENGTH = this.props.MAX_LENGTH || this.DEFAULT_MAX_LENGTH;
    if (text.length > MAX_LENGTH) {
      //Truncate anything that's pasted to the first MAX_LENGTH characters.
      text = text.split("").splice(0, MAX_LENGTH).join("");
      //Also add the "error" animation to the textbox for a second.
      this.refs.input.classList.add("error");
    } else {
      this.refs.input.classList.remove("error");
    }
    this.setState({ text: text });
  }
  render() {
    return (
      <div
        ref="input"
        className={`single-input-form ${this.props.className || ""}`}
      >
        {this.props.children}
        <input
          className="input-box"
          value={this.state.text}
          onKeyDown={this.handleSubmit}
          onChange={this.handleChange}
        />
        {this.props.button && (
          <button onClick={() => this.handleSubmit()}>
            {this.props.button}
          </button>
        )}
      </div>
    );
  }
}
