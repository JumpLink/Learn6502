#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Application ID and manifest file
APP_ID="eu.jumplink.Easy6502"
MANIFEST_FILE="eu.jumplink.Easy6502.json"
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
flatpak-builder --force-clean "$BUILD_DIR" "$MANIFEST_FILE" --install-deps-from=flathub

# Install the application locally
echo "Installing the Flatpak application locally..."
flatpak-builder --user --install --force-clean "$BUILD_DIR" "$MANIFEST_FILE"

# Run the application
echo "Running the application..."
flatpak run "$APP_ID"