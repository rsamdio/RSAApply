[![Netlify Status](https://api.netlify.com/api/v1/badges/cf84a1c9-5bde-41b3-a9fd-46d698c65524/deploy-status)](https://app.netlify.com/projects/rsaapply/deploys)

# RSA MDIO Nomination Application System

A modern web application for collecting and managing leadership position nominations for Rotaract South Asia MDIO (RSA MDIO) for Rotary Year 2026-27.

## Overview

This application provides a streamlined nomination process for RSA MDIO leadership positions, featuring a multi-step form for applicants and a comprehensive admin panel for managing submissions.

## Features

### For Applicants
- **Multi-step Nomination Form**: Progressive form with 13 questions covering personal information, role preferences, and vision statements
- **Auto-save**: Draft responses are automatically saved to local storage
- **Progress Tracking**: Visual progress bar and navigation sidebar
- **Role Information**: Dedicated page to explore available roles and their responsibilities
- **Form Validation**: Real-time validation with helpful error messages
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### For Administrators
- **Magic Link Authentication**: Passwordless login via email magic links
- **Dashboard Statistics**: Real-time stats showing total applications and status breakdown
- **Application Management**: View, filter, and manage all nominations
- **Status Workflow**: Update application status (Pending, Under Review, Shortlisted, Selected, Rejected)
- **Advanced Filtering**: Filter by status, role, or search by name/email
- **CSV Export**: Export filtered applications to CSV for external analysis
- **Responsive Admin Panel**: Desktop table view and mobile card view

## Project Structure

```
rsaapply/
├── index.html              # Main nomination form page
├── admin.html              # Admin dashboard page
├── roles.html              # Roles information page
├── roles.json              # Role definitions and descriptions
├── assets/
│   ├── css/
│   │   ├── main.css        # Main stylesheet
│   │   ├── admin.css       # Admin panel styles
│   │   └── roles.css       # Roles page styles
│   ├── js/
│   │   ├── app.js          # Main application logic
│   │   ├── admin.js        # Admin panel logic
│   │   ├── roles.js        # Roles page logic
│   │   └── firebase-config.js  # Firebase configuration
│   └── images/             # Images and logos
└── README.md
```

## Setup Instructions

### Prerequisites
- A Firebase project with Firestore and Authentication enabled
- A web server (can use any static file server or Firebase Hosting)

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication with Email/Passwordless sign-in
4. Update `assets/js/firebase-config.js` with your Firebase configuration:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Firestore Security Rules

Set up appropriate security rules for your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Nominations collection - public write, admin read
    match /nominations/{nominationId} {
      allow create: if request.auth == null || request.auth != null;
      allow read: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

### Authentication Setup

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Configure authorized domains for magic link redirects

### Deployment

#### Option 1: Firebase Hosting (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

#### Option 2: Any Static Hosting
- Upload all files to your hosting provider
- Ensure `index.html`, `admin.html`, and `roles.html` are accessible
- Update Firebase configuration with your domain

## Usage

### For Applicants

1. Visit the main page (`index.html`)
2. Click "Start Nomination Form"
3. Fill out all required fields
4. Review your responses
5. Submit the nomination

### For Administrators

1. Visit the admin page (`admin.html`)
2. Enter your email address
3. Check your email for the magic link
4. Click the link to sign in
5. Manage applications using the dashboard

## Available Roles

The system supports nominations for the following positions:

- Vice President
- General Secretary
- Secretary (Reporting / Communications / Initiatives / Special Programs)
- Treasurer
- Sergeant at Arms
- Chairperson - R.O.A.R.
- Editor
- Zone Director / Coordinator
- Director - International Relations
- Director - Service Programs
- Director - Foundation Programs
- Director - Learning Programs
- Director - Fellowship Programs
- Director - Membership Programs
- Director - Design & Branding
- Director - Marketing & Communications
- Director - Web & Tech
- Other (with custom specification)

## Technologies Used

- **Frontend**: Vanilla JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication)
- **Styling**: Modern CSS with CSS Variables
- **Storage**: Local Storage (draft persistence), Firestore (submissions)
- **Icons**: SVG icons
- **Fonts**: Inter (Google Fonts)

## Data Model

### Nomination Document Structure

```javascript
{
  full_name: string,
  email: string,
  phone: string,
  current_club: string,
  district: string,
  drr_year: string,
  years_in_rotaract: string,
  first_preference_role: string,
  first_preference_role_other: string (if "Other" selected),
  vision_first_role: string,
  second_preference_role: string,
  second_preference_role_other: string (if "Other" selected),
  vision_second_role: string,
  vision_rsamdio: string,
  status: "Pending" | "Under Review" | "Shortlisted" | "Selected" | "Rejected",
  timestamp: Timestamp,
  createdAt: string (ISO),
  updatedAt: Timestamp (optional)
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Features

- XSS protection through HTML escaping
- Firebase Authentication for admin access
- Firestore security rules
- Input validation and sanitization

## Accessibility

- ARIA labels and roles
- Skip links for keyboard navigation
- Semantic HTML structure
- Keyboard navigation support

## License

This project is proprietary software for RSA MDIO.

## Support

For issues or questions, please contact the development team.

---

**Note**: This application is designed specifically for RSA MDIO nominations for Rotary Year 2026-27. The roles and structure are subject to change based on the final Executive Council structure.
