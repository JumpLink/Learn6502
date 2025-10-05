# Contributing Examples to Learn6502

Thank you for your interest in contributing examples to the Learn6502 project! 🎉

## 🚀 Quick Start

The easiest way to contribute an example is directly through the **Learn6502 app**:

1. Open the Learn6502 app (GNOME version)
2. Write your 6502 assembly code in the editor
3. Test your code thoroughly
4. Click the **Share** button (or use the menu: Run → Share)
5. Fill in the example details:
   - **Title**: A descriptive name for your example
   - **Author**: Your name
   - **Description**: What does the example demonstrate?
   - **Source URL** (optional): If based on another example
6. Review the preview
7. Click **Submit** - this will open a GitHub issue
8. Confirm the issue on GitHub (requires a GitHub account)

That's it! A GitHub Action will automatically:

- Create the example files (`*.asm` and `*.meta.ts`)
- Open a Pull Request with your name as the author
- Notify you when it's ready for review

## 🔧 Technical Details

### How It Works

1. **App Side**: The app creates a prefilled GitHub issue with your code and metadata
   - For small examples (< 7000 chars): The issue is automatically filled with all data
   - For large examples: The issue opens with helpful instructions, and the complete content is automatically copied to your clipboard for easy pasting
2. **GitHub Action**: When the issue is created, a workflow extracts the data and generates the files
3. **Pull Request**: The workflow creates a branch and opens a PR with proper attribution
4. **Review**: Maintainers review and merge your contribution

### Generated Files

For each example, two files are created in `packages/examples/<slug>/`:

- `<slug>.asm` - Your 6502 assembly code
- `<slug>.meta.ts` - Metadata including title, description, author, and display snapshot

### Example Issue Format

The GitHub issue contains two code blocks:

**Metadata (JSON):**

```json
{
  "slug": "snake",
  "title": "Snake Game",
  "description": "Classic snake game",
  "author": "Nick Morgan",
  "sourceUrl": "https://example.com/original",
  "displayMemory": "000001100000010000010100..."
}
```

**Code (Assembly with syntax highlighting):**

```assembly
lda sysRandom
sta $00
lda #$01
sta $10
; ... more code
```

This separation provides:

- ✅ Syntax highlighting for the assembly code
- ✅ Better readability in the issue
- ✅ Clear separation between metadata and code

## 🎯 Example Guidelines

### Good Examples Should:

- ✅ Be well-commented
- ✅ Demonstrate a specific concept or technique
- ✅ Be self-contained and runnable
- ✅ Have a clear visual output (when applicable)
- ✅ Follow 6502 assembly best practices

### Example Ideas:

- Simple graphics patterns
- Number manipulation demos
- Control flow examples
- Games and interactive programs
- Hardware simulation demos
- Algorithm implementations

## 🤝 Attribution

Your GitHub username will be automatically set as the commit author, ensuring proper attribution for your contribution. The workflow includes:

- `--author` flag with your GitHub identity
- `Co-authored-by` trailer in the commit message
- `Signed-off-by` trailer for DCO compliance

## 📝 Manual Contribution

If you prefer, you can also contribute examples manually:

1. Fork the repository
2. Create the files in `packages/examples/<your-slug>/`
3. Follow the file structure of existing examples
4. Open a Pull Request

## ❓ Questions?

If you have questions or need help:

- Open an issue on GitHub
- Check existing examples for reference
- Contact the maintainers

Thank you for helping make Learn6502 better! 🎮
