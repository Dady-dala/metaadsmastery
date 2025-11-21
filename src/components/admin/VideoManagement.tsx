import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Video, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface Course {
  id: string;
  title: string;
}

interface CourseVideo {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  wistia_media_id: string;
  order_index: number;
}

export const VideoManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CourseVideo | null>(null);
  const [previewWistiaId, setPreviewWistiaId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    wistia_media_id: '',
    course_id: '',
  });

  useEffect(() => {
    loadCourses();
    
    // Load Wistia player script for preview
    const script = document.createElement('script');
    script.src = 'https://fast.wistia.com/player.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadVideos(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
      if (data && data.length > 0) {
        setSelectedCourseId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Erreur lors du chargement des vidéos');
    }
  };

  // Extract Wistia media ID from various formats
  const extractWistiaId = (input: string): string => {
    // Remove whitespace
    const trimmed = input.trim();
    
    // Format 1: Direct ID (e.g., "jbs50a8vzd")
    if (/^[a-z0-9]+$/i.test(trimmed)) {
      return trimmed;
    }
    
    // Format 2: URL (e.g., "https://dadykakwata.wistia.com/medias/jbs50a8vzd?...")
    const urlMatch = trimmed.match(/wistia\.com\/medias\/([a-z0-9]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Format 3: Web component code (e.g., '<wistia-player media-id="jbs50a8vzd"...')
    const componentMatch = trimmed.match(/media-id=["']([a-z0-9]+)["']/i);
    if (componentMatch) {
      return componentMatch[1];
    }
    
    // If no pattern matches, return as-is and let validation handle it
    return trimmed;
  };

  // Handle Wistia ID input change with live preview
  const handleWistiaIdChange = (value: string) => {
    setFormData({ ...formData, wistia_media_id: value });
    
    // Extract and set preview ID
    const extracted = extractWistiaId(value);
    if (extracted && /^[a-z0-9]+$/i.test(extracted)) {
      setPreviewWistiaId(extracted);
    } else {
      setPreviewWistiaId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseId = formData.course_id || selectedCourseId;
      
      // Extract clean Wistia ID
      const cleanWistiaId = extractWistiaId(formData.wistia_media_id);
      
      if (!cleanWistiaId) {
        toast.error('ID Wistia invalide');
        return;
      }
      
      if (editingVideo) {
        const { error } = await supabase
          .from('course_videos')
          .update({
            title: formData.title,
            description: formData.description,
            wistia_media_id: cleanWistiaId,
            course_id: courseId,
          })
          .eq('id', editingVideo.id);
        
        if (error) throw error;
        toast.success('Vidéo mise à jour avec succès');
      } else {
        // Get the next order index
        const { data: existingVideos } = await supabase
          .from('course_videos')
          .select('order_index')
          .eq('course_id', courseId)
          .order('order_index', { ascending: false })
          .limit(1);

        const nextOrderIndex = existingVideos && existingVideos.length > 0 
          ? existingVideos[0].order_index + 1 
          : 0;

        const { error } = await supabase
          .from('course_videos')
          .insert([{
            title: formData.title,
            description: formData.description,
            wistia_media_id: cleanWistiaId,
            course_id: courseId,
            order_index: nextOrderIndex,
          }]);
        
        if (error) throw error;
        toast.success('Vidéo ajoutée avec succès');
      }
      
      setDialogOpen(false);
      setFormData({ title: '', description: '', wistia_media_id: '', course_id: '' });
      setEditingVideo(null);
      loadVideos(selectedCourseId);
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;
    
    try {
      const { error } = await supabase
        .from('course_videos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Vidéo supprimée avec succès');
      loadVideos(selectedCourseId);
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditDialog = (video: CourseVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      wistia_media_id: video.wistia_media_id,
      course_id: video.course_id,
    });
    setPreviewWistiaId(video.wistia_media_id);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingVideo(null);
    setFormData({ title: '', description: '', wistia_media_id: '', course_id: selectedCourseId });
    setPreviewWistiaId('');
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Video className="w-5 h-5" />
              Gestion des Vidéos
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Ajoutez et organisez les vidéos de vos formations
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={openCreateDialog} 
                disabled={!selectedCourseId}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Vidéo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingVideo ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingVideo ? 'Modifiez les détails de la vidéo' : 'Ajoutez une nouvelle vidéo Wistia'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="course" className="text-foreground">Formation</Label>
                  <Select
                    value={formData.course_id || selectedCourseId}
                    onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title" className="text-foreground">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="wistia_media_id" className="text-foreground">ID ou Code Wistia</Label>
                  <Textarea
                    id="wistia_media_id"
                    value={formData.wistia_media_id}
                    onChange={(e) => handleWistiaIdChange(e.target.value)}
                    required
                    placeholder="Collez l'ID, l'URL complète ou le code embed Wistia"
                    className="bg-input border-border text-foreground font-mono text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formats acceptés: ID simple (jbs50a8vzd), URL (https://...wistia.com/medias/jbs50a8vzd) ou code embed complet
                  </p>
                </div>

                {/* Video Preview */}
                {previewWistiaId && (
                  <div>
                    <Label className="text-foreground">Aperçu de la vidéo</Label>
                    <div className="mt-2 rounded-lg overflow-hidden bg-black border border-border">
                      <div className="aspect-video">
                        <wistia-player 
                          media-id={previewWistiaId}
                          seo="false"
                          aspect="1.7777777777777777"
                          className="w-full h-full"
                        ></wistia-player>
                      </div>
                    </div>
                    <p className="text-xs text-success mt-1">
                      ✓ ID détecté: {previewWistiaId}
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {editingVideo ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label className="text-foreground">Sélectionner une formation</Label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedCourseId ? (
          <p className="text-muted-foreground text-center py-8">
            Créez d'abord une formation
          </p>
        ) : videos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucune vidéo pour cette formation
          </p>
        ) : (
          <div className="space-y-3">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="bg-muted/50 border border-border rounded-lg p-4 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="w-5 h-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                        <h3 className="font-semibold text-foreground">{video.title}</h3>
                      </div>
                      {video.description && (
                        <p className="text-sm text-muted-foreground mb-2">{video.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        Wistia ID: {video.wistia_media_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(video)}
                      className="border-border"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
