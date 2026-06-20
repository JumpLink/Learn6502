gnome = import('gnome')

dependency('gjs-1.0', version: '>= 1.80.2')
gjs_console = find_program('gjs-console', required: true)
node = find_program('node')

# node_modules is materialised by the offline `gjsify install` in the root
# meson.build (it must run from the repo root, where gjsify-lock.json lives).
# The build runs through the workspace-local gjsify CLI under Node (npm rolldown
# + learn's esbuild MDX build). It is invoked from the repo root via `sh -c`
# (like the old yarn `--cwd` did) because `gjsify workspace` resolves the
# monorepo from cwd, and meson's custom_target cwd is the build dir. Going fully
# Node-free is a follow-up (port learn off esbuild, then drop the node24 ext).
gjsify_cli = meson.project_source_root() / 'node_modules' / '@gjsify' / 'cli' / 'lib' / 'index.js'

build_env = environment()
build_env.set('GJS_CONSOLE', gjs_console.full_path())
build_env.set('PACKAGE_VERSION', meson.project_version())
build_env.set('APPLICATION_ID', application_id)
build_env.set('PREFIX', prefix)
build_env.set('LIBDIR', libdir)
build_env.set('DATADIR', datadir)
build_env.set('BINDIR', bindir)
build_env.set('OUTDIR', meson.current_build_dir())
build_env.set('BUILD_MODE', 'flatpak')
build_env.set('PKGDATADIR', pkgdatadir)
build_env.set('RESOURCES_PATH', '/' + application_id.replace('.', '/'))

# Find all source files
ts_files = run_command('sh', '-c', 'ls src/*/*.ts && ls src/**/*.ts', check: true).stdout().strip().split('\n')
blueprint_files = run_command('sh', '-c', 'ls src/**/*.blp', check: true).stdout().strip().split('\n')
# ui_files = run_command('sh', '-c', 'ls ../learn/dist/**/*.ui', check: true).stdout().strip().split('\n')
src_files = files(ts_files, blueprint_files)

custom_target('gjsify-build',
  input: src_files,
  command: [
    'sh', '-c',
    'cd "' + meson.project_source_root() + '" && exec "' + node.full_path() + '" "' + gjsify_cli + '" workspace @learn6502/app-gnome build --with-dependencies',
  ],
  output: application_id,
  build_by_default: true,
  env: build_env,
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
