import postgres, { camel } from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

export interface UserProps {
	userId?: number;
	email: string;
	password: string;
	createdAt: Date;
	editedAt?: Date;
	profile?: string;
}

export class DuplicateEmailError extends Error {
	constructor() {
		super("User with this email already exists.");
	}
}

export class InvalidCredentialsError extends Error {
	constructor() {
		super("Invalid credentials.");
	}
}

export default class User {
	constructor(
		private sql: postgres.Sql<any>,
		public props: UserProps,
	) {}

	/**
	 * TODO: Implement this method. It should insert a new
	 * row into the "users" table with the provided props.
	 */
	static async create(
		sql: postgres.Sql<any>,
		props: UserProps,
	): Promise<User> {
		const connection = await sql.reserve();

		props.createdAt = props.createdAt ?? createUTCDate();
		
		const [existingEmail] = await connection<UserProps[]>`
			SELECT * FROM users 
			WHERE email = ${props.email}
			`;
		if (!existingEmail)
		{
			const [row] = await connection<UserProps[]>`
			INSERT INTO users
				${sql(convertToCase(camelToSnake, props))}
			RETURNING *
			`;

			await connection.release();

			return new User(sql, convertToCase(snakeToCamel, row) as UserProps);
		}
		else
		{
			await connection.release();
			throw new DuplicateEmailError();
		}
	}

	/**
	 * TODO: To "log in" a user, we need to check if the
	 * provided email and password match an existing row
	 * in the database. If they do, we return a new User instance.
	 */
	static async login(
		sql: postgres.Sql<any>,
		email: string,
		password: string,
	): Promise<User> {
		const connection = await sql.reserve();
		
		const [userData] = await connection<UserProps[]>`
		SELECT * FROM users WHERE LOWER(email) = ${email.toLowerCase()} AND password = ${password}`;
		
		if (userData)
		{
			await connection.release();
			return new User(sql, convertToCase(snakeToCamel, userData) as UserProps);
		}
		else
		{
			await connection.release();
			throw new InvalidCredentialsError();
		}
	}
	static async read(
		sql: postgres.Sql<any>,
		id: number,
	): Promise<User> 
	{
		const connection = await sql.reserve();
		
		const [userData] = await connection<UserProps[]>`
		SELECT * FROM users WHERE id = ${id}`;
		

		await connection.release();
		return new User(sql, convertToCase(snakeToCamel, userData) as UserProps);

	}

	async update(updateProps: Partial<UserProps>) {
		const connection = await this.sql.reserve();

		const [dupeEmail] = await connection<UserProps[]>`
		SELECT * FROM users WHERE email = ${updateProps.email} and id != ${updateProps.userId}`;
		if (dupeEmail)
		{
			throw new InvalidCredentialsError();
		}

		const [row] = await connection`
			UPDATE users
			SET
				${this.sql(convertToCase(camelToSnake, updateProps))}, edited_at = ${createUTCDate()}
			WHERE
				id = ${this.props.userId}
			RETURNING *
		`;

		await connection.release();

		this.props = { ...this.props, ...convertToCase(snakeToCamel, row) };
	}
}