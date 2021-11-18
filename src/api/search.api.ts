import { Router } from "express";
import { SearchController } from "../controllers/search/search.controller";

const searchApi = Router();
const searchController = new SearchController();
searchApi.get('/list/:query', searchController.list);
searchApi.get('/user/:query', searchController.user);

export default searchApi;
