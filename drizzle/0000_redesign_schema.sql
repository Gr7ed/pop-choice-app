create extension if not exists vector;--> statement-breakpoint

drop table if exists recommendation_results cascade;
drop table if exists recommendation_requests cascade;
drop table if exists movie_chunks cascade;
drop table if exists movies cascade;
drop table if exists account cascade;
drop table if exists "session" cascade;
drop table if exists verification cascade;
drop table if exists "user" cascade;
drop function if exists match_movies;--> statement-breakpoint

CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"movie_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_chunks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"movie_id" bigint NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "movie_chunks_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "movie_list_items" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"movie_id" bigint NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"title" text NOT NULL,
	"overview" text,
	"release_date" date,
	"release_year" integer,
	"poster_path" text,
	"backdrop_path" text,
	"vote_average" double precision,
	"vote_count" integer,
	"popularity" double precision,
	"genres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id")
);
--> statement-breakpoint
CREATE TABLE "recommendation_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"favorite_movie" text NOT NULL,
	"mood" text NOT NULL,
	"favorite_genre" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"model" text,
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_results" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"movie_id" bigint,
	"rank" integer NOT NULL,
	"title" text NOT NULL,
	"release_year" text NOT NULL,
	"content" text NOT NULL,
	"poster_url" text,
	"tmdb_id" bigint
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_chunks" ADD CONSTRAINT "movie_chunks_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_list_items" ADD CONSTRAINT "movie_list_items_list_id_movie_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."movie_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_list_items" ADD CONSTRAINT "movie_list_items_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_lists" ADD CONSTRAINT "movie_lists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_requests" ADD CONSTRAINT "recommendation_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_results" ADD CONSTRAINT "recommendation_results_request_id_recommendation_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."recommendation_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_results" ADD CONSTRAINT "recommendation_results_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_movie_idx" ON "favorites" USING btree ("user_id","movie_id");--> statement-breakpoint
CREATE INDEX "movie_chunks_embedding_idx" ON "movie_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "movie_list_items_list_movie_idx" ON "movie_list_items" USING btree ("list_id","movie_id");--> statement-breakpoint
CREATE INDEX "movie_lists_user_idx" ON "movie_lists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "movies_title_idx" ON "movies" USING btree ("title");--> statement-breakpoint
CREATE INDEX "movies_vote_average_idx" ON "movies" USING btree ("vote_average");--> statement-breakpoint
CREATE INDEX "recommendation_requests_user_created_idx" ON "recommendation_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_results_request_rank_idx" ON "recommendation_results" USING btree ("request_id","rank");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");

create or replace function match_movies (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (id bigint, content text, similarity float)
language sql stable
as $$
  select movie_chunks.id,
    movie_chunks.content,
    1 - (movie_chunks.embedding <=> query_embedding) as similarity
  from movie_chunks
  where movie_chunks.embedding <=> query_embedding < 1 - match_threshold
  order by movie_chunks.embedding <=> query_embedding
  limit least(match_count, 10);
$$;--> statement-breakpoint

alter table "user" enable row level security;
alter table "session" enable row level security;
alter table "account" enable row level security;
alter table "verification" enable row level security;
alter table movies enable row level security;
alter table movie_chunks enable row level security;
alter table favorites enable row level security;
alter table movie_lists enable row level security;
alter table movie_list_items enable row level security;
alter table recommendation_requests enable row level security;
alter table recommendation_results enable row level security;--> statement-breakpoint

create policy "movies readable by everyone"
  on movies for select
  to anon, authenticated
  using (true);

create policy "movie_chunks readable by everyone"
  on movie_chunks for select
  to anon, authenticated
  using (true);

create policy "users can manage their own favorites"
  on favorites
  to authenticated
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

create policy "users can manage their own lists"
  on movie_lists
  to authenticated
  using (user_id = (select auth.uid())::text)
  with check (user_id = (select auth.uid())::text);

create policy "users can manage items in their own lists"
  on movie_list_items
  to authenticated
  using (exists (
    select 1 from movie_lists
    where movie_lists.id = movie_list_items.list_id
      and movie_lists.user_id = (select auth.uid())::text
  ))
  with check (exists (
    select 1 from movie_lists
    where movie_lists.id = movie_list_items.list_id
      and movie_lists.user_id = (select auth.uid())::text
  ));

create policy "users can read their own recommendation requests"
  on recommendation_requests
  to authenticated
  using (user_id = (select auth.uid())::text);

create policy "users can read results of their own requests"
  on recommendation_results
  to authenticated
  using (exists (
    select 1 from recommendation_requests
    where recommendation_requests.id = recommendation_results.request_id
      and recommendation_requests.user_id = (select auth.uid())::text
  ));

grant usage on schema public to anon, authenticated;
grant select on movies, movie_chunks to anon, authenticated;
grant select, insert, update, delete on favorites, movie_lists, movie_list_items to authenticated;
grant select, insert, update on recommendation_requests, recommendation_results to authenticated;