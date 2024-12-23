# RFID Attendance System

A comprehensive attendance management system using RFID technology, with both web-based and desktop interfaces.

## Features

### Web Interface
- **User Management**: Admin, HR, and Manager roles with different access levels
- **Agent Management**: Add, edit, and delete agents with RFID card assignments
- **Office Management**: Configure multiple offices with custom check-in/out times
- **Attendance History**: View and export detailed attendance records
- **Manual Entry**: HR can manually record attendance when needed
- **Real-time Updates**: Live status updates for check-ins and check-outs
- **Working Hours Calculation**: Automatic calculation of working hours
- **Status Tracking**: ON_TIME, LATE, and EARLY status indicators

### Desktop RFID Client
- **Real-time RFID Scanning**: Instant card detection and processing
- **Offline Mode**: Continues working during server disconnections
- **Auto-sync**: Automatically syncs offline records when connection is restored
- **System Tray Integration**: Minimizes to system tray for background operation
- **Visual Notifications**: Clear status indicators for scan results
- **Cooldown Protection**: Prevents accidental double scans
- **Error Recovery**: Automatic reconnection and error handling

## System Requirements

### Server (Backend)
- Node.js 14+
- PostgreSQL 12+
- NestJS Framework
- Prisma ORM

### Web Client (Frontend)
- React 18+
- Material-UI
- TypeScript
- Modern web browser

### Desktop Client
- Python 3.8+
- Windows 10/11
- Required Python packages:
  - hidapi==0.14.0
  - requests==2.31.0
  - Pillow==10.0.0
  - pystray==0.19.4
  - plyer==2.1.0
  - pynput==1.7.6

## Installation

### Backend Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/attendance"
   JWT_SECRET="your-secret-key"
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the server:
   ```bash
   npm run start:dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Configure API endpoint in `.env`:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Desktop Client Setup
1. Navigate to RFID client directory:
   ```bash
   cd r
   ```
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure `config.json` with your server settings
4. Run the client:
   ```bash
   python rfid_client.py
   ```

## Creating Installer

To create a Windows installer:

1. Install cx_Freeze:
   ```bash
   pip install cx_Freeze
   ```
2. Run the setup script:
   ```bash
   python setup.py bdist_msi
   ```
3. Find the installer in the `dist` directory

## Usage

### Web Interface
1. Access the web interface at `http://localhost:3000`
2. Log in with your credentials
3. Use the navigation menu to access different features
4. For HR:
   - Add/edit agents and assign RFID cards
   - View attendance records
   - Make manual entries when needed

### Desktop Client
1. Start the RFID client application
2. The application will minimize to system tray
3. Scan RFID cards to record attendance
4. Check the logs for scan results
5. Right-click the tray icon for additional options

## Troubleshooting

### Common Issues
1. **RFID Reader Not Detected**
   - Check USB connection
   - Verify correct vendor_id and product_id in config.json
   - Ensure proper drivers are installed

2. **Server Connection Issues**
   - Verify server URL in config.json
   - Check network connectivity
   - Ensure server is running

3. **Card Not Recognized**
   - Verify card is registered in the system
   - Check card format settings
   - Try rescanning the card

### Error Recovery
- The system automatically stores offline scans
- Records will sync when connection is restored
- Check logs for detailed error messages

## Security

- All API endpoints are protected with JWT authentication
- Role-based access control for different user types
- Secure password hashing
- RFID card data encryption
- Session management and timeout

## Support

For support and bug reports, please create an issue in the repository or contact the system administrator.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
