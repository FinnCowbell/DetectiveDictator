import React from "react";

interface SingleInputFormProps {
  className?: string;
  button?: string;
  MAX_LENGTH?: number;
  submit: (text: string) => void;
  children?: React.ReactNode;
}


const SingleInputForm: React.FC<SingleInputFormProps> = ({ className, button, MAX_LENGTH, submit, children }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const DEFAULT_MAX_LENGTH = 240;
  const [text, setText] = React.useState("");

  const handleSubmit = (e?: React.KeyboardEvent) => {
    if (!e || (e && e.keyCode == 13)) {
      submit(text);
      setText("");
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value;
    MAX_LENGTH = MAX_LENGTH || DEFAULT_MAX_LENGTH;
    if (text.length > MAX_LENGTH) {
      // Truncate anything that's pasted to the first MAX_LENGTH characters.
      text = text.split("").splice(0, MAX_LENGTH).join("");
      // Also add the "error" animation to the textbox for a second.
      containerRef.current?.classList.add("error");
    } else {
      containerRef.current?.classList.remove("error");
    }
    setText(text);
  }

  return (
    <div
      ref={containerRef}
      className={`single-input-form ${className || ""}`}
    >
      <div onClick={() => inputRef.current?.focus()}>
        {children}
      </div>
      <input
        ref={inputRef}
        className="input-box"
        value={text}
        onKeyDown={handleSubmit}
        onChange={handleChange}
        type="text"
        // Prevents edge autocomplete.
        autoComplete="new-password"
        list="autocompleteOff"
      />
      {button && (
        <button onClick={() => handleSubmit()}>
          {button}
        </button>
      )}
    </div>
  );
}

export default SingleInputForm;