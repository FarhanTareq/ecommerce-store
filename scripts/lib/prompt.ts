import readline from "node:readline";

export async function promptHidden(question: string): Promise<string> {
  process.stdout.write(question);

  if (!process.stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });
      rl.once("line", (line) => {
        rl.close();
        resolve(line);
      });
    });
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    let value = "";

    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(Boolean(wasRaw));
      stdin.pause();
      process.stdout.write("\n");
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (char >= " ") {
          value += char;
          process.stdout.write("*");
        }
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", onData);
  });
}
