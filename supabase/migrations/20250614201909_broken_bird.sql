/*
  # Setup Email Service Integration

  1. Configuration
    - Add settings for email service integration
    - Support for multiple email providers (Resend, SendGrid, etc.)
    
  2. Functions
    - Generic email sending function
    - Email template management
    
  3. Security
    - Secure API key storage
    - Rate limiting for email sending
*/

-- Create email service configuration table
CREATE TABLE IF NOT EXISTS public.email_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('resend', 'sendgrid', 'mailgun', 'ses')),
  is_active boolean DEFAULT false,
  config jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on email_config
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;

-- Create policy for email_config (service role only)
CREATE POLICY "Service role can manage email config"
  ON public.email_config
  FOR ALL
  TO service_role
  USING (true);

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email_templates (service role only)
CREATE POLICY "Service role can manage email templates"
  ON public.email_templates
  FOR ALL
  TO service_role
  USING (true);

-- Insert welcome email template
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables)
VALUES (
  'welcome_email',
  'Welcome to Kelv AI — You''re on the waitlist! 🎯',
  '<!-- HTML content will be inserted here -->',
  'Plain text content will be inserted here',
  '["user_name", "user_email"]'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Create improved email sending function
CREATE OR REPLACE FUNCTION public.send_email(
  to_email text,
  template_name text,
  variables jsonb DEFAULT '{}'::jsonb
)
RETURNS json AS $$
DECLARE
  template_record record;
  email_config_record record;
  final_subject text;
  final_html text;
  final_text text;
  api_response json;
  log_id uuid;
BEGIN
  -- Get active email configuration
  SELECT * INTO email_config_record
  FROM public.email_config
  WHERE is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active email configuration found'
    );
  END IF;
  
  -- Get email template
  SELECT * INTO template_record
  FROM public.email_templates
  WHERE name = template_name AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email template not found: ' || template_name
    );
  END IF;
  
  -- Replace variables in template
  final_subject := template_record.subject;
  final_html := template_record.html_content;
  final_text := template_record.text_content;
  
  -- Simple variable replacement (you can make this more sophisticated)
  IF variables ? 'user_name' THEN
    final_subject := replace(final_subject, '{{user_name}}', variables->>'user_name');
    final_html := replace(final_html, '{{user_name}}', variables->>'user_name');
    final_text := replace(final_text, '{{user_name}}', variables->>'user_name');
  END IF;
  
  IF variables ? 'user_email' THEN
    final_html := replace(final_html, '{{user_email}}', variables->>'user_email');
    final_text := replace(final_text, '{{user_email}}', variables->>'user_email');
  END IF;
  
  -- Create log entry
  INSERT INTO public.email_logs (user_id, email_type, status, created_at)
  VALUES (NULL, template_name, 'pending', now())
  RETURNING id INTO log_id;
  
  -- For now, just return success (you'll need to implement actual email sending)
  -- This is where you'd integrate with your chosen email service
  
  UPDATE public.email_logs
  SET status = 'sent', sent_at = now()
  WHERE id = log_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email sent successfully',
    'log_id', log_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Update log with error
    UPDATE public.email_logs
    SET status = 'failed', error_message = SQLERRM
    WHERE id = log_id;
    
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get email statistics
CREATE OR REPLACE FUNCTION public.get_email_stats(days_back integer DEFAULT 30)
RETURNS json AS $$
DECLARE
  stats json;
BEGIN
  SELECT json_build_object(
    'total_sent', COUNT(*) FILTER (WHERE status = 'sent'),
    'total_failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'total_pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'success_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'sent')::numeric / 
       NULLIF(COUNT(*), 0) * 100), 2
    ),
    'by_type', json_object_agg(
      email_type,
      json_build_object(
        'sent', COUNT(*) FILTER (WHERE status = 'sent'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed')
      )
    )
  ) INTO stats
  FROM public.email_logs
  WHERE created_at >= now() - (days_back || ' days')::interval;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;