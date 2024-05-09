DROP DATABASE IF EXISTS "MovieDB";
CREATE DATABASE "MovieDB";

\c MovieDB;

DROP TYPE IF EXISTS movie_status;
CREATE TYPE movie_status AS ENUM ('watched', 'to_watch');

DROP TABLE IF EXISTS movies;
CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status movie_status NOT NULL DEFAULT 'to_watch',
  user_id int NOT NULL
  
  );


DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
	  profile VARCHAR(255),
	  is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP
);