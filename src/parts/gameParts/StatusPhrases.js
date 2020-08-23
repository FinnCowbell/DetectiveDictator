//Status Phrases for Secret Hitler.
export default function getStatusPhrase(currentState, players) {
  let presidentName, chancellorName, investigatedName, victimName;
  if (players[currentState.presidentPID]) {
    presidentName = players[currentState.presidentPID].username;
  }
  if (players[currentState.chancellorPID]) {
    chancellorName = players[currentState.chancellorPID].username;
  }

  investigatedName = currentState.investigatedName;

  if (players[currentState.victim]) {
    victimName = players[currentState.victim].username;
  }
  const phrases = {
    "pre game": "Please wait, the game will begin shortly",
    "new round": "A new round has begun",
    "chancellor pick": `${presidentName} is picking a chancellor`,
    "your chancellor pick": "Pick Your Chancellor.",
    "chancellor vote": `Vote for President ${presidentName} and Chancellor ${chancellorName}.`,
    "chancellor not voted": "The vote didn't pass.",
    "your president discard": "Discard a Policy.",
    "president discard": `The vote passed and President ${presidentName} is discarding a policy.`,
    "your chancellor discard": "Discard a Policy.",
    "chancellor discard": `Chancellor ${chancellorName} is discarding a policy.`,
    "veto requested": `Chancellor ${chancellorName} has requested to veto!`,
    "your veto requested": "Your Chancellor has Requested a Veto.",
    "veto accepted": `President ${presidentName} has accepted the veto.`,
    "veto denied": "The Veto has been DENIED!",
    "liberal policy placed": "A Liberal policy has been placed.",
    "fascist policy placed": "A Fascist Policy has been Placed",
    "president peek": `President ${presidentName} is viewing the top 3 policy cards.`,
    "your president peek": "Take a peek. (Rightmost = Top Card)",
    "president investigate": `President ${presidentName} is picking someone to investigate.`,
    "your president investigate": "Pick someone to investigate.",
    "president investigated": `${presidentName} investigated ${investigatedName}.`,
    "your president investigated": `${presidentName} investigated ${investigatedName}.`,
    "president pick": `President ${presidentName} is selecting the next president.`,
    "your president pick": "Pick the next president.",
    "president kill": `President ${presidentName} is picking someone to assassinate.`,
    "your president kill": "Shoot Someone.",
    "player killed": `${victimName} has been murdered.`,
    "end game": "The Game Has Ended.",
  };
  return (
    phrases[currentState.action] ||
    "Ayy Secret Hitler and Stuff. You're definitely supposed to see this."
  );
}
