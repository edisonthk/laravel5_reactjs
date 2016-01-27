
import PostStore from "../stores/PostStore"
import PostAction from "../actions/PostAction"

export default class Post extends React.Component {
    
    constructor() {
        super();
        this.state = {
            posts: [],
        };
        this._onChange = this._onChange.bind(this);
    }

    
    componentDidMount() {
        PostStore.addChangeListener(this._onChange);

        // if there is updated in data, _onChange will be fired and data will be updated
        PostStore.loadAll();
    }

    componentWillUnmount() {
        this.ws.close();
        PostStore.removeChangeListener(this._onChange);
    }

    _onChange() {
        this.setState({
            posts: PostStore.getAll()
        });
    }

    _nameOnChange(e) {
        this.setState({
            name: e.target.value,
        });
    }

    _titleOnChange(e) {
        this.setState({
            title: e.target.value,
        });
    }

    _onSubmit(e) {
        e.preventDefault();
        

        var name = this.state.name;
        var title = this.state.title;

        this.setState({name: "", title: ""});

        PostAction.create(name, title);
    }

    render() {
            
        var list = [];
        for(var i = 0; i < this.state.posts.length ; i ++ ) {
            var post = this.state.posts[i];

            list.push(<li key={i}>{post.title} <small>by {post.name}</small></li>);
        }

        return (
            <div>
                <p>Comment page</p>
                <ul>
                    {list}
                </ul>

                <form onSubmit={this._onSubmit.bind(this)}>
                    <input value={this.state.name} onChange={this._nameOnChange.bind(this)} placeholder="name" />
                    <input value={this.state.title} onChange={this._titleOnChange.bind(this)} placeholder="title"/>
                    <input type="submit" value="送信" />
                </form>
            </div>
        );
    }
}