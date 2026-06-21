/*
 * Shared Server Action result shapes.
 *
 * Actions never throw to the client — they return a discriminated result. The
 * client uses `ok` to decide toast vs. field-error display. `fieldErrors` keys
 * match form field names; `message` is shown in the toast.
 */

export type FieldErrors = Record<string, string[]> | undefined;

export type ActionResult<T = void> = {
  ok: boolean;
  message?: string;
  data?: T;
  fieldErrors?: FieldErrors;
};

export const ok = <T,>(data?: T, message?: string): ActionResult<T> => ({
  ok: true,
  data,
  message,
});

export const fail = (
  message: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> => ({
  ok: false,
  message,
  fieldErrors,
});
