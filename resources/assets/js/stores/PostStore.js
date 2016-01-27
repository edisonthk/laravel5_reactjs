import { PostConst, ApiPrefix } from "../Constant"
import AppDispatcher from "../Dispatcher"
import BaseStore from "./BaseStore"

class PostStore extends BaseStore {
    /**
     * constructor
     */
    constructor() {
        super();

        this.data = [];

        this.dispatchToken = AppDispatcher.register( (action) => {
            switch (action.type) {
                case PostConst.LOAD_ALL:
                    this.loadAll();
                break;
                case PostConst.CREATE:
                    this.create(action.name, action.title);
                break;
            }
        });
    }


    loadAll() {
        
        this.ajax("get", ApiPrefix + "/post", (error, data) => {    
            this.data = data;
            this.emitChange();
        });
    }

    create(name, title) {

        var formData = {
            name: name,
            title : title,
        };

        this.ajax("post", ApiPrefix + "/post", (error, post) => {
            this.data.push(post);
            this.emitChange();
        }, formData);
    }

    getAll() {
        return this.data;
    }

}

export default new PostStore();