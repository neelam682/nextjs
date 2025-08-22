import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
/* eslint-disable @typescript-eslint/no-explicit-any */

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
    return subjectsColors[subject as keyof typeof subjectsColors];
};

export const configureAssistant = (voice: string, style: string) => {
    const voiceId = voices[voice as keyof typeof voices][
        style as keyof (typeof voices)[keyof typeof voices]
    ] || "sarah";


    const vapiAssistant = {
        name: "Companion",
        firstMessage:
            "Hello, let's start the session. Today we'll be talking about {{topic}}.",
        transcriber: {
            provider: "deepgram",
            model: "nova-3",
            language: "en",
        },
        voice: {
            provider: "11labs",
            voiceId: voiceId,
            stability: 0.4,
            similarityBoost: 0.8,
            speed: 1,
            style: 0.5,
            useSpeakerBoost: true,
        },
        model: {
            provider: "openai",
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a highly knowledgeable tutor teaching a real-time voice session...`,
                },
            ],
        },
        clientMessages: [],
        serverMessages: [],
    } as unknown as CreateAssistantDTO;

    return vapiAssistant;
};