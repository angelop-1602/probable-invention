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
import { ChevronRight, Home } from "lucide-react";

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

    // Define navigation links
    const navLinks = [
        { name: "Home", href: "/dashboard" },
        { name: "Submission", href: "/submission-application" },
        { name: "Sign out", href: "/signout" },
    ];


    return (
        <Card className="container mx-auto mt-6 border-none shadow-none">
            <CardContent className="p-0">
                <div className="flex flex-col space-y-3">
                    {/* Logo and Title */}
                    <div className="flex items-center mb-4 justify-center">
                        <div className="flex flex-col text-center">
                            <h1 className="text-2xl font-bold">{title}</h1>
                            {subtitle && (
                                <div className="text-muted-foreground text-sm">{subtitle}</div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    {showNav && (
                        <div className="flex items-center justify-center border-y py-2">
                            <nav className="flex space-x-6">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "text-sm font-medium transition-colors hover:text-primary",
                                            pathname === link.href
                                                ? "text-primary font-semibold border-b-2 border-primary pb-1"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    )}

                </div>
            </CardContent>
        </Card>
    );
} 