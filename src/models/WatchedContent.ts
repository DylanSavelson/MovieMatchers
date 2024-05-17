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

    static async add(sql: postgres.Sql<any>, content_id: number){
        const connection = await sql.reserve();

        await connection`
            INSERT INTO watched_content
            (content_id) VALUES (${content_id})
        `;
        
        connection.release();
    }

    static async update(sql: postgres.Sql<any>, content_id: number, new_rating: number){
        const connection = await sql.reserve();

        await connection`
            UPDATE watched_content
            SET (rating) = ${new_rating}
            WHERE content_id = ${content_id}
        `;

        await connection.release();
    }

    static async remove(sql: postgres.Sql<any>, content_id: number){
        const connection = await sql.reserve();

        await connection`
            DELETE FROM watched_list
            WHERE content_id = ${content_id}
        `;

        await connection.release();
    }
}