type Subscriber<T> = { resolve: (value: T) => void; reject: (error: unknown) => void };
type Pending<R, T> = { key: string; request: R; subscribers: Set<Subscriber<T>> };

// Each pool has its own generation. Invalidating it settles both the active
// request and its queued subscribers, even when native rendering never settles.
export function createNativeQueue<R, T>(
  run: (request: R, signal: AbortSignal, wanted: () => boolean) => Promise<T>,
  reset: () => void,
  timeout = 10_000,
) {
  const pending = new Map<string, Pending<R, T>>();
  let generation = new AbortController();
  let active: Pending<R, T> | undefined;
  let draining = false;

  function invalidate(error: unknown) {
    const expired = generation;
    generation = new AbortController();
    draining = false;
    active = undefined;
    for (const entry of pending.values()) {
      for (const subscriber of entry.subscribers) subscriber.reject(error);
      entry.subscribers.clear();
    }
    pending.clear();
    expired.abort(error);
    reset();
  }

  async function drain(epoch: AbortController) {
    while (epoch === generation && pending.size) {
      const entry = pending.values().next().value!;
      active = entry;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let abort = () => {};
      try {
        const interrupted = new Promise<never>((_, reject) => {
          abort = () => reject(epoch.signal.reason);
          epoch.signal.addEventListener("abort", abort, { once: true });
          timer = setTimeout(() => {
            if (epoch === generation) invalidate(new Error("Native 2x2x2 operation timed out. Retry to recover."));
          }, timeout);
        });
        const value = await Promise.race([
          run(entry.request, epoch.signal, () => entry.subscribers.size > 0), interrupted,
        ]);
        if (epoch !== generation) return;
        for (const subscriber of entry.subscribers) subscriber.resolve(value);
      } catch (error) {
        if (epoch !== generation) return;
        for (const subscriber of entry.subscribers) subscriber.reject(error);
      } finally {
        clearTimeout(timer);
        epoch.signal.removeEventListener("abort", abort);
        if (epoch === generation) {
          if (pending.get(entry.key) === entry) pending.delete(entry.key);
          entry.subscribers.clear();
          active = undefined;
        }
      }
    }
    if (epoch === generation) draining = false;
  }

  return {
    invalidate,
    subscribe(key: string, request: R) {
      let entry = pending.get(key);
      if (!entry) {
        entry = { key, request, subscribers: new Set() };
        pending.set(key, entry);
      }
      const target = entry;
      let subscriber: Subscriber<T>;
      const promise = new Promise<T>((resolve, reject) => {
        subscriber = { resolve, reject };
        target.subscribers.add(subscriber);
      });
      if (!draining) {
        draining = true;
        // Let effect cleanup cancel StrictMode's first subscription before work.
        const epoch = generation;
        queueMicrotask(() => { if (epoch === generation) void drain(epoch); });
      }
      return {
        promise,
        cancel() {
          if (!target.subscribers.delete(subscriber!)) return;
          subscriber!.reject(new DOMException("Native 2x2x2 subscription cancelled.", "AbortError"));
          if (!target.subscribers.size && target !== active && pending.get(key) === target) pending.delete(key);
        },
      };
    },
  };
}
