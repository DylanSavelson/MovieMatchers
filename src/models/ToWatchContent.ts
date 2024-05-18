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

export default class ToWatchContent{
    constructor(
        private sql: postgres.Sql<any>,
    ){}

    static async add(sql: postgres.Sql<any>, contentId: number, userId: number){
        const connection = await sql.reserve();

        await connection`
            INSERT INTO to_watch_content
            (user_id, content_id) VALUES (${userId}, ${contentId})
        `;
        
        connection.release();
    }

    static async remove(sql: postgres.Sql<any>, contentId: number, userId: number){
        const connection = await sql.reserve();

        await connection`
            DELETE FROM to_watch_content
            WHERE content_id = ${contentId} and user_id = ${userId}
        `;

        await connection.release();
    }

    static async readAll(sql: postgres.Sql<any>, userId: number): Promise<Content[]>
    {
        const connection = await sql.reserve();
		const rows = await connection<ContentProps[]>`
			SELECT *
			FROM to_watch_content
			where user_id = ${userId}
		`;
        await connection.release();
        let new_rows  = rows.map(
			(row) =>
				convertToCase(snakeToCamel, row),)

        let content = [];
        for (let i = 0; i < rows.length; i ++)
        {
            content[i] = await Content.read(sql, new_rows[i].contentId);
        }


		return content;
    }
    static async read(sql: postgres.Sql<any>, userId: number, contentId: number)
    {
        const connection = await sql.reserve();
		const [row] = await connection<ContentProps[]>`
			SELECT *
			FROM to_watch_content
			where user_id = ${userId} and content_id = ${contentId}
		`;

		await connection.release();

		return new Content(sql, convertToCase(snakeToCamel, row) as ContentProps);
    }
}