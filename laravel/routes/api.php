<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['ok' => true]);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/events/public', [EventController::class, 'publicIndex']);
Route::get('/programs/{kind}/public', [ProgramController::class, 'publicIndex'])->where('kind', 'workshops|courses|centers');
Route::get('/announcements', [AnnouncementController::class, 'index']);
Route::get('/posts', [CommunityController::class, 'posts']);
Route::get('/members', [CommunityController::class, 'members']);
Route::get('/topics', [CommunityController::class, 'topics']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'update']);
    Route::get('/notifications', [ReportController::class, 'notifications']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{user}/status', [UserController::class, 'status']);
    Route::patch('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    Route::get('/reports', [ReportController::class, 'show']);
    Route::get('/dashboard', [ReportController::class, 'dashboard']);

    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::patch('/events/{event}/review', [EventController::class, 'review']);
    Route::patch('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);

    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::patch('/tickets/{ticket}/review', [TicketController::class, 'review']);
    Route::patch('/tickets/{ticket}', [TicketController::class, 'update']);
    Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy']);

    Route::patch('/programs/{kind}/{program}/review', [ProgramController::class, 'review'])->whereNumber('program');
    Route::patch('/programs/{kind}/{program}', [ProgramController::class, 'update'])->whereNumber('program');
    Route::delete('/programs/{kind}/{program}', [ProgramController::class, 'destroy'])->whereNumber('program');
    Route::get('/programs/{kind}', [ProgramController::class, 'index']);
    Route::post('/programs/{kind}', [ProgramController::class, 'store']);

    Route::get('/orders', [BookingController::class, 'orders']);
    Route::post('/orders', [BookingController::class, 'storeOrder']);
    Route::patch('/orders/{order}', [BookingController::class, 'updateOrder']);

    Route::get('/workshop-registrations', [BookingController::class, 'workshops']);
    Route::post('/workshop-registrations', [BookingController::class, 'storeWorkshop']);
    Route::patch('/workshop-registrations/{registration}', [BookingController::class, 'updateWorkshop']);

    Route::get('/enrollments', [BookingController::class, 'enrollments']);
    Route::post('/enrollments', [BookingController::class, 'storeEnrollment']);

    Route::get('/reviews', [BookingController::class, 'reviews']);
    Route::post('/reviews', [BookingController::class, 'storeReview']);
    Route::patch('/reviews/{review}', [BookingController::class, 'updateReview']);
    Route::delete('/reviews/{review}', [BookingController::class, 'destroyReview']);
    Route::get('/enquiries', [BookingController::class, 'enquiries']);

    Route::post('/posts', [CommunityController::class, 'storePost']);
    Route::post('/posts/{post}/like', [CommunityController::class, 'like']);
    Route::post('/posts/{post}/comments', [CommunityController::class, 'comment']);
    Route::get('/posts/manage', [CommunityController::class, 'managePosts']);
    Route::post('/members/{member}/follow', [CommunityController::class, 'follow']);

    Route::get('/announcements/manage', [AnnouncementController::class, 'manage']);
    Route::get('/announcements/mine', [AnnouncementController::class, 'mine']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
});
