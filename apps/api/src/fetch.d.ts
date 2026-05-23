// Ensure native fetch Response type has .json(), .ok, .status
// @types/node@25 uses undici-types BodyMixin which may not declare json() properly

interface Response {
  json(): Promise<any>;
  readonly ok: boolean;
  readonly status: number;
}