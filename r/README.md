# RFID Attendance System Client

## Overview
RFID Attendance System Client is a Windows application that manages employee attendance using RFID cards. The application supports both RFID reader hardware and manual card number input.

## Installation Options

### Option 1: MSI Installer (Recommended)
1. Download the `RFIDAttendance.msi` installer
2. Double-click to run the installer
3. Follow the installation wizard
4. The application will automatically:
   - Install all required dependencies
   - Create desktop and start menu shortcuts
   - Configure Windows startup
   - Set up necessary files and folders

### Option 2: Manual Installation
If you prefer manual installation or need a custom setup, follow these steps:

#### System Requirements
- Windows 10 or later
- Python 3.8 or later
- USB port (for RFID reader)
- Internet connection (for server communication)

#### Installation Steps
1. Install Python from [python.org](https://www.python.org/downloads/)
2. During installation, check "Add Python to PATH"
3. Open Command Prompt as Administrator
4. Navigate to the application folder
5. Run: `pip install -r requirements.txt`

## Configuration

### First-Time Setup
1. After installation, run the application from:
   - Desktop shortcut (MSI installation)
   - Start menu (MSI installation)
   - `run_attendance.bat` (Manual installation)

2. The application will create a default `config.json`
3. Edit `config.json` to set your server URL:
   ```json
   {
     "server_url": "http://your-server:3001/api/rfid/scan",
     "vendor_id": "0x0483",
     "product_id": "0x5750"
   }
   ```

### RFID Reader Setup
1. Connect the SYC ID&IC USB RFID Reader
2. Windows will automatically install drivers
3. The application will detect the reader automatically

## Features
- Real-time attendance tracking
- System tray operation
- Automatic server synchronization
- Offline mode with local storage
- Visual and sound notifications
- 20-second cooldown between same card scans
- Automatic startup with Windows

## Troubleshooting

### RFID Reader Not Detected
1. Check USB connection
2. Open application settings
3. Click "List HID Devices"
4. Verify vendor and product IDs match your reader
5. Update config.json if needed

### Connection Issues
1. Verify server URL in config.json
2. Check internet connection
3. Verify server is running
4. Check Windows Firewall settings

### Card Not Reading
1. Try manual input mode
2. Check card format in settings
3. Verify card prefix settings
4. Try re-scanning after 20 seconds

## File Locations

### MSI Installation
- Program Files: `C:\Program Files\RFID Attendance System\`
- Configuration: `%APPDATA%\RFID Attendance System\`
- Logs: `%APPDATA%\RFID Attendance System\logs\`
- Database: `%APPDATA%\RFID Attendance System\data\`

### Manual Installation
- All files in installation directory
- `rfid_reader.log` in installation directory
- `rfid_data.db` in installation directory

## Maintenance
- Logs are automatically rotated
- Database is backed up daily
- Updates can be installed via MSI
- Clear logs via application interface

## Security Notes
- Application runs with user privileges
- Database is not encrypted
- API keys should be kept secure
- Regular updates recommended

## Building from Source
To build the MSI installer:
1. Install required build tools:
   ```
   pip install cx_Freeze
   ```
2. Run the build script:
   ```
   python setup.py bdist_msi
   ```
3. Find the MSI in `dist` folder

## Contact
For support, contact your system administrator or the development team. 