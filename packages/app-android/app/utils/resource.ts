import { Utils } from "@nativescript/core";

/**
 * Return a resource identifier for the given resource name. A fully qualified resource name is of the form "package:type/entry". The first two components (package and type) are optional if defType and defPackage, respectively, are specified here.
 *
 * Note: use of this function is discouraged. It is much more efficient to retrieve resources by identifier than by name.
 * @see https://developer.android.com/reference/android/content/res/Resources#getIdentifier(java.lang.String,%20java.lang.String,%20java.lang.String)
 *
 * @param name - The name of the resource to retrieve
 * @param defType - The type of the resource
 * @param context - The context to retrieve the resource from
 * @param packageName - The package name of the resource
 * @returns The identifier for the resource
 */
export const getResource = (
  name: string,
  defType: "color" | "drawable",
  context: android.content.Context = Utils.android.getApplicationContext(),
  packageName: string = context.getPackageName()
): number => {
  return context.getResources().getIdentifier(name, defType, packageName);
};
