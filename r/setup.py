import sys
import os
from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but it might need fine tuning.
build_exe_options = {
    "packages": [
        "tkinter", 
        "hid", 
        "requests", 
        "sqlite3", 
        "PIL", 
        "pystray", 
        "plyer", 
        "pynput",
        "logging",
        "queue",
        "json",
        "winshell",  # For startup integration
        "win32com.client",  # For startup integration
        "urllib3",  # For better network handling
        "socket",  # For network monitoring
        "threading"
    ],
    "excludes": [],
    "include_files": [
        "config.json",
        "README.md",
        "requirements.txt",
        "run_attendance.bat",
        "icon.ico"
    ]
}

# Add DLLs needed for startup integration
if sys.platform == "win32":
    build_exe_options["include_msvcr"] = True

# GUI applications require a different base on Windows
base = None
if sys.platform == "win32":
    base = "Win32GUI"

setup(
    name="RFID Attendance System",
    version="1.0",
    description="RFID Attendance System Client",
    options={
        "build_exe": build_exe_options,
        "bdist_msi": {
            "add_to_path": True,
            "initial_target_dir": r"[ProgramFilesFolder]\RFID Attendance System",
            "install_icon": "icon.ico",
            "target_name": "RFID Attendance System",
            "data": {
                "Shortcut": [
                    ("DesktopShortcut",     # Shortcut
                     "DesktopFolder",        # Directory_
                     "RFID Attendance",      # Name
                     "TARGETDIR",            # Component_
                     "[TARGETDIR]RFIDAttendance.exe",   # Target
                     None,                   # Arguments
                     None,                   # Description
                     None,                   # Hotkey
                     None,                   # Icon
                     None,                   # IconIndex
                     None,                   # ShowCmd
                     "TARGETDIR"             # WkDir
                     ),
                    ("StartupShortcut",      # Shortcut for startup
                     "StartupFolder",        # Directory_
                     "RFID Attendance",      # Name
                     "TARGETDIR",            # Component_
                     "[TARGETDIR]RFIDAttendance.exe",   # Target
                     None,                   # Arguments
                     None,                   # Description
                     None,                   # Hotkey
                     None,                   # Icon
                     None,                   # IconIndex
                     None,                   # ShowCmd
                     "TARGETDIR"             # WkDir
                     )
                ]
            }
        }
    },
    executables=[
        Executable(
            "rfid_client.py", 
            base=base,
            target_name="RFIDAttendance.exe",
            icon="icon.ico",
            shortcut_name="RFID Attendance",
            shortcut_dir="DesktopFolder"
        )
    ]
) 