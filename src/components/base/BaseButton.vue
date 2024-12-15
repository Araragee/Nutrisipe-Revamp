<script lang="ts" setup>
import { computed } from "@vue/reactivity";
import type { PropType } from "vue";
import BaseLoaderSpin from "@/components/base/BaseLoader.vue";
type ButtonType =
    | "primary"
    | "primaryOutlined"
    | "secondary"
    | "secondaryOutlined"
    | "plainOutlined"
    | "plain"
    | "noPadding"
    | "critical";

type ButtonAlign =
    | "center"
    | "left"
    | "right"
    | "between"
    | "evenly"
    | "around";

const props = defineProps({
    buttonType: {
        type: String as PropType<ButtonType>,
        default: "primaryOutlined",
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    align: {
        type: String as PropType<ButtonAlign>,
        default: "center",
    },
    loading: {
        type: Boolean,
        default: false,
    },
    withLoadingSpinner: {
        type: Boolean,
        default: true,
    },
    size: {
        type: String as PropType<"lg" | "base" | "sm" | "xs" | "mobile">,
        default: "base",
    },
    widthClass: {
        type: String,
        default: 'w-full'
    },
    textStyle: {
        type: String,
        default: 'uppercase'
    }
});

const btnSize = computed(() => {
    return {
        lg: "px-6 py-3.5 rounded-3xl",
        base: "px-4 py-3 rounded-3xl",
        sm: "px-3.5 py-2.5 rounded-3xl text-sm",
        xs: "px-2.5 py-2 rounded-3xl text-xs",
        mobile: "px-1.5 py-1.5 rounded-3xl"
    }[props.size];
});

const isDisabled = computed(() => props.disabled || props.loading);

const btnAlign = computed(() => {
    return {
        center: "justify-center",
        left: "justify-start",
        right: "justify-end",
        between: "justify-between",
        evenly: "justify-evenly",
        around: "justify-around",
    }[props.align];
});

const btnClass = computed(() => {
    return {
        primary:
            "disabled:bg-zinc-300 border-transparent text-white bg-primary-800 hover:bg-primary-900 focus:ring-2 focus:ring-primary-400 active:bg-primary-500",
        primaryOutlined:
            "disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-300 border-primary-base border-opacity-30 dark:border-opacity-30 bg-none text-primary-700 hover:text-zinc-100 hover:border-primary-400 focus:ring-primary-300 focus:border-primary-400 hover:bg-primary-900 focus:ring-offset-0 focus:ring-2 active:bg-white",
        secondary:
            "disabled:bg-zinc-300  border-transparent text-white bg-secondary-base hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-300 active:bg-secondary-500",
        secondaryOutlined:
            "disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-300 border-secondary-300 bg-none text-secondary-base hover:text-secondary-700 hover:border-secondary-base hover:bg-secondary-100 focus:ring-secondary-200 focus:border-secondary-base hover:bg-secondary-100 focus:ring-offset-0 focus:ring-2",
        critical:
            "disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-300 border-error-200 bg-none text-error-600 border-error-200 hover:border-error-300 hover:bg-error-100 hover:text-error-700 focus:ring-offset-0 focus:ring-2 focus:ring-error-200 focus:border-error-400",
        plainOutlined:
            "disabled:text-zinc-400 disabled:border-zinc-300 disabled:bg-zinc-100 bg-white dark:bg-zinc-800 text-zinc-600 border-zinc-300 dark:border-opacity-30 hover:text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 focus:ring-offset-0 focus:ring-2 focus:ring-zinc-200 focus:border-zinc-base",
        plain:
            "disabled:text-zinc-400 border-transparent text-zinc-600 dark:text-zinc-200 hover:text-zinc-100 active:text-zinc-base focus:ring-primary-300 focus:border-primary-400 hover:bg-primary-800 focus:ring-offset-0 focus:ring-2 active:bg-white",
        noPadding:
            "disabled:text-zinc-400 border-transparent text-zinc-700 dark:text-zinc-100 hover:text-primary-400  hover:text-primary-base active:text-zinc-base focus:text-zinc-400",
    }[props.buttonType];
});
</script>

<template>
    <button data-cy="button" type="button" :disabled="isDisabled"
        :class="[widthClass, btnSize, btnClass, btnAlign, { 'animate-pulse': loading }, textStyle]"
        class="relative flex items-center border whitespace-nowrap rounded-xl text-sm tracking-widest font-semibold focus:outline-none focus:ring-offset-2 transition duration-300">
        <span class="flex items-center space-x-1">
            <slot></slot>
        </span>
        <BaseLoaderSpin v-if="loading && withLoadingSpinner" class="ml-2" data-cy="loader-spin" />
        <slot v-else name="iconSlot"></slot>
    </button>
</template>
