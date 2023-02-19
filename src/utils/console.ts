function topMessage(message: string | any[]) {
  let line = "╔═";
  for (let i = 0; i < message.length; i++) {
    message[i] == "║" ? (line += "╦") : (line += "═");
  }
  line += "═╗";
  return line;
}

function aroundMessage(message: string | any[], size = message.length) {
  return `║ ${message}${" ".repeat(size - message.length)} ║`;
}

function botMessage(message: string | any[]) {
  let line = "╚═";
  for (let i = 0; i < message.length; i++) {
    message[i] == "║" ? (line += "╩") : (line += "═");
  }
  line += "═╝";
  return line;
}

export function squareIt(message: string | any[]) {
  if (Array.isArray(message)) {
    const longestMessage = message.reduce((acc, next) => {
      return acc.length < next.length ? next : acc;
    }, "");
    console.log(topMessage(longestMessage));
    message.forEach((m) => console.log(aroundMessage(m, longestMessage.length)));
    console.log(botMessage(longestMessage));
  } else {
    console.log(topMessage(message));
    console.log(aroundMessage(message));
    console.log(botMessage(message));
  }
}
