subdir('metainfo')

i18n = import('i18n')

desktop_file = i18n.merge_file(
        input: 'eu.jumplink.Learn6502.desktop.in',
       output: 'eu.jumplink.Learn6502.desktop',
         type: 'desktop',
       po_dir: '../../translations',
      install: true,
  install_dir: get_option('datadir') / 'applications'
)

desktop_utils = find_program('desktop-file-validate', required: false)
if desktop_utils.found()
  test('Validate desktop file', desktop_utils, args: [desktop_file])
endif

# The schema is shared with the web and Android builds, which register it from @learn6502/ui.
schema_dir = meson.project_source_root() / 'packages' / 'ui' / 'data'
install_data(schema_dir / 'eu.jumplink.Learn6502.gschema.xml',
  install_dir: get_option('datadir') / 'glib-2.0' / 'schemas'
)

compile_schemas = find_program('glib-compile-schemas', required: false, disabler: true)
test('Validate schema file',
     compile_schemas,
     args: ['--strict', '--dry-run', schema_dir])

subdir('icons')

data_res = gnome.compile_resources(
  application_id + '.data',
  application_id + '.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
  dependencies: [],
)
