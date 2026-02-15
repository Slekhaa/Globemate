# Supabase Database Setup Instructions

## Required Supabase Keys

To connect your GlobeMate application to Supabase, you need to provide two keys in the `index.html` file:

### 1. **SUPABASE_URL** (Project URL)
   - This is your unique Supabase project URL
   - Format: `https://xxxxxxxxxxxxx.supabase.co`

### 2. **SUPABASE_ANON_KEY** (Anonymous/Public Key)
   - This is your project's anonymous (public) key
   - It's safe to use in client-side code
   - Format: A long string starting with `eyJ...`

---

## How to Get Your Supabase Keys

### Step 1: Create a Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign Up"
3. Sign up with your email or GitHub account

### Step 2: Create a New Project
1. Once logged in, click "New Project"
2. Choose an organization (or create one)
3. Fill in:
   - **Project Name**: GlobeMate (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for project setup

### Step 3: Get Your API Keys
1. In your project dashboard, click the **Settings** icon (⚙️) in the sidebar
2. Click **API** under Project Settings
3. You'll see:
   - **Project URL**: Copy this (it's your `SUPABASE_URL`)
   - **anon public**: Copy this key (it's your `SUPABASE_ANON_KEY`)

### Step 4: Set Up the Database Table
1. In your Supabase dashboard, go to **SQL Editor** (database icon in sidebar)
2. Click **New query**
3. Copy and paste this SQL code:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click **Run** or press `Ctrl/Cmd + Enter`

### Step 5: Configure Your Application
1. Open `index.html` in your GlobeMate project
2. Find these lines (around line 92-97):
```javascript
<script>
  // TODO: Replace these with your actual Supabase credentials
  window.SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
  window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
</script>
```

3. Replace with your actual keys:
```javascript
<script>
  window.SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
  window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
</script>
```

---

## IMPORTANT: Disable Email Confirmation (Required for Development)

⚠️ **You must disable email confirmation to avoid rate limit errors during testing!**

### Steps to Disable Email Confirmation:
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (GlobeMate)
3. Click **Authentication** in the left sidebar
4. Click **Settings** under Authentication
5. Scroll down to **Email Auth** section
6. Find **"Enable email confirmations"** and toggle it **OFF**
7. Click **Save** at the bottom

This will allow users to register and login immediately without email verification.

---

## Optional: Enable Email Authentication (For Production Later)

By default, Supabase requires email confirmation. To configure this:

### Option A: Disable Email Confirmation (for development)
1. Go to **Authentication** > **Settings** in Supabase
2. Scroll to **Email Auth**
3. Toggle **OFF** the "Enable email confirmations" option

### Option B: Configure Email Templates (for production)
1. Go to **Authentication** > **Email Templates**
2. Customize your confirmation email template
3. Set up your email provider (or use Supabase's default)

---

## Optional: Enable Google Sign-In

To enable the "Continue with Google" button:

1. Go to **Authentication** > **Providers** in Supabase
2. Find **Google** in the list
3. Toggle it **ON**
4. Follow Supabase's instructions to:
   - Create a Google Cloud project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add redirect URLs
5. Copy your Google Client ID and Secret into Supabase

---

## Testing Your Setup

1. Open your GlobeMate application
2. Click the **Sign Up** button on the home page
3. Try registering with:
   - Name: Test User
   - Email: test@example.com
   - Password: testpassword123
4. If successful, you should see a success message
5. Check your Supabase dashboard:
   - Go to **Authentication** > **Users**
   - You should see your new user

---

## Security Considerations

### ✅ Safe to Commit
- `SUPABASE_URL`: Safe to include in version control
- `SUPABASE_ANON_KEY`: Safe to expose in client-side code

### ⚠️ Keep Secret (Never Commit)
- `service_role` key: Never use this in client-side code
- Database password: Keep this secure

### 🔒 Best Practices
- Use Row Level Security (RLS) policies (already included in setup)
- Never disable RLS in production
- Validate data on both client and server side
- Use HTTPS in production

---

## Database Schema

The authentication system creates the following table:

### **profiles** table
| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | UUID      | User ID (references auth.users)|
| full_name   | TEXT      | User's full name              |
| email       | TEXT      | User's email (unique)         |
| created_at  | TIMESTAMP | Account creation date         |
| updated_at  | TIMESTAMP | Last update date              |

---

## Troubleshooting

### Error: "Supabase credentials not configured"
- Make sure you replaced the placeholder keys in `index.html`
- Refresh the page after updating keys

### Error: "Failed to initialize authentication"
- Check if the Supabase CDN script loaded correctly
- Check browser console for detailed errors
- Verify your internet connection

### Users not appearing in database
- Make sure you ran the SQL setup script
- Check that email confirmation is disabled (for testing)
- Check Supabase logs in Authentication > Logs

### Email confirmation not working
- Go to Authentication > Settings
- Check email provider configuration
- For testing, disable email confirmation

---

## Need Help?

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **Authentication Guide**: [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)

---

## What's Included in Your Authentication System

✅ User Registration with email and password
✅ User Login with email and password
✅ Google Sign-In (requires setup)
✅ Password validation (minimum 8 characters)
✅ Email validation
✅ Remember me functionality
✅ User profile storage
✅ Secure authentication with Supabase
✅ Row-level security policies
✅ Success/error notifications
✅ Responsive design
✅ Clean UI with tabs (Login/Register)

Enjoy building with GlobeMate! 🌍
