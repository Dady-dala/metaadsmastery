import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Users, BookOpen, Ban, CheckCircle, Edit, Search, AlertCircle, Mail, Phone, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  is_active?: boolean;
  first_name?: string | null;
  last_name?: string | null;
  enrollments?: { course_id: string; course_title: string }[];
}

interface Course {
  id: string;
  title: string;
  description: string;
}

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [prospects, setProspects] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [assigningCourse, setAssigningCourse] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("");
  const [resetPassword, setResetPassword] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [showDeleteProspectDialog, setShowDeleteProspectDialog] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<ContactSubmission | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");

  useEffect(() => {
    loadUsers();
    loadCourses();
    loadProspects();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expirée, veuillez vous reconnecter');
        await supabase.auth.signOut();
        window.location.href = '/auth';
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        if (error.message?.includes('Invalid token') || error.message?.includes('JWT')) {
          toast.error('Session expirée, reconnexion nécessaire');
          await supabase.auth.signOut();
          window.location.href = '/auth';
          return;
        }
        throw error;
      }
      
      const users = data.users || [];

      // Charger les enrollments pour chaque utilisateur étudiant
      const usersWithEnrollments = await Promise.all(
        users.map(async (user: User) => {
          if (user.roles.includes('student')) {
            const { data: enrollments } = await supabase
              .from('student_enrollments')
              .select(`
                course_id,
                courses (
                  id,
                  title
                )
              `)
              .eq('student_id', user.id);

            return {
              ...user,
              enrollments: enrollments?.map(e => ({
                course_id: e.course_id,
                course_title: (e.courses as any)?.title || 'Cours inconnu'
              })) || []
            };
          }
          return user;
        })
      );

      setUsers(usersWithEnrollments);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Erreur lors du chargement des cours');
    }
  };

  const loadProspects = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error('Error loading prospects:', error);
      toast.error('Erreur lors du chargement des prospects');
    }
  };

  const createAccountFromProspect = (prospect: ContactSubmission) => {
    setNewUserFirstName(prospect.first_name);
    setNewUserLastName(prospect.last_name);
    setNewUserEmail(prospect.email);
    setNewUserRole("student");
    setShowCreateDialog(true);
  };

  const assignRole = async (userId: string, role: 'admin' | 'student') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (insertError) throw insertError;

      toast.success(`Rôle ${role === 'admin' ? 'administrateur' : 'étudiant'} attribué avec succès`);
      loadUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Erreur lors de l\'attribution du rôle');
    }
  };

  const assignToCourse = async () => {
    if (!selectedUserId || !selectedCourseId) {
      toast.error('Veuillez sélectionner un cours');
      return;
    }

    setAssigningCourse(true);
    try {
      const { data: existing } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', selectedUserId)
        .eq('course_id', selectedCourseId)
        .single();

      if (existing) {
        toast.info('Cet étudiant est déjà inscrit à ce cours');
        setAssigningCourse(false);
        return;
      }

      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: selectedUserId,
          course_id: selectedCourseId
        });

      if (error) throw error;

      // Get student and course information for email
      const student = users.find(u => u.id === selectedUserId);
      const course = courses.find(c => c.id === selectedCourseId);

      if (student && course && student.email) {
        // Get student profile for full name
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', selectedUserId)
          .single();

        const studentName = profileData?.first_name && profileData?.last_name
          ? `${profileData.first_name} ${profileData.last_name}`
          : student.email;

        // Send course assignment email (background task - don't await)
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-student-course-assignment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              studentEmail: student.email,
              studentName: studentName,
              courseName: course.title,
              courseDescription: course.description,
              userId: selectedUserId, // Ajouter l'ID pour générer le magic link
            }),
          }
        ).catch(error => console.error('Error sending course assignment email:', error));
      }

      toast.success('Étudiant assigné au cours avec succès');
      setSelectedUserId(null);
      setSelectedCourseId('');
    } catch (error) {
      console.error('Error assigning to course:', error);
      toast.error('Erreur lors de l\'assignation au cours');
    } finally {
      setAssigningCourse(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId)
        .eq('role', 'student');

      if (error) throw error;

      toast.success(
        !currentStatus 
          ? 'Étudiant réactivé avec succès' 
          : 'Étudiant suspendu avec succès'
      );
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const handleCreateUser = async () => {
    if (!newUserFirstName || !newUserLastName || !newUserEmail || !newUserPassword || !newUserRole) {
      toast.error("Tous les champs sont requis");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée");
        window.location.href = '/auth';
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { 
          email: newUserEmail, 
          password: newUserPassword,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          role: newUserRole
        }
      });

      if (error) throw error;

      // Envoyer l'email de bienvenue pour les étudiants
      if (newUserRole === 'student' && data?.user?.user?.id) {
        const userId = data.user.user.id;
        
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-student-welcome-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              studentEmail: newUserEmail,
              studentName: `${newUserFirstName} ${newUserLastName}`,
              userId: userId,
            }),
          }
        ).catch(error => console.error('Error sending welcome email:', error));
      }

      toast.success("Utilisateur créé avec succès. Un email de bienvenue a été envoyé.");
      setShowCreateDialog(false);
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("");
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || "Erreur lors de la création");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée");
        window.location.href = '/auth';
        return;
      }

      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id }
      });

      if (error) throw error;

      toast.success("Utilisateur supprimé avec succès");
      setShowDeleteDialog(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleResetPassword = async () => {
    if (!userToResetPassword || !resetPassword) {
      toast.error("Mot de passe requis");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée");
        window.location.href = '/auth';
        return;
      }

      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: userToResetPassword.id, newPassword: resetPassword }
      });

      if (error) throw error;

      toast.success("Mot de passe réinitialisé avec succès");
      setShowResetPasswordDialog(false);
      setUserToResetPassword(null);
      setResetPassword("");
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || "Erreur lors de la réinitialisation");
    }
  };

  const handleEditUser = async () => {
    if (!userToEdit || !editFirstName || !editLastName) {
      toast.error("Tous les champs sont requis");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('update-user-profile', {
        body: { 
          userId: userToEdit.id, 
          firstName: editFirstName,
          lastName: editLastName
        }
      });

      if (error) throw error;

      toast.success("Profil modifié avec succès");
      setShowEditDialog(false);
      setUserToEdit(null);
      setEditFirstName("");
      setEditLastName("");
      loadUsers();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Erreur lors de la modification");
    }
  };

  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setEditFirstName(user.first_name || "");
    setEditLastName(user.last_name || "");
    setShowEditDialog(true);
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);
    
    // Filtre par formation
    if (selectedCourseFilter !== "all") {
      const isEnrolledInCourse = user.enrollments?.some(
        enrollment => enrollment.course_id === selectedCourseFilter
      );
      return matchesSearch && isEnrolledInCourse;
    }
    
    return matchesSearch;
  });

  const handleDeleteProspect = async () => {
    if (!prospectToDelete) return;

    try {
      // Supprimer le prospect de la liste des pré-inscriptions
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', prospectToDelete.id);

      if (error) throw error;

      toast.success("Prospect retiré de la liste. Si un compte étudiant existe pour cet email, il reste actif.");
      
      setShowDeleteProspectDialog(false);
      setProspectToDelete(null);
      loadProspects();
    } catch (error: any) {
      console.error('Error deleting prospect:', error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
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
      <div className="flex items-center justify-center p-8">
        <div className="text-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-2xl text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground">
                Gérez les utilisateurs et créez des comptes depuis les pré-inscriptions
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md w-full md:w-auto"
              size="default"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Créer un utilisateur
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="users" className="data-[state=active]:bg-background">
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs ({users.length})
          </TabsTrigger>
          <TabsTrigger value="prospects" className="data-[state=active]:bg-background">
            <Mail className="w-4 h-4 mr-2" />
            Prospects ({prospects.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Search and Filter Bar Card */}
          <Card className="bg-card border-border shadow-md">
            <CardContent className="p-4 md:pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Filtrer par formation" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all" className="text-foreground hover:bg-accent">
                        Toutes les formations
                      </SelectItem>
                      {courses.map((course) => (
                        <SelectItem 
                          key={course.id} 
                          value={course.id}
                          className="text-foreground hover:bg-accent"
                        >
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedCourseFilter !== "all" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="border-primary text-primary">
                    {filteredUsers.length} étudiant{filteredUsers.length > 1 ? 's' : ''} dans cette formation
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCourseFilter("all")}
                    className="h-6 px-2 text-xs hover:bg-accent"
                  >
                    Réinitialiser
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Table Card */}
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-border bg-muted/50">
                  <TableHead className="text-foreground font-semibold">Nom complet</TableHead>
                  <TableHead className="text-foreground font-semibold">Email</TableHead>
                  <TableHead className="text-foreground font-semibold">Date d'inscription</TableHead>
                  <TableHead className="text-foreground font-semibold">Rôles</TableHead>
                  <TableHead className="text-foreground font-semibold">Formations</TableHead>
                  <TableHead className="text-foreground font-semibold">Statut</TableHead>
                  <TableHead className="text-foreground font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-12 h-12 text-muted-foreground/50" />
                        <p className="text-lg font-medium">
                          {searchQuery ? 'Aucun utilisateur ne correspond à votre recherche' : 'Aucun utilisateur trouvé'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : <span className="text-muted-foreground italic">Non renseigné</span>
                          }
                          {(!user.first_name || !user.last_name) && (
                            <Badge variant="outline" className="border-warning text-warning text-xs gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Profil incomplet
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.roles[0] || ''} 
                          onValueChange={(value) => assignRole(user.id, value as 'admin' | 'student')}
                        >
                          <SelectTrigger className="w-[180px] bg-background border-border text-foreground">
                            <SelectValue placeholder="Sélectionner un rôle">
                              {user.roles.length === 0 ? 'Aucun rôle' : (
                                <Badge 
                                  variant={user.roles[0] === 'admin' ? 'default' : 'secondary'}
                                  className={user.roles[0] === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
                                >
                                  {user.roles[0] === 'admin' ? 'Administrateur' : 'Étudiant'}
                                </Badge>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="student" className="text-foreground hover:bg-accent">
                              Étudiant
                            </SelectItem>
                            <SelectItem value="admin" className="text-foreground hover:bg-accent">
                              Administrateur
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.roles.includes('student') && (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.enrollments && user.enrollments.length > 0 ? (
                              user.enrollments.map((enrollment) => (
                                <Badge 
                                  key={enrollment.course_id}
                                  variant="outline" 
                                  className="border-primary/50 text-primary text-xs"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {enrollment.course_title}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm italic">
                                Aucune formation
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.roles.includes('student') && (
                          <Badge 
                            variant={user.is_active !== false ? 'default' : 'destructive'}
                            className={user.is_active !== false ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}
                          >
                            {user.is_active !== false ? 'Actif' : 'Suspendu'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                          
                          {user.roles.includes('student') && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedUserId(user.id)}
                                    className="border-primary text-primary hover:bg-primary/10"
                                  >
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    Assigner
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-popover border-border">
                                  <DialogHeader>
                                    <DialogTitle className="text-foreground">
                                      Assigner au Cours
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                      Sélectionnez un cours pour {user.email}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                      <SelectTrigger className="bg-background border-border text-foreground">
                                        <SelectValue placeholder="Sélectionner un cours" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-popover border-border">
                                        {courses.map((course) => (
                                          <SelectItem 
                                            key={course.id} 
                                            value={course.id}
                                            className="text-foreground hover:bg-accent"
                                          >
                                            {course.title}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      onClick={assignToCourse}
                                      disabled={!selectedCourseId || assigningCourse}
                                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                      {assigningCourse ? 'Assignation...' : 'Assigner'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant={user.is_active !== false ? 'destructive' : 'default'}
                                onClick={() => toggleUserStatus(user.id, user.is_active !== false)}
                                className={user.is_active !== false 
                                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                              >
                                {user.is_active !== false ? (
                                  <>
                                    <Ban className="w-3 h-3 mr-1" />
                                    Suspendre
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Réactiver
                                  </>
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setUserToResetPassword(user);
                                  setShowResetPasswordDialog(true);
                                }}
                                className="border-border text-foreground hover:bg-accent"
                              >
                                Réinitialiser MDP
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteDialog(true);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </Button>
                            </>
                          )}
                        </div>
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

    {/* Prospects Tab */}
    <TabsContent value="prospects" className="space-y-4">
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Pré-inscriptions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Prospects ayant soumis le formulaire d'inscription
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-border bg-muted/50">
                  <TableHead className="text-foreground font-semibold">Nom complet</TableHead>
                  <TableHead className="text-foreground font-semibold">Email</TableHead>
                  <TableHead className="text-foreground font-semibold">Téléphone</TableHead>
                  <TableHead className="text-foreground font-semibold">Date d'inscription</TableHead>
                  <TableHead className="text-foreground font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Mail className="w-12 h-12 text-muted-foreground/50" />
                        <p className="text-lg font-medium">Aucune pré-inscription trouvée</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  prospects.map((prospect) => (
                    <TableRow key={prospect.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="text-foreground font-medium">
                        {prospect.first_name} {prospect.last_name}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {prospect.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {prospect.phone_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(prospect.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => createAccountFromProspect(prospect)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Créer compte
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setProspectToDelete(prospect);
                              setShowDeleteProspectDialog(true);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Créer un nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-foreground">Prénom</Label>
              <Input
                id="firstName"
                type="text"
                value={newUserFirstName}
                onChange={(e) => setNewUserFirstName(e.target.value)}
                placeholder="Prénom"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-foreground">Nom</Label>
              <Input
                id="lastName"
                type="text"
                value={newUserLastName}
                onChange={(e) => setNewUserLastName(e.target.value)}
                placeholder="Nom"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-foreground">Rôle</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="student" className="text-foreground hover:bg-accent">
                    Étudiant
                  </SelectItem>
                  <SelectItem value="admin" className="text-foreground hover:bg-accent">
                    Administrateur
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateUser}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Utilisateur: <strong className="text-foreground">{userToResetPassword?.email}</strong>
            </p>
            <div>
              <Label htmlFor="new-password" className="text-foreground">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResetPasswordDialog(false);
                setResetPassword("");
                setUserToResetPassword(null);
              }}
              className="border-border text-foreground hover:bg-accent"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleResetPassword}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <strong className="text-foreground">{userToDelete?.email}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
              }}
              className="border-border text-foreground hover:bg-accent"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Modifier le profil</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Utilisateur: <strong className="text-foreground">{userToEdit?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-firstName" className="text-foreground">Prénom</Label>
              <Input
                id="edit-firstName"
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="Prénom"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName" className="text-foreground">Nom</Label>
              <Input
                id="edit-lastName"
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Nom"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setUserToEdit(null);
                setEditFirstName("");
                setEditLastName("");
              }}
              className="border-border text-foreground hover:bg-accent"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleEditUser}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Prospect Dialog */}
      <AlertDialog open={showDeleteProspectDialog} onOpenChange={setShowDeleteProspectDialog}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Êtes-vous sûr de vouloir retirer{" "}
              <strong className="text-foreground">{prospectToDelete?.first_name} {prospectToDelete?.last_name}</strong>{" "}
              de la liste des prospects ? Si un compte étudiant existe, il sera conservé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteProspectDialog(false);
                setProspectToDelete(null);
              }}
              className="border-border text-foreground hover:bg-accent"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProspect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
