import tkinter as tk
from tkinter import ttk, messagebox
import hid
import requests
import sqlite3
from datetime import datetime, timezone, UTC
from pystray import Icon, Menu, MenuItem
from PIL import Image, ImageDraw
from plyer import notification
import threading
import logging
from logging.handlers import RotatingFileHandler
import time
import sys
import queue
import json
import os
from pynput import keyboard
import csv
import webbrowser

# ==============================================================================
# Configuration
# ==============================================================================
CONFIG_FILE = 'config.json'
DEFAULT_CONFIG = {
    "server_url": "http://localhost:3001/api/rfid/scan",
    "vendor_id": 0x0483,  # SYC ID&IC USB Reader vendor ID
    "product_id": 0x5750,  # SYC ID&IC USB Reader product ID
    "retry_interval": 30,
    "card_prefix": "000",
    "remove_prefix": False,
    "max_log_entries": 100
}

def load_config():
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                return {**DEFAULT_CONFIG, **json.load(f)}
    except Exception as e:
        logger.error(f"Error loading config: {e}")
    return DEFAULT_CONFIG.copy()

def save_config(config):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=4)
    except Exception as e:
        logger.error(f"Error saving config: {e}")

# Load configuration
CONFIG = load_config()

# ==============================================================================
# Database Setup
# ==============================================================================
DB_PATH = 'rfid_data.db'
LOG_PATH = 'rfid_reader.log'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        
        # Drop existing table if it exists
        c.execute("DROP TABLE IF EXISTS unsent_data")
        
        # Create table with proper timestamp format
        c.execute('''
            CREATE TABLE IF NOT EXISTS unsent_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                sync_attempts INTEGER DEFAULT 0
            )
        ''')
        conn.commit()

# ==============================================================================
# Logging Setup
# ==============================================================================
handler = RotatingFileHandler(LOG_PATH, maxBytes=5 * 1024 * 1024, backupCount=5)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)

# ==============================================================================
# Settings Dialog
# ==============================================================================
class SettingsDialog:
    def __init__(self, parent):
        self.dialog = tk.Toplevel(parent)
        self.dialog.title("Settings")
        self.dialog.geometry("400x500")  # Made taller for debug info
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        # Create variables for settings
        self.server_url = tk.StringVar(value=CONFIG["server_url"])
        self.vendor_id = tk.StringVar(value=f"0x{CONFIG['vendor_id']:04x}")
        self.product_id = tk.StringVar(value=f"0x{CONFIG['product_id']:04x}")
        self.retry_interval = tk.StringVar(value=str(CONFIG["retry_interval"]))
        self.card_prefix = tk.StringVar(value=CONFIG["card_prefix"])
        self.remove_prefix = tk.BooleanVar(value=CONFIG["remove_prefix"])
        self.max_log_entries = tk.StringVar(value=str(CONFIG["max_log_entries"]))
        
        self.setup_gui()
        
    def setup_gui(self):
        main_frame = ttk.Frame(self.dialog, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Server Settings
        server_frame = ttk.LabelFrame(main_frame, text="Server Settings", padding="5")
        server_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(server_frame, text="Server URL:").pack(anchor=tk.W)
        ttk.Entry(server_frame, textvariable=self.server_url, width=40).pack(fill=tk.X, pady=2)
        
        ttk.Label(server_frame, text="Retry Interval (seconds):").pack(anchor=tk.W, pady=(5,0))
        ttk.Entry(server_frame, textvariable=self.retry_interval, width=10).pack(anchor=tk.W, pady=2)
        
        # Reader Settings
        reader_frame = ttk.LabelFrame(main_frame, text="Reader Settings", padding="5")
        reader_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(reader_frame, text="Vendor ID (hex):").pack(anchor=tk.W)
        ttk.Entry(reader_frame, textvariable=self.vendor_id, width=10).pack(anchor=tk.W, pady=2)
        
        ttk.Label(reader_frame, text="Product ID (hex):").pack(anchor=tk.W, pady=(5,0))
        ttk.Entry(reader_frame, textvariable=self.product_id, width=10).pack(anchor=tk.W, pady=2)
        
        ttk.Label(reader_frame, text="Card Prefix:").pack(anchor=tk.W, pady=(5,0))
        ttk.Entry(reader_frame, textvariable=self.card_prefix, width=10).pack(anchor=tk.W, pady=2)
        
        ttk.Checkbutton(reader_frame, text="Remove Prefix", variable=self.remove_prefix).pack(anchor=tk.W, pady=5)
        
        # Display Settings
        display_frame = ttk.LabelFrame(main_frame, text="Display Settings", padding="5")
        display_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(display_frame, text="Max Log Entries:").pack(anchor=tk.W)
        ttk.Entry(display_frame, textvariable=self.max_log_entries, width=10).pack(anchor=tk.W, pady=2)
        
        # Debug Frame
        debug_frame = ttk.LabelFrame(main_frame, text="Debug Information", padding="5")
        debug_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.debug_text = tk.Text(debug_frame, height=6, wrap=tk.WORD)
        debug_scroll = ttk.Scrollbar(debug_frame, orient="vertical", command=self.debug_text.yview)
        self.debug_text.configure(yscrollcommand=debug_scroll.set)
        
        self.debug_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        debug_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        ttk.Button(debug_frame, text="List HID Devices", command=self.list_hid_devices).pack(pady=5)
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, padx=5, pady=10)
        
        ttk.Button(button_frame, text="Save", command=self.save_settings).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=self.dialog.destroy).pack(side=tk.RIGHT)
    
    def list_hid_devices(self):
        self.debug_text.delete(1.0, tk.END)
        try:
            devices = hid.enumerate()
            self.debug_text.insert(tk.END, f"Found {len(devices)} HID devices:\n\n")
            for device in devices:
                self.debug_text.insert(tk.END, 
                    f"Vendor ID: 0x{device.get('vendor_id', 0):04x}\n"
                    f"Product ID: 0x{device.get('product_id', 0):04x}\n"
                    f"Product: {device.get('product_string', 'N/A')}\n"
                    f"Manufacturer: {device.get('manufacturer_string', 'N/A')}\n"
                    f"-------------------\n"
                )
        except Exception as e:
            self.debug_text.insert(tk.END, f"Error listing devices: {str(e)}")
    
    def validate_settings(self):
        try:
            if not self.server_url.get().startswith(('http://', 'https://')):
                raise ValueError("Server URL must start with http:// or https://")
            
            # Validate vendor ID and product ID (hex values)
            try:
                vendor_id = int(self.vendor_id.get(), 16)
                product_id = int(self.product_id.get(), 16)
            except ValueError:
                raise ValueError("Vendor ID and Product ID must be valid hexadecimal values")
            
            retry = int(self.retry_interval.get())
            if retry < 1:
                raise ValueError("Retry interval must be at least 1 second")
                
            max_logs = int(self.max_log_entries.get())
            if max_logs < 10:
                raise ValueError("Max log entries must be at least 10")
            
            return True
        except ValueError as e:
            messagebox.showerror("Invalid Settings", str(e))
            return False
    
    def save_settings(self):
        if not self.validate_settings():
            return
            
        CONFIG.update({
            "server_url": self.server_url.get(),
            "vendor_id": int(self.vendor_id.get(), 16),
            "product_id": int(self.product_id.get(), 16),
            "retry_interval": int(self.retry_interval.get()),
            "card_prefix": self.card_prefix.get(),
            "remove_prefix": self.remove_prefix.get(),
            "max_log_entries": int(self.max_log_entries.get())
        })
        
        save_config(CONFIG)
        self.dialog.destroy()
        messagebox.showinfo("Settings Saved", "Settings have been saved successfully.\nSome changes may require a restart to take effect.")

