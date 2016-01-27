import {PostConst, ApiPrefix} from "../Constant";
import AppDispatcher from "../Dispatcher";


class PostAction {
    
    loadAll() {
        
        AppDispatcher.dispatch({
            type: PostConst.LOAD_ALL,
        });
    }

    create(name, title) {
        AppDispatcher.dispatch({
            type: PostConst.CREATE,
            name: name,
            title: title,
        });
    }

}   

export default new PostAction();