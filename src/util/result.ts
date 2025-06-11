export type Result<Ok, Err> =
  | { ok: true; value: Ok }
  | { ok: false; error: Err };

export const Ok = <Ok>(value: Ok) => ({ ok: true, value }) as const;
export const Err = <Err>(error: Err) => ({ ok: false, error }) as const;

export const attempt = async <T>(
  fn: () => Promise<T>,
): Promise<Result<T, unknown>> => {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(error);
  }
};

export const unwrap = <Ok, Err>(result: Result<Ok, Err>) => {
  if (result.ok) return result.value;
  throw result.error;
};

export const match = <Ok, Err, T, U>(
  result: Result<Ok, Err>,
  ok: (value: Ok) => T,
  err: (error: Err) => U,
) => (result.ok ? ok(result.value) : err(result.error));
