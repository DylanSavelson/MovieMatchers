import postgres, { camel } from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import axios from "axios";
import { ContentProps } from "./Content";
import Content from "./Content"

export default class WatchedContent{
    constructor(
        private sql: postgres.Sql<any>,
    ){}

    static async add(sql: postgres.Sql<any>, contentId: number, userId: number){
        const connection = await sql.reserve();

        await connection`
            INSERT INTO watched_content
            (user_id, content_id) VALUES (${userId}, ${contentId})
        `;
        
        connection.release();
    }

    static async update(sql: postgres.Sql<any>, contentId: number, newRating: number){
        const connection = await sql.reserve();

        await connection`
            UPDATE watched_content
            SET (rating) = ${newRating}
            WHERE content_id = ${contentId}
        `;

        await connection.release();
    }

    static async remove(sql: postgres.Sql<any>, contentId: number){
        const connection = await sql.reserve();

        await connection`
            DELETE FROM watched_content
            WHERE content_id = ${contentId}
        `;

        await connection.release();
    }

    static async readAll(sql: postgres.Sql<any>, userId: number)
    {
        const connection = await sql.reserve();
		const rows = await connection<ContentProps[]>`
			SELECT *
			FROM watched_content
			where user_id = ${userId}
		`;

		await connection.release();

		return rows.map(
			(row) =>
				new Content(sql, convertToCase(snakeToCamel, row) as ContentProps),
		);

    }
    static async read(sql: postgres.Sql<any>, userId: number, contentId: number)
    {
        const connection = await sql.reserve();
		const [row] = await connection<ContentProps[]>`
			SELECT *
			FROM watched_content
			where user_id = ${userId} and content_id = ${contentId}
		`;

		await connection.release();

		return new Content(sql, convertToCase(snakeToCamel, row) as ContentProps);
    }
}