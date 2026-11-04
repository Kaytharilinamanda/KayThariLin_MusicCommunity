<?php

use Illuminate\Support\Facades\Route;

$spa = function () {
    $index = public_path('index.html');
    if (! is_file($index)) {
        return response('Build the React app first: npm run build. Then open http://localhost:8000.', 503);
    }

    return response()->file($index);
};

Route::get('/', $spa);
Route::get('/{any}', $spa)->where('any', '^(?!api(?:/|$)).*$');
