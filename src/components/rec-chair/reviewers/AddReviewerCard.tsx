"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircleIcon } from "lucide-react";
import {
    addDoc,
    collection,
    serverTimestamp,
    getDocs,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AddReviewerCardProps {
    onReviewerAdded?: () => void;
}

export function AddReviewerCard({ onReviewerAdded }: AddReviewerCardProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nextCodeNumber, setNextCodeNumber] = useState(1);

    // Fetch the next available code number when the dialog opens
    useEffect(() => {
        if (open) {
            fetchNextCodeNumber();
        }
    }, [open]);

    // When name changes, generate the code prefix
    useEffect(() => {
        if (name) {
            const generatedCode = generateReviewerCode(name, nextCodeNumber);
            setCode(generatedCode);
        }
    }, [name, nextCodeNumber]);

    // Function to get the next available code number by counting total documents
    const fetchNextCodeNumber = async () => {
        try {
            const reviewersCollection = collection(db, "reviewers");
            const snapshot = await getDocs(reviewersCollection);

            // Count the total number of documents and add 1 for the next code
            const totalReviewers = snapshot.size;
            setNextCodeNumber(totalReviewers + 1);

        } catch (error) {
            console.error("Error fetching reviewer count:", error);
            setNextCodeNumber(1);
        }
    };

    // Function to capitalize the first letter of each word in a string
    const capitalizeWords = (text: string): string => {
        if (!text) return "";

        // Split the text by spaces and capitalize each word
        return text
            .split(' ')
            .map(word => {
                if (word.length === 0) return '';

                // Handle words with periods (like initials: "L.")
                if (word.includes('.')) {
                    return word
                        .split('.')
                        .map(part => part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
                        .join('.');
                }

                // Normal word capitalization
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    };

    // Function to handle name input changes and apply capitalization
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formattedName = capitalizeWords(rawValue);
        setName(formattedName);
    };

    // Function to generate a reviewer code based on name and number
    const generateReviewerCode = (fullName: string, number: number): string => {
        if (!fullName.trim()) return "";

        // Extract title and name parts
        const parts = fullName.trim().split(" ");
        if (parts.length < 2) return "";

        let prefix = "";
        let nameInitials = "";

        // Extract title (first part)
        const title = parts[0].toLowerCase();

        // Extract title prefix (first two letters of title)
        if (title.startsWith("dr")) {
            prefix = "DR";
        } else if (title.startsWith("mr")) {
            prefix = "MR";
        } else if (title.startsWith("mrs")) {
            prefix = "MR";
        } else if (title.startsWith("ms")) {
            prefix = "MS";
        } else if (title.startsWith("engr")) {
            prefix = "ENG";
        } else {
            // Use first two letters of whatever title is provided
            prefix = title.substring(0, Math.min(2, title.length)).toUpperCase();
        }

        // Extract initials from the rest of the name
        // Skip the title (parts[0]) and use first letter of each name part
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].length > 0) {
                // Remove any periods or commas
                const cleanPart = parts[i].replace(/[.,]/g, "");
                if (cleanPart.length > 0) {
                    nameInitials += cleanPart[0].toUpperCase();
                }
            }
        }

        // Format the number with leading zeros (always 3 digits)
        const formattedNumber = number.toString().padStart(3, "0");

        // Combine prefix and number
        return `${prefix}${nameInitials}-${formattedNumber}`;
    };

    const resetForm = () => {
        setName("");
        setCode("");
        setError("");
        setSuccess("");
    };

    const handleAddReviewer = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset status messages
        setError("");
        setSuccess("");

        // Simple validation
        if (!name.trim()) {
            setError("Please enter the reviewer's name.");
            return;
        }

        if (!code.trim()) {
            setError("Reviewer code could not be generated. Please check the name format.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Add new reviewer to Firestore
            await addDoc(collection(db, "reviewers"), {
                name: name.trim(),
                code: code.trim(),
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Show success message
            setSuccess("Reviewer added successfully!");

            // Call the callback if provided
            if (onReviewerAdded) {
                onReviewerAdded();
            }

            // Close the dialog and reset form after a delay
            setTimeout(() => {
                setOpen(false);
                resetForm();
            }, 1500);

        } catch (err) {
            console.error("Error adding reviewer:", err);
            setError("Failed to add reviewer. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Add Reviewer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Reviewer</DialogTitle>
                    <DialogDescription>
                        Add a new primary reviewer for protocol evaluation
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleAddReviewer} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reviewer-name">Reviewer Name (with Title)</Label>
                            <Input
                                id="reviewer-name"
                                value={name}
                                onChange={handleNameChange}
                                placeholder="Dr. John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reviewer-code">Reviewer Code</Label>
                            <p className="text-xs text-muted-foreground">
                                Auto-generated Code
                            </p>
                            <Input
                                id="reviewer-code"
                                value={code}
                                readOnly
                                className="bg-muted/50"
                            />

                        </div>
                    </div>

                    <DialogFooter className="sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !code}
                        >
                            {isSubmitting ? "Adding..." : "Add Reviewer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 