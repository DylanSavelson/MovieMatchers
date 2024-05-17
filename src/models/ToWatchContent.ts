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

    static async add(sql: postgres.Sql<any>, content_id: number, user_id: number){
        const connection = await sql.reserve();

        await connection`
            INSERT INTO to_watch_content
            (user_id, content_id) VALUES (${user_id}, ${content_id})
        `;
        
        connection.release();
    }

    static async remove(sql: postgres.Sql<any>, content_id: number){
        const connection = await sql.reserve();

        await connection`
            DELETE FROM to_watch_list
            WHERE content_id = ${content_id}
        `;

        await connection.release();
    }
}