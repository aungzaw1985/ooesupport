-- 1. Create the new Enum type
CREATE TYPE "FormFieldVisibility" AS ENUM ('OPTIONAL', 'REQUIRED', 'REQUIRED_END_USERS', 'REQUIRED_AGENTS', 'INTERNAL_OPTIONAL', 'INTERNAL_REQUIRED', 'END_USERS_ONLY');

-- 2. Add the new column, defaulting to 'OPTIONAL' for existing fields
ALTER TABLE "FormField" ADD COLUMN "visibility" "FormFieldVisibility" NOT NULL DEFAULT 'OPTIONAL';

-- 3. Drop the old boolean column
ALTER TABLE "FormField" DROP COLUMN "required";