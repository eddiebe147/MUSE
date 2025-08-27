CREATE TABLE IF NOT EXISTS "project_setup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_project_id" uuid NOT NULL,
	"template_id" uuid,
	"uploaded_materials" jsonb,
	"material_analysis" jsonb,
	"customizations" jsonb,
	"suggested_templates" jsonb,
	"setup_completed" boolean DEFAULT false NOT NULL,
	"setup_step" integer DEFAULT 1 NOT NULL,
	"setup_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text NOT NULL,
	"structure_config" jsonb NOT NULL,
	"formatting_rules" jsonb,
	"quality_checklist" jsonb,
	"phase_templates" jsonb,
	"example_projects" jsonb,
	"tags" jsonb,
	"difficulty_level" text DEFAULT 'beginner' NOT NULL,
	"estimated_duration" text,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"rating_average" integer DEFAULT 0,
	"rating_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"story_project_id" uuid,
	"completion_rate" integer,
	"user_satisfaction" integer,
	"modifications_made" jsonb,
	"time_to_complete" integer,
	"abandoned_at_step" integer,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"completed_first_onboarding" boolean DEFAULT false NOT NULL,
	"preferred_formats" jsonb,
	"workflow_preferences" jsonb,
	"skip_onboarding" boolean DEFAULT false NOT NULL,
	"last_project_format" text,
	"onboarding_step" integer DEFAULT 1,
	"completion_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_setup" ADD CONSTRAINT "project_setup_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_setup" ADD CONSTRAINT "project_setup_template_id_story_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."story_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_templates" ADD CONSTRAINT "story_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_analytics" ADD CONSTRAINT "template_analytics_template_id_story_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."story_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_analytics" ADD CONSTRAINT "template_analytics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_analytics" ADD CONSTRAINT "template_analytics_story_project_id_story_projects_id_fk" FOREIGN KEY ("story_project_id") REFERENCES "public"."story_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
