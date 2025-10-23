class IntervalManager {
  constructor() {
    this.handlers = new Map();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAll();
      } else {
        this.resumeAll();
      }
    });
  }

  create(key, fn, delay) {
    this.clear(key);
    const handler = {
      fn,
      delay,
      timer: window.setInterval(fn, delay),
      paused: false,
    };
    this.handlers.set(key, handler);
    return () => this.clear(key);
  }

  pauseAll() {
    this.handlers.forEach((handler) => {
      if (!handler.paused) {
        window.clearInterval(handler.timer);
        handler.paused = true;
      }
    });
  }

  resumeAll() {
    this.handlers.forEach((handler) => {
      if (handler.paused) {
        handler.timer = window.setInterval(handler.fn, handler.delay);
        handler.paused = false;
      }
    });
  }

  clear(key) {
    if (this.handlers.has(key)) {
      const handler = this.handlers.get(key);
      window.clearInterval(handler.timer);
      this.handlers.delete(key);
    }
  }
}

const intervalManager = new IntervalManager();

export { intervalManager };
