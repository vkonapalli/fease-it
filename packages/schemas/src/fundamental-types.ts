import { z } from "zod";

// --- Primitives ---

export const PositiveInt = z.number().int().positive().brand<"PositiveInt">();
export type PositiveInt = z.infer<typeof PositiveInt>;

export const NegativeInt = z.number().int().negative().brand<"NegativeInt">();
export type NegativeInt = z.infer<typeof NegativeInt>;

export const Nat = z.number().int().min(0).brand<"Nat">();
export type Nat = z.infer<typeof Nat>;

export const Money = z.number().min(0).brand<"Money">();
export type Money = z.infer<typeof Money>;

/** Signed monetary value — can be positive (income, asset) or negative (liability, outflow). */
export const NetMoney = z.number().brand<"NetMoney">();
export type NetMoney = z.infer<typeof NetMoney>;

export const Percentage = z.number().brand<"Percentage">();
export type Percentage = z.infer<typeof Percentage>;

export const Email = z.string().email().brand<"Email">();
export type Email = z.infer<typeof Email>;

export const UUID = z.string().uuid().brand<"UUID">();
export type UUID = z.infer<typeof UUID>;

// --- Coerced Types ---

// Helper from regional-assistant to handle empty strings gracefully before coercion
const preprocessEmptyNumber = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema);

export const IntoMoney = preprocessEmptyNumber(z.coerce.number()).pipe(Money);
export type IntoMoney = z.infer<typeof IntoMoney>;

export const IntoPercentage = preprocessEmptyNumber(z.coerce.number()).pipe(Percentage);
export type IntoPercentage = z.infer<typeof IntoPercentage>;

export const IntoPositiveInt = preprocessEmptyNumber(z.coerce.number()).pipe(PositiveInt);
export type IntoPositiveInt = z.infer<typeof IntoPositiveInt>;

export const IntoNat = preprocessEmptyNumber(z.coerce.number()).pipe(Nat);
export type IntoNat = z.infer<typeof IntoNat>;

export const IntoBoolean = z.union([
  z.boolean(),
  z
    .string()
    .transform((it) => it.toLowerCase())
    .transform((value) => !["false", "no", "0"].includes(value)),
]);
export type IntoBoolean = z.infer<typeof IntoBoolean>;

// --- JSON Parsing ---

export const FromStringified = z.string().transform((input, ctx) => {
  try {
    return JSON.parse(input);
  } catch (e: any) {
    ctx.addIssue({
      code: "custom",
      message: `Invalid JSON string: ${e.message}`,
    });
    return z.NEVER;
  }
});

// --- Utilities ---

/** Utility function to assist with exhaustiveness checks of switch and if
    statements.

    Call this with the scrutinee of the switch or if statement; the compiler
    will raise an error if the branch in which it is called is reachable.
 */
export const impossible = (_arg: never): never => {
  throw new Error("impossible");
};

// --- Safe Type Casts ---
function validateMoney(val: number): Money {
  if (Number.isNaN(val) || val < 0) throw new Error(`Invalid Money value: ${val}`);
  return val as Money;
}
function validateNetMoney(val: number): NetMoney {
  if (Number.isNaN(val)) throw new Error(`Invalid NetMoney value: ${val}`);
  return val as NetMoney;
}
function validatePercentage(val: number): Percentage {
  if (Number.isNaN(val)) throw new Error(`Invalid Percentage value: ${val}`);
  return val as Percentage;
}
function validatePositiveInt(val: number): PositiveInt {
  if (Number.isNaN(val) || !Number.isInteger(val) || val <= 0) throw new Error(`Invalid PositiveInt value: ${val}`);
  return val as PositiveInt;
}
function validateNat(val: number): Nat {
  if (Number.isNaN(val) || !Number.isInteger(val) || val < 0) throw new Error(`Invalid Nat value: ${val}`);
  return val as Nat;
}
export const asMoney = (val: number) => validateMoney(val);
export const asNetMoney = (val: number) => validateNetMoney(val);
export const asPercentage = (val: number) => validatePercentage(val);
export const asPositiveInt = (val: number) => validatePositiveInt(val);
export const asNat = (val: number) => validateNat(val);
