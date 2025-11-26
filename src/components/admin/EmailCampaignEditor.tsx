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
  const [targetFormId, setTargetFormId] = useState(campaign?.target_audience?.form_id || '');
  const [selectedContactLists, setSelectedContactLists] = useState<string[]>(campaign?.target_audience?.contact_lists || []);
  const [inactivityDays, setInactivityDays] = useState(campaign?.trigger_config?.days || '7');
  const [progressPercentage, setProgressPercentage] = useState(campaign?.trigger_config?.percentage || '50');
  const [sendOption, setSendOption] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (campaign?.scheduled_at) {
      setSendOption('scheduled');
      const date = new Date(campaign.scheduled_at);
      setScheduledDate(date.toISOString().split('T')[0]);
      setScheduledTime(date.toTimeString().slice(0, 5));
    }
  }, [campaign]);

  useEffect(() => {
    loadCourses();
    loadForms();
    loadContactLists();
  }, []);

  const loadCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .order('title');
    
    setCourses(data || []);
  };

  const loadForms = async () => {
    const { data } = await supabase
      .from('forms')
      .select('id, title')
      .eq('is_active', true)
      .order('title');
    
    setForms(data || []);
  };

  const loadContactLists = async () => {
    const { data } = await supabase
      .from('contact_lists')
      .select('id, name, description')
      .order('name');
    
    setContactLists(data || []);
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
      if (targetFormId) {
        targetAudience.form_id = targetFormId;
      }
      if (selectedContactLists.length > 0) {
        targetAudience.contact_lists = selectedContactLists;
      }

      let scheduledAt = null;
      if (sendOption === 'scheduled') {
        if (!scheduledDate || !scheduledTime) {
          toast({
            title: "Erreur",
            description: "Veuillez sélectionner une date et heure de programmation",
            variant: "destructive",
          });
          return;
        }
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const campaignData = {
        name,
        subject,
        html_body: htmlBody,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        target_audience: targetAudience,
        scheduled_at: scheduledAt,
        status: sendOption === 'immediate' ? 'active' : 'draft',
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
              <SelectItem value="manual">📧 Manuel</SelectItem>
              <SelectItem value="new_student">👋 Nouvel étudiant</SelectItem>
              <SelectItem value="course_assigned">📚 Assignation à une formation</SelectItem>
              <SelectItem value="course_completed">🎓 Formation complétée</SelectItem>
              <SelectItem value="percentage_progress">📊 Progression % atteinte</SelectItem>
              <SelectItem value="inactivity">⏰ Inactivité</SelectItem>
              <SelectItem value="form_submitted">📝 Soumission de formulaire</SelectItem>
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

        {triggerType === 'form_submitted' && (
          <div>
            <Label htmlFor="target_form">Formulaire ciblé</Label>
            <Select value={targetFormId || undefined} onValueChange={setTargetFormId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un formulaire" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="course">Cibler une formation spécifique (optionnel)</Label>
          <Select value={targetCourseId || undefined} onValueChange={setTargetCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les formations" />
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
          <Label>Listes de contacts CRM (optionnel)</Label>
          <div className="mt-2 space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
            {contactLists.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune liste de contacts disponible</p>
            ) : (
              contactLists.map((list) => (
                <div key={list.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`list-${list.id}`}
                    checked={selectedContactLists.includes(list.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContactLists([...selectedContactLists, list.id]);
                      } else {
                        setSelectedContactLists(selectedContactLists.filter(id => id !== list.id));
                      }
                    }}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`list-${list.id}`} className="cursor-pointer font-medium">
                      {list.name}
                    </Label>
                    {list.description && (
                      <p className="text-xs text-muted-foreground">{list.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Sélectionnez les listes de contacts qui recevront cet email
          </p>
        </div>

        <div>
          <Label>Options d'envoi</Label>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="immediate"
                  checked={sendOption === 'immediate'}
                  onChange={(e) => setSendOption(e.target.value as 'immediate')}
                  className="rounded"
                />
                <span>Lancer immédiatement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="scheduled"
                  checked={sendOption === 'scheduled'}
                  onChange={(e) => setSendOption(e.target.value as 'scheduled')}
                  className="rounded"
                />
                <span>Programmer l'envoi</span>
              </label>
            </div>

            {sendOption === 'scheduled' && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="scheduled_date">Date</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Heure</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
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
