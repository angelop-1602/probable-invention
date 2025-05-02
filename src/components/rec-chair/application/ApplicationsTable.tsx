"use client";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { 
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "../../ui/pagination";
import { useState } from "react";
import Link from "next/link";
import { ApplicationsTableProps } from "@/types/rec-chair";
import { formatDate } from "@/lib/rec-chair/utils";

export function ApplicationsTable({ 
    title,
    caption = "A list of recent submission of protocol review applications",
    data = [],
    hidePagination = false,
    onRefresh
}: ApplicationsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Get status badge color
    const getStatusBadge = (status: string = "Pending") => {
        switch (status.toLowerCase()) {
            case "approved":
                return <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">Approved</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            case "pending":
                return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
            case "under review":
                return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Under Review</Badge>;
            case "resubmission required":
                return <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Resubmission Required</Badge>;
            case "submission check":
                return <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Submission Check</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Get the current page of data
    const getCurrentPageData = () => {
        // If pagination is hidden, return all data
        if (hidePagination) {
            return data;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    // Render table rows
    const renderTableRows = () => {
        const currentPageData = getCurrentPageData();
        
        if (currentPageData.length > 0) {
            return currentPageData.map((application, index) => (
                <TableRow key={index}>
                    <TableCell>{application.spupRecCode || "Not Assigned"}</TableCell>
                    <TableCell>{application.principalInvestigator}</TableCell>
                    <TableCell>{formatDate(application.submissionDate)}</TableCell>
                    <TableCell>{application.title}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Link href={`/rec-chair/applications/${application.id}`} passHref>
                                <Button size="sm" variant="default">View Details</Button>
                            </Link>
                        </div>
                    </TableCell>
                </TableRow>
            ));
        } else {
            // Show placeholder row if no data is available
            return (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No protocol applications available
                    </TableCell>
                </TableRow>
            );
        }
    };

    // Only show pagination if we have more than one page and it's not hidden
    const shouldShowPagination = !hidePagination && totalPages > 1;

    return (
        <section>
            {title && <h2 className="text-2xl font-semibold mb-6 text-primary-600 dark:text-primary-400">{title}</h2>}
            <Table>
                <TableCaption>{caption}</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>SPUP REC Code</TableHead>
                        <TableHead>Principal Investigator</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderTableRows()}
                </TableBody>
            </Table>
            
            {shouldShowPagination && (
                <div className="mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    size="default"
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>

                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <PaginationItem key={i}>
                                        <PaginationLink 
                                            size="default"
                                            onClick={() => handlePageChange(pageNum)}
                                            isActive={currentPage === pageNum}
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            {totalPages > 5 && (
                                <>
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink
                                            size="default"
                                            onClick={() => handlePageChange(totalPages)}
                                            isActive={currentPage === totalPages}
                                        >
                                            {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                </>
                            )}

                            <PaginationItem>
                                <PaginationNext 
                                    size="default"
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </section>
    );
} 