-- Autoriser les étudiants à insérer leurs propres certificats
CREATE POLICY "Students can insert their own certificates"
ON certificates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id 
  AND has_role(auth.uid(), 'student'::app_role)
);