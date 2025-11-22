import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100, "Maximum 100 caractères"),
  email: z.string().trim().email("Email invalide").max(255, "Maximum 255 caractères"),
  message: z.string().trim().min(1, "Le message est requis").max(250, "Maximum 250 caractères"),
});

type ContactMessageForm = z.infer<typeof contactMessageSchema>;

const RECAPTCHA_SITE_KEY = '6Lds3RQsAAAAAGGCQkvjMDo_HlBqhU_MKJPGRfBC';

export const ContactMessageForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactMessageForm>({
    resolver: zodResolver(contactMessageSchema),
  });

  const onSubmit = async (data: ContactMessageForm) => {
    setIsSubmitting(true);

    try {
      // Obtenir le token reCAPTCHA v2
      const recaptchaToken = await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'CONTACT_MESSAGE' });
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });

      const { data: result, error } = await supabase.functions.invoke('submit-contact-message', {
        body: {
          name: data.name,
          email: data.email,
          message: data.message,
          recaptchaToken: recaptchaToken
        }
      });

      if (error) throw error;

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Message envoyé avec succès !");
      reset();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Votre nom"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email de contact</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="votre@email.com"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          {...register("message")}
          placeholder="Votre message (max 250 caractères)"
          maxLength={250}
          disabled={isSubmitting}
          className="min-h-[120px]"
        />
        {errors.message && (
          <p className="text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full cinematic-cta"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Validation en cours...
          </span>
        ) : (
          "Envoyer"
        )}
      </Button>
    </form>
  );
};