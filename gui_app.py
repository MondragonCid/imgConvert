"""
imgConvert - Standalone Desktop GUI
Created for personal local use.
To bundle into a single-file Windows executable (.exe):
    pip install pyinstaller pillow
    pyinstaller --noconsole --onefile --name "imgConvert" gui_app.py
"""

import os
import sys
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image

class ImageConverterApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("imgConvert - Batch Image Converter")
        self.geometry("620x580")
        self.minsize(550, 500)
        self.configure(bg="#0f172a")

        # Styling
        self.style = ttk.Style(self)
        self.style.theme_use("clam")
        
        # Color palette
        self.bg_color = "#0f172a"
        self.card_bg = "#1e293b"
        self.accent_color = "#6366f1"
        self.text_color = "#f8fafc"
        self.muted_color = "#94a3b8"
        self.success_color = "#10b981"

        # Determine default paths (relative to script or .exe location)
        if getattr(sys, 'frozen', False):
            self.base_dir = Path(sys.executable).parent
        else:
            self.base_dir = Path(__file__).parent.resolve()

        self.input_folder = tk.StringVar(value=str(self.base_dir / "input_images"))
        self.output_folder = tk.StringVar(value=str(self.base_dir / "converted"))
        self.target_format = tk.StringVar(value="jpeg")  # "jpeg" or "png"
        self.only_jpe = tk.BooleanVar(value=True)
        self.jpg_quality = tk.IntVar(value=92)
        self.is_converting = False

        self._configure_styles()
        self._build_ui()

    def _configure_styles(self):
        self.style.configure(".", background=self.bg_color, foreground=self.text_color)
        self.style.configure("Card.TFrame", background=self.card_bg, relief="flat")
        self.style.configure("TLabel", background=self.bg_color, foreground=self.text_color, font=("Segoe UI", 9))
        self.style.configure("Card.TLabel", background=self.card_bg, foreground=self.text_color, font=("Segoe UI", 9))
        self.style.configure("Header.TLabel", background=self.bg_color, foreground="#ffffff", font=("Segoe UI", 14, "bold"))
        self.style.configure("SubHeader.TLabel", background=self.bg_color, foreground=self.muted_color, font=("Segoe UI", 8))
        self.style.configure("TCheckbutton", background=self.card_bg, foreground=self.text_color, font=("Segoe UI", 9))
        self.style.configure("TRadiobutton", background=self.card_bg, foreground=self.text_color, font=("Segoe UI", 9))
        self.style.configure("Horizontal.TProgressbar", troughcolor="#334155", background=self.accent_color)

    def _build_ui(self):
        main_container = tk.Frame(self, bg=self.bg_color, padx=20, pady=16)
        main_container.pack(fill=tk.BOTH, expand=True)

        # 1. Header
        header_frame = tk.Frame(main_container, bg=self.bg_color)
        header_frame.pack(fill=tk.X, pady=(0, 14))
        tk.Label(header_frame, text="imgConvert", font=("Segoe UI", 16, "bold"), fg="#ffffff", bg=self.bg_color).pack(anchor="w")
        tk.Label(header_frame, text="Batch convert .jpe and image files directly to JPG or PNG on your PC", font=("Segoe UI", 9), fg=self.muted_color, bg=self.bg_color).pack(anchor="w")

        # 2. Folder Selection Card
        folder_card = tk.Frame(main_container, bg=self.card_bg, padx=14, pady=12, highlightthickness=1, highlightbackground="#334155")
        folder_card.pack(fill=tk.X, pady=(0, 12))

        # Input folder row
        tk.Label(folder_card, text="Input Folder:", font=("Segoe UI", 9, "bold"), fg=self.text_color, bg=self.card_bg).grid(row=0, column=0, sticky="w", pady=(0, 4))
        input_entry = tk.Entry(folder_card, textvariable=self.input_folder, bg="#0f172a", fg=self.text_color, insertbackground="white", relief="flat", highlightthickness=1, highlightbackground="#475569")
        input_entry.grid(row=0, column=1, sticky="ew", padx=8, pady=(0, 4))
        tk.Button(folder_card, text="Browse...", command=self._browse_input, bg="#334155", fg="white", activebackground="#475569", relief="flat", padx=10, pady=2, font=("Segoe UI", 8)).grid(row=0, column=2, pady=(0, 4))

        # Output folder row
        tk.Label(folder_card, text="Output Folder:", font=("Segoe UI", 9, "bold"), fg=self.text_color, bg=self.card_bg).grid(row=1, column=0, sticky="w", pady=(6, 0))
        output_entry = tk.Entry(folder_card, textvariable=self.output_folder, bg="#0f172a", fg=self.text_color, insertbackground="white", relief="flat", highlightthickness=1, highlightbackground="#475569")
        output_entry.grid(row=1, column=1, sticky="ew", padx=8, pady=(6, 0))
        tk.Button(folder_card, text="Browse...", command=self._browse_output, bg="#334155", fg="white", activebackground="#475569", relief="flat", padx=10, pady=2, font=("Segoe UI", 8)).grid(row=1, column=2, pady=(6, 0))

        folder_card.columnconfigure(1, weight=1)

        # 3. Settings Card
        settings_card = tk.Frame(main_container, bg=self.card_bg, padx=14, pady=12, highlightthickness=1, highlightbackground="#334155")
        settings_card.pack(fill=tk.X, pady=(0, 12))

        # Target Format Selection
        format_frame = tk.Frame(settings_card, bg=self.card_bg)
        format_frame.pack(fill=tk.X, pady=(0, 6))
        tk.Label(format_frame, text="Target Format:", font=("Segoe UI", 9, "bold"), fg=self.text_color, bg=self.card_bg).pack(side=tk.LEFT, padx=(0, 12))
        
        rb_jpg = tk.Radiobutton(format_frame, text="JPG / JPEG", variable=self.target_format, value="jpeg", bg=self.card_bg, fg=self.text_color, selectcolor="#0f172a", activebackground=self.card_bg, activeforeground="white", command=self._on_format_change)
        rb_jpg.pack(side=tk.LEFT, padx=8)
        rb_png = tk.Radiobutton(format_frame, text="PNG", variable=self.target_format, value="png", bg=self.card_bg, fg=self.text_color, selectcolor="#0f172a", activebackground=self.card_bg, activeforeground="white", command=self._on_format_change)
        rb_png.pack(side=tk.LEFT, padx=8)

        # Filter option
        filter_frame = tk.Frame(settings_card, bg=self.card_bg)
        filter_frame.pack(fill=tk.X, pady=(4, 6))
        cb_jpe = tk.Checkbutton(filter_frame, text="Convert only .jpe files (ignore other formats in folder)", variable=self.only_jpe, bg=self.card_bg, fg=self.text_color, selectcolor="#0f172a", activebackground=self.card_bg, activeforeground="white")
        cb_jpe.pack(side=tk.LEFT)

        # Quality slider frame (for JPG)
        self.quality_frame = tk.Frame(settings_card, bg=self.card_bg)
        self.quality_frame.pack(fill=tk.X, pady=(4, 0))
        tk.Label(self.quality_frame, text="JPG Quality:", font=("Segoe UI", 9, "bold"), fg=self.text_color, bg=self.card_bg).pack(side=tk.LEFT, padx=(0, 10))
        self.quality_slider = tk.Scale(self.quality_frame, from_=50, to=100, orient=tk.HORIZONTAL, variable=self.jpg_quality, bg=self.card_bg, fg=self.text_color, highlightthickness=0, troughcolor="#0f172a", activebackground=self.accent_color, length=180)
        self.quality_slider.pack(side=tk.LEFT)
        tk.Label(self.quality_frame, text="%", font=("Segoe UI", 9), fg=self.muted_color, bg=self.card_bg).pack(side=tk.LEFT, padx=(4, 0))

        # 4. Action Bar
        action_frame = tk.Frame(main_container, bg=self.bg_color)
        action_frame.pack(fill=tk.X, pady=(0, 10))

        self.btn_convert = tk.Button(
            action_frame,
            text="⚡ Start Conversion",
            command=self._start_conversion_thread,
            bg=self.accent_color,
            fg="white",
            activebackground="#4f46e5",
            activeforeground="white",
            relief="flat",
            font=("Segoe UI", 10, "bold"),
            padx=18,
            pady=8,
            cursor="hand2"
        )
        self.btn_convert.pack(side=tk.LEFT)

        self.btn_open_folder = tk.Button(
            action_frame,
            text="📂 Open Output Folder",
            command=self._open_output_folder,
            bg="#334155",
            fg="white",
            activebackground="#475569",
            relief="flat",
            font=("Segoe UI", 9),
            padx=12,
            pady=8,
            cursor="hand2"
        )
        self.btn_open_folder.pack(side=tk.RIGHT)

        # 5. Progress Bar
        self.progress_var = tk.DoubleVar(value=0)
        self.progressbar = ttk.Progressbar(main_container, variable=self.progress_var, maximum=100, style="Horizontal.TProgressbar")
        self.progressbar.pack(fill=tk.X, pady=(0, 6))

        self.status_label = tk.Label(main_container, text="Ready. Choose a folder and click Start Conversion.", font=("Segoe UI", 8), fg=self.muted_color, bg=self.bg_color)
        self.status_label.pack(anchor="w", pady=(0, 8))

        # 6. Log Console
        log_frame = tk.Frame(main_container, bg="#020617", highlightthickness=1, highlightbackground="#334155")
        log_frame.pack(fill=tk.BOTH, expand=True)

        self.log_text = tk.Text(log_frame, bg="#020617", fg="#cbd5e1", insertbackground="white", relief="flat", font=("Consolas", 9), padx=8, pady=8)
        scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def _browse_input(self):
        selected = filedialog.askdirectory(initialdir=self.input_folder.get(), title="Select Input Images Folder")
        if selected:
            self.input_folder.set(selected)

    def _browse_output(self):
        selected = filedialog.askdirectory(initialdir=self.output_folder.get(), title="Select Output Folder")
        if selected:
            self.output_folder.set(selected)

    def _on_format_change(self):
        if self.target_format.get() == "jpeg":
            self.quality_frame.pack(fill=tk.X, pady=(4, 0))
        else:
            self.quality_frame.pack_forget()

    def _log(self, message: str, color: str = None):
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)

    def _open_output_folder(self):
        out_path = Path(self.output_folder.get())
        out_path.mkdir(parents=True, exist_ok=True)
        try:
            if sys.platform == 'win32':
                os.startfile(str(out_path))
            elif sys.platform == 'darwin':
                import subprocess
                subprocess.Popen(['open', str(out_path)])
            else:
                import subprocess
                subprocess.Popen(['xdg-open', str(out_path)])
        except Exception as e:
            messagebox.showerror("Error", f"Could not open folder: {e}")

    def _start_conversion_thread(self):
        if self.is_converting:
            return
        thread = threading.Thread(target=self._run_conversion, daemon=True)
        thread.start()

    def _run_conversion(self):
        self.is_converting = True
        self.btn_convert.config(state=tk.DISABLED, text="⏳ Converting...")
        self.progress_var.set(0)
        self.log_text.delete("1.0", tk.END)

        in_dir = Path(self.input_folder.get())
        out_dir = Path(self.output_folder.get())

        in_dir.mkdir(parents=True, exist_ok=True)
        out_dir.mkdir(parents=True, exist_ok=True)

        # Collect files
        target_fmt = self.target_format.get()
        target_ext = "jpg" if target_fmt == "jpeg" else "png"
        only_jpe = self.only_jpe.get()

        valid_extensions = {".jpe"} if only_jpe else {".jpe", ".jpg", ".jpeg", ".png", ".webp", ".bmp"}

        files = [
            f for f in in_dir.iterdir()
            if f.is_file() and f.suffix.lower() in valid_extensions
        ]

        if not files:
            msg = f"[!] No matching image files found in:\n{in_dir.resolve()}"
            self._log(msg)
            self.status_label.config(text="No files found.")
            self.btn_convert.config(state=tk.NORMAL, text="⚡ Start Conversion")
            self.is_converting = False
            return

        self._log(f"Found {len(files)} image(s) to process.")
        self._log(f"Target format: .{target_ext.upper()} | Output folder: {out_dir.resolve()}\n")

        success_count = 0
        total = len(files)

        for idx, file_path in enumerate(files, 1):
            destination = out_dir / f"{file_path.stem}.{target_ext}"
            try:
                with Image.open(file_path) as img:
                    # Transparency / CMYK handling for JPG (matches your logic)
                    if target_fmt == "jpeg":
                        if img.mode in ("RGBA", "LA", "P", "CMYK"):
                            # Create white background to prevent dark transparent matte
                            background = Image.new("RGB", img.size, (255, 255, 255))
                            if img.mode == "RGBA":
                                background.paste(img, mask=img.split()[3])
                            else:
                                background.paste(img.convert("RGB"))
                            img = background
                        else:
                            img = img.convert("RGB")

                        img.save(destination, format="JPEG", quality=self.jpg_quality.get())
                    else:
                        img.save(destination, format="PNG")

                    self._log(f" [✓] {file_path.name}  ->  {destination.name}")
                    success_count += 1
            except Exception as err:
                self._log(f" [✗] Error converting {file_path.name}: {err}")

            pct = (idx / total) * 100
            self.progress_var.set(pct)
            self.status_label.config(text=f"Processed {idx}/{total} files ({int(pct)}%)")

        self._log(f"\nFinished! Converted {success_count}/{total} images.")
        self._log(f"Output saved to: {out_dir.resolve()}")
        self.status_label.config(text=f"Done! Converted {success_count}/{total} images.")

        self.btn_convert.config(state=tk.NORMAL, text="⚡ Start Conversion")
        self.is_converting = False

        if success_count > 0:
            messagebox.showinfo("Success", f"Successfully converted {success_count} images to .{target_ext.upper()}!")

if __name__ == "__main__":
    app = ImageConverterApp()
    app.mainloop()
