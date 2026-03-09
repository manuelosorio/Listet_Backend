type NodeCallback<T> = (err: Error | null, result: T) => void;

export function promisify<T, TArgs extends unknown[]>(
  fn: (...args: [...TArgs, NodeCallback<T>]) => void,
  ...args: TArgs
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
}
