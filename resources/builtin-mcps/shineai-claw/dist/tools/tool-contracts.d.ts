import { z } from 'zod';
export declare const TOOL_NAMES: readonly ["describe_screen", "click", "type_text", "hotkey", "scroll", "list_apps", "activate_app"];
export type ToolName = typeof TOOL_NAMES[number];
export declare const toolSchemas: {
    describe_screen: {
        input: z.ZodObject<{
            target: z.ZodOptional<z.ZodObject<{
                window_id: z.ZodOptional<z.ZodNumber>;
                app_bundle_id: z.ZodOptional<z.ZodString>;
                app_name: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            display_index: z.ZodOptional<z.ZodNumber>;
            capture_area: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
            annotated: z.ZodOptional<z.ZodBoolean>;
            allow_web_focus: z.ZodOptional<z.ZodBoolean>;
            mode: z.ZodOptional<z.ZodEnum<{
                auto: "auto";
                ax_only: "ax_only";
                ax_plus_vision: "ax_plus_vision";
                ax_plus_cdp: "ax_plus_cdp";
                cdp_only: "cdp_only";
                vision_only: "vision_only";
            }>>;
        }, z.core.$strip>;
        output: z.ZodObject<{
            snapshot_id: z.ZodString;
            screenshot_raw_path: z.ZodString;
            screenshot_annotated_path: z.ZodOptional<z.ZodString>;
            screen_dimensions: z.ZodObject<{
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
            application: z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                bundle_id: z.ZodString;
                pid: z.ZodNumber;
            }, z.core.$strip>>;
            window: z.ZodOptional<z.ZodObject<{
                title: z.ZodString;
                window_id: z.ZodNumber;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>>;
            is_dialog: z.ZodBoolean;
            element_count: z.ZodNumber;
            interactable_count: z.ZodNumber;
            ui_elements: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodOptional<z.ZodString>;
                label: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
                value: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
                identifier: z.ZodOptional<z.ZodString>;
                keyboard_shortcut: z.ZodOptional<z.ZodString>;
                is_actionable: z.ZodBoolean;
                source: z.ZodOptional<z.ZodEnum<{
                    ax: "ax";
                    vis: "vis";
                    cdp: "cdp";
                }>>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>>;
            menu_bar: z.ZodOptional<z.ZodObject<{
                items: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    title: z.ZodString;
                    shortcut: z.ZodOptional<z.ZodString>;
                    enabled: z.ZodBoolean;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            warnings: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        description: string;
    };
    click: {
        input: z.ZodObject<{
            snapshot_id: z.ZodOptional<z.ZodString>;
            element_id: z.ZodOptional<z.ZodString>;
            query: z.ZodOptional<z.ZodObject<{
                role: z.ZodOptional<z.ZodString>;
                label: z.ZodOptional<z.ZodString>;
                identifier: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            button: z.ZodOptional<z.ZodEnum<{
                left: "left";
                right: "right";
                middle: "middle";
            }>>;
            click_type: z.ZodOptional<z.ZodEnum<{
                single: "single";
                double: "double";
            }>>;
            modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                shift: "shift";
                cmd: "cmd";
                option: "option";
                control: "control";
            }>>>;
        }, z.core.$strip>;
        output: z.ZodObject<{
            clicked_at: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
            method: z.ZodOptional<z.ZodEnum<{
                axPress: "axPress";
                hidClick: "hidClick";
            }>>;
            target_element: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                label: z.ZodString;
            }, z.core.$strip>>;
            verification_screenshot_path: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        description: string;
    };
    type_text: {
        input: z.ZodObject<{
            text: z.ZodString;
            snapshot_id: z.ZodOptional<z.ZodString>;
            element_id: z.ZodOptional<z.ZodString>;
            clear_existing: z.ZodOptional<z.ZodBoolean>;
            delay_ms_per_char: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        output: z.ZodObject<{
            typed_chars: z.ZodNumber;
            method: z.ZodOptional<z.ZodEnum<{
                axSetValue: "axSetValue";
                hidType: "hidType";
            }>>;
            focused_element: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                label: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        description: string;
    };
    hotkey: {
        input: z.ZodObject<{
            keys: z.ZodArray<z.ZodString>;
            hold_ms: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        output: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, z.core.$strip>;
        description: string;
    };
    scroll: {
        input: z.ZodObject<{
            direction: z.ZodEnum<{
                left: "left";
                right: "right";
                up: "up";
                down: "down";
            }>;
            amount: z.ZodNumber;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        output: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, z.core.$strip>;
        description: string;
    };
    list_apps: {
        input: z.ZodObject<{}, z.core.$strict>;
        output: z.ZodObject<{
            applications: z.ZodArray<z.ZodObject<{
                pid: z.ZodNumber;
                bundle_id: z.ZodString;
                name: z.ZodString;
                is_active: z.ZodBoolean;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        description: string;
    };
    activate_app: {
        input: z.ZodObject<{
            bundle_id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        output: z.ZodObject<{
            ok: z.ZodLiteral<true>;
            pid: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        description: string;
    };
};
export type ToolInput<T extends ToolName> = z.infer<(typeof toolSchemas)[T]['input']>;
export type ToolOutput<T extends ToolName> = z.infer<(typeof toolSchemas)[T]['output']>;
export declare function jsonSchemaOf(tool: ToolName): object;
