<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Session;

use App\Http\Requests;
use App\Http\Controllers\Controller;

class AppController extends Controller
{

    private $react;
    private $auth;
    private $oauth;
    private $profile;


    public function getIndex() 
    {
        return view('app');
    }

    public function getComment()
    {
        return view('app');
    } 
}
