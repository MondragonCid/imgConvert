"""
imgConvert - Simple Batch Image Converter
A clean, basic desktop UI for converting .jpe, .jpg, and .png images.
"""

import os
import sys
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image

class SimpleImageConverter(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("imgConvert")
        self.geometry("480x420")
        self.resizable(True, True)

        # Base directory (supports both .py script and compiled .exe)
        if getattr(sys, 'frozen', False):
            self.base_dir = Path(sys.executable).parent
        else:
            self.base_dir = Path(__file__).parent.resolve()

        # Variables
        self.input_folder = tk.StringVar(value=str(self.base_dir / "input_images"))
        self.output_folder = tk.StringVar(value=str(self.base_dir / "converted"))
        self.target_format = tk.StringVar(value="jpg")  # "jpg" or "png"
        self.only_jpe = tk.BooleanVar(value=True)
        self.is_running = False

        self._create_widgets()

    def _create_widgets(self):
        pad = {'padx': 12, 'pady': 6}

        # 1. Input Folder
        frame_input = ttk.LabelFrame(self, text="Input Folder", padding=8)
        frame_input.pack(fill=tk.X, padx=12, pady=(10, 4))

        entry_input = ttk.Entry(frame_input, textvariable=self.input_folder)
        entry_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6))

        btn_browse_in = ttk.Button(frame_input, text="Browse...", command=self._browse_input)
        btn_browse_in.pack(side=tk.RIGHT)

        # 2. Output Folder
        frame_output = ttk.LabelFrame(self, text="Output Folder", padding=8)
        frame_output.pack(fill=tk.X, padx=12, pady=4)

        entry_output = ttk.Entry(frame_output, textvariable=self.output_folder)
        entry_output.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6))

        btn_browse_out = ttk.Button(frame_output, text="Browse...", command=self._browse_output)
        btn_browse_out.pack(side=tk.RIGHT)

        # 3. Format Options
        frame_options = ttk.LabelFrame(self, text="Conversion Options", padding=8)
        frame_options.pack(fill=tk.X, padx=12, pady=4)

        format_row = ttk.Frame(frame_options)
        format_row.pack(fill=tk.X, pady=(0, 4))
        ttk.Label(format_row, text="Target format:").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Radiobutton(format_row, text="JPG", variable=self.target_format, value="jpg").pack(side=tk.LEFT, padx=6)
        ttk.Radiobutton(format_row, text="PNG", variable=self.target_format, value="png").pack(side=tk.LEFT, padx=6)

        cb_jpe = ttk.Checkbutton(frame_options, text="Convert only .jpe files", variable=self.only_jpe)
        cb_jpe.pack(anchor="w")

        # 4. Action Buttons
        frame_actions = ttk.Frame(self)
        frame_actions.pack(fill=tk.X, padx=12, pady=8)

        self.btn_convert = ttk.Button(frame_actions, text="Convert Images", command=self._start_thread)
        self.btn_convert.pack(side=tk.LEFT, padx=(0, 6))

        self.btn_open = ttk.Button(frame_actions, text="Open Output Folder", command=self._open_output)
        self.btn_open.pack(side=tk.LEFT)

        # 5. Progress
        self.progress_var = tk.DoubleVar(value=0)
        self.progressbar = ttk.Progressbar(self, variable=self.progress_var, maximum=100)
        self.progressbar.pack(fill=tk.X, padx=12, pady=(0, 4))

        self.status_lbl = ttk.Label(self, text="Ready.")
        self.status_lbl.pack(anchor="w", padx=14, pady=(0, 4))

        # 6. Log list
        frame_log = ttk.LabelFrame(self, text="Status Log", padding=4)
        frame_log.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 10))

        self.log_text = tk.Text(frame_log, height=8, font=("Courier", 9), relief="solid", borderwidth=1)
        scroll = ttk.Scrollbar(frame_log, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scroll.set)

        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)

    def _browse_input(self):
        folder = filedialog.askdirectory(initialdir=self.input_folder.get(), title="Select Input Folder")
        if folder:
            self.input_folder.set(folder)

    def _browse_output(self):
        folder = filedialog.askdirectory(initialdir=self.output_folder.get(), title="Select Output Folder")
        if folder:
            self.output_folder.set(folder)

    def _open_output(self):
        out = Path(self.output_folder.get())
        out.mkdir(parents=True, exist_ok=True)
        try:
            if sys.platform == 'win32':
                os.startfile(str(out))
            elif sys.platform == 'darwin':
                import subprocess
                subprocess.Popen(['open', str(out)])
            else:
                import subprocess
                subprocess.Popen(['xdg-open', str(out)])
        except Exception as e:
            messagebox.showerror("Error", f"Could not open folder: {e}")

    def _log(self, text: str):
        self.log_text.insert(tk.END, text + "\n")
        self.log_text.see(tk.END)

    def _start_thread(self):
        if self.is_running:
            return
        threading.Thread(target=self._convert, daemon=True).start()

    def _convert(self):
        self.is_running = True
        self.btn_convert.config(state=tk.DISABLED)
        self.progress_var.set(0)
        self.log_text.delete("1.0", tk.END)

        in_dir = Path(self.input_folder.get())
        out_dir = Path(self.output_folder.get())

        in_dir.mkdir(parents=True, exist_ok=True)
        out_dir.mkdir(parents=True, exist_ok=True)

        target_ext = self.target_format.get()
        only_jpe = self.only_jpe.get()

        valid_exts = {".jpe"} if only_jpe else {".jpe", ".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        files = [f for f in in_dir.iterdir() if f.is_file() and f.suffix.lower() in valid_exts]

        if not files:
            self._log(f"No matching image files found in:\n{in_dir.resolve()}")
            self.status_lbl.config(text="No files found.")
            self.btn_convert.config(state=tk.NORMAL)
            self.is_running = False
            return

        self._log(f"Found {len(files)} file(s). Converting to .{target_ext.upper()}...")
        success = 0
        total = len(files)

        for i, file_path in enumerate(files, 1):
            dest = out_dir / f"{file_path.stem}.{target_ext}"
            try:
                with Image.open(file_path) as img:
                    if target_ext in ("jpg", "jpeg"):
                        if img.mode in ("RGBA", "LA", "P", "CMYK"):
                            # Simple clean white background for transparency
                            bg = Image.new("RGB", img.size, (255, 255, 255))
                            if img.mode == "RGBA":
                                bg.paste(img, mask=img.split()[3])
                            else:
                                bg.paste(img.convert("RGB"))
                            img = bg
                        else:
                            img = img.convert("RGB")
                        img.save(dest, format="JPEG", quality=95)
                    else:
                        img.save(dest, format="PNG")

                self._log(f"  OK: {file_path.name} -> {dest.name}")
                success += 1
            except Exception as e:
                self._log(f"  ERROR {file_path.name}: {e}")

            pct = (i / total) * 100
            self.progress_var.set(pct)
            self.status_lbl.config(text=f"Converted {i}/{total} ({int(pct)}%)")

        self._log(f"\nCompleted: {success}/{total} images saved to:\n{out_dir.resolve()}")
        self.status_lbl.config(text=f"Done! {success}/{total} converted.")
        self.btn_convert.config(state=tk.NORMAL)
        self.is_running = False

if __name__ == "__main__":
    app = SimpleImageConverter()
    app.mainloop()
