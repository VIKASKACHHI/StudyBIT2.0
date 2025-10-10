-- Add course and branch columns to materials table
ALTER TABLE public.materials 
ADD COLUMN course text,
ADD COLUMN branch text;

-- Update existing materials to have a default course
UPDATE public.materials 
SET course = 'B.Tech' 
WHERE course IS NULL;