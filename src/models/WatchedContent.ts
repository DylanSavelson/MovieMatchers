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
        public WatchedList: [Content]
    ){}

    static async add(sql: postgres.Sql<any>, content: Content){

    }

    static async update(sql: postgres.Sql<any>, content_id: number, new_rating: number){

    }

    static async remove(sql: postgres.Sql<any>, content_id: number){

    }
}