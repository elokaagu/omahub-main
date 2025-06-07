-- Migration: Fix catalogue ID type compatibility
-- This migration fixes the type mismatch between catalogue_id (uuid) and catalogues.id (text)

-- Step 1: First, let's check if we need to convert the catalogues.id column to UUID type
-- or convert the catalogue_id columns to TEXT type

-- Option A: Convert catalogues.id from TEXT to UUID (if it contains valid UUIDs)
-- We'll try this approach first

-- Step 2: Drop the foreign key constraints temporarily
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_catalogue_id_fkey;
ALTER TABLE catalogue_images DROP CONSTRAINT IF EXISTS catalogue_images_catalogue_id_fkey;

-- Step 3: Convert catalogues.id from TEXT to UUID if possible
-- First, let's try to convert the id column to UUID type
ALTER TABLE catalogues ALTER COLUMN id TYPE UUID USING id::UUID;

-- Step 4: Re-add the foreign key constraints with proper types
ALTER TABLE products ADD CONSTRAINT products_catalogue_id_fkey 
    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE SET NULL;

ALTER TABLE catalogue_images ADD CONSTRAINT catalogue_images_catalogue_id_fkey 
    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE CASCADE; 