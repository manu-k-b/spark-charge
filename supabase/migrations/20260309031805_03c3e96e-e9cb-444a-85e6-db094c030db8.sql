
-- Allow admins to update settings
CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
