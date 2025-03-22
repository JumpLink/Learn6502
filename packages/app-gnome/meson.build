gnome = import('gnome')

dependency('gjs-1.0', version: '>= 1.80.2')
gjs_console = find_program('gjs-console', required: true)

# TODO: Autodetect yarn version
yarn_path = meson.project_source_root() / '.yarn' / 'releases' / 'yarn-4.7.0.cjs'
node = find_program('node')
yarn = [node, yarn_path]


yarn_args = ['--cwd', meson.project_source_root()]

yarn_env = environment()
yarn_env.set('GJS_CONSOLE', gjs_console.full_path())
yarn_env.set('PACKAGE_VERSION', meson.project_version())
yarn_env.set('APPLICATION_ID', application_id)
yarn_env.set('PREFIX', prefix)
yarn_env.set('LIBDIR', libdir)
yarn_env.set('DATADIR', datadir)
yarn_env.set('BINDIR', bindir)
yarn_env.set('OUTDIR', meson.current_build_dir())
yarn_env.set('BUILD_MODE', 'flatpak')

yarn_env.set('PKGDATADIR', pkgdatadir)

run_command(yarn, yarn_args, 'install', check: true)

# Find all source files
ts_files = run_command('sh', '-c', 'ls src/*/*.ts && ls src/**/*.ts', check: true).stdout().strip().split('\n')
blueprint_files = run_command('sh', '-c', 'ls src/**/*.blp', check: true).stdout().strip().split('\n')
# ui_files = run_command('sh', '-c', 'ls ../learn/dist/**/*.ui', check: true).stdout().strip().split('\n')
src_files = files(ts_files, blueprint_files)

custom_target('yarn-build',
  input: src_files,
  command: [yarn, yarn_args, 'build:with-deps'],
  output: application_id,
  build_by_default: true,
  env: yarn_env,
  install: true,
  install_dir: bindir,
)

subdir('data')
# subdir('po')

gnome.post_install(
     glib_compile_schemas: true,
    gtk_update_icon_cache: true,
  update_desktop_database: true,
)
