import { FalsyValue } from './falsy_value.type.ts';

export type TruthyValue = Exclude<unknown, FalsyValue>;
