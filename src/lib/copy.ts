export type ContentRequest = { request: string; note: string };
export type Copy = string | ContentRequest;

export const isRequest = (v: unknown): v is ContentRequest =>
  typeof v === 'object' && v !== null && 'request' in v;

/** The string, or undefined for a pending request. */
export const text = (v: Copy | undefined): string | undefined => (isRequest(v) ? undefined : v);
