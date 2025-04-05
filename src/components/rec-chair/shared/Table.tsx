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

interface ChairTableProps {
    title?: string;
    caption?: string;
    tableType?: 'default' | 'reviewers'; // Add tableType to support different header types
    data?: any[]; // For displaying data from Firebase
    hidePagination?: boolean; // Option to hide pagination
}

export function ChairTable({ 
    title,
    caption = "A list of recent submission of protocol review applications",
    tableType = 'default',
    data = [],
    hidePagination = false
}: ChairTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
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

    // Render different table headers based on the tableType
    const renderTableHeader = () => {
        switch (tableType) {
            case 'reviewers':
                return (
                    <TableRow>
                        <TableHead>Reviewer Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                );
            case 'default':
            default:
                return (
                    <TableRow>
                        <TableHead>SPUP REC Code</TableHead>
                        <TableHead>Principal Investigator</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Course/Program</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                );
        }
    };

    // Render table row content based on the tableType
    const renderTableRows = () => {
        const currentPageData = getCurrentPageData();
        
        if (currentPageData.length > 0) {
            return currentPageData.map((item, index) => {
                if (tableType === 'reviewers') {
                    return (
                        <TableRow key={index}>
                            <TableCell>{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                                {item.isActive ? (
                                    <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-200">
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        Inactive
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>{item.createdAt?.toDate().toLocaleDateString() || "N/A"}</TableCell>
                            <TableCell><Button size="sm">View</Button></TableCell>
                        </TableRow>
                    );
                } else {
                    // Default row rendering for other page types
                    return (
                        <TableRow key={index}>
                            <TableCell>{item.spupRecCode || "SPUP_2025_00165_SR_KD"}</TableCell>
                            <TableCell>{item.principalInvestigator || "Keith Dela Cruz"}</TableCell>
                            <TableCell>{item.submissionDate?.toDate().toLocaleDateString() || "2023-10-15"}</TableCell>
                            <TableCell>{item.courseProgram || "DIT"}</TableCell>
                            <TableCell><Button size="sm">View</Button></TableCell>
                        </TableRow>
                    );
                }
            });
        } else {
            // Show placeholder row if no data is available
            return (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                        No data available
                    </TableCell>
                </TableRow>
            );
        }
    };

    // Only show pagination if we have more than one page and it's not hidden
    const shouldShowPagination = !hidePagination && totalPages > 1;

    return (
        <section>
            {title && <h2 className="text-2xl font-semibold mb-6 text-primary-600">{title}</h2>}
            <Table>
                <TableCaption>{caption}</TableCaption>
                <TableHeader>
                    {renderTableHeader()}
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
    )
}