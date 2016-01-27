import Post from "./components/Post"

var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var IndexRoute = ReactRouter.IndexRoute;
var BrowserHistory = ReactRouter.browserHistory;

var routesMap = (
    <Router history={BrowserHistory}>
        <Route path="/"         component={Post} />
    </Router>
);

export default routesMap;