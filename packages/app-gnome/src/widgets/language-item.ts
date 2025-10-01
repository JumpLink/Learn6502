import GObject from "@girs/gobject-2.0";

/**
 * GObject wrapper for language information
 * Used in ComboRow list model
 */
export class LanguageItem extends GObject.Object {
  static {
    GObject.registerClass(
      {
        GTypeName: "LanguageItem",
        Properties: {
          code: GObject.ParamSpec.string(
            "code",
            "Code",
            "Language code (e.g., 'de', 'en')",
            GObject.ParamFlags.READWRITE,
            ""
          ),
          name: GObject.ParamSpec.string(
            "name",
            "Name",
            "English name of the language",
            GObject.ParamFlags.READWRITE,
            ""
          ),
          "native-name": GObject.ParamSpec.string(
            "native-name",
            "Native Name",
            "Native name of the language",
            GObject.ParamFlags.READWRITE,
            ""
          ),
        },
      },
      this
    );
  }

  constructor(params?: { code: string; name: string; nativeName: string }) {
    super();
    if (params) {
      (this as any).code = params.code;
      (this as any).name = params.name;
      (this as any)["native-name"] = params.nativeName;
    }
  }
}

GObject.type_ensure(LanguageItem.$gtype);
