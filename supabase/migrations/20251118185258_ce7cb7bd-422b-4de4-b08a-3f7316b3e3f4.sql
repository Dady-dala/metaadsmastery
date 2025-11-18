-- Add phone_number column to contact_submissions table
ALTER TABLE contact_submissions 
ADD COLUMN phone_number text NOT NULL DEFAULT '';