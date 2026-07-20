CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'candidate' NOT NULL,
	"avatar_url" text,
	"phone" text,
	"telegram_chat_id" text,
	"is_banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"sector" text,
	"description" text,
	"city" text,
	"address" text,
	"website" text,
	"contact_email" text,
	"contact_phone" text,
	"employee_count" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"hr_subscription_tier" text DEFAULT 'hr_basic' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"category" text NOT NULL,
	"title" text,
	"summary" text,
	"city" text,
	"district" text,
	"metro_station" text,
	"salary_expectation" integer,
	"currency" text DEFAULT 'AZN' NOT NULL,
	"experience_years" integer,
	"education" text,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"cv_url" text,
	"voice_intro_url" text,
	"video_intro_url" text,
	"has_disability_status" boolean DEFAULT false NOT NULL,
	"has_medical_restriction" boolean DEFAULT false NOT NULL,
	"has_financial_issues" boolean DEFAULT false NOT NULL,
	"is_contact_blurred" boolean DEFAULT true NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"average_rating" real,
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_suspended_by_admin" boolean DEFAULT false NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"requirements" text,
	"city" text,
	"address" text,
	"employment_type" text DEFAULT 'full_time' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"currency" text DEFAULT 'AZN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_suspended_by_admin" boolean DEFAULT false NOT NULL,
	"admin_note" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"application_count" integer DEFAULT 0 NOT NULL,
	"requires_voice_intro" boolean DEFAULT false NOT NULL,
	"voice_prompt" text,
	"requires_nearby_location" boolean DEFAULT false NOT NULL,
	"job_lat" real,
	"job_lng" real,
	"radius_km" integer,
	"requires_health_declaration" boolean DEFAULT false NOT NULL,
	"requires_credit_declaration" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"cover_letter" text,
	"voice_application_url" text,
	"voice_duration_sec" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"hr_user_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"job_id" integer,
	"type" text DEFAULT 'interview_invite' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"unblurred_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_access_grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"hr_user_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"contact_request_id" integer,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"audience" text DEFAULT 'candidate' NOT NULL,
	"description" text,
	"price" real NOT NULL,
	"currency" text DEFAULT 'AZN' NOT NULL,
	"duration_days" integer NOT NULL,
	"media_view_limit" integer DEFAULT 0 NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"contact_request_id" integer,
	"company_id" integer,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'AZN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'simulated' NOT NULL,
	"provider_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"payload" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"external_post_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"hr_user_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"stars" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"score" real NOT NULL,
	"factors" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"media_view_limit" integer DEFAULT 10 NOT NULL,
	"media_views_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_view_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"hr_user_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "job_matches_job_candidate_idx" ON "job_matches" USING btree ("job_id","candidate_id");