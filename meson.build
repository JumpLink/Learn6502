project('easy6502',
          version: '0.1.0',
    meson_version: '>= 0.62.0',
  default_options: [ 'warning_level=2', 'werror=false', ],
)

yarn = find_program('yarn', required: true)
i18n = import('i18n')
gnome = import('gnome')

subdir('packages/app-gnome')

gnome.post_install(
     glib_compile_schemas: true,
    gtk_update_icon_cache: true,
  update_desktop_database: true,
)
