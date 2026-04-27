# Database & System Overview 

## Authentication System 

The app uses Supabase Authentication to manage user accounts. 

Users can sign up and log in using their email and password. 
Password reset is supported through a verification code sent to the user’s email. 
Once verified, the user can safely update their password. 

  
When a user signs up, a profile is automatically created in the 'profiles' table using a database trigger. 

The app also supports role-based access: 
- Managers are directed to the manager dashboard 
- Students are directed to the student home screen
  

 ## Password Reset Flow 

  
When a user requests a password reset, a verification code is sent to their email.
The user enters this code in the app, and the system verifies it using Supabase’s OTP functionality. 

 After verification, the user can set a new password. 

  
The system uses Supabase OTP verification to securely handle password resets. 


## User Profiles 

Each user has a profile stored in the 'profile' table. 

  
This includes: 

- Display name 
- Role (manager or student) 
- Profile picture 
- Account status 

  
Profiles are created automatically when a user signs up, so no manual setup is required.


## Account Deletion (Soft Delete) 

  
Instead of permanently deleting users, the app uses a soft delete approach. 

  
When a user deletes their account: 

- The profile is marked as deleted ('is_deleted=true') 
- A deletion timestamp is recorded 
- Personal data is anonymised 
- The user is logged out 

  
Deleted users are prevented from signing back into the app.


## Notification System 

  
Users can customise how they receive notifications. 

  
The system includes: 
- A global on/off toggle for all notifications 
- Individual toggles for specific notification types 
- Preferences stored in the 'notification_preferences' table 

  
The app respects these settings when sending notifications, ensuring users only receive what they’ve enabled. 

  
