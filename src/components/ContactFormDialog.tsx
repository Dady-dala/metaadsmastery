import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';
import { z } from 'zod';
import ReCAPTCHA from 'react-google-recaptcha';

interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const contactSchema = z.object({
  firstName: z.string().trim().min(1, { message: "Le prénom est requis" }).max(100),
  lastName: z.string().trim().min(1, { message: "Le nom est requis" }).max(100),
  email: z.string().trim().email({ message: "Email invalide" }).max(255),
  phoneNumber: z.string().trim().min(1, { message: "Le numéro de téléphone est requis" }).max(20),
});

const ContactFormDialog = ({ isOpen, onOpenChange }: ContactFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [recaptchaToken, setRecaptchaToken] = React.useState<string | null>(null);
  const [consent, setConsent] = React.useState(false);
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);

  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Démarrez Votre Inscription Gratuite</DialogTitle>
        </DialogHeader>
        <form 
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            
            // Vérifier le consentement
            if (!consent) {
              toast({
                title: "Consentement requis",
                description: "Veuillez accepter les conditions pour continuer.",
                variant: "destructive",
              });
              return;
            }

            // Vérifier le reCAPTCHA
            if (!recaptchaToken) {
              toast({
                title: "Vérification requise",
                description: "Veuillez valider le CAPTCHA.",
                variant: "destructive",
              });
              return;
            }
            
            setIsSubmitting(true);
            setErrors({});
            
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            
            const data = {
              firstName: formData.get('firstName') as string,
              lastName: formData.get('lastName') as string,
              email: formData.get('email') as string,
              phoneNumber: formData.get('phoneNumber') as string,
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
                  phone_number: validated.phoneNumber,
                });
              
              if (error) throw error;
              
              // Redirect to thank you page
              window.location.href = '/merci';
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
              // Réinitialiser le reCAPTCHA
              recaptchaRef.current?.reset();
              setRecaptchaToken(null);
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
          <div>
            <Input
              name="phoneNumber"
              type="tel"
              placeholder="Numéro de téléphone"
              required
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
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
