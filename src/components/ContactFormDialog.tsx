import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';
import { z } from 'zod';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: string | HTMLElement, parameters: any) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inlineForm?: boolean;
}

const contactSchema = z.object({
  firstName: z.string().trim().min(1, { message: "Le prénom est requis" }).max(100),
  lastName: z.string().trim().min(1, { message: "Le nom est requis" }).max(100),
  email: z.string().trim().email({ message: "Email invalide" }).max(255),
  phoneNumber: z.string().trim().min(1, { message: "Le numéro de téléphone est requis" }).max(20),
});

const ContactFormDialog = ({ isOpen, onOpenChange, inlineForm = false }: ContactFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [consent, setConsent] = React.useState(false);
  const recaptchaRef = React.useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = React.useRef<number | null>(null);

  const RECAPTCHA_SITE_KEY = '6LdQQBUsAAAAAFJLaQ-I1th5dvKgmEiLW9G53E-J';

  React.useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha && recaptchaRef.current && recaptchaWidgetId.current === null) {
        window.grecaptcha.ready(() => {
          if (recaptchaRef.current) {
            recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
            });
          }
        });
      }
    };

    const timer = setTimeout(() => {
      if (isOpen) {
        loadRecaptcha();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (recaptchaWidgetId.current !== null) {
        window.grecaptcha?.reset(recaptchaWidgetId.current);
      }
    };
  }, [isOpen]);
  
  const formContent = (
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
        
        setIsSubmitting(true);
        setErrors({});

        try {
          // Obtenir le token reCAPTCHA v2
          const recaptchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current ?? undefined);
          
          if (!recaptchaToken) {
            toast({
              title: "Vérification requise",
              description: "Veuillez compléter la vérification reCAPTCHA.",
              variant: "destructive",
            });
            return;
          }
        
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          
          const data = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            phoneNumber: formData.get('phoneNumber') as string,
          };
          
          // Validate data
          const validated = contactSchema.parse(data);
          
          // Appeler l'Edge Function sécurisé au lieu d'insérer directement
          const { data: result, error } = await supabase.functions.invoke('submit-contact', {
            body: {
              first_name: validated.firstName,
              last_name: validated.lastName,
              email: validated.email,
              phone_number: validated.phoneNumber,
              recaptchaToken: recaptchaToken,
            }
          });
          
          if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Erreur lors de la soumission');
          }
          
          if (result?.error) {
            throw new Error(result.error);
          }
          
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
            const errorMessage = error instanceof Error ? error.message : 'Une erreur s\'est produite. Veuillez réessayer.';
            toast({
              title: "Erreur",
              description: errorMessage,
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

      {/* reCAPTCHA v2 Checkbox */}
      <div ref={recaptchaRef} className="flex justify-center"></div>

      {/* Consent Checkbox */}
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          className="mt-1"
        />
        <label 
          htmlFor="consent" 
          className="text-sm text-gray-300 cursor-pointer leading-relaxed"
        >
          J'accepte que mes informations soient collectées et utilisées pour me contacter concernant cette formation.
        </label>
      </div>

      <Button 
        type="submit" 
        className="w-full cinematic-cta"
        disabled={isSubmitting || !consent}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Validation en cours...
          </span>
        ) : (
          'Rejoindre la Formation'
        )}
      </Button>
    </form>
  );
  
  if (inlineForm) {
    return formContent;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Démarrez Votre Inscription Gratuite</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
