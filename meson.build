project('Learn6502',
          version: '0.7.0',
    meson_version: '>= 1.4.1',
  default_options: [ 'warning_level=2', 'werror=false', ],
)

application_id = 'eu.jumplink.Learn6502'
prefix = get_option('prefix')
libdir = prefix / get_option('libdir')
datadir = prefix / get_option('datadir')
bindir = prefix / get_option('bindir')
pkgdatadir = datadir / application_id

# Offline dependency install (Flathub sandbox = no network). Run from the repo
# root (where gjsify-lock.json lives) via the committed, self-contained gjsify
# CLI bundle under gjs — no Node, no node_modules needed. `--immutable` pulls
# every tarball from the cache flatpak-builder pre-populated from
# gjsify-sources.json (keyed by SRI integrity), so it makes zero network calls.
# Replaces the vendored yarn `workspaces focus`.
gjs_console = find_program('gjs-console', required: true)
gjsify_install_env = environment()
gjsify_install_env.set('XDG_CACHE_HOME', meson.project_source_root() / 'flatpak-gjsify-cache')
run_command(
  gjs_console, '-m', meson.project_source_root() / 'build-aux' / 'gjsify.gjs.mjs',
  'install', '--immutable',
  env: gjsify_install_env,
  check: true,
)

subdir('packages/translations')
subdir('packages/app-gnome')
