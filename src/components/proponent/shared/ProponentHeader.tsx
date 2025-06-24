'use client';

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { ChevronRight, Home, User } from "lucide-react";
import { useProponentAuthContext } from "@/lib/auth/proponent-auth-context";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface ProponentHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    showBreadcrumbs?: boolean;
    currentPage?: string;
    showNav?: boolean;
}

export function ProponentHeader({
    title,
    subtitle,
    showBreadcrumbs = true,
    currentPage,
    showNav = true,
}: ProponentHeaderProps) {
    const pathname = usePathname();
    const { user } = useProponentAuthContext();

    // Define navigation links
    const navLinks = [
        { name: "Home", href: "/dashboard" },
        { name: "Submission", href: "/submission-application" },
    ];


    return (
        <Card className="container mx-auto mt-6 border-none shadow-none">
            <CardContent className="p-0">
                <div className="flex flex-col space-y-3">
                    {/* Logo and Title */}
                    <div className="flex items-center mb-4 justify-between">
                        <div className="flex flex-col text-center flex-1">
                            <h1 className="text-2xl font-bold">{title}</h1>
                            {subtitle && (
                                <div className="text-muted-foreground text-sm">{subtitle}</div>
                            )}
                        </div>
                        
                        {/* User info and sign out */}
                        
                    </div>

                    {/* Navigation Links */}
                    {showNav && user && (
                        <div className="flex items-center justify-between border-y py-2">
                            {/* Navigation links in the center */}
                            <nav className="flex items-center space-x-6">
                                <Link href="/dashboard" className="text-gray-600 hover:text-green-600 transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/submission-application" className="text-gray-600 hover:text-green-600 transition-colors">
                                    Submit Application
                                </Link>
                            </nav>
                            
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{user.email}</span>
                                </div>
                                <SignOutButton size="sm" />
                            </div>
                        </div>
                    )}

                </div>
            </CardContent>
        </Card>
    );
} 