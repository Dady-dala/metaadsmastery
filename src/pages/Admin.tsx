import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { LogOut, Mail, User, Phone, MessageSquare } from 'lucide-react';

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Vous devez être connecté pour accéder à cette page');
        navigate('/auth');
        return;
      }

      // Vérifier si l'utilisateur est admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        toast.error("Accès refusé : vous n'avez pas les droits administrateur");
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la vérification des droits');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Charger les inscriptions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

      // Charger les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    navigate('/auth');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033]">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO 
        title="Administration - Meta Ads Mastery"
        description="Espace d'administration Meta Ads Mastery"
      />
      <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Tableau de Bord Admin
              </h1>
              <p className="text-gray-300">
                Gérez les inscriptions et messages de contact
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>

          <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="submissions">
                Inscriptions ({submissions.length})
              </TabsTrigger>
              <TabsTrigger value="messages">
                Messages ({messages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Inscriptions à la Formation
                  </CardTitle>
                  <CardDescription>
                    Liste de tous les prospects inscrits à la formation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prénom</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Aucune inscription pour le moment
                            </TableCell>
                          </TableRow>
                        ) : (
                          submissions.map((submission) => (
                            <TableRow key={submission.id}>
                              <TableCell className="font-medium">
                                {submission.first_name}
                              </TableCell>
                              <TableCell>{submission.last_name}</TableCell>
                              <TableCell>
                                <a 
                                  href={`mailto:${submission.email}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Mail className="w-4 h-4" />
                                  {submission.email}
                                </a>
                              </TableCell>
                              <TableCell>
                                <a 
                                  href={`tel:${submission.phone_number}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Phone className="w-4 h-4" />
                                  {submission.phone_number}
                                </a>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(submission.created_at)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages de Contact
                  </CardTitle>
                  <CardDescription>
                    Messages reçus via le formulaire de contact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messages.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              Aucun message pour le moment
                            </TableCell>
                          </TableRow>
                        ) : (
                          messages.map((message) => (
                            <TableRow key={message.id}>
                              <TableCell className="font-medium">
                                {message.name}
                              </TableCell>
                              <TableCell>
                                <a 
                                  href={`mailto:${message.email}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Mail className="w-4 h-4" />
                                  {message.email}
                                </a>
                              </TableCell>
                              <TableCell className="max-w-md">
                                <p className="truncate" title={message.message}>
                                  {message.message}
                                </p>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(message.created_at)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Admin;