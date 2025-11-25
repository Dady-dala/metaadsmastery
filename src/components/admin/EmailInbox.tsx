import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailComposer } from "./EmailComposer";
import { useToast } from "@/hooks/use-toast";
import { Mail, Inbox, Send, Reply, Plus, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Email {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  to_name: string | null;
  subject: string;
  html_body: string;
  text_body: string | null;
  reply_to_id: string | null;
  status: string;
  sent_at: string;
  read_at: string | null;
  metadata: any;
}

export function EmailInbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      console.error('Error loading emails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les emails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('emails')
        .update({ read_at: new Date().toISOString() })
        .eq('id', emailId);

      if (error) throw error;
      loadEmails();
    } catch (error: any) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleReply = (email: Email) => {
    setReplyToEmail(email);
    setIsComposerOpen(true);
  };

  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read_at) {
      handleMarkAsRead(email.id);
    }
  };

  const sentEmails = emails.filter(e => e.metadata?.sent_by_admin);
  const receivedEmails = emails.filter(e => !e.metadata?.sent_by_admin);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Boîte de réception</h2>
          <p className="text-muted-foreground">
            Gérez vos emails transactionnels
          </p>
        </div>
        <Button onClick={() => {
          setReplyToEmail(null);
          setIsComposerOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Composer
        </Button>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList>
          <TabsTrigger value="received" className="gap-2">
            <Inbox className="h-4 w-4" />
            Reçus ({receivedEmails.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Envoyés ({sentEmails.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedEmails.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun email reçu</p>
              </CardContent>
            </Card>
          ) : (
            receivedEmails.map((email) => (
              <Card key={email.id} className={email.read_at ? "opacity-75" : ""}>
                <CardHeader className="cursor-pointer" onClick={() => handleViewEmail(email)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {!email.read_at && (
                          <Badge variant="default" className="text-xs">Non lu</Badge>
                        )}
                        <CardTitle className="text-base">
                          {email.from_name || email.from_email}
                        </CardTitle>
                      </div>
                      <CardDescription className="font-medium">
                        {email.subject}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(email.sent_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewEmail(email);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(email);
                        }}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentEmails.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Send className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun email envoyé</p>
              </CardContent>
            </Card>
          ) : (
            sentEmails.map((email) => (
              <Card key={email.id}>
                <CardHeader className="cursor-pointer" onClick={() => handleViewEmail(email)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">
                        À: {email.to_name || email.to_email}
                      </CardTitle>
                      <CardDescription className="font-medium">
                        {email.subject}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(email.sent_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEmail(email);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>De:</strong> {selectedEmail.from_name || selectedEmail.from_email}</p>
                <p><strong>À:</strong> {selectedEmail.to_name || selectedEmail.to_email}</p>
                <p><strong>Date:</strong> {formatDate(selectedEmail.sent_at)}</p>
              </div>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }} />
              </ScrollArea>
              <div className="flex justify-end">
                <Button onClick={() => handleReply(selectedEmail)}>
                  <Reply className="mr-2 h-4 w-4" />
                  Répondre
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {replyToEmail ? `Répondre à: ${replyToEmail.subject}` : 'Composer un email'}
            </DialogTitle>
          </DialogHeader>
          <EmailComposer
            replyTo={replyToEmail}
            onSent={() => {
              setIsComposerOpen(false);
              setReplyToEmail(null);
              loadEmails();
            }}
            onCancel={() => {
              setIsComposerOpen(false);
              setReplyToEmail(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
