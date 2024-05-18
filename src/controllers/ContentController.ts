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
import ToWatchContent from "../models/ToWatchContent";
import WatchedContent from "../models/WatchedContent";
import SimilarContent from "../models/SimilarContent";
import { c } from "vite/dist/node/types.d-aGj9QkWt";


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
		router.get("/error",this.getErrorView);
		router.get("/similar", this.getSimilar);
		router.get("/to_watch/:id", this.getToWatchPage);
		router.get("/watched/:id", this.getWatchedPage);
		router.post("/add_to_watch/:id", this.addToWatch);
		router.post("/add_watched/:id", this.addWatched);
		router.post("/update_rating/:id", this.updateRating);
		router.post("/remove_to_watch/:id", this.removeFromToWatch);
		router.post("/remove_watched/:id", this.removeFromWatched);
    }
	getSimilar = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		);
		const contentId = req.getSearchParams().get("content_id");
		if (contentId)
		{
			const similarContent = await SimilarContent.readAll(this.sql, parseInt(contentId));
			if (similarContent.length > 0)
				{
					await res.send({
						statusCode: StatusCode.OK,
						message: "Contents",
						payload: {
						  sessionCookie: session.get("userId") ? true : false,
						  userId: session.get("userId"),
						  content: similarContent           
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
					  redirect: "/content?error=No similar content found",
				  });
				}
		}
	}
	removeFromToWatch = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		);
		const contentId = req.getSearchParams().get("content_id");
		const userId = session.get("userId");
		if (contentId)
		{
			await ToWatchContent.remove(this.sql, parseInt(contentId), userId)
			await res.send({
				statusCode: StatusCode.OK,
				message: "Removed from to watch",
				redirect: `/to_watch/${userId}`
			});
		}
	}

	removeFromWatched = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		);
		const contentId = req.getSearchParams().get("content_id");
		const userId = session.get("userId");
		if (contentId)
		{
			await WatchedContent.remove(this.sql, parseInt(contentId), userId)
			await res.send({
				statusCode: StatusCode.OK,
				message: "Removed from watched",
				redirect: `/watched/${userId}`
			});
		}
	}

	updateRating = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		);
		const contentId = req.getSearchParams().get("content_id")
		const userId = session.get("userId")
		if (contentId)
		{
			await WatchedContent.update(this.sql, parseInt(contentId), userId, parseFloat(req.body.rating))
			await res.send({
				statusCode: StatusCode.OK,
				message: "Rating updated",
				redirect: `/watched/${userId}`
			});
		}

	}
	getErrorView = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		);
		await res.send({
			statusCode: StatusCode.BadRequest,
			message: "Error View",
			payload: {
				error: req.getSearchParams().get("error")
			},
			template: "ErrorView",
		});
	}
	
	addWatched = async (req: Request, res: Response) => {
		const rating = req.body.rating
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		);
		const contentId = req.getSearchParams().get("content_id")
		const userId = session.get("userId")
		if (rating > 10)
		{
			res.send({
				statusCode: StatusCode.BadRequest,
				message: "Max rating is 10",
				redirect: `/individual_content?content_id=${contentId}&error=Max rating is 10`
			})
			return
		}

		if (rating < 0)
		{
			res.send({
				statusCode: StatusCode.BadRequest,
				message: "Min rating is 0",
				redirect: `/individual_content?content_id=${contentId}&error=Min rating is 0`
			})
			return
		}
		if (contentId)
		{
			await ToWatchContent.remove(this.sql, parseInt(contentId), userId)
			await WatchedContent.add(this.sql, parseInt(contentId), userId, rating)
			await res.send({
				statusCode: StatusCode.OK,
				message: "User watched page",		
				redirect: `/watched/${userId}?user=${userId}`,
			});
		}

	}
	addToWatch = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		);
		const contentId = req.getSearchParams().get("content_id")
		const userId = session.get("userId")
		if (contentId)
		{
			await ToWatchContent.add(this.sql,parseInt(contentId), userId)
			await res.send({
				statusCode: StatusCode.OK,
				message: "User to watch page",		
				redirect: `/to_watch/${userId}?user=${userId}`,
			});
		}
	}

	getToWatchPage = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		if(req.session.get("userId"))
		{	
			const url = req.getURL();
			let profileId = url.toString().split('/')[4];
			const content = await ToWatchContent.readAll(this.sql, parseInt(profileId))
			let nextUser;
			let lastUser;
			let nextProfileId : number | null = parseInt(profileId) + 1;
			let lastProfileId : number | null = parseInt(profileId) - 1;
			while (true)
			{
				nextUser = await User.read(this.sql, nextProfileId)
				if (nextUser.props.visibility || nextUser.props.userId == req.session.get("userId"))
					break
				nextProfileId++;
				if (!nextUser.props.userId)
				{
					nextProfileId = null;
					break
				}

			}
			while (true)
			{
				lastUser = await User.read(this.sql, lastProfileId)
				if (lastUser.props.visibility || lastUser.props.userId == req.session.get("userId"))
					break
				lastProfileId--;
				if (!lastUser.props.userId )
				{
					lastProfileId = null;
					break
				}

			}
			let userProfile = await User.read(this.sql, parseInt(profileId));
			if (profileId == req.session.get("userId"))
			{
				await res.send({
					statusCode: StatusCode.OK,
					message: "To Watch List",
					payload: {
						sessionCookie: session.get("userId") ? true : false,
						userId: session.get("userId"),
						content: content,
						user: userProfile,
						lastProfile: lastProfileId,
						nextProfile: nextProfileId
					},
					template: "ToWatchView",
				});
			}
			else
			{
				const url = req.getURL();
				let profileId = url.toString().split('/')[4].split('?')[0];
				let userProfile = await User.read(this.sql, parseInt(profileId));
				if (userProfile.props.visibility)
				{
					const content = await ToWatchContent.readAll(this.sql, parseInt(profileId))
					await res.send({
						statusCode: StatusCode.OK,
						message: "To Watch List",
						payload: {
							sessionCookie: session.get("userId") ? true : false,
							userId: session.get("userId"),
							content: content,
							user: userProfile,
							lastProfile: lastProfileId,
							nextProfile: nextProfileId
						},
						template: "ToWatchView",
					});
				}
				else
				{
					await res.send({
						statusCode: StatusCode.Forbidden,
						message: "not authenticated",
						redirect: "/error?error=Profile is private",
					});
				}
			}
		}
		else
		{
			await res.send({
				statusCode: StatusCode.Forbidden,
				message: "not authenticated",
				redirect: "/login",
			});
		}

	}
	getWatchedPage = async (req: Request, res: Response) => {
		const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		if(req.session.get("userId"))
		{	
			const url = req.getURL();
			let profileId = url.toString().split('/')[4];
			const content = await WatchedContent.readAll(this.sql, parseInt(profileId))
			let nextUser;
			let lastUser;
			let nextProfileId : number | null = parseInt(profileId) + 1;
			let lastProfileId : number | null = parseInt(profileId) - 1;
			while (true)
			{
				nextUser = await User.read(this.sql, nextProfileId)
				if (nextUser.props.visibility || nextUser.props.userId == req.session.get("userId"))
					break
				nextProfileId++;
				if (!nextUser.props.userId)
				{
					nextProfileId = null;
					break
				}

			}
			while (true)
			{
				lastUser = await User.read(this.sql, lastProfileId)
				if (lastUser.props.visibility || lastUser.props.userId == req.session.get("userId"))
					break
				lastProfileId--;
				if (!lastUser.props.userId )
				{
					lastProfileId = null;
					break
				}

			}
			let userProfile = await User.read(this.sql, parseInt(profileId));
			if (profileId == req.session.get("userId"))
			{
				await res.send({
					statusCode: StatusCode.OK,
					message: "Watched List",
					payload: {
						sessionCookie: session.get("userId") ? true : false,
						userId: session.get("userId"),
						content: content,
						user: userProfile,
						lastProfile: lastProfileId,
						nextProfile: nextProfileId
					},
					template: "WatchedView",
				});
			}
			else
			{
				const url = req.getURL();
				let profileId = url.toString().split('/')[4].split('?')[0];
				let userProfile = await User.read(this.sql, parseInt(profileId));
				if (userProfile.props.visibility)
				{
					const content = await WatchedContent.readAll(this.sql, parseInt(profileId))
					await res.send({
						statusCode: StatusCode.OK,
						message: "Watched List",
						payload: {
							sessionCookie: session.get("userId") ? true : false,
							userId: session.get("userId"),
							content: content,
							user: userProfile,
							lastProfile: lastProfileId,
							nextProfile: nextProfileId
						},
						template: "WatchedView",
					});
				}
				else
				{
					await res.send({
						statusCode: StatusCode.Forbidden,
						message: "not authenticated",
						redirect: "/error?error=Profile is private",
					});
				}
			}
		}
		else
		{
			await res.send({
				statusCode: StatusCode.Forbidden,
				message: "not authenticated",
				redirect: "/login",
			});
		}

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
			const userId = session.get("userId")
			const content = await Content.read(this.sql, parseInt(content_id));
			const watched = await WatchedContent.read(this.sql, userId, parseInt(content_id));
			const toWatch = await ToWatchContent.read(this.sql, userId, parseInt(content_id));
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
						description: new_description,
						watched: watched.props.contentId,
						toWatch: toWatch.props.contentId
					},
					template: "ContentView",
				});
			}
			else
			{
				await res.send({
					statusCode: StatusCode.Forbidden,
					message: "not authenticated",
					redirect: "/login",
				});
			}
		}

	}

    getSearchedContents = async (req: Request, res: Response) => 
    {
        const session = req.getSession();
		res.setCookie( 
			session.cookie
		  );
		if(req.session.get("userId"))
		{	
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
		else
		{
			await res.send({
				statusCode: StatusCode.Forbidden,
				message: "not authenticated",
				redirect: "/login",
			});
		}
    }

	getContentForm = async (req: Request, res: Response) => 
	{
		if(req.session.get("userId"))
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
		else
		{
			await res.send({
				statusCode: StatusCode.Forbidden,
				message: "not authenticated",
				redirect: "/login",
			});
		}
	}

}