import postgres from "postgres";
import { test, expect, Page } from "@playwright/test";
import Content from "../src/models/Content"
import { ContentProps } from "../src/models/Content";
import ToWatchContent from "../src/models/ToWatchContent";
import { UserProps } from "../src/models/User"
import User from "../src/models/User"
import { createUTCDate } from "../src/utils";


test.describe("CRUD operations", () => {
	// Set up the connection to the DB.
	const sql = postgres({
		database: "ContentDB",
	});

	test.beforeEach(async () => {
		// Anything you want to do before each test runs?
		await sql.unsafe(`DROP TABLE IF EXISTS content CASCADE;
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
		
		
		DROP TABLE IF EXISTS contents CASCADE;
		CREATE TABLE contents (
		  content_id SERIAL PRIMARY KEY,
		  email VARCHAR(100) NOT NULL UNIQUE,
		  password VARCHAR(255) NOT NULL,
		  profile TEXT,
		  is_admin BOOLEAN DEFAULT FALSE,
		  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		  edited_at TIMESTAMP,
		  visibility BOOLEAN DEFAULT TRUE
		);
		
		DROP TABLE IF EXISTS watched_content CASCADE;
		CREATE TABLE watched_content (
		  content_id INTEGER REFERENCES contents(content_id),
		  content_id INTEGER REFERENCES content(content_id),
		  PRIMARY KEY (content_id, content_id),
		  rating FLOAT
		);
		
		DROP TABLE IF EXISTS to_watch_content CASCADE;
		CREATE TABLE to_watch_content (
		  content_id INTEGER REFERENCES contents(content_id),
		  content_id INTEGER REFERENCES content(content_id),
		  PRIMARY KEY (content_id, content_id)
		);`);
	});

	/**
	 * Clean up the database after each test. This function deletes all the rows
	 * from the todos and subtodos tables and resets the sequence for each table.
	 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
	 */
	test.afterEach(async () => {
		// Replace the table_name with the name of the table(s) you want to clean up.
	});

	// Close the connection to the DB after all tests are done.
	test.afterAll(async () => {
		await sql.end();
	});

	const createContent = async (props: Partial<ContentProps> = {}) => {
		return await Content.create(sql, {
            title: props.title || "Logan",
            description: props.description || "Logan, The Wolverine goes on an adventure with a similar mutant to himself.",
            contentPoster: props.contentPoster || "the poster",
            type: props.type || "movie",
            createdBy: props.createdBy || ["James Mangold"],
            releaseDate: props.releaseDate || "2017-03-03",
            genres: props.genres || ["Action", "Drama"],
            rating: props.rating || 10.0
		});
	};

	const createUser = async (props: Partial<UserProps> = {}) => {
		return await User.create(sql, {
			email: props.email || "user@email.com",
			password: props.password || "password",
			createdAt: props.createdAt || createUTCDate(),
			visibility: true
		});
	};

	test("content was added to database.", async () => {
		const content = await createContent({});
        const user = await createUser({});
        const toWatchContent = await ToWatchContent.add(sql, content.props.contentId, user.props.userId);

		expect().toBe("");
		expect().toBe("");
	});

	test("Content ", async () => {
		const content = await createContent({});
        const user = await createUser({});
        const toWatchContent = await ToWatchContent.add();

		expect().toBe("");
		expect().toBe("");
	});

	test("Content ", async () => {
		const content = await createContent({});
        const user = await createUser({});
        const toWatchContent = await ToWatchContent.add();

		expect().toBe("");
		expect().toBe("");
	});

	test("Content ", async () => {
		const content = await createContent({  });

	});

	test("Content ", async () => {
		const content = await createContent({  });

	});

	test("Content ", async () => {
		const content = await createContent({  });


	});
});