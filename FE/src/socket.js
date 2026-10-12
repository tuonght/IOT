const SOCKET_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

export function connectStomp(onConnectionChange) {
  let socket;
  let connected = false;
  let stopped = false;
  let reconnectTimer;
  let inputBuffer = "";
  let nextSubscriptionId = 1;
  const subscriptions = new Map();

  function sendFrame(command, headers = {}, body = "") {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const headerLines = Object.entries(headers)
      .map(([key, value]) => `${key}:${value}`)
      .join("\n");
    socket.send(`${command}${headerLines ? `\n${headerLines}` : ""}\n\n${body}\0`);
  }

  function subscribePending() {
    for (const [destination, subscription] of subscriptions) {
      if (subscription.sent) continue;
      sendFrame("SUBSCRIBE", {
        id: subscription.id,
        destination,
        ack: "auto",
      });
      subscription.sent = true;
    }
  }

  function handleFrame(frame) {
    const separator = frame.indexOf("\n\n");
    if (separator < 0) return;
    const [command, ...headerLines] = frame.slice(0, separator).split("\n");
    const headers = new Map(headerLines.map((line) => {
      const colon = line.indexOf(":");
      return colon < 0
        ? [line, ""]
        : [line.slice(0, colon), line.slice(colon + 1)];
    }));
    const body = frame.slice(separator + 2);

    if (command === "CONNECTED") {
      connected = true;
      onConnectionChange(true);
      subscribePending();
      return;
    }
    if (command === "MESSAGE") {
      const destination = headers.get("destination");
      const callback = subscriptions.get(destination)?.callback;
      if (!callback) return;
      try {
        callback(JSON.parse(body));
      } catch (error) {
        console.error("Could not parse STOMP message body", error);
      }
    }
  }

  function connect() {
    if (stopped) return;
    inputBuffer = "";
    try {
      socket = new WebSocket(SOCKET_URL);
      socket.onopen = () => {
        sendFrame("CONNECT", {
          "accept-version": "1.2",
          host: window.location.host || "localhost",
          "heart-beat": "0,0",
        });
      };
      socket.onmessage = (event) => {
        inputBuffer += event.data;
        let frameEnd = inputBuffer.indexOf("\0");
        while (frameEnd >= 0) {
          const frame = inputBuffer.slice(0, frameEnd)
            .replace(/\r\n/g, "\n")
            .replace(/^\n+/, "");
          inputBuffer = inputBuffer.slice(frameEnd + 1);
          if (frame) handleFrame(frame);
          frameEnd = inputBuffer.indexOf("\0");
        }
        inputBuffer = inputBuffer.replace(/^\n+/, "");
      };
      socket.onerror = () => {
        connected = false;
        onConnectionChange(false);
      };
      socket.onclose = () => {
        connected = false;
        for (const subscription of subscriptions.values()) subscription.sent = false;
        onConnectionChange(false);
        if (!stopped) reconnectTimer = window.setTimeout(connect, 2500);
      };
    } catch {
      onConnectionChange(false);
      if (!stopped) reconnectTimer = window.setTimeout(connect, 2500);
    }
  }

  connect();

  return {
    subscribe(destination, callback) {
      const existing = subscriptions.get(destination);
      if (existing) {
        existing.callback = callback;
        return () => {};
      }
      const subscription = {
        id: `subscription-${nextSubscriptionId++}`,
        callback,
        sent: false,
      };
      subscriptions.set(destination, subscription);
      if (connected) subscribePending();
      return () => {
        if (subscriptions.get(destination) !== subscription) return;
        if (connected && subscription.sent) {
          sendFrame("UNSUBSCRIBE", { id: subscription.id });
        }
        subscriptions.delete(destination);
      };
    },
    disconnect() {
      stopped = true;
      window.clearTimeout(reconnectTimer);
      if (connected) sendFrame("DISCONNECT");
      socket?.close();
    },
  };
}
