import mitt from "mitt";
import webSocket from "plus-websocket";

export const useWs = ({ url, headers }) => {
  let instance = null;

  const events = {
    open: "open",
    error: "error",
    close: "close",
    ping: "ping",
    pingOk: "pingOk",
  };

  const emitter = mitt();

  let connected = false;

  let isReady = false;

  let pingTimer = null;

  const initialize = () => {
    if (uni) {
      instance = uni.connectSocket({ url, complete: () => {} });
    } else {
      instance = webSocket.connectSocket({ url, complete: () => {} });
    }

    instance.onOpen(() => {
      connected = true;
      emitter.emit("open");
    });

    instance.onError((error) => {
      connected = false;
      emitter.emit("error", error);
    });

    instance.onClose((res) => {
      connected = false;
      emitter.emit("close", res);
    });

    instance.onMessage((res) => {
      const { event, data } = JSON.parse(res.data);
      emitter.emit(event, data);
    });
  };

  const reconnect = () => {
    instance.close();
    initialize();
  };

  const ready = (cb) => {
    if (connected) {
      cb();
    } else {
      emitter.on("open", () => {
        if (!isReady) {
          cb();
          isReady = true;
        }
      });
    }
  };

  const send = ({ event, data }) => {
    data.headers = headers;

    instance.send({ data: JSON.stringify({ event, data }) });
  };

  const ping = () => {
    send({ event: events.ping, data: {} });
  };

  const heartbeat = {
    reset() {
      clearTimeout(pingTimer);
    },
    start() {
      connected && ping();
      pingTimer = setTimeout(reconnect, 3 * 1000);
    },
  };

  return {
    instance,
    emitter,
    events,
    initialize,
    reconnect,
    ready,
    send,
    heartbeat,
  };
};
