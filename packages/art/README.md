# Art Package

This package contains art generated with ComfyUI for the Easy6502 project - an interactive learning tutorial for 6502 assembly language programming. The original files of the generated images contain the workflow used to create them, which can be easily reconstructed and further developed by drag & drop into ComfyUI.

## Purpose

The art assets are designed to enhance the learning experience in the Easy6502 project (see root @README.md). The characters and visual elements aim to make the learning process more engaging and approachable for users learning 6502 assembly programming.

## Characters

The characters are all retro gaming enthusiasts in their own way, fans of the 6502 microchip and gaming consoles that used it, among others. They are designed to motivate users to continue learning.

Current characters include:
* A nerdy girl inspired by retro gaming
* Older cheerful man inspired by retro gaming

## Image Generation Process

The graphics are generated in two steps:
1. First, an anime character is created with simple colors in a basic graphic style
2. Then this image is pixelized using different checkpoints and nodes, resulting in multiple graphics

## Required Checkpoints & Models

To recreate the workflows, you need the following checkpoints and models:

### Base Models
* `sd1.5/aziibpixelmix_v10/aziibpixelmix_v10.safetensors`
* `sdxl1.0/leosamsHelloworldXL_helloworldXL70/leosamsHelloworldXL_helloworldXL70.safetensors`


### IPAdapter
* PLUS (high strength)

### Background Removal
* isnet-anime model for background removal

## Technical Details

The generated pixel art images have a higher resolution than the actually displayed pixels. For example, one visible pixel might correspond to 8 actual pixels in the image, requiring downscaling to its actual size.

The checkpoints and Loras are usually trained for a specific pixel density, so scaling must be adjusted accordingly. A value of 0 maintains the ratio and is calculated automatically.

## Original Files

The original graphics include the ComfyUI workflow used to generate them. This workflow can be loaded via drag & drop into ComfyUI for reconstruction and further development.