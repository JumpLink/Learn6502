project('easy6502',
          version: '0.1.0',
    meson_version: '>= 1.4.1',
  default_options: [ 'warning_level=2', 'werror=false', ],
)

i18n = import('i18n')
gnome = import('gnome')
yarn = find_program('yarn', required: true)

gjs_dep = dependency('gjs-1.0', version: '>= 1.80.2')
gjs_console = find_program('gjs-console', required: true)

app_id = 'eu.jumplink.Easy6502'
prefix = get_option('prefix')
libdir = prefix / get_option('libdir')
datadir = prefix / get_option('datadir')
bindir = prefix / get_option('bindir')
pkgdatadir = datadir / app_id

yarn_args = ['--cwd', meson.project_source_root()]

yarn_env = environment()
yarn_env.set('APPLICATION_ID', app_id)
yarn_env.set('PREFIX', get_option('prefix'))
yarn_env.set('LIBDIR', libdir)
yarn_env.set('DATADIR', datadir)
yarn_env.set('BINDIR', bindir)
yarn_env.set('GJS_CONSOLE', gjs_console.full_path())
yarn_env.set('PKGDATADIR', pkgdatadir)

yarn_install = run_target('yarn-install',
  command: [yarn, yarn_args, 'install'],
  env: yarn_env,
)

yarn_build = custom_target('yarn-build',
  output: ['eu.jumplink.Easy6502'],
  command: [yarn, yarn_args, 'build'],
  build_by_default: true,
  env: yarn_env,
)

subdir('data')
subdir('po')

gnome.post_install(
     glib_compile_schemas: true,
    gtk_update_icon_cache: true,
  update_desktop_database: true,
)
