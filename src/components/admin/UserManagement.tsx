import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Users, BookOpen, Ban, CheckCircle, Edit } from 'lucide-react';
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
}

interface Course {
  id: string;
  title: string;
  description: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
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

  useEffect(() => {
    loadUsers();
    loadCourses();
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
        // Si erreur de token invalide, nettoyer la session
        if (error.message?.includes('Invalid token') || error.message?.includes('JWT')) {
          toast.error('Session expirée, reconnexion nécessaire');
          await supabase.auth.signOut();
          window.location.href = '/auth';
          return;
        }
        throw error;
      }
      
      setUsers(data.users || []);
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

  const assignRole = async (userId: string, role: 'admin' | 'student') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Supprimer tous les rôles existants de l'utilisateur
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Ajouter le nouveau rôle
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
      // Check if already enrolled
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

      toast.success("Utilisateur créé avec succès");
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
    return fullName.includes(query) || email.includes(query);
  });

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
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription className="text-gray-300">
                Gérez les rôles, les accès aux formations et le statut des étudiants
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#00ff87] text-black hover:bg-[#00cc6e]"
            >
              Créer un utilisateur
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Input
              placeholder="Rechercher par nom, prénom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-gray-300">Nom complet</TableHead>
              <TableHead className="text-gray-300">Email</TableHead>
              <TableHead className="text-gray-300">Date d'inscription</TableHead>
              <TableHead className="text-gray-300">Rôles</TableHead>
              <TableHead className="text-gray-300">Statut</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow className="border-white/10">
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  {searchQuery ? 'Aucun utilisateur ne correspond à votre recherche' : 'Aucun utilisateur trouvé'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : <span className="text-gray-400 italic">Non renseigné</span>
                      }
                      {(!user.first_name || !user.last_name) && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">
                          Profil incomplet
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{user.email}</TableCell>
                  <TableCell className="text-gray-300">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={user.roles[0] || ''} 
                      onValueChange={(value) => assignRole(user.id, value as 'admin' | 'student')}
                    >
                      <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Sélectionner un rôle">
                          {user.roles.length === 0 ? 'Aucun rôle' : (
                            <Badge 
                              variant={user.roles[0] === 'admin' ? 'default' : 'secondary'}
                              className={user.roles[0] === 'admin' ? 'bg-[#00ff87] text-black' : ''}
                            >
                              {user.roles[0] === 'admin' ? 'Administrateur' : 'Étudiant'}
                            </Badge>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a0033] border-white/10">
                        <SelectItem value="student" className="text-white hover:bg-white/10">
                          Étudiant
                        </SelectItem>
                        <SelectItem value="admin" className="text-white hover:bg-white/10">
                          Administrateur
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.roles.includes('student') && (
                      <Badge 
                        variant={user.is_active !== false ? 'default' : 'destructive'}
                        className={user.is_active !== false ? 'bg-[#00ff87] text-black' : 'bg-red-500 text-white'}
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
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      >
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
                                className="border-[#00ff87] text-[#00ff87] hover:bg-[#00ff87]/10"
                              >
                                <BookOpen className="w-4 h-4 mr-1" />
                                Assigner
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1a0033] border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">
                                  Assigner au Cours
                                </DialogTitle>
                                <DialogDescription className="text-gray-300">
                                  Sélectionnez un cours pour {user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Sélectionner un cours" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1a0033] border-white/10">
                                    {courses.map((course) => (
                                      <SelectItem 
                                        key={course.id} 
                                        value={course.id}
                                        className="text-white hover:bg-white/10"
                                      >
                                        {course.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  onClick={assignToCourse}
                                  disabled={!selectedCourseId || assigningCourse}
                                  className="w-full bg-[#00ff87] text-black hover:bg-[#00cc6e]"
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
                              ? 'bg-red-500 hover:bg-red-600' 
                              : 'bg-[#00ff87] text-black hover:bg-[#00cc6e]'}
                          >
                            {user.is_active !== false ? (
                              <>
                                <Ban className="w-4 h-4 mr-1" />
                                Suspendre
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
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
                            className="border-white/20 text-white hover:bg-white/10"
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
                            className="bg-red-500 hover:bg-red-600"
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
      </CardContent>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Créer un nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-gray-300">Prénom</Label>
              <Input
                id="firstName"
                type="text"
                value={newUserFirstName}
                onChange={(e) => setNewUserFirstName(e.target.value)}
                placeholder="Prénom"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-gray-300">Nom</Label>
              <Input
                id="lastName"
                type="text"
                value={newUserLastName}
                onChange={(e) => setNewUserLastName(e.target.value)}
                placeholder="Nom"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-gray-300">Rôle</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a0033] border-white/10">
                  <SelectItem value="student" className="text-white hover:bg-white/10">
                    Étudiant
                  </SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-white/10">
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
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateUser}
              className="bg-[#00ff87] text-black hover:bg-[#00cc6e]"
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Utilisateur: <strong className="text-white">{userToResetPassword?.email}</strong>
            </p>
            <div>
              <Label htmlFor="new-password" className="text-gray-300">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="bg-white/5 border-white/10 text-white"
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
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleResetPassword}
              className="bg-[#00ff87] text-black hover:bg-[#00cc6e]"
            >
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <strong className="text-white">{userToDelete?.email}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Modifier le profil</DialogTitle>
            <DialogDescription className="text-gray-300">
              Utilisateur: <strong className="text-white">{userToEdit?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-firstName" className="text-gray-300">Prénom</Label>
              <Input
                id="edit-firstName"
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="Prénom"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName" className="text-gray-300">Nom</Label>
              <Input
                id="edit-lastName"
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Nom"
                className="bg-white/5 border-white/10 text-white"
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
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleEditUser}
              className="bg-[#00ff87] text-black hover:bg-[#00cc6e]"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
