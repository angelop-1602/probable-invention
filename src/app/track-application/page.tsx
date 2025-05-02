"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from "@/components/ui/card";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";

export default function TrackingPage() {
    const router = useRouter();
    const [applicationCode, setApplicationCode] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!applicationCode.trim()) {
            setError("Please enter your application code");
            return;
        }

        // Simple validation for the application code format (RECYYYYAAAAAA)
        const codeRegex = /^REC\d{4}[A-Z0-9]{6}$/;
        if (!codeRegex.test(applicationCode)) {
            setError("Invalid application code format. Should be like REC2023ABCDEF");
            return;
        }
        // Navigate to the track page with the code
        router.push(`/track-application/${applicationCode}`);
    };

    return (
        <div className=" container mx-auto py-8 px-4 max-w-5xl">
            <ProponentHeader title="Track Your Protocol Application" subtitle="Enter your application code to check the status of your submission"/>
            <div className="flex items-center justify-center">

                <Card className="w-full max-w-md">
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={applicationCode}
                                        onChange={(e) => {
                                            setApplicationCode(e.target.value.toUpperCase());
                                            setError("");
                                        }}
                                        placeholder="Enter Application Code (e.g., REC2023ABCDEF)"
                                        className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        aria-label="Application Code"
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-red-600">{error}</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors font-medium"
                            >
                                Track Application
                            </button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
