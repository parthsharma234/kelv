/*
  # Create Welcome Email Function

  1. New Functions
    - `send_welcome_email` - Sends a custom welcome email when users sign up
    - Email template with personalized content and branding
    
  2. Triggers
    - Automatically sends welcome email on user signup
    
  3. Security
    - Function runs with security definer privileges
    - Only triggers on new user creation
*/

-- Create the welcome email function
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  email_subject TEXT;
  email_html TEXT;
  email_text TEXT;
BEGIN
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Set email subject
  email_subject := 'Welcome to Kelv AI — You''re on the waitlist! 🎯';
  
  -- Create HTML email content
  email_html := '
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Kelv AI</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        .main-text {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .features {
            background-color: #f7fafc;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .features-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
            text-align: center;
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            font-size: 15px;
            color: #4a5568;
        }
        .feature-icon {
            margin-right: 12px;
            font-size: 18px;
        }
        .cta-section {
            text-align: center;
            margin: 35px 0;
            padding: 25px;
            background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%);
            border-radius: 8px;
            color: white;
        }
        .cta-text {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .cta-subtext {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background-color: white;
            color: #FF5722;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .footer {
            background-color: #2d3748;
            color: #a0aec0;
            padding: 30px;
            text-align: center;
        }
        .footer-brand {
            font-size: 20px;
            font-weight: bold;
            color: #FF5722;
            margin-bottom: 10px;
        }
        .footer-text {
            font-size: 14px;
            margin-bottom: 15px;
        }
        .footer-link {
            color: #FF5722;
            text-decoration: none;
        }
        .social-links {
            margin-top: 20px;
        }
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #a0aec0;
            text-decoration: none;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0 10px;
            }
            .header, .content, .footer {
                padding: 25px 20px;
            }
            .greeting {
                font-size: 22px;
            }
            .main-text {
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">Kelv AI</div>
            <p class="tagline">Master Your Interview Skills</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <h1 class="greeting">Hey ' || user_name || ',</h1>
            
            <p class="main-text">
                <strong>Welcome to Kelv AI — you''ve officially secured your spot on the waitlist.</strong>
            </p>
            
            <p class="main-text">
                We''re building the smartest way to prep for interviews, and you''re now one step closer to mastering yours.
            </p>
            
            <p class="main-text">
                If you''ve ever felt unprepared walking into an interview, Kelv AI is here to change that. Our platform uses cutting-edge technology to simulate real interviews, give detailed feedback, and track your progress — so you can show up with confidence and clarity.
            </p>
            
            <div class="cta-section">
                <div class="cta-text">We''ll let you know as soon as we launch. 👀</div>
                <div class="cta-subtext">In the meantime, you can try our interview platform preview</div>
                <a href="https://kelvai.com/platform" class="button">Try Platform Preview</a>
            </div>
            
            <!-- Features Preview -->
            <div class="features">
                <h2 class="features-title">Here''s a sneak peek at what''s coming:</h2>
                <ul class="feature-list">
                    <li class="feature-item">
                        <span class="feature-icon">🧠</span>
                        <span>Real-time performance analysis</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">🎥</span>
                        <span>Dynamic mock interviews</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span>Personalized feedback & coaching</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">📈</span>
                        <span>Progress tracking with smart insights</span>
                    </li>
                </ul>
            </div>
            
            <p class="main-text">
                Thanks for joining — we can''t wait to help you land that offer.
            </p>
            
            <p class="main-text">
                <strong>— Team Kelv AI</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">Kelv AI</div>
            <p class="footer-text">
                The future of interview preparation
            </p>
            <p class="footer-text">
                <a href="https://kelvai.com" class="footer-link">kelvai.com</a>
            </p>
        </div>
    </div>
</body>
</html>';

  -- Create plain text version
  email_text := 'Hey ' || user_name || ',

Welcome to Kelv AI — you''ve officially secured your spot on the waitlist.

We''re building the smartest way to prep for interviews, and you''re now one step closer to mastering yours.

If you''ve ever felt unprepared walking into an interview, Kelv AI is here to change that. Our platform uses cutting-edge technology to simulate real interviews, give detailed feedback, and track your progress — so you can show up with confidence and clarity.

We''ll let you know as soon as we launch. 👀

Here''s a sneak peek at what''s coming:
🧠 Real-time performance analysis
🎥 Dynamic mock interviews  
📊 Personalized feedback & coaching
📈 Progress tracking with smart insights

Thanks for joining — we can''t wait to help you land that offer.

— Team Kelv AI
kelvai.com';

  -- Send the email using Supabase's built-in email functionality
  PERFORM
    extensions.http_post(
      url := current_setting('app.smtp_url', true),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.smtp_password', true)
      ),
      body := jsonb_build_object(
        'from', 'Kelv AI <team@kelvai.com>',
        'to', ARRAY[user_email],
        'subject', email_subject,
        'html', email_html,
        'text', email_text
      )
    );

  -- Log successful email send
  INSERT INTO public.email_logs (user_id, email_type, status, sent_at, created_at)
  VALUES (NEW.id, 'welcome', 'sent', NOW(), NOW());

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup process
    INSERT INTO public.email_logs (user_id, email_type, status, error_message, created_at)
    VALUES (NEW.id, 'welcome', 'failed', SQLERRM, NOW());
    
    -- Log the error to Supabase logs for debugging
    RAISE LOG 'Error sending welcome email to %: %', user_email, SQLERRM;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create email logs table to track email sending
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for email_logs (admin access only)
CREATE POLICY "Admin can view email logs"
  ON public.email_logs
  FOR ALL
  TO authenticated
  USING (false); -- Only accessible via service role

-- Create trigger to send welcome email on user signup
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email();

-- Create function to manually send welcome email (for testing)
CREATE OR REPLACE FUNCTION public.send_test_welcome_email(user_email text, user_name text DEFAULT NULL)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- This function can be called manually for testing
  -- Example: SELECT send_test_welcome_email('test@example.com', 'John Doe');
  
  IF user_name IS NULL THEN
    user_name := split_part(user_email, '@', 1);
  END IF;
  
  -- Here you would implement the same email sending logic
  -- For now, just return success
  result := json_build_object(
    'success', true,
    'message', 'Welcome email would be sent to ' || user_email,
    'user_name', user_name
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;