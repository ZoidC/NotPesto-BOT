function topMessage(message: string | string[]) {
  let line = "╔═";
  for (const char of message) {
    line += char === "║" ? "╦" : "═";
  }

  line += "═╗";
  return line;
}

function aroundMessage(message: string | string[], size = message.length) {
  return `║ ${message}${" ".repeat(size - message.length)} ║`;
}

function botMessage(message: string | string[]) {
  let line = "╚═";
  for (const thing of message) {
    line += thing === "║" ? "╩" : "═";
  }

  line += "═╝";
  return line;
}

export function squareIt(message: string | string[]) {
  if (Array.isArray(message)) {
    const longestMessage = message.reduce((acc, next) => (acc.length < next.length ? next : acc), "");
    console.log(topMessage(longestMessage));
    message.forEach((m) => {
      console.log(aroundMessage(m, longestMessage.length));
    });
    console.log(botMessage(longestMessage));
  } else {
    console.log(topMessage(message));
    console.log(aroundMessage(message));
    console.log(botMessage(message));
  }
}
