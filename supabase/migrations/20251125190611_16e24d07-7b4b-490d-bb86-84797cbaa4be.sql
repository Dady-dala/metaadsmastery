-- Ajouter le champ target_list_id à la table forms
ALTER TABLE public.forms
ADD COLUMN target_list_id uuid REFERENCES public.contact_lists(id) ON DELETE SET NULL;