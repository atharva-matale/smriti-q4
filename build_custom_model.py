"""
build_custom_model.py
---------------------
Downloads essential config + 4-bit ONNX weights from
HuggingFaceTB/SmolLM2-135M-Instruct and rebrands them as `smriti-q4`.

Run:
    pip install huggingface_hub
    python build_custom_model.py
"""

import json
import os
import sys
from pathlib import Path

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from huggingface_hub import hf_hub_download

# -- Configuration ----------------------------------------------------------
REPO_ID = "HuggingFaceTB/SmolLM2-135M-Instruct"
CUSTOM_NAME = "smriti-q4"
LOCAL_DIR = Path("./models") / CUSTOM_NAME

# Files to download (relative paths inside the HF repo)
FILES_TO_DOWNLOAD = [
    # Root-level config / tokenizer files
    "config.json",
    "generation_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    # 4-bit ONNX weights
    "onnx/model_q4.onnx",
    "onnx/model_q4f16.onnx",
]

# Files whose JSON content should be patched with the custom model name
PATCH_TARGETS = {
    "config.json": ["_name_or_path"],
    "tokenizer_config.json": ["_name_or_path"],
}


def download_files() -> None:
    """Download each required file from the HF Hub into LOCAL_DIR."""
    print(f"\n[DOWNLOAD] Downloading files from {REPO_ID} -> {LOCAL_DIR}\n")

    for rel_path in FILES_TO_DOWNLOAD:
        dest = LOCAL_DIR / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)

        print(f"  [*] {rel_path} ... ", end="", flush=True)
        try:
            downloaded = hf_hub_download(
                repo_id=REPO_ID,
                filename=rel_path,
                local_dir=str(LOCAL_DIR),
                local_dir_use_symlinks=False,
            )
            print(f"OK ({os.path.getsize(downloaded):,} bytes)")
        except Exception as exc:
            print(f"SKIPPED -- {exc}")


def patch_configs() -> None:
    """Rewrite metadata fields so the model identifies as `smriti-q4`."""
    print(f"\n[PATCH] Patching config files with custom name: {CUSTOM_NAME}\n")

    for filename, keys in PATCH_TARGETS.items():
        filepath = LOCAL_DIR / filename
        if not filepath.exists():
            print(f"  [!] {filename} not found -- skipping patch")
            continue

        with open(filepath, "r", encoding="utf-8") as fh:
            data = json.load(fh)

        changed = False
        for key in keys:
            old = data.get(key)
            data[key] = CUSTOM_NAME
            if old != CUSTOM_NAME:
                print(f"  [~] {filename}  {key}: {old!r} -> {CUSTOM_NAME!r}")
                changed = True

        if changed:
            with open(filepath, "w", encoding="utf-8") as fh:
                json.dump(data, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
            print(f"  [OK] {filename} saved")
        else:
            print(f"  [=] {filename} already up-to-date")


def verify() -> None:
    """Quick sanity check: list all files under LOCAL_DIR."""
    print(f"\n[VERIFY] Contents of {LOCAL_DIR}:\n")
    for root, _dirs, files in os.walk(LOCAL_DIR):
        for f in sorted(files):
            full = Path(root) / f
            rel = full.relative_to(LOCAL_DIR)
            size = full.stat().st_size
            print(f"  {rel}  ({size:,} bytes)")
    print()


if __name__ == "__main__":
    download_files()
    patch_configs()
    verify()
    print("[DONE] smriti-q4 model build complete!\n")
