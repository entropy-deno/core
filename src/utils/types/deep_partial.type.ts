export type DeepPartial<TObject> = {
  [P in keyof TObject]?: DeepPartial<TObject[P]>;
};
