#!/usr/bin/env python3
"""
Generate a Markdown file (tree.md) showing the directory tree for a given path.

Usage:
    python make_tree_md.py /path/to/case

If no path is given, it uses the current working directory.
"""

import argparse
from pathlib import Path


def build_tree_lines(root: Path, prefix: str = "") -> list[str]:
    """
    Recursively build 'tree' lines for root.

    Example of resulting lines (inside a code block):

    case/
    ├── system/
    │   ├── controlDict
    │   └── fvSchemes
    └── constant/
        └── polyMesh/
            ├── boundary
            └── points
    """
    lines: list[str] = []

    # Sort so that directories come first, then files, both alphabetically
    entries = sorted(root.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
    last_index = len(entries) - 1

    for idx, entry in enumerate(entries):
        connector = "└── " if idx == last_index else "├── "
        line = f"{prefix}{connector}{entry.name}"
        if entry.is_dir():
            line += "/"
        lines.append(line)

        if entry.is_dir():
            # For children, extend prefix with vertical line or spaces
            child_prefix = prefix + ("    " if idx == last_index else "│   ")
            lines.extend(build_tree_lines(entry, child_prefix))

    return lines


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate tree.md with a directory tree in Markdown format."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Root directory to document (default: current directory).",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="tree.md",
        help="Output Markdown filename (default: tree.md).",
    )
    args = parser.parse_args()

    root = Path(args.path).resolve()
    if not root.is_dir():
        raise SystemExit(f"Error: {root} is not a directory")

    # Build the tree lines
    tree_lines: list[str] = []
    tree_lines.append(f"{root.name}/")
    tree_lines.extend(build_tree_lines(root))

    # Wrap in Markdown with a header + fenced code block
    md_lines: list[str] = []
    md_lines.append(f"# Directory tree for `{root.name}`\n")
    md_lines.append("```text")
    md_lines.extend(tree_lines)
    md_lines.append("```")
    md_content = "\n".join(md_lines) + "\n"

    output_path = root / args.output
    output_path.write_text(md_content, encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
