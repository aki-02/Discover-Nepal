# Admin Panel - Documentation

## Overview

The Admin Panel is a comprehensive management interface for Discover Nepal that allows administrators to manage users, view statistics, and monitor system health. It follows modern UI/UX principles inspired by shadcn/ui.

## Features

### Dashboard
- **Statistics Overview**: View total users, active users, users joined today, and system status
- **Recent Users**: See the 5 most recently joined users with their details
- **Quick Actions**: Fast access to common tasks (Add User, View All Users, Backup Data)

### User Management
- **User Table**: View all registered users with their information
- **Search & Filter**: Search users by name or email in real-time
- **Add User**: Create new user accounts with name, email, and password
- **Edit User**: Update user information and password
- **Delete User**: Remove users with confirmation dialog
- **User Details**: View join date and last login information

### Settings
- **Application Settings**: View app name and version
- **System Information**: Check database and API endpoint details
- **Admin Actions**: Clear cache and manage system data

### User Interface
- **Dark Mode**: Toggle between light and dark themes (persists in localStorage)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: Fade-in and slide-up animations for better UX
- **Toast Notifications**: Feedback for user actions (success/error/info)
- **Modal Dialogs**: Clear forms for adding/editing users and confirmations

## Access

### How to Access
1. **Login First**: You must be logged in to access the admin panel
2. **Navigate**: After logging in, click **Admin Panel** link in the navbar (orange/gold colored)
3. **Direct URL**: Go to `admin.html` in the application

### Access Control
- Only logged-in users can access the admin panel
- Redirects to login page if not authenticated

## How to Use

### Dashboard Tab
1. View key metrics at the top
2. Check recent user registrations
3. Use quick action buttons for common tasks

### Users Tab
1. **View All Users**: Table shows all registered users
2. **Search Users**:
   - Type in the search box
   - Filters by name or email in real-time
   - Clear search to see all users

3. **Add User**:
   - Click "+ Add User" button
   - Fill in name, email, password
   - Click "Save User"
   - User is created and appears in table

4. **Edit User**:
   - Click "Edit" button in user's row
   - Update name and/or password
   - Leave password empty to keep existing password
   - Click "Save User"

5. **Delete User**:
   - Click "Delete" button in user's row
   - Confirm deletion in dialog
   - User is removed and table updates

### Settings Tab
1. View application configuration
2. Check system information
3. Use admin actions:
   - **Clear Cache**: Clears browser localStorage
   - **Reset Data**: (Requires backend support, currently informational)

## Theme Management

### Dark Mode Toggle
- Click the moon icon (🌙) in the sidebar footer
- Toggle applies immediately
- Preference is saved in localStorage
- Persists across sessions

### Theme Persistence
- Uses `discoverNepal_theme` key in localStorage
- Automatically loads on admin panel access

## Data Backup

### How to Backup
1. Go to Dashboard tab
2. Click "Backup Data" in Quick Actions
3. JSON file downloads automatically
4. Filename format: `discover-nepal-backup-[timestamp].json`

### Backup Contents
```json
{
  "timestamp": "2024-03-30T10:30:00.000Z",
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-03-20T05:30:00",
      "last_login": "2024-03-30T10:15:00"
    }
  ]
}
```

## Keyboard Shortcuts

- **Esc**: Close any open modal or dialog

## API Integration

### Backend Endpoints Used

**Get All Users**
```
GET /api/admin/users
Returns: { users: [...] }
```

**Create User**
```
POST /api/auth/signup
Body: { name, email, password }
```

**Update User**
```
PUT /api/admin/users/<email>
Body: { name, password (optional) }
```

**Delete User**
```
DELETE /api/admin/users/<email>
Returns: { success: true/false }
```

**Get Server Health**
```
GET /api/health
```

## Responsive Behavior

### Desktop (> 768px)
- Full sidebar navigation
- Multi-column grid layouts
- Large tables with horizontal scroll

### Tablet (768px - 480px)
- Horizontal sidebar navigation
- 2-column stat cards grid
- Compact layouts

### Mobile (< 480px)
- Stack all content vertically
- Single column tables
- Full-width buttons and inputs

## Styling System

### Design Tokens (CSS Variables)
```css
--primary: #0ea5e9          /* Sky blue */
--secondary: #64748b        /* Slate gray */
--destructive: #ef4444      /* Red for delete/danger */
--accent: #f59e0b           /* Amber for highlights */
--background: #ffffff       /* Main background */
--card: #f8fafc             /* Card background */
--border: #e2e8f0           /* Border color */
```

### Dark Mode Tokens
- All colors automatically shift for dark mode
- Better contrast and reduced eye strain
- Maintains color relationships

## Troubleshooting

### Can't Access Admin Panel
- **Issue**: "Redirects to login"
- **Solution**: You must login first. Check that you're logged in (green "Logout" text in navbar)

### Users table shows "Loading users..."
- **Issue**: Users not appearing
- **Solution**: 
  - Check backend is running on localhost:5000
  - Check browser console for errors
  - Refresh the page

### Changes not saving
- **Issue**: Add/edit/delete doesn't work
- **Solution**:
  - Verify backend API is running
  - Check browser console for error messages
  - Ensure user has proper permissions

### Dark mode not persisting
- **Issue**: Theme reverts to light mode
- **Solution**: Check if localStorage is enabled in browser settings

## Performance Notes

- Admin panel loads all users on initialization
- Search is performed client-side (no API call)
- Tables can handle 100+ users efficiently
- Animations are GPU-accelerated for smooth performance

## Security Considerations

### Current Implementation
- Client-side authentication check only
- localStorage used for session persistence
- No JWT tokens currently implemented

### Production Recommendations
1. Implement JWT token-based authentication
2. Add role-based access control (RBAC)
3. Add audit logging for admin actions
4. Implement rate limiting on API endpoints
5. Add HTTPS requirement
6. Implement CSRF protection
7. Add input validation and sanitization (already implemented in form)

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Older Browsers**: May lack certain CSS features but still functional
- **Mobile Browsers**: Full support with responsive design

## Files

- **admin.html**: Main admin panel page (HTML structure)
- **admin.css**: Styling and responsive design (800+ lines)
- **admin.js**: Functionality and API integration (400+ lines)
- **auth-system.js**: Authentication system (updated with admin link)

## Additional Features

### Toast Notifications
- Success (green): Successful operations
- Error (red): Failed operations
- Info (blue): Informational messages
- Auto-dismiss after 3 seconds

### Form Validation
- Required field checks
- Email format validation
- Password length validation (minimum 6 characters)
- Helpful error messages

### Animations
- Fade-in for modals and sections
- Slide-up for modal content
- Smooth hover transitions
- Page transitions with CSS animations

## Future Enhancement Ideas

1. **Export to CSV**: Download user data in CSV format
2. **User Roles**: Add admin, moderator, user roles
3. **User Profile Picture**: Avatar management
4. **Activity Log**: Track all admin actions
5. **Email Templates**: Manage notification templates
6. **Two-Factor Authentication**: Add 2FA setup for users
7. **Advanced Analytics**: Charts and statistics
8. **Batch Operations**: Bulk user actions
9. **Admin Permissions**: Fine-grained access control
10. **API Key Management**: Generate and manage API keys

## Support

For issues or questions:
1. Check browser console (F12) for error messages
2. Verify backend is running on localhost:5000
3. Ensure you're logged in
4. Try clearing cache and refreshing page

---

**Version**: 1.0.0  
**Last Updated**: 2024-03-30  
**Author**: Discover Nepal Admin Team
