project('Learn6502',
          version: '0.1.0',
    meson_version: '>= 1.4.1',
  default_options: [ 'warning_level=2', 'werror=false', ],
)

application_id = 'eu.jumplink.Learn6502'
prefix = get_option('prefix')
libdir = prefix / get_option('libdir')
datadir = prefix / get_option('datadir')
bindir = prefix / get_option('bindir')
pkgdatadir = datadir / application_id

subdir('packages/translations')
subdir('packages/app-gnome')
