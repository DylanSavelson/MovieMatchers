DROP DATABASE IF EXISTS "ContentDB";
CREATE DATABASE "ContentDB";

\c ContentDB;

DROP TYPE IF EXISTS content_type;
CREATE TYPE content_type AS ENUM ('movie', 'tv');

DROP TABLE IF EXISTS content;
CREATE TABLE content (
  content_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  content_poster TEXT NOT NULL,
  type content_type NOT NULL,
	created_by TEXT[],
	release_date TEXT,
	genres TEXT[],
	rating FLOAT,
	seasons INTEGER
  );


DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
	  profile TEXT,
	  is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP
);

DROP TABLE IF EXISTS watched_content;
CREATE TABLE watched_content (
  user_id INTEGER REFERENCES users(user_id),
  content_id INTEGER REFERENCES content(content_id),
  PRIMARY KEY (user_id, content_id),
  rating INTEGER
);