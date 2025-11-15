-- Add preference columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'IST',
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';

-- Add comment for documentation
COMMENT ON COLUMN profiles.language IS 'User preferred language (en, hi, ta, te, bn)';
COMMENT ON COLUMN profiles.currency IS 'User preferred currency (INR, USD, EUR)';
COMMENT ON COLUMN profiles.timezone IS 'User preferred timezone (IST, PST, EST)';
COMMENT ON COLUMN profiles.email_notifications IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN profiles.sms_notifications IS 'Whether user wants to receive SMS notifications';
COMMENT ON COLUMN profiles.gender IS 'User gender (male, female)';
