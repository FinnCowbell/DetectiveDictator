import React, { RefObject } from "react";

interface SingleInputFormProps {
  className?: string;
  button?: string;
  MAX_LENGTH?: number;
  submit: (text: string) => void;
  children?: React.ReactNode;
}

interface SingleInputFormState {
  text: string;
}

export default class SingleInputForm extends React.Component<SingleInputFormProps, SingleInputFormState> {
  input: RefObject<HTMLDivElement>;
  DEFAULT_MAX_LENGTH: number;

  constructor(props: SingleInputFormProps) {
    super(props);
    this.input = React.createRef();
    this.state = {
      text: "",
    };
    this.DEFAULT_MAX_LENGTH = 240;
  }

  public handleSubmit = (e?: React.KeyboardEvent) => {
    if (!e || (e && (e as React.KeyboardEvent).keyCode == 13)) {
      this.props.submit(this.state.text);
      this.setState({ text: "" });
    }
  }

  public handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value;
    const MAX_LENGTH = this.props.MAX_LENGTH || this.DEFAULT_MAX_LENGTH;
    if (text.length > MAX_LENGTH) {
      // Truncate anything that's pasted to the first MAX_LENGTH characters.
      text = text.split("").splice(0, MAX_LENGTH).join("");
      // Also add the "error" animation to the textbox for a second.
      this.input.current?.classList.add("error");
    } else {
      this.input.current?.classList.remove("error");
    }
    this.setState({ text: text });
  }

  render() {
    return (
      <div
        ref={this.input}
        className={`single-input-form ${this.props.className || ""}`}
      >
        {this.props.children}
        <input
          className="input-box"
          value={this.state.text}
          onKeyDown={this.handleSubmit}
          onChange={this.handleChange}
          type="text"
          // Prevents edge autocomplete.
          autoComplete="new-password"
          list="autocompleteOff" 
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
