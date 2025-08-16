/**
 * Gets a value from an object by path with dot notation
 * @param obj The object to get the value from
 * @param path The property path (supports dot notation for nested properties)
 */
export const getByPath = (obj: any, path: string): any => {
  return path.split(".").reduce((o, p) => (o ? o[p] : undefined), obj);
};
