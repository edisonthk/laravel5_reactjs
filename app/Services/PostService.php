<?php 

namespace App\Services;

use App\Post;

class PostService {
       

    public function all() {
        return Post::all();
    }

    public function create($name, $title) {
        $post = new Post;
        $post->name = $name;
        $post->title = $title;
        $post->save();

        return $post;
    }

}