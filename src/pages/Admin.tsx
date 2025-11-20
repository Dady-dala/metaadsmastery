import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { LogOut, Users, BookOpen, Video, Mail, MessageSquare, LayoutDashboard, TrendingUp, UserCircle, UserPlus, BarChart3 } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { CourseManagement } from '@/components/admin/CourseManagement';
import { VideoManagement } from '@/components/admin/VideoManagement';
import StudentProgressManagement from '@/components/admin/StudentProgressManagement';
import { AdminProfileSettings } from '@/components/admin/AdminProfileSettings';
import { QuizManagement } from '@/components/admin/QuizManagement';
import { AdvancedAnalytics } from '@/components/admin/AdvancedAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalVideos: 0,
    totalSubmissions: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

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

      // Charger les statistiques
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: usersData } = await supabase.functions.invoke('get-users', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        const { count: coursesCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });

        const { count: videosCount } = await supabase
          .from('course_videos')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersData?.users?.length || 0,
          totalCourses: coursesCount || 0,
          totalVideos: videosCount || 0,
          totalSubmissions: submissionsData?.length || 0,
        });
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Administration - Meta Ads Mastery"
        description="Espace d'administration Meta Ads Mastery"
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Dashboard Admin
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Meta Ads Mastery
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Formations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.totalCourses}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Vidéos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.totalVideos}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Inscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.totalSubmissions}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-8 mb-6 bg-muted">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Utilisateurs</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Formations</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Vidéos</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Progression</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Inscriptions</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-0">
              <UserManagement />
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <CourseManagement />
            </TabsContent>

            <TabsContent value="videos" className="mt-0">
              <VideoManagement />
            </TabsContent>

            <TabsContent value="progress" className="mt-0">
              <StudentProgressManagement />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AdvancedAnalytics />
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <AdminProfileSettings />
            </TabsContent>

            <TabsContent value="submissions" className="mt-0">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Inscriptions à la Formation
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Liste des prospects inscrits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-foreground">Nom</TableHead>
                          <TableHead className="text-foreground">Prénom</TableHead>
                          <TableHead className="text-foreground">Email</TableHead>
                          <TableHead className="text-foreground">Téléphone</TableHead>
                          <TableHead className="text-foreground">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id} className="border-border">
                            <TableCell className="text-foreground">{submission.last_name}</TableCell>
                            <TableCell className="text-foreground">{submission.first_name}</TableCell>
                            <TableCell className="text-foreground">{submission.email}</TableCell>
                            <TableCell className="text-foreground">{submission.phone_number}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(submission.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages de Contact
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Questions et demandes des visiteurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-foreground">Nom</TableHead>
                          <TableHead className="text-foreground">Email</TableHead>
                          <TableHead className="text-foreground">Message</TableHead>
                          <TableHead className="text-foreground">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messages.map((message) => (
                          <TableRow key={message.id} className="border-border">
                            <TableCell className="text-foreground">{message.name}</TableCell>
                            <TableCell className="text-foreground">{message.email}</TableCell>
                            <TableCell className="text-foreground max-w-md truncate">{message.message}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(message.created_at)}</TableCell>
                          </TableRow>
                        ))}
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