DO $$ BEGIN
 CREATE TYPE "public"."document_visibility" AS ENUM('public', 'private');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"description" text,
	"backstory" text,
	"personality_traits" text,
	"goals" text,
	"conflicts" text,
	"arc_development" text,
	"story_project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phase_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase" text NOT NULL,
	"workflow_name" text NOT NULL,
	"description" text,
	"steps" jsonb NOT NULL,
	"estimated_duration_days" integer,
	"dependencies" jsonb,
	"deliverables" jsonb,
	"story_project_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_bible_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"document_section" text NOT NULL,
	"original_text" text NOT NULL,
	"suggested_text" text NOT NULL,
	"confidence" integer NOT NULL,
	"applied" boolean DEFAULT false NOT NULL,
	"reason" text NOT NULL,
	"applied_at" timestamp with time zone,
	"transcript_id" uuid,
	"phase" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_bible_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rule_ids" jsonb NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"story_project_id" uuid,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_bible_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"original_filename" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"story_project_id" uuid,
	"parsing_status" text DEFAULT 'pending' NOT NULL,
	"parsing_error" text,
	"extracted_rules_count" integer DEFAULT 0,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_bible_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"rule_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"pattern" text,
	"replacement" text,
	"examples" jsonb,
	"conditions" jsonb,
	"action" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"confidence" integer DEFAULT 100,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"applicable_phases" jsonb,
	"examples" text,
	"story_project_id" uuid,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tags" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'development' NOT NULL,
	"genre" text,
	"target_audience" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean,
	"seats" integer,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_type" text NOT NULL,
	"word_count" integer,
	"duration_minutes" integer,
	"story_project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "style" jsonb;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "characters" ADD CONSTRAINT "characters_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phase_workflows" ADD CONSTRAINT "phase_workflows_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_bible_applications" ADD CONSTRAINT "production_bible_applications_rule_id_production_bible_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."production_bible_rules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_bible_applications" ADD CONSTRAINT "production_bible_applications_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_bible_configs" ADD CONSTRAINT "production_bible_configs_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_bible_configs" ADD CONSTRAINT "production_bible_configs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_bible_documents" ADD CONSTRAINT "production_bible_documents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_bible_documents" ADD CONSTRAINT "production_bible_documents_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_bible_rules" ADD CONSTRAINT "production_bible_rules_document_id_production_bible_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."production_bible_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_guidelines" ADD CONSTRAINT "production_guidelines_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_projects" ADD CONSTRAINT "story_projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription" ADD CONSTRAINT "subscription_reference_id_user_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Document_userId_slug_unique" ON "Document" USING btree ("userId","slug");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");