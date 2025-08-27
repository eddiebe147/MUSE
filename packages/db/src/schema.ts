import {
  pgTable,
  uuid,
  timestamp,
  text,
  varchar,
  jsonb,
  boolean,
  primaryKey,
  integer,
  pgEnum,
  unique,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations, Many, One } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

export const user = pgTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
});

export const session = pgTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable("verification", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const Chat = pgTable('Chat', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
  title: text('title').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  document_context: jsonb('document_context'),
});

export type Chat = InferSelectModel<typeof Chat>;

export const Message = pgTable('Message', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => Chat.id),
  role: varchar('role').notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
});

export type Message = InferSelectModel<typeof Message>;

export const artifactKindEnum = pgEnum('artifact_kind', ['text', 'code', 'image', 'sheet']);

export const documentVisibilityEnum = pgEnum('document_visibility', ['public', 'private']);

export const Document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
      .notNull()
      .$onUpdate(() => new Date()),
    title: text('title').notNull(),
    content: text('content'),
    kind: artifactKindEnum('kind')
      .notNull()
      .default('text'),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    chatId: uuid('chatId')
      .references(() => Chat.id),
    is_current: boolean('is_current').notNull(),
    visibility: text('visibility', { enum: ['public', 'private'] }).notNull().default('private'),
    style: jsonb('style'),
    author: text('author'),
    slug: text('slug'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
      userSlugUnique: uniqueIndex('Document_userId_slug_unique').on(table.userId, table.slug),
    };
  },
);

export type Document = InferSelectModel<typeof Document>;

export const subscription = pgTable("subscription", {
  id: text('id').primaryKey(),
  plan: text('plan').notNull(),
  referenceId: text('reference_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  status: text('status').notNull(),
  periodStart: timestamp('period_start', { mode: 'date' }),
  periodEnd: timestamp('period_end', { mode: 'date' }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  seats: integer('seats'),
  trialStart: timestamp('trial_start', { mode: 'date' }),
  trialEnd: timestamp('trial_end', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// MUSE Story Intelligence Tables (moved before relations)

export const story_projects = pgTable('story_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['development', 'pre_production', 'production', 'post_production', 'completed'] }).notNull().default('development'),
  genre: text('genre'),
  target_audience: text('target_audience'),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
  metadata: jsonb('metadata'),
});

export type StoryProject = InferSelectModel<typeof story_projects>;

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role', { enum: ['protagonist', 'antagonist', 'supporting', 'minor'] }).notNull(),
  description: text('description'),
  backstory: text('backstory'),
  personality_traits: text('personality_traits'),
  goals: text('goals'),
  conflicts: text('conflicts'),
  arc_development: text('arc_development'),
  story_project_id: uuid('story_project_id').notNull().references(() => story_projects.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Character = InferSelectModel<typeof characters>;

export const transcripts = pgTable('transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  source_type: text('source_type', { enum: ['interview', 'meeting', 'brainstorm', 'other'] }).notNull(),
  word_count: integer('word_count'),
  duration_minutes: integer('duration_minutes'),
  story_project_id: uuid('story_project_id').notNull().references(() => story_projects.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
  metadata: jsonb('metadata'),
});

export type Transcript = InferSelectModel<typeof transcripts>;

export const phase_workflows = pgTable('phase_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  phase: text('phase', { enum: ['development', 'pre_production', 'production', 'post_production'] }).notNull(),
  workflow_name: text('workflow_name').notNull(),
  description: text('description'),
  steps: jsonb('steps').notNull(),
  estimated_duration_days: integer('estimated_duration_days'),
  dependencies: jsonb('dependencies'),
  deliverables: jsonb('deliverables'),
  story_project_id: uuid('story_project_id').notNull().references(() => story_projects.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['not_started', 'in_progress', 'completed', 'blocked'] }).notNull().default('not_started'),
  started_at: timestamp('started_at', { withTimezone: true, mode: 'date' }),
  completed_at: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PhaseWorkflow = InferSelectModel<typeof phase_workflows>;

export const production_guidelines = pgTable('production_guidelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category', { enum: ['character_development', 'plot_structure', 'dialogue', 'world_building', 'pacing', 'theme', 'genre_conventions', 'technical'] }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  applicable_phases: jsonb('applicable_phases'),
  examples: text('examples'),
  story_project_id: uuid('story_project_id').references(() => story_projects.id, { onDelete: 'cascade' }),
  is_global: boolean('is_global').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
  tags: jsonb('tags'),
});

export type ProductionGuideline = InferSelectModel<typeof production_guidelines>;

// Production Bible Document Upload and Management Tables
export const production_bible_documents = pgTable('production_bible_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  original_filename: text('original_filename').notNull(),
  file_type: text('file_type', { enum: ['pdf', 'docx', 'txt', 'md'] }).notNull(),
  file_size: integer('file_size').notNull(),
  file_path: text('file_path').notNull(),
  uploaded_at: timestamp('uploaded_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  story_project_id: uuid('story_project_id').references(() => story_projects.id, { onDelete: 'cascade' }),
  parsing_status: text('parsing_status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  parsing_error: text('parsing_error'),
  extracted_rules_count: integer('extracted_rules_count').default(0),
  metadata: jsonb('metadata'),
});

export type ProductionBibleDocument = InferSelectModel<typeof production_bible_documents>;

export const production_bible_rules = pgTable('production_bible_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  document_id: uuid('document_id').notNull().references(() => production_bible_documents.id, { onDelete: 'cascade' }),
  rule_type: text('rule_type', { enum: ['format', 'style', 'content', 'structure', 'validation'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  pattern: text('pattern'),
  replacement: text('replacement'),
  examples: jsonb('examples'),
  conditions: jsonb('conditions'),
  action: text('action', { enum: ['apply', 'suggest', 'validate', 'warn'] }).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
  confidence: integer('confidence').default(100),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
  is_active: boolean('is_active').notNull().default(true),
});

export type ProductionBibleRule = InferSelectModel<typeof production_bible_rules>;

export const production_bible_configs = pgTable('production_bible_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  rule_ids: jsonb('rule_ids').notNull(),
  priority: integer('priority').notNull().default(100),
  is_active: boolean('is_active').notNull().default(true),
  story_project_id: uuid('story_project_id').references(() => story_projects.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
  metadata: jsonb('metadata'),
});

export type ProductionBibleConfig = InferSelectModel<typeof production_bible_configs>;

export const production_bible_applications = pgTable('production_bible_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  rule_id: uuid('rule_id').notNull().references(() => production_bible_rules.id, { onDelete: 'cascade' }),
  document_section: text('document_section').notNull(),
  original_text: text('original_text').notNull(),
  suggested_text: text('suggested_text').notNull(),
  confidence: integer('confidence').notNull(),
  applied: boolean('applied').notNull().default(false),
  reason: text('reason').notNull(),
  applied_at: timestamp('applied_at', { withTimezone: true, mode: 'date' }),
  transcript_id: uuid('transcript_id').references(() => transcripts.id, { onDelete: 'cascade' }),
  phase: integer('phase'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type ProductionBibleApplication = InferSelectModel<typeof production_bible_applications>;

// Intelligent Onboarding System Tables
export const story_templates = pgTable('story_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category', { enum: ['tv', 'film', 'written', 'interactive', 'gaming'] }).notNull(),
  subcategory: text('subcategory', { enum: ['reality', 'drama', 'documentary', 'comedy', 'competition', 'lifestyle', 'feature', 'series', 'limited_series', 'novel', 'screenplay', 'rpg', 'interactive_fiction'] }),
  description: text('description').notNull(),
  structure_config: jsonb('structure_config').notNull(), // 4-phase workflow configuration
  formatting_rules: jsonb('formatting_rules'), // Format-specific requirements
  quality_checklist: jsonb('quality_checklist'), // Genre conventions and best practices
  phase_templates: jsonb('phase_templates'), // Templates for each phase
  example_projects: jsonb('example_projects'), // Sample projects using this template
  tags: jsonb('tags'), // Searchable tags
  difficulty_level: text('difficulty_level', { enum: ['beginner', 'intermediate', 'advanced', 'expert'] }).notNull().default('beginner'),
  estimated_duration: text('estimated_duration'), // "2-4 hours", "1-2 weeks", etc.
  is_builtin: boolean('is_builtin').notNull().default(false),
  is_featured: boolean('is_featured').notNull().default(false),
  created_by: text('created_by').references(() => user.id),
  usage_count: integer('usage_count').notNull().default(0),
  rating_average: integer('rating_average').default(0), // 0-100 scale
  rating_count: integer('rating_count').default(0),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type StoryTemplate = InferSelectModel<typeof story_templates>;

export const user_onboarding = pgTable('user_onboarding', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  completed_first_onboarding: boolean('completed_first_onboarding').notNull().default(false),
  preferred_formats: jsonb('preferred_formats'), // User's most-used formats
  workflow_preferences: jsonb('workflow_preferences'), // Guidance level, auto-update settings
  skip_onboarding: boolean('skip_onboarding').notNull().default(false),
  last_project_format: text('last_project_format'),
  onboarding_step: integer('onboarding_step').default(1),
  completion_data: jsonb('completion_data'), // Analytics about onboarding completion
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserOnboarding = InferSelectModel<typeof user_onboarding>;

export const project_setup = pgTable('project_setup', {
  id: uuid('id').primaryKey().defaultRandom(),
  story_project_id: uuid('story_project_id').notNull().references(() => story_projects.id, { onDelete: 'cascade' }),
  template_id: uuid('template_id').references(() => story_templates.id),
  uploaded_materials: jsonb('uploaded_materials'), // Files uploaded during setup
  material_analysis: jsonb('material_analysis'), // AI analysis results
  customizations: jsonb('customizations'), // User modifications to template
  suggested_templates: jsonb('suggested_templates'), // AI template suggestions with scores
  setup_completed: boolean('setup_completed').notNull().default(false),
  setup_step: integer('setup_step').notNull().default(1), // Track progress through onboarding
  setup_data: jsonb('setup_data'), // Answers to setup questions
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ProjectSetup = InferSelectModel<typeof project_setup>;

export const template_analytics = pgTable('template_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  template_id: uuid('template_id').notNull().references(() => story_templates.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  story_project_id: uuid('story_project_id').references(() => story_projects.id, { onDelete: 'cascade' }),
  completion_rate: integer('completion_rate'), // 0-100 percentage
  user_satisfaction: integer('user_satisfaction'), // 1-5 rating
  modifications_made: jsonb('modifications_made'), // What user customized
  time_to_complete: integer('time_to_complete'), // Minutes to complete setup
  abandoned_at_step: integer('abandoned_at_step'), // If user didn't complete
  feedback: text('feedback'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type TemplateAnalytics = InferSelectModel<typeof template_analytics>;

export type ProductionBibleApplication = InferSelectModel<typeof production_bible_applications>;

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
  sessions: many(session),
  documents: many(Document),
  chats: many(Chat),
  subscriptions: many(subscription),
  storyProjects: many(story_projects),
  productionBibleDocuments: many(production_bible_documents),
  productionBibleConfigs: many(production_bible_configs),
  storyTemplates: many(story_templates),
  userOnboarding: many(user_onboarding),
  templateAnalytics: many(template_analytics),
}));

// Story Intelligence Relations
export const storyProjectsRelations = relations(story_projects, ({ one, many }) => ({
  user: one(user, {
    fields: [story_projects.user_id],
    references: [user.id],
  }),
  characters: many(characters),
  transcripts: many(transcripts),
  phaseWorkflows: many(phase_workflows),
  productionGuidelines: many(production_guidelines),
  productionBibleDocuments: many(production_bible_documents),
  productionBibleConfigs: many(production_bible_configs),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  storyProject: one(story_projects, {
    fields: [characters.story_project_id],
    references: [story_projects.id],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  storyProject: one(story_projects, {
    fields: [transcripts.story_project_id],
    references: [story_projects.id],
  }),
}));

export const phaseWorkflowsRelations = relations(phase_workflows, ({ one }) => ({
  storyProject: one(story_projects, {
    fields: [phase_workflows.story_project_id],
    references: [story_projects.id],
  }),
}));

export const productionGuidelinesRelations = relations(production_guidelines, ({ one }) => ({
  storyProject: one(story_projects, {
    fields: [production_guidelines.story_project_id],
    references: [story_projects.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const chatRelations = relations(Chat, ({ one, many }) => ({
	user: one(user, {
		fields: [Chat.userId],
		references: [user.id],
	}),
  messages: many(Message),
  documents: many(Document),
}));

export const documentRelations = relations(Document, ({ one, many }) => ({
	user: one(user, {
		fields: [Document.userId],
		references: [user.id],
	}),
  chat: one(Chat, {
    fields: [Document.chatId],
    references: [Chat.id],
  }),
}));

export const messageRelations = relations(Message, ({ one }) => ({
	chat: one(Chat, {
		fields: [Message.chatId],
		references: [Chat.id],
	}),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
	user: one(user, {
		fields: [subscription.referenceId],
		references: [user.id],
	}),
}));

// Production Bible Relations
export const productionBibleDocumentsRelations = relations(production_bible_documents, ({ one, many }) => ({
  user: one(user, {
    fields: [production_bible_documents.user_id],
    references: [user.id],
  }),
  storyProject: one(story_projects, {
    fields: [production_bible_documents.story_project_id],
    references: [story_projects.id],
  }),
  rules: many(production_bible_rules),
}));

export const productionBibleRulesRelations = relations(production_bible_rules, ({ one, many }) => ({
  document: one(production_bible_documents, {
    fields: [production_bible_rules.document_id],
    references: [production_bible_documents.id],
  }),
  applications: many(production_bible_applications),
}));

export const productionBibleConfigsRelations = relations(production_bible_configs, ({ one }) => ({
  user: one(user, {
    fields: [production_bible_configs.user_id],
    references: [user.id],
  }),
  storyProject: one(story_projects, {
    fields: [production_bible_configs.story_project_id],
    references: [story_projects.id],
  }),
}));

export const productionBibleApplicationsRelations = relations(production_bible_applications, ({ one }) => ({
  rule: one(production_bible_rules, {
    fields: [production_bible_applications.rule_id],
    references: [production_bible_rules.id],
  }),
  transcript: one(transcripts, {
    fields: [production_bible_applications.transcript_id],
    references: [transcripts.id],
  }),
}));

// Onboarding System Relations
export const storyTemplatesRelations = relations(story_templates, ({ one, many }) => ({
  creator: one(user, {
    fields: [story_templates.created_by],
    references: [user.id],
  }),
  projectSetups: many(project_setup),
  templateAnalytics: many(template_analytics),
}));

export const userOnboardingRelations = relations(user_onboarding, ({ one }) => ({
  user: one(user, {
    fields: [user_onboarding.user_id],
    references: [user.id],
  }),
}));

export const projectSetupRelations = relations(project_setup, ({ one }) => ({
  storyProject: one(story_projects, {
    fields: [project_setup.story_project_id],
    references: [story_projects.id],
  }),
  template: one(story_templates, {
    fields: [project_setup.template_id],
    references: [story_templates.id],
  }),
}));

export const templateAnalyticsRelations = relations(template_analytics, ({ one }) => ({
  template: one(story_templates, {
    fields: [template_analytics.template_id],
    references: [story_templates.id],
  }),
  user: one(user, {
    fields: [template_analytics.user_id],
    references: [user.id],
  }),
  storyProject: one(story_projects, {
    fields: [template_analytics.story_project_id],
    references: [story_projects.id],
  }),
}));