<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->string('slug')->nullable()->unique();
            $table->string('title');
            $table->string('artist');
            $table->string('category');
            $table->date('event_date');
            $table->string('event_time');
            $table->string('venue');
            $table->string('address')->default('');
            $table->string('city');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('image')->default('/images/crowd.jpg');
            $table->string('image_class')->default('');
            $table->boolean('featured')->default(false);
            $table->string('blurb', 500)->default('');
            $table->text('description')->nullable();
            $table->json('lineup')->nullable();
            $table->string('approval_status', 20)->default('pending');
            $table->string('rejection_reason', 500)->default('');
            $table->timestamps();
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->string('slug')->nullable();
            $table->string('name');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('note')->default('');
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('sold')->default(0);
            $table->date('sales_start')->nullable();
            $table->date('sales_end')->nullable();
            $table->string('approval_status', 20)->default('pending');
            $table->string('rejection_reason', 500)->default('');
            $table->timestamps();
            $table->unique(['event_id', 'slug']);
        });

        Schema::create('ticket_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('buyer_name');
            $table->string('email');
            $table->string('event_title');
            $table->string('tier');
            $table->unsignedInteger('qty');
            $table->decimal('total', 10, 2);
            $table->string('status', 40)->default('Paid');
            $table->timestamps();
        });

        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->string('kind', 30);
            $table->string('slug')->nullable();
            $table->json('payload');
            $table->string('approval_status', 20)->default('pending');
            $table->string('rejection_reason', 500)->default('');
            $table->timestamps();
            $table->index(['kind', 'organizer_id']);
        });

        Schema::create('workshop_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('title');
            $table->string('event_date')->default('');
            $table->string('city')->default('');
            $table->string('name');
            $table->string('email');
            $table->string('phone')->default('');
            $table->string('level')->default('');
            $table->string('status', 40)->default('Confirmed');
            $table->timestamps();
        });

        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('title');
            $table->string('center')->default('');
            $table->string('event_date')->default('');
            $table->string('name');
            $table->string('email');
            $table->string('phone')->default('');
            $table->text('message')->nullable();
            $table->string('status', 40)->default('Pending');
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('kind', 20)->default('announcement');
            $table->string('title');
            $table->string('event_name')->default('');
            $table->string('audience')->default('');
            $table->string('placement')->default('');
            $table->string('channel')->default('Community');
            $table->text('body')->nullable();
            $table->string('status', 20)->default('Published');
            $table->date('published_on')->nullable();
            $table->timestamps();
        });

        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name');
            $table->string('handle')->default('');
            $table->string('avatar')->default('/avatars/sam.svg');
            $table->string('role_label')->default('Member');
            $table->string('topic')->default('Community');
            $table->text('text');
            $table->string('image')->default('');
            $table->unsignedInteger('likes_count')->default(0);
            $table->string('status', 20)->default('Visible');
            $table->timestamps();
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name');
            $table->string('avatar')->default('/avatars/sam.svg');
            $table->text('text');
            $table->timestamps();
        });

        Schema::create('post_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['post_id', 'user_id']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('target');
            $table->string('kind', 40)->default('Event');
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('text');
            $table->string('status', 40)->default('New');
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('detail')->default('');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('community_members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role_label')->default('Member');
            $table->string('city')->default('');
            $table->string('avatar')->default('/avatars/sam.svg');
            $table->timestamps();
        });

        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('community_member_id')->constrained('community_members')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'community_member_id']);
        });

        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->string('tag')->unique();
            $table->unsignedInteger('posts_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topics');
        Schema::dropIfExists('follows');
        Schema::dropIfExists('community_members');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('post_likes');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('workshop_registrations');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('ticket_orders');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('events');
    }
};
