-- Migration 1: Ajouter le rôle 'student' à l'enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';