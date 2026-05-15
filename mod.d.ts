export interface DumpOptions {
  depth?: number;
  enumerable?: boolean;
  symbols?: boolean;
  inherited?: boolean;
  order?: boolean;
  callGetters?: boolean;
  customRender?: ((value: unknown) => string | null | undefined) | false;
}

/**
 * Render a detailed HTML representation of any JavaScript value.
 */
export function dump(obj: unknown, options?: DumpOptions): string;

export function encode(str: unknown): string;

export function domRender(obj: unknown): string | undefined;
