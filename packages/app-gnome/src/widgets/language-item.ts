import GObject from "@girs/gobject-2.0";

/**
 * GObject wrapper for language information
 * Used in ComboRow list model
 */
export class LanguageItem extends GObject.Object {
  declare private code: string;
  declare private name: string;
  declare private nativeName: string;

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
          nativeName: GObject.ParamSpec.string(
            "nativeName",
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
      this.code = params.code;
      this.name = params.name;
      this.nativeName = params.nativeName;
    }
  }
}

GObject.type_ensure(LanguageItem.$gtype);
