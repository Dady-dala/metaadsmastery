import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Edit2, Clock, Plus } from "lucide-react";

interface VideoNote {
  id: string;
  note_content: string;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface VideoNotesProps {
  videoId: string;
  currentTime?: number;
  onSeekTo?: (time: number) => void;
}

export const VideoNotes = ({ videoId, currentTime = 0, onSeekTo }: VideoNotesProps) => {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [videoId]);

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("video_notes")
        .select("*")
        .eq("video_id", videoId)
        .eq("student_id", user.id)
        .order("timestamp_seconds", { ascending: true });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error("Error loading notes:", error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("video_notes").insert({
        student_id: user.id,
        video_id: videoId,
        note_content: newNote,
        timestamp_seconds: Math.floor(currentTime),
      });

      if (error) throw error;

      toast.success("Note ajoutée");
      setNewNote("");
      loadNotes();
    } catch (error: any) {
      toast.error("Erreur lors de l'ajout de la note");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("video_notes")
        .update({ note_content: editContent })
        .eq("id", noteId);

      if (error) throw error;

      toast.success("Note modifiée");
      setEditingId(null);
      loadNotes();
    } catch (error: any) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("video_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast.success("Note supprimée");
      loadNotes();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mes Notes</h3>
        <span className="text-sm text-muted-foreground">{notes.length} note(s)</span>
      </div>

      {/* Add new note */}
      <Card className="p-4 space-y-3">
        <Textarea
          placeholder="Ajouter une note à ce moment de la vidéo..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(Math.floor(currentTime))}
          </span>
          <Button onClick={addNote} disabled={loading || !newNote.trim()} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </Card>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="p-4 space-y-2">
            {editingId === note.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={() => updateNote(note.id)} size="sm" disabled={loading}>
                    Sauvegarder
                  </Button>
                  <Button
                    onClick={() => setEditingId(null)}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1 whitespace-pre-wrap">{note.note_content}</p>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.note_content);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {note.timestamp_seconds !== null && onSeekTo && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => onSeekTo(note.timestamp_seconds!)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(note.timestamp_seconds)}
                  </Button>
                )}
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
