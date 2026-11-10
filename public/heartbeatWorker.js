// public/heartbeatWorker.js
let timer = null;

self.onmessage = (e) => {
  if (e.data === 'START') {
    // FIX: Clear any existing active timer to prevent accelerated ping spamming
    if (timer) {
      clearInterval(timer);
    }

    timer = setInterval(() => {
      self.postMessage('TICK');
    }, 25000); // 25 seconds keeps the Durable Object connection perfectly pinned open

  } else if (e.data === 'STOP') {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
};
