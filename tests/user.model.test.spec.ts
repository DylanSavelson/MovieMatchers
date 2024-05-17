import postgres from "postgres";
import { test, expect, Page } from "@playwright/test";
import User from "../src/models/User"
import { UserProps } from "../src/models/User"
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
		
		
		DROP TABLE IF EXISTS users CASCADE;
		CREATE TABLE users (
		  user_id SERIAL PRIMARY KEY,
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
		  user_id INTEGER REFERENCES users(user_id),
		  content_id INTEGER REFERENCES content(content_id),
		  PRIMARY KEY (user_id, content_id),
		  rating FLOAT
		);
		
		DROP TABLE IF EXISTS to_watch_content CASCADE;
		CREATE TABLE to_watch_content (
		  user_id INTEGER REFERENCES users(user_id),
		  content_id INTEGER REFERENCES content(content_id),
		  PRIMARY KEY (user_id, content_id)
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

	const createUser = async (props: Partial<UserProps> = {}) => {
		return await User.create(sql, {
			email: props.email || "user@email.com",
			password: props.password || "password",
			createdAt: props.createdAt || createUTCDate(),
			visibility: true
		});
	};

	test("User was created.", async () => {
		const user = await createUser({ password: "Password123" });

		expect(user.props.email).toBe("user@email.com");
		expect(user.props.password).toBe("Password123");
		expect(user.props.createdAt).toBeTruthy();
		expect(user.props.editedAt).toBeFalsy();
	});

	test("User was not created with duplicate email.", async () => {
		await createUser({ email: "user@email.com" });

		await expect(async () => {
			await createUser({ email: "user@email.com" });
		}).rejects.toThrow("User with this email already exists.");
	});

	test("User was logged in.", async () => {
		const user = await createUser({ password: "Password123" });
		const loggedInUser = await User.login(
			sql,
			user.props.email,
			"Password123",
		);

		expect(loggedInUser?.props.email).toBe("user@email.com");
		expect(loggedInUser?.props.password).toBe("Password123");
	});

	test("User was not logged in with invalid password.", async () => {
		const user = await createUser({ password: "Password123" });

		await expect(async () => {
			await User.login(sql, user.props.email, "wrongpassword");
		}).rejects.toThrow("Invalid credentials.");
	});

	test("User was not logged in with invalid email.", async () => {
		const user = await createUser({ password: "Password123" });

		await expect(async () => {
			await User.login(sql, "invalid@email.com", "password");
		}).rejects.toThrow("Invalid credentials.");
	});

	test("User was not logged in with invalid email and password.", async () => {
		const user = await createUser({ password: "Password123" });

		await expect(async () => {
			await User.login(sql, "invalid@email.com", "wrongpassword");
		}).rejects.toThrow("Invalid credentials.");
	});
});
