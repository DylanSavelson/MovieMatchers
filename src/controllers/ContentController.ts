import postgres from "postgres";
import Router from "../router/Router";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import User, { InvalidCredentialsError, UserProps } from "../models/User";
import SessionManager from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import Session from "../auth/Session"
import { spec } from "node:test/reporters";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import Content from "../models/Content";


export default class AuthController {
	private sql: postgres.Sql<any>;
	private sessionManager: SessionManager;
	constructor(sql: postgres.Sql<any>) {
		this.sql = sql;
		this.sessionManager = SessionManager.getInstance();
	}

	registerRoutes(router: Router) {
		router.get("/content", this.getContentForm);
        router.post("/content", this.getSearchedContents);
		router.get("/individual_content", this.getIndividualContent);
		router.get("/watched/:id", this.getWatchedPage);
    }

	getWatchedPage = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		await res.send({
			statusCode: StatusCode.OK,
			message: "Watched content page",
			//get watched content and send here
			payload: {
				sessionCookie: session.get("userId") ? true : false,
				userId: session.get("userId")
			},
			template: "WatchedView",
		});
	}

	getIndividualContent= async (req: Request, res: Response) => 
	{
		const content_id = req.getSearchParams().get("content_id")
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );

		if (content_id)
		{
			const content = await Content.read(this.sql, parseInt(content_id))
			if (content)
			{
				let new_description = content.props.description
				if (new_description.length > 400)
				{
					new_description = new_description.substring(0, 400) + "...";
				}
				await res.send({
					statusCode: StatusCode.OK,
					message: "Content page",
					payload: {
						sessionCookie: session.get("userId") ? true : false,
						userId: session.get("userId"),
						error: req.getSearchParams().get("error"),
						content: content,
						description: new_description
					},
					template: "ContentView",
				});
			}
			else
			{

			}
		}

	}

    getSearchedContents = async (req: Request, res: Response) => 
    {
        const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
          const new_content = await Content.readAll(this.sql, req.body.content)

          if (new_content.length > 0)
          {
              await res.send({
                  statusCode: StatusCode.OK,
                  message: "Contents",
                  payload: {
                    sessionCookie: session.get("userId") ? true : false,
                    userId: session.get("userId"),
                    content: new_content           
			    },
                  template: "SearchedContents",
              });
          }
		  else
		  {
			await res.send({
				statusCode: StatusCode.OK,
				message: "Contents",
				payload: {
				  sessionCookie: session.get("userId") ? true : false,
				  userId: session.get("userId")
				},
				redirect: "/content?error=No found content",
			});
		  }
    }

	getContentForm = async (req: Request, res: Response) => 
	{
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		await res.send({
			statusCode: StatusCode.OK,
			message: "Content search form",
			payload: {
				sessionCookie: session.get("userId") ? true : false,
				userId: session.get("userId"),
				error: req.getSearchParams().get("error"),
			},
			template: "ContentSearchView",
		});
	}


}