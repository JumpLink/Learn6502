install_data(
  'eu.jumplink.Learn6502.metainfo.xml',
  install_dir: get_option('datadir') / 'metainfo'
)

appstreamcli = find_program('appstreamcli', required: false, disabler: true)
test('Validate appstream file', appstreamcli, args: ['validate', '--no-net', '--explain', meson.current_source_dir() / 'eu.jumplink.Learn6502.metainfo.xml'])