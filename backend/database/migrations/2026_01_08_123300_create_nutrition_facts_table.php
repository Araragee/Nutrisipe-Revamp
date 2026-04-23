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
        Schema::create('nutrition_facts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('serving_size', 10, 2);
            $table->string('yield_amount');
            $table->decimal('energy', 10, 2);
            $table->decimal('protein', 10, 2);
            $table->decimal('fat', 10, 2);
            $table->decimal('carb', 10, 2);
            $table->decimal('calcium', 10, 2);
            $table->decimal('phos', 10, 2);
            $table->decimal('iron', 10, 2);
            $table->decimal('vit_a', 10, 2);
            $table->decimal('thia', 10, 2);
            $table->decimal('ribo', 10, 2);
            $table->decimal('nia', 10, 2);
            $table->decimal('vit_c', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nutrition_facts');
    }
};
