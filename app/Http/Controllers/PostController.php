<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Session;

use App\Http\Requests;
use App\Http\Controllers\Controller;

class PostController extends Controller
{
    public function __construct(\App\Services\PostService $post) 
    {
        $this->post = $post;
    }

    public function index() 
    {
        $posts = $this->post->all();

        return response()->json($posts);
    }

    public function store(Request $request) 
    {
        $name  = $request->get("name");
        $title = $request->get("title");

        return $this->post->create($name, $title);
    }
}
