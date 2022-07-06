import { useWs } from "./use-ws";

export const useIm = () => {
  const ws = useWs({ url: "ws://localhost:3002/" });

  const events = { ...ws.events };

  let heartbeatTimer = null;

  const initialize = () => {
    ws.initialize();

    heartbeatTimer = setInterval(() => {
      ws.heartbeat.reset();
      ws.heartbeat.start();
    }, 5 * 1000);

    ws.emitter.on(events.pingOk, () => {
      ws.heartbeat.reset();
    });

    ws.emitter.on(events.error, () => {
      ws.heartbeat.reset();
      ws.heartbeat.start();
    });

    ws.emitter.on(events.close, () => {
      ws.heartbeat.reset();
      ws.heartbeat.start();
    });
  };

  const destroy = () => {
    clearInterval(heartbeatTimer);
    ws.emitter.all.clear();
  };

  return {
    events,
    ws,
    emitter: ws.emitter,
    ready: ws.ready,
    send: ws.send,
    initialize,
    destroy,
  };
};
