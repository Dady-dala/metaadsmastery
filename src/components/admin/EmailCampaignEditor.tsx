import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EmailCampaignEditorProps {
  campaign: any | null;
  onSave: () => void;
  onCancel: () => void;
}

export function EmailCampaignEditor({ campaign, onSave, onCancel }: EmailCampaignEditorProps) {
  const [name, setName] = useState(campaign?.name || '');
  const [subject, setSubject] = useState(campaign?.subject || '');
  const [htmlBody, setHtmlBody] = useState(campaign?.html_body || '');
  const [triggerType, setTriggerType] = useState(campaign?.trigger_type || 'manual');
  const [targetCourseId, setTargetCourseId] = useState(campaign?.target_audience?.course_id || '');
  const [inactivityDays, setInactivityDays] = useState(campaign?.trigger_config?.days || '7');
  const [progressPercentage, setProgressPercentage] = useState(campaign?.trigger_config?.percentage || '50');
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .order('title');
    
    setCourses(data || []);
  };

  const handleSave = async () => {
    if (!name || !subject || !htmlBody) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const triggerConfig: any = {};
      if (triggerType === 'inactivity') {
        triggerConfig.days = parseInt(inactivityDays);
      } else if (triggerType === 'percentage_progress') {
        triggerConfig.percentage = parseInt(progressPercentage);
      }

      const targetAudience: any = {};
      if (targetCourseId) {
        targetAudience.course_id = targetCourseId;
      }

      const campaignData = {
        name,
        subject,
        html_body: htmlBody,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        target_audience: targetAudience,
      };

      if (campaign) {
        const { error } = await supabase
          .from('email_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_campaigns')
          .insert([campaignData]);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: campaign ? "Campagne mise à jour" : "Campagne créée",
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la campagne",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nom de la campagne</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Bienvenue nouveaux étudiants"
          />
        </div>

        <div>
          <Label htmlFor="subject">Objet de l'e-mail</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Bienvenue dans votre formation !"
          />
        </div>

        <div>
          <Label htmlFor="trigger">Déclencheur</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manuel</SelectItem>
              <SelectItem value="new_student">Nouvel étudiant</SelectItem>
              <SelectItem value="course_assigned">Assignation à une formation</SelectItem>
              <SelectItem value="course_completed">Formation complétée</SelectItem>
              <SelectItem value="percentage_progress">Progression % atteinte</SelectItem>
              <SelectItem value="inactivity">Inactivité</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {triggerType === 'inactivity' && (
          <div>
            <Label htmlFor="inactivity_days">Nombre de jours d'inactivité</Label>
            <Input
              id="inactivity_days"
              type="number"
              value={inactivityDays}
              onChange={(e) => setInactivityDays(e.target.value)}
              min="1"
            />
          </div>
        )}

        {triggerType === 'percentage_progress' && (
          <div>
            <Label htmlFor="progress_percentage">Pourcentage de progression</Label>
            <Input
              id="progress_percentage"
              type="number"
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(e.target.value)}
              min="0"
              max="100"
            />
          </div>
        )}

        <div>
          <Label htmlFor="course">Cibler une formation spécifique (optionnel)</Label>
          <Select value={targetCourseId} onValueChange={setTargetCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les formations</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Contenu de l'e-mail</Label>
          <div className="mt-2">
            <ReactQuill
              theme="snow"
              value={htmlBody}
              onChange={setHtmlBody}
              modules={modules}
              className="bg-background"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Variables disponibles: {'{'}student_name{'}'}, {'{'}course_name{'}'}, {'{'}espace_formation_link{'}'}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Sauvegarde..." : campaign ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </div>
  );
}
