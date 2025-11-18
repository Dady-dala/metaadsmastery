import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';
import { z } from 'zod';

interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const contactSchema = z.object({
  firstName: z.string().trim().min(1, { message: "Le prénom est requis" }).max(100),
  lastName: z.string().trim().min(1, { message: "Le nom est requis" }).max(100),
  email: z.string().trim().email({ message: "Email invalide" }).max(255),
});

const ContactFormDialog = ({ isOpen, onOpenChange }: ContactFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Obtenez Votre Plan de Formation Gratuit</DialogTitle>
        </DialogHeader>
        <form 
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            
            setIsSubmitting(true);
            setErrors({});
            
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            
            const data = {
              firstName: formData.get('firstName') as string,
              lastName: formData.get('lastName') as string,
              email: formData.get('email') as string,
            };
            
            try {
              // Validate data
              const validated = contactSchema.parse(data);
              
              // Insert into Supabase
              const { error } = await supabase
                .from('contact_submissions')
                .insert({
                  first_name: validated.firstName,
                  last_name: validated.lastName,
                  email: validated.email,
                });
              
              if (error) throw error;
              
              form.reset();
              onOpenChange(false);
              toast({
                title: "Succès !",
                description: "Merci ! Nous vous contacterons bientôt.",
              });
            } catch (error) {
              if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                  if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message;
                  }
                });
                setErrors(fieldErrors);
              } else {
                toast({
                  title: "Erreur",
                  description: "Une erreur s'est produite. Veuillez réessayer.",
                  variant: "destructive",
                });
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                name="firstName"
                type="text"
                placeholder="Prénom"
                required
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Input
                name="lastName"
                type="text"
                placeholder="Nom"
                required
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
          <div>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full cinematic-cta" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours..." : "Soumettre"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
