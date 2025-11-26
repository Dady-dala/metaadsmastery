import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Tag, 
  Users,
  Trash2,
  Edit,
  X,
  List,
  CheckSquare,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  tags: string[];
  source: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [selectedListForNewContact, setSelectedListForNewContact] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    tags: '',
    notes: '',
    source: 'manual',
    status: 'active',
  });

  const [listFormData, setListFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      const { data: listsData, error: listsError } = await supabase
        .from('contact_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;
      setLists(listsData || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const contactData = {
        email: formData.email,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone: formData.phone || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        notes: formData.notes || null,
        source: formData.source,
        status: formData.status,
        created_by: user?.id,
      };

      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', editingContact.id);

        if (error) throw error;
        toast.success('Contact modifié avec succès');
      } else {
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert([contactData])
          .select()
          .single();

        if (error) throw error;

        // Ajouter le contact à la liste sélectionnée si une liste est spécifiée
        if (selectedListForNewContact && newContact) {
          const { error: memberError } = await supabase
            .from('contact_list_members')
            .insert({
              contact_id: newContact.id,
              list_id: selectedListForNewContact,
            });

          if (memberError) {
            console.error('Error adding contact to list:', memberError);
            toast.warning('Contact créé mais non ajouté à la liste');
          }
        }

        toast.success('Contact ajouté avec succès');
      }

      setIsAddDialogOpen(false);
      setEditingContact(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving contact:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement du contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Contact supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erreur lors de la suppression du contact');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      email: contact.email,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      phone: contact.phone || '',
      tags: contact.tags.join(', '),
      notes: contact.notes || '',
      source: contact.source,
      status: contact.status,
    });
    setIsAddDialogOpen(true);
  };

  const handleExportCSV = () => {
    const contactsToExport = selectedContacts.size > 0
      ? contacts.filter(c => selectedContacts.has(c.id))
      : contacts;

    const headers = ['Email', 'Prénom', 'Nom', 'Téléphone', 'Tags', 'Source', 'Statut', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...contactsToExport.map(c => [
        c.email,
        c.first_name || '',
        c.last_name || '',
        c.phone || '',
        c.tags.join(';'),
        c.source,
        c.status,
        c.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(`${contactsToExport.length} contacts exportés`);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const { data: { user } } = await supabase.auth.getUser();
      const contactsToImport = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const contact: any = {
          email: values[0],
          first_name: values[1] || null,
          last_name: values[2] || null,
          phone: values[3] || null,
          tags: values[4] ? values[4].split(';').map(t => t.trim()) : [],
          source: 'import',
          status: values[6] || 'active',
          notes: values[7] || null,
          created_by: user?.id,
        };
        
        if (contact.email) {
          contactsToImport.push(contact);
        }
      }

      const { error } = await supabase
        .from('contacts')
        .insert(contactsToImport);

      if (error) throw error;

      toast.success(`${contactsToImport.length} contacts importés avec succès`);
      setIsImportDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error importing contacts:', error);
      toast.error(error.message || 'Erreur lors de l\'importation');
    }
  };

  const handleCreateList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const listData = {
        name: listFormData.name,
        description: listFormData.description || null,
        created_by: user?.id,
      };

      if (editingList) {
        const { error } = await supabase
          .from('contact_lists')
          .update(listData)
          .eq('id', editingList.id);

        if (error) throw error;
        toast.success('Liste modifiée avec succès');
      } else {
        const { data: newList, error: listError } = await supabase
          .from('contact_lists')
          .insert([listData])
          .select()
          .single();

        if (listError) throw listError;

        if (selectedContacts.size > 0 && newList) {
          const members = Array.from(selectedContacts).map(contactId => ({
            contact_id: contactId,
            list_id: newList.id,
          }));

          const { error: membersError } = await supabase
            .from('contact_list_members')
            .insert(members);

          if (membersError) throw membersError;
        }

        toast.success('Liste créée avec succès');
      }

      setIsListDialogOpen(false);
      setEditingList(null);
      setListFormData({ name: '', description: '' });
      setSelectedContacts(new Set());
      loadData();
    } catch (error: any) {
      console.error('Error saving list:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde de la liste');
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) return;

    try {
      const { error } = await supabase
        .from('contact_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Liste supprimée avec succès');
      loadData();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Erreur lors de la suppression de la liste');
    }
  };

  const handleEditList = (list: ContactList) => {
    setEditingList(list);
    setListFormData({
      name: list.name,
      description: list.description || '',
    });
    setIsListDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      tags: '',
      notes: '',
      source: 'manual',
      status: 'active',
    });
    setSelectedListForNewContact('');
  };

  const toggleContactSelection = (id: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedContacts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  // Get unique tags
  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesTag = tagFilter === 'all' || contact.tags.includes(tagFilter);
    
    return matchesSearch && matchesStatus && matchesTag;
  });

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Contacts</h1>
          <p className="text-muted-foreground mt-1">
            {contacts.length} contact{contacts.length > 1 ? 's' : ''} · {lists.length} liste{lists.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingContact(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'Modifier le contact' : 'Ajouter un contact'}</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du contact
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="prospect, vip, newsletter"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="source">Source</Label>
                    <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manuel</SelectItem>
                        <SelectItem value="form_submission">Formulaire</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="unsubscribed">Désabonné</SelectItem>
                        <SelectItem value="bounced">Rebondi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                {!editingContact && (
                  <div className="grid gap-2">
                    <Label htmlFor="target_list">Ajouter à une liste (optionnel)</Label>
                    <Select value={selectedListForNewContact} onValueChange={setSelectedListForNewContact}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une liste" />
                      </SelectTrigger>
                      <SelectContent>
                        {lists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddContact}>
                  {editingContact ? 'Modifier' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => { setEditingList(null); setListFormData({ name: '', description: '' }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une liste
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingList ? 'Modifier la liste' : 'Créer une liste'}</DialogTitle>
                <DialogDescription>
                  {editingList ? 'Modifiez les informations de la liste' : selectedContacts.size > 0 ? `Créer une liste avec ${selectedContacts.size} contact(s) sélectionné(s)` : 'Créer une nouvelle liste vide'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="list_name">Nom de la liste *</Label>
                  <Input
                    id="list_name"
                    value={listFormData.name}
                    onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="list_description">Description</Label>
                  <Textarea
                    id="list_description"
                    value={listFormData.description}
                    onChange={(e) => setListFormData({ ...listFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsListDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateList}>
                  {editingList ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer des contacts</DialogTitle>
                <DialogDescription>
                  Importez un fichier CSV avec les colonnes: Email, Prénom, Nom, Téléphone, Tags, Source, Statut, Notes
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                />
              </div>
            </DialogContent>
          </Dialog>

          {selectedContacts.size > 0 && (
            <Button variant="outline" onClick={() => { setEditingList(null); setIsListDialogOpen(true); }}>
              <List className="mr-2 h-4 w-4" />
              Ajouter à une liste ({selectedContacts.size})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="unsubscribed">Désabonné</SelectItem>
                <SelectItem value="bounced">Rebondi</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTagFilter('all');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contacts ({filteredContacts.length})</span>
            {filteredContacts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectedContacts.size === filteredContacts.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={() => toggleContactSelection(contact.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{contact.email}</TableCell>
                    <TableCell>
                      {contact.first_name || contact.last_name
                        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                        : '-'}
                    </TableCell>
                    <TableCell>{contact.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contact.status === 'active' ? 'default' : 'secondary'}
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun contact trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lists */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listes de diffusion ({lists.length})</CardTitle>
              <CardDescription>Gérez vos listes de contacts</CardDescription>
            </div>
            <Button onClick={() => { setEditingList(null); setListFormData({ name: '', description: '' }); setIsListDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle liste
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucune liste créée. Créez votre première liste pour organiser vos contacts.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <Card key={list.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        {list.name}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditList(list)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteList(list.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    {list.description && (
                      <CardDescription>{list.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};