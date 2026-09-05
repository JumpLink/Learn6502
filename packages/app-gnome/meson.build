gnome = import('gnome')

dependency('gjs-1.0', version: '>= 1.80.2')
gjs_console = find_program('gjs-console', required: true)

# node_modules is materialised by the offline `gjsify install` in the root
# meson.build (it must run from the repo root, where gjsify-lock.json lives).
# The build runs FULLY NODE-FREE: the committed `@gjsify/cli` GJS bundle under
# `gjs-console -m`, with `@gjsify/rolldown-native` (the Vala/Rust bundler
# engine) + `@gjsify/lightningcss-native` on GI_TYPELIB_PATH/LD_LIBRARY_PATH.
# learn's MDX build runs `@mdx-js/rollup` under GJS via the CLI's by-name
# plugin auto-bundling (gjsify v0.9.0); translations' gettext + app-gnome's
# blueprint/gettext plugins all run in-process under the same gjs. Invoked from
# the repo root via `sh -c` because `gjsify workspace` resolves the monorepo
# from cwd, and meson's custom_target cwd is the build dir.
gjsify_cli = meson.project_source_root() / 'node_modules' / '@gjsify' / 'cli' / 'dist' / 'cli.gjs.mjs'

# Native bundler/CSS engines ship per-arch prebuilt typelibs + shared objects.
prebuild_arch = host_machine.cpu_family() == 'aarch64' ? 'linux-aarch64' : 'linux-x86_64'
gjsify_nm = meson.project_source_root() / 'node_modules' / '@gjsify'
rolldown_prebuild = gjsify_nm / 'rolldown-native' / 'prebuilds' / prebuild_arch
lightningcss_prebuild = gjsify_nm / 'lightningcss-native' / 'prebuilds' / prebuild_arch

build_env = environment()
# Append (not set) so the runtime's own Gtk/Adw/Gio typelibs stay reachable.
build_env.append('GI_TYPELIB_PATH', rolldown_prebuild, lightningcss_prebuild, separator: ':')
build_env.append('LD_LIBRARY_PATH', rolldown_prebuild, lightningcss_prebuild, separator: ':')
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

# The dependency builds are spelled out rather than left to `gjsify workspace
# --with-dependencies`. That flag walks only deps declared with the `workspace:`
# protocol (`collectTransitiveClosure` in the CLI), and this monorepo declares
# its internal deps as plain `^x.y.z` ranges on purpose — see the note in
# pnpm-workspace.yaml. So the flag collects NOTHING here, builds no dependency,
# and still exits 0: the app-gnome bundle was then assembled without
# `@learn6502/core` or learn's generated `.ui`, which `gjsify build --app gjs`
# rejects as unresolved bare specifiers. Same order the CI workflows use.
gjsify_deps = ['core', 'examples', 'learn']
build_deps_cmd = ''
foreach dep : gjsify_deps
  build_deps_cmd += '"' + gjs_console.full_path() + '" -m "' + gjsify_cli + '" workspace @learn6502/' + dep + ' build && '
endforeach

custom_target('gjsify-build',
  input: src_files,
  command: [
    'sh', '-c',
    'cd "' + meson.project_source_root() + '" && ' + build_deps_cmd + 'exec "' + gjs_console.full_path() + '" -m "' + gjsify_cli + '" workspace @learn6502/app-gnome build',
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