# ==============================================================================
# GUI Class
# ==============================================================================
class NotificationWindow:
    def __init__(self, root, message, status="success"):
        self.window = tk.Toplevel(root)
        self.window.overrideredirect(True)  # Remove window decorations
        
        # Calculate position (bottom right corner)
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        window_width = 300
        window_height = 100
        x_position = screen_width - window_width - 20
        y_position = screen_height - window_height - 60
        
        self.window.geometry(f"{window_width}x{window_height}+{x_position}+{y_position}")
        self.window.attributes('-topmost', True)  # Keep window on top
        
        # Background color based on status
        bg_color = {
            "success": "#4CAF50",  # Green
            "warning": "#FFA500",  # Orange
            "error": "#F44336"     # Red
        }.get(status, "#2196F3")   # Blue (default)
        
        self.window.configure(bg=bg_color)
        
        # Add padding frame
        frame = tk.Frame(self.window, bg=bg_color, padx=10, pady=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Message label with word wrap
        label = tk.Label(frame, text=message, bg=bg_color, fg="white",
                        font=("Arial", 12, "bold"), wraplength=280,
                        justify=tk.CENTER)
        label.pack(expand=True)
        
        # Auto-close after 5 seconds
        self.window.after(5000, self.close)
    
    def close(self):
        self.window.destroy()

class RFIDClientGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("RFID Attendance System")
        self.root.geometry("600x400")
        self.root.protocol("WM_DELETE_WINDOW", self.hide_window)
        self.root.minsize(400, 300)
        
        # Initialize variables first
        self.message_queue = queue.Queue()
        self.card_buffer = ""
        self.reader_connected = False
        self.server_connected = False
        self.last_card_scans = {}  # Dictionary to track last scan time for each card
        self.cooldown_period = 20  # 20 seconds cooldown
        self.auto_sync_enabled = tk.BooleanVar(value=True)  # Initialize before setup_gui
        
        # Create system tray icon
        self.create_tray_icon()
        
        # Setup GUI components
        self.setup_gui()
        self.update_gui()
        
        # Setup keyboard listener
        self.keyboard_listener = keyboard.Listener(
            on_press=self.on_key_press,
            on_release=self.on_key_release
        )
        self.keyboard_listener.start()
        
    def create_tray_icon(self):
        # Create system tray icon
        image = Image.new('RGB', (64, 64), color='green')
        draw = ImageDraw.Draw(image)
        draw.rectangle([0, 0, 63, 63], outline='white')
        
        menu = Menu(
            MenuItem('Show', self.show_window),
            MenuItem('Exit', self.quit_application)
        )
        
        self.tray_icon = Icon(
            'RFID Attendance',
            image,
            'RFID Attendance System',
            menu
        )
        
        # Start tray icon in a separate thread
        threading.Thread(target=self.tray_icon.run, daemon=True).start()
    
    def hide_window(self):
        """Minimize to system tray instead of closing"""
        self.root.withdraw()  # Hide the window
        self.tray_icon.notify(
            'Application Minimized',
            'RFID Attendance System is still running in the background'
        )
    
    def show_window(self):
        """Show the window from system tray"""
        self.root.deiconify()  # Show the window
        self.root.lift()  # Bring to front
        self.root.focus_force()  # Force focus
    
    def quit_application(self):
        """Properly quit the application"""
        if messagebox.askokcancel("Quit", "Are you sure you want to quit?"):
            self.tray_icon.stop()
            self.root.quit()
    
    def on_key_press(self, key):
        try:
            if hasattr(key, 'char') and key.char is not None:
                # Only accept numeric input
                if key.char.isdigit():
                    self.card_buffer += key.char
        except AttributeError:
            pass

    def on_key_release(self, key):
        if key == keyboard.Key.enter and self.card_buffer:
            # Process the card number
            card_id = self.card_buffer
            self.card_buffer = ""  # Clear the buffer
            
            # Validate card number
            if len(card_id) < 4:  # Minimum card length
                self.add_log_entry("Invalid card number - too short", "error")
                self.show_notification("Invalid card number - too short", "error")
                return
            
            process_card_data(card_id, self)

    def setup_gui(self):
        # Menu Bar
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File Menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Settings", command=self.show_settings)
        file_menu.add_command(label="Hide to Tray", command=self.hide_window)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.quit_application)

        # Offline Menu
        offline_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Offline", menu=offline_menu)
        offline_menu.add_checkbutton(
            label="Auto Sync",
            variable=self.auto_sync_enabled,
            command=self.toggle_auto_sync
        )
        offline_menu.add_separator()
        offline_menu.add_command(label="View Offline Records", command=self.show_offline_records)
        offline_menu.add_command(label="Manual Sync", command=self.sync_offline_records)
        offline_menu.add_command(label="Export Offline Data", command=self.export_offline_data)
        offline_menu.add_separator()
        offline_menu.add_command(label="Clear Offline Data", command=self.clear_offline_data)

        # Status Frame
        status_frame = ttk.LabelFrame(self.root, text="System Status", padding="5")
        status_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.reader_status = ttk.Label(status_frame, text="Reader: Disconnected")
        self.reader_status.pack(side=tk.LEFT, padx=5)
        
        self.server_status = ttk.Label(status_frame, text="Server: Disconnected")
        self.server_status.pack(side=tk.LEFT, padx=5)
        
        # Recent Scans Frame
        scans_frame = ttk.LabelFrame(self.root, text="Recent Scans", padding="5")
        scans_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.log_text = tk.Text(scans_frame, height=10, wrap=tk.WORD)
        scrollbar = ttk.Scrollbar(scans_frame, orient="vertical", command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Control Frame
        control_frame = ttk.Frame(self.root)
        control_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(control_frame, text="Clear Logs", command=self.clear_logs).pack(side=tk.RIGHT)
    
    def show_settings(self):
        SettingsDialog(self.root)
    
    def update_status(self, reader_connected=None, server_connected=None):
        if reader_connected is not None:
            self.reader_connected = reader_connected
            status_text = "Reader: Connected" if reader_connected else "Reader: Disconnected"
            status_color = "green" if reader_connected else "red"
            self.reader_status.configure(text=status_text, foreground=status_color)
            
        if server_connected is not None:
            self.server_connected = server_connected
            status_text = "Server: Connected" if server_connected else "Server: Disconnected"
            status_color = "green" if server_connected else "red"
            self.server_status.configure(text=status_text, foreground=status_color)
    
    def add_log_entry(self, message, status="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = {
            "success": "green",
            "error": "red",
            "warning": "orange",
            "info": "black"
        }.get(status, "black")
        
        # Format the message based on content
        if "Card scanned:" in message:
            # Don't add the card number to a new line
            formatted_message = f"[{timestamp}] {message}"
            msg_color = "black"
        elif "successful" in message.lower():
            formatted_message = f"[{timestamp}] {message}"
            msg_color = "green"
        elif "RFID Reader not found" in message:
            formatted_message = f"[{timestamp}] {message}"
            msg_color = "orange"
        else:
            formatted_message = f"[{timestamp}] {message}"
            msg_color = color
        
        self.message_queue.put((formatted_message, msg_color))
    
    def update_gui(self):
        try:
            while True:
                message, color = self.message_queue.get_nowait()
                self.log_text.insert(tk.END, message + "\n")
                last_line_start = self.log_text.index("end-2c linestart")
                last_line_end = self.log_text.index("end-1c")
                self.log_text.tag_add(color, last_line_start, last_line_end)
                self.log_text.tag_config(color, foreground=color)
                self.log_text.see(tk.END)
                
                while int(self.log_text.index('end-1c').split('.')[0]) > CONFIG["max_log_entries"]:
                    self.log_text.delete('1.0', '2.0')
        except queue.Empty:
            pass
        finally:
            self.root.after(100, self.update_gui)
    
    def clear_logs(self):
        self.log_text.delete(1.0, tk.END)
    
    def on_closing(self):
        if messagebox.askokcancel("Quit", "Do you want to quit?"):
            self.root.quit()
    
    def show_notification(self, message, status="success"):
        """Show a popup notification window"""
        NotificationWindow(self.root, message, status)

    def show_offline_records(self):
        """Show window with offline records"""
        offline_window = tk.Toplevel(self.root)
        offline_window.title("Offline Records")
        offline_window.geometry("600x400")
        
        # Create treeview
        columns = ("Timestamp", "Card ID", "Status")
        tree = ttk.Treeview(offline_window, columns=columns, show="headings")
        
        # Set column headings
        for col in columns:
            tree.heading(col, text=col)
            tree.column(col, width=100)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(offline_window, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        
        # Load data
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            for row in c.execute("SELECT timestamp, card_id, 'Pending' FROM unsent_data ORDER BY timestamp DESC"):
                tree.insert("", "end", values=row)
        
        # Pack widgets
        tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

    def sync_offline_records(self):
        """Manually sync offline records with server"""
        if not self.auto_sync_enabled.get():
            self.add_log_entry("Auto-sync is disabled, skipping sync", "warning")
            return
            
        try:
            with sqlite3.connect(DB_PATH) as conn:
                c = conn.cursor()
                records = c.execute("""
                    SELECT id, card_id, timestamp, created_at 
                    FROM unsent_data 
                    ORDER BY timestamp
                """).fetchall()
                
                if not records:
                    self.show_notification("No offline records to sync", "info")
                    return
                
                success_count = 0
                fail_count = 0
                unregistered_cards = set()  # Track unregistered cards
                
                for record_id, card_id, timestamp, created_at in records:
                    try:
                        # Send the scan request in the same format as real-time scans
                        payload = {
                            "cardNumber": card_id,
                            "timestamp": timestamp,
                            "source": "RFIDO"  # Offline sync
                        }
                        
                        response = requests.post(
                            CONFIG["server_url"], 
                            json=payload,
                            headers={"Content-Type": "application/json"},
                            timeout=CONFIG["network"]["timeout"]
                        )
                        
                        if response.status_code == 201:  # Success
                            # Delete successful record
                            c.execute("DELETE FROM unsent_data WHERE id = ?", (record_id,))
                            conn.commit()
                            success_count += 1
                            
                            # Log the successful sync
                            try:
                                response_data = response.json()
                                attendance = response_data.get('attendance', {})
                                agent_name = attendance.get('agent', {}).get('name', 'Unknown')
                                action = attendance.get('action', 'UNKNOWN')
                                status = attendance.get('status', 'UNKNOWN')
                                sync_message = f"Synced offline record: {agent_name} - {action} ({status})"
                                self.add_log_entry(sync_message, "success")
                            except Exception as e:
                                logger.error(f"Error parsing sync response: {e}")
                                sync_message = f"Synced offline record for card {card_id}"
                                self.add_log_entry(sync_message, "success")
                            
                        elif response.status_code == 404:  # Card not registered
                            fail_count += 1
                            unregistered_cards.add(card_id)
                            message = f"Card {card_id} not registered in system"
                            self.add_log_entry(message, "warning")
                            # Don't delete the record yet
                            
                        else:  # Other errors
                            fail_count += 1
                            error_message = f"Failed to sync card {card_id}: {response.status_code}"
                            self.add_log_entry(error_message, "warning")
                            
                    except requests.exceptions.RequestException as e:
                        fail_count += 1
                        error_message = f"Network error syncing card {card_id}: {str(e)}"
                        self.add_log_entry(error_message, "error")
                        continue
                    except Exception as e:
                        fail_count += 1
                        error_message = f"Error syncing card {card_id}: {str(e)}"
                        self.add_log_entry(error_message, "error")
                        continue
                    
                    # Small delay between syncs
                    time.sleep(0.5)
                
                # Show summary of unregistered cards without prompt
                if unregistered_cards:
                    unregistered_message = f"Found {len(unregistered_cards)} unregistered cards: {', '.join(sorted(unregistered_cards))}"
                    self.add_log_entry(unregistered_message, "warning")
                
                final_message = f"Sync complete: {success_count} succeeded, {fail_count} failed"
                if unregistered_cards:
                    final_message += f"\n{len(unregistered_cards)} cards need registration"
                self.show_notification(final_message, "success" if fail_count == 0 else "warning")
                
        except Exception as e:
            error_message = f"Sync error: {str(e)}"
            self.show_notification(error_message, "error")
            logger.error(error_message)

    def export_offline_data(self):
        """Export offline data to CSV"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"offline_records_{timestamp}.csv"
            
            with sqlite3.connect(DB_PATH) as conn:
                c = conn.cursor()
                records = c.execute("SELECT timestamp, card_id FROM unsent_data ORDER BY timestamp").fetchall()
                
                if not records:
                    self.show_notification("No offline records to export", "info")
                    return
                
                with open(filename, 'w', newline='') as csvfile:
                    writer = csv.writer(csvfile)
                    writer.writerow(["Timestamp", "Card ID"])
                    writer.writerows(records)
                
                self.show_notification(f"Data exported to {filename}", "success")
                
        except Exception as e:
            self.show_notification(f"Export error: {str(e)}", "error")

    def clear_offline_data(self):
        """Clear all offline data after confirmation"""
        if not messagebox.askyesno("Confirm", "Are you sure you want to clear all offline data?"):
            return
        
        try:
            with sqlite3.connect(DB_PATH) as conn:
                c = conn.cursor()
                c.execute("DELETE FROM unsent_data")
                conn.commit()
                
            self.show_notification("Offline data cleared", "success")
            
        except Exception as e:
            self.show_notification(f"Error clearing data: {str(e)}", "error")

    def toggle_auto_sync(self):
        """Toggle automatic offline sync"""
        if self.auto_sync_enabled.get():
            self.add_log_entry("Automatic offline sync enabled", "info")
        else:
            self.add_log_entry("Automatic offline sync disabled", "warning")

# ==============================================================================
# Utility Functions
# ==============================================================================
def find_hid_device():
    """Find the RFID reader HID device."""
    try:
        devices = hid.enumerate()
        logger.info(f"Found {len(devices)} HID devices")
        
        for device in devices:
            if (device.get('vendor_id') == CONFIG["vendor_id"] and 
                device.get('product_id') == CONFIG["product_id"]):
                logger.info(f"Found RFID reader: {device}")
                return device
                
        logger.warning(f"No RFID reader found with vendor_id=0x{CONFIG['vendor_id']:04x}, product_id=0x{CONFIG['product_id']:04x}")
        return None
    except Exception as e:
        logger.error(f"Error finding HID device: {e}")
        return None

def format_card_number(card_number):
    """Format the card number according to system requirements."""
    try:
        # Convert to string and strip whitespace
        card_number = str(card_number).strip()
        
        # Log original input
        logger.debug(f"Formatting card number: {card_number}")
        
        # Basic validation
        if not card_number:
            logger.warning("Empty card number")
            return None
            
        # Only validate length, keep original format
        if len(card_number) < 4:
            logger.warning(f"Card number too short: {card_number}")
            return None
            
        logger.debug(f"Final formatted card number: {card_number}")
        return card_number
        
    except Exception as e:
        logger.error(f"Error formatting card number: {str(e)}")
        return None

def store_card(card_id):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        # Store timestamp in UTC format using timezone-aware datetime
        timestamp = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        c.execute("INSERT INTO unsent_data (card_id, timestamp) VALUES (?, ?)", (card_id, timestamp))
        conn.commit()

def show_popup(message):
    try:
        notification.notify(
            title="Attendance System",
            message=message,
            timeout=5
        )
    except Exception as e:
        logger.error(f"Error showing notification: {e}")

# ==============================================================================
# Main Program Entry Point
# ==============================================================================
def check_server_connection():
    """Check if the server is accessible"""
    try:
        # Try to check if the server is available by making a simple request
        base_url = CONFIG["server_url"].rsplit('/', 1)[0]  # Remove '/scan' from the end
        response = requests.get(
            f"{base_url}/check/test",
            timeout=CONFIG["network"]["timeout"]
        )
        return response.status_code in [200, 404]  # 404 is ok because it means server is up but card not found
    except requests.exceptions.RequestException:
        return False
    except Exception as e:
        logger.error(f"Error checking server connection: {e}")
        return False

def main():
    init_db()
    root = tk.Tk()
    gui = RFIDClientGUI(root)
    
    def check_network_and_sync():
        """Monitor network connection and sync offline records"""
        last_sync_time = 0
        while True:
            try:
                server_available = check_server_connection()
                
                if server_available:
                    gui.update_status(server_connected=True)
                    
                    # Check if it's time to sync
                    current_time = time.time()
                    if current_time - last_sync_time >= CONFIG["network"]["sync_interval"]:
                        # Check if there are offline records to sync
                        with sqlite3.connect(DB_PATH) as conn:
                            c = conn.cursor()
                            count = c.execute("SELECT COUNT(*) FROM unsent_data").fetchone()[0]
                            
                            if count > 0 and gui.auto_sync_enabled.get():
                                gui.add_log_entry(f"Found {count} offline records, starting auto-sync...", "info")
                                gui.sync_offline_records()
                                last_sync_time = current_time
                else:
                    gui.update_status(server_connected=False)
                    gui.add_log_entry("Server connection lost - working offline", "warning")
            except Exception as e:
                logger.error(f"Error in network monitor: {e}")
            
            # Wait for the configured interval before next check
            time.sleep(CONFIG["network"]["check_interval"])
    
    def check_reader_connection():
        while True:
            try:
                device_info = find_hid_device()
                if device_info:
                    gui.update_status(reader_connected=True)
                    try:
                        device = hid.device()
                        device.open_path(device_info['path'])
                        device.set_nonblocking(True)
                        gui.add_log_entry("RFID Reader connected successfully", "success")
                        
                        while True:
                            try:
                                data = device.read(64)
                                if data:
                                    card_id = ''.join(chr(d) for d in data if d > 0)
                                    process_card_data(card_id, gui)
                            except Exception as e:
                                logger.error(f"Error reading HID data: {e}")
                                gui.add_log_entry(f"Error reading card: {str(e)}", "error")
                                break
                            time.sleep(0.1)
                            
                    except Exception as e:
                        logger.error(f"Error initializing HID device: {e}")
                        gui.add_log_entry(f"Error connecting to reader: {str(e)}", "error")
                else:
                    gui.update_status(reader_connected=False)
                    if not hasattr(gui, 'keyboard_mode_notified'):
                        gui.add_log_entry("RFID Reader not found, using keyboard mode", "warning")
                        gui.keyboard_mode_notified = True
            except Exception as e:
                logger.error(f"Error in reader thread: {e}")
                gui.add_log_entry(f"Reader error: {str(e)}", "error")
            
            time.sleep(CONFIG["retry_interval"])
    
    # Start reader monitoring thread
    reader_thread = threading.Thread(target=check_reader_connection, daemon=True)
    reader_thread.start()
    
    # Start network monitoring and auto-sync thread
    network_thread = threading.Thread(target=check_network_and_sync, daemon=True)
    network_thread.start()
    
    root.mainloop()

def process_card_data(card_id, gui):
    try:
        # Log the original card number for debugging
        logger.debug(f"Original card: {card_id}")
        
        # Basic validation
        if not card_id or not isinstance(card_id, str):
            logger.warning(f"Invalid card number detected: {card_id}")
            gui.add_log_entry("Invalid card number", "error")
            return

        # Format card number
        formatted_card = format_card_number(card_id)
        logger.debug(f"Formatted card: {formatted_card}")
        
        if not formatted_card:
            logger.warning(f"Invalid card number format: {card_id}")
            gui.add_log_entry("Invalid card number format", "error")
            return
        
        # Check cooldown
        current_time = time.time()
        last_scan_time = gui.last_card_scans.get(formatted_card, 0)
        time_since_last_scan = current_time - last_scan_time
        
        if time_since_last_scan < 20:  # 20 seconds cooldown
            time_left = int(20 - time_since_last_scan)
            message = f"Please wait {time_left} seconds before scanning this card again"
            logger.debug(f"Cooldown active: {message}")
            gui.add_log_entry(message, "warning")
            return
        
        # Update last scan time
        gui.last_card_scans[formatted_card] = current_time
        
        # Log the scan attempt
        logger.debug(f"Attempting to send card {formatted_card} to {CONFIG['server_url']}")
        
        try:
            # Send request to server
            response = requests.post(
                CONFIG['server_url'],  # Use the full URL from config
                json={
                    "cardNumber": formatted_card,
                    "timestamp": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "source": "RFIDR"
                },
                headers={"Content-Type": "application/json"},
                timeout=CONFIG["network"]["timeout"]
            )
            
            # Log the server response
            logger.debug(f"Server response: {response.status_code} - {response.text}")
            
            if response.status_code == 201:  # Success
                gui.update_status(server_connected=True)
                response_data = response.json()
                
                if response_data.get('success'):
                    attendance = response_data.get('attendance', {})
                    agent_name = attendance.get('agent', {}).get('name', 'Unknown')
                    action = attendance.get('action', 'UNKNOWN')
                    status = attendance.get('status', 'UNKNOWN')
                    
                    message = f"{agent_name}: {action} ({status})"
                    gui.add_log_entry(message, "success")
                    gui.show_notification(message, "success")
                else:
                    logger.error(f"Server error: {response_data.get('message', 'Unknown error')}")
                    gui.add_log_entry("Server error", "error")
                    store_card(formatted_card)
                    
            elif response.status_code == 404:  # Card not found
                message = f"Card {formatted_card} not registered in system"
                logger.warning(message)
                gui.add_log_entry(message, "warning")
                gui.show_notification(message, "warning")
                
            else:  # Other errors
                logger.error(f"Server error ({response.status_code}): {response.text}")
                store_card(formatted_card)
                gui.add_log_entry("Network error - saving offline", "warning")
                gui.show_notification("Card stored for later sync", "warning")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error: {str(e)}")
            store_card(formatted_card)
            gui.add_log_entry("Network error - saving offline", "warning")
            gui.show_notification("Card stored for later sync", "warning")
            gui.update_status(server_connected=False)
            
    except Exception as e:
        logger.error(f"Unexpected error processing card: {str(e)}")
        gui.add_log_entry(f"Error processing card: {str(e)}", "error")
        gui.show_notification("Error processing card", "error")

if __name__ == "__main__":
    main()
