<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('food_item');
            $table->string('alt_name')->nullable();
            $table->decimal('edible_portion', 5, 2);
            $table->decimal('energy', 8, 2);
            $table->decimal('protein', 8, 2);
            $table->decimal('fat', 8, 2);
            $table->decimal('carb', 8, 2);
            $table->decimal('calcium', 8, 2);
            $table->decimal('phos', 8, 2);
            $table->decimal('iron', 8, 2);
            $table->decimal('vit_a', 8, 2);
            $table->decimal('thia', 8, 2);
            $table->decimal('ribo', 8, 2);
            $table->decimal('nia', 8, 2);
            $table->decimal('vit_c', 8, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
