import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EmailComposerProps {
  replyTo?: any | null;
  onSent: () => void;
  onCancel: () => void;
}

export function EmailComposer({ replyTo, onSent, onCancel }: EmailComposerProps) {
  const [toEmail, setToEmail] = useState(replyTo?.from_email || '');
  const [toName, setToName] = useState(replyTo?.from_name || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [htmlBody, setHtmlBody] = useState('');
  const [sending, setSending] = useState(false);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const handleSend = async () => {
    if (!toEmail || !subject || !htmlBody) {
      toast.error("Erreur", {
        description: "Veuillez remplir tous les champs",
      });
      return;
    }

    try {
      setSending(true);

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          toEmail,
          toName,
          subject,
          htmlBody,
          replyToId: replyTo?.id || null,
        }
      });

      if (error) throw error;

      toast.success("Succès", {
        description: "Email envoyé avec succès",
      });

      onSent();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error("Erreur", {
        description: "Impossible d'envoyer l'email",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="to_email">Destinataire (email)</Label>
          <Input
            id="to_email"
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="destinataire@example.com"
            disabled={!!replyTo}
          />
        </div>

        <div>
          <Label htmlFor="to_name">Nom du destinataire (optionnel)</Label>
          <Input
            id="to_name"
            value={toName}
            onChange={(e) => setToName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label htmlFor="subject">Objet</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de l'email"
          />
        </div>

        <div>
          <Label>Message</Label>
          <div className="mt-2">
            <ReactQuill
              theme="snow"
              value={htmlBody}
              onChange={setHtmlBody}
              modules={modules}
              className="bg-background"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={sending}>
          Annuler
        </Button>
        <Button onClick={handleSend} disabled={sending}>
          {sending ? "Envoi..." : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}
