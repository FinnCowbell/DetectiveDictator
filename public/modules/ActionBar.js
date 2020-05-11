export default class ActionBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    React.createElement("div", { className: "action-bar" });
  }
}

function PickChancellor(props) {
  return React.createElement(
    "div",
    { className: "action pick-chancellor" },
    React.createElement(
      "button",
      { className: !this.props.selected ? "disabled" : "", onClick: this.props.confirm },
      "Pick ",
      this.props.selected || ""
    )
  );
}

class JaNein extends React.Component {
  //JaNein holds its own internal state: Nothing needs its data until its ready.
  constructor(props) {
    super(props);
    this.state = {
      isJa: null //Null means the vote hasnt been cast yet.
    };
    this.setJa = this.setJa.bind(this);
    this.setNein = this.setNein.bind(this);
    this.tryConfirm = this.tryConfirm.bind(this);
  }
  setJa() {
    if (this.state.isJa !== true) {
      this.setState({ isJa: true });
    }
  }
  setNein() {
    if (this.state.isJa !== false) {
      this.setState({ isJa: false });
    }
  }
  tryConfirm() {
    const isJa = this.state.isJa;
    if (isJa === null) {
      return;
    } else {
      this.props.confirm("vote", isJa);
    }
  }
  render() {
    return React.createElement(
      "div",
      { className: "action ja-nein" },
      React.createElement(
        "button",
        { onClick: this.setJa, className: "ja " + isJa ? "selected" : "" },
        "Ja"
      ),
      React.createElement(
        "button",
        { onClick: this.setNein, className: "nein " + !isJa ? "selected" : "" },
        "Nein"
      ),
      React.createElement(
        "button",
        { onClick: this.props.tryConfirm, className: "nein" },
        "Cast Vote"
      )
    );
  }
}

class DiscardPresident extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedCard: null //Will be 0, 1 or 2. 
    };
    this.selectCard = this.selectCard.bind(this);
    this.trySubmit = this.trySubmit.bind(this);
  }
  selectCard(i) {
    if (i < 0 || i > 2) {
      return;
    };
    this.setState({ selectedCard: i });
  }
  trySubmit() {
    const selectedCard = this.state.selectedCard;
    if (selectedCard !== null) {
      this.props.submit('discard-president', selectedCard);
    }
  }
  render() {
    return React.createElement(
      "div",
      { className: "action discard-president" },
      React.createElement("div", { className: "three-cards" }),
      React.createElement(
        "button",
        { onClick: this.trySubmit },
        "Discard"
      )
    );
  }
}

class DiscardChancellor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedCard: null //Will be 0, 1 or 2. 
    };
    this.selectCard = this.selectCard.bind(this);
    this.trySubmit = this.trySubmit.bind(this);
  }
  selectCard(i) {
    if (i < 0 || i > 1) {
      return;
    };
    this.setState({ selectedCard: i });
  }
  trySubmit() {
    const selectedCard = this.state.selectedCard;
    if (selectedCard !== null) {
      this.props.submit('discard-chancellor', selectedCard);
    }
  }
  render() {
    return React.createElement(
      "div",
      { className: "action discard-chancellor" },
      React.createElement("div", { className: "two-cards" }),
      React.createElement(
        "button",
        { onClick: this.trySubmit },
        "Discard"
      )
    );
  }
}

function PickPresident(props) {
  //Requires: this.props.selected = Name of selected player.
  //this.props.confirm = lock in answer.
  return React.createElement(
    "div",
    { className: "action pick-president" },
    React.createElement(
      "button",
      { className: !this.props.selected ? "disabled" : "", onClick: this.props.confirm },
      "Pick ",
      this.props.selected || ""
    )
  );
}

function ViewTopThree(props) {
  return React.createElement(
    "div",
    { className: "action view-three" },
    React.createElement("div", { className: "three-cards" }),
    React.createElement(
      "button",
      { onClick: this.props.confirm },
      "Continue"
    )
  );
}

function ViewMembership(props) {
  let textClass = "liberal";
  if (this.props.party == 1) {
    textClass = "fascist";
  }
  return React.createElement(
    "div",
    { className: "action view-membership" },
    React.createElement(
      "div",
      { className: textClass },
      this.props.party
    ),
    React.createElement(
      "button",
      { onClick: this.props.confirm },
      "Continue"
    )
  );
}

function Murder(props) {
  return React.createElement(
    "div",
    { className: "action murder" },
    React.createElement(
      "button",
      { className: !this.props.selected ? "disabled" : "",
        onClick: this.props.confirm },
      this.props.selected ? "Murder " + this.props.selected : "Choose A Target"
    )
  );
}