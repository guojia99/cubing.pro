#!/usr/bin/env python3
"""
Remove sibling compiler emit files next to .ts / .tsx under src/:

  - For every .ts / .tsx: delete same-stem ``.js`` and ``.js.map`` if present.
  - For .tsx only: also delete same-stem ``.jsx`` and ``.jsx.map`` (e.g. ``jsx: "preserve"``).

These are typically accidental ``tsc`` outputs (without ``--noEmit`` / ``outDir``) or
editor compile artifacts and should not sit next to real sources.

Only touches src/. Does not delete standalone modules with no matching .ts/.tsx.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

TS_SUFFIXES = (".ts", ".tsx")


def find_project_src(script_file: Path) -> Path:
    """Default …/<project>/src for a file living in …/<project>/scripts/."""
    return script_file.resolve().parent.parent / "src"


def iter_ts_sources(src_root: Path) -> list[Path]:
    out: list[Path] = []
    for p in src_root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix in TS_SUFFIXES and not p.name.endswith(".d.ts"):
            out.append(p)
    return out


def emit_artifact_candidates(ts_path: Path) -> list[Path]:
    stem = ts_path.with_suffix("")
    out: list[Path] = [
        stem.with_suffix(".js"),
        stem.with_suffix(".js.map"),
    ]
    if ts_path.suffix == ".tsx":
        out.extend(
            [
                stem.with_suffix(".jsx"),
                stem.with_suffix(".jsx.map"),
            ]
        )
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--src",
        type=Path,
        default=None,
        help="Path to src directory (default: <project>/src next to scripts/)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print paths that would be removed without deleting",
    )
    args = parser.parse_args()

    src_root = (
        args.src.resolve()
        if args.src is not None
        else find_project_src(Path(__file__))
    )

    if not src_root.is_dir():
        print(f"error: not a directory: {src_root}", file=sys.stderr)
        return 1

    to_remove: list[Path] = []
    for ts in iter_ts_sources(src_root):
        for cand in emit_artifact_candidates(ts):
            if cand.is_file():
                to_remove.append(cand)

    # stable order for logs
    to_remove = sorted(set(to_remove))

    if not to_remove:
        print(f"No emit artifacts found under {src_root}")
        return 0

    for p in to_remove:
        try:
            rel = p.relative_to(src_root.parent)
        except ValueError:
            rel = p
        if args.dry_run:
            print(f"would remove: {rel}")
        else:
            p.unlink()
            print(f"removed: {rel}")

    print(f"{'Would remove' if args.dry_run else 'Removed'} {len(to_remove)} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
