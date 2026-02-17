declare module "ajv/dist/2020" {
  import type { ErrorObject } from "ajv";

  export interface AjvOptions {
    allErrors?: boolean;
    strict?: boolean;
  }

  export interface ValidatorFunction {
    (data: unknown): boolean;
    errors?: ErrorObject[] | null;
  }

  export default class Ajv2020 {
    constructor(options?: AjvOptions);
    compile(schema: unknown): ValidatorFunction;
  }
}

declare module "ajv" {
  export interface ErrorObject {
    instancePath: string;
    message?: string;
  }
}

declare module "yaml" {
  export function parse(input: string): unknown;
}
