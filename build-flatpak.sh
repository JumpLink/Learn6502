#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Application ID and manifest file
APP_ID="eu.jumplink.Learn6502"
MANIFEST_FILE="eu.jumplink.Learn6502.json"
BUILD_DIR="flatpak-build"

# Ensure Flatpak and Flatpak Builder are installed
if ! command -v flatpak-builder &> /dev/null
then
    echo "flatpak-builder could not be found."
    echo "Please install Flatpak and Flatpak Builder before running this script."
    exit 1
fi

# Remove previous build directory if it exists
rm -rf "$BUILD_DIR"

# Build the Flatpak
echo "Building the Flatpak..."
flatpak-builder --keep-build-dirs --force-clean "$BUILD_DIR" "$MANIFEST_FILE" --install-deps-from=flathub

# Copy metainfo.xml to the correct location for Flathub
echo "Copying metainfo.xml to build directory..."
cp packages/app-gnome/data/eu.jumplink.Learn6502.metainfo.xml "$BUILD_DIR/"

# Install the application locally
echo "Installing the Flatpak application locally..."
flatpak-builder --user --install --force-clean "$BUILD_DIR" "$MANIFEST_FILE"

# Export the Flatpak for Flathub
echo "Exporting Flatpak for Flathub..."
flatpak-builder --repo=repo --force-clean "$BUILD_DIR" "$MANIFEST_FILE"

# Create a tarball for Flathub
echo "Creating tarball for Flathub..."
tar -czf "$APP_ID.tar.gz" -C "$BUILD_DIR" .

echo "Build complete! The Flatpak has been installed locally and exported for Flathub."
echo "To publish to Flathub:"
echo "1. Push your changes to GitHub"
echo "2. Create a new release on GitHub"
echo "3. Upload the $APP_ID.tar.gz file to the release"
echo "4. Submit your application on Flathub"
