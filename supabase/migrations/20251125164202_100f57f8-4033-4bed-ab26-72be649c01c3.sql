-- Create contacts table for comprehensive contact management
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all contacts"
ON public.contacts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for email lookups
CREATE INDEX idx_contacts_email ON public.contacts(email);

-- Create index for tags
CREATE INDEX idx_contacts_tags ON public.contacts USING GIN(tags);

-- Create index for status
CREATE INDEX idx_contacts_status ON public.contacts(status);

-- Create trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create contact lists table for organized grouping
CREATE TABLE public.contact_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact lists"
ON public.contact_lists
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create junction table for contacts in lists
CREATE TABLE public.contact_list_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, list_id)
);

ALTER TABLE public.contact_list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact list members"
ON public.contact_list_members
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));