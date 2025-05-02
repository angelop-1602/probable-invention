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
import { ViewReviewerDialog } from "../reviewers/ViewReviewerDialog";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

interface ChairTableProps {
    title?: string;
    caption?: string;
    tableType?: 'default' | 'reviewers'; // Add tableType to support different header types
    data?: any[]; // For displaying data from Firebase
    hidePagination?: boolean; // Option to hide pagination
    onRefresh?: () => void; // Add refresh callback
}

export function ChairTable({ 
    title,
    caption = "A list of recent submission of protocol review applications",
    tableType = 'default',
    data = [],
    hidePagination = false,
    onRefresh
}: ChairTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const itemsPerPage = 5;
    
    // Filter data by category if a filter is selected
    const filteredData = categoryFilter 
        ? data.filter(item => item.category === categoryFilter)
        : data;
    
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Get the current page of data
    const getCurrentPageData = () => {
        // If pagination is hidden, return all filtered data
        if (hidePagination) {
            return filteredData;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
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
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                );
        }
    };

    // Render table row content based on the tableType
    const renderTableRows = () => {
        const currentPageData = getCurrentPageData();
        
        // Helper function to format dates properly
        const formatDate = (timestamp: any) => {
            if (!timestamp) return "N/A";
            
            try {
                // Handle Firestore timestamp
                if (typeof timestamp === 'object' && timestamp.toDate && typeof timestamp.toDate === 'function') {
                    return timestamp.toDate().toLocaleDateString();
                }
                
                // Handle milliseconds number
                if (typeof timestamp === 'number') {
                    return new Date(timestamp).toLocaleDateString();
                }
                
                // Handle ISO string or any parsable date string
                if (typeof timestamp === 'string') {
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString();
                    }
                }
                
                // Handle Date object
                if (timestamp instanceof Date) {
                    return timestamp.toLocaleDateString();
                }

                // Handle Firebase server timestamp object that might be in a different format
                if (typeof timestamp === 'object' && timestamp.seconds) {
                    return new Date(timestamp.seconds * 1000).toLocaleDateString();
                }
                
                // If none of the above, return the original value as string
                return String(timestamp);
            } catch (error) {
                console.error("Error formatting date:", error, timestamp);
                return "Invalid Date";
            }
        };
        
        if (currentPageData.length > 0) {
            return currentPageData.map((item, index) => {
                if (tableType === 'reviewers') {
                    return (
                        <TableRow key={index}>
                            <TableCell>{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                                {item.isActive ? (
                                    <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900">
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        Inactive
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                            <TableCell>
                                <ViewReviewerDialog 
                                    reviewer={item} 
                                    onReviewerUpdated={onRefresh} 
                                />
                            </TableCell>
                        </TableRow>
                    );
                } else {
                    // Default row rendering for application data
                    return (
                        <TableRow key={index}>
                            <TableCell>{item.spupRecCode || `SPUP_${new Date().getFullYear()}_${item.id?.substr(0, 5)}`}</TableCell>
                            <TableCell>{item.principalInvestigator || "Unknown"}</TableCell>
                            <TableCell>{formatDate(item.submissionDate)}</TableCell>
                            <TableCell>{item.courseProgram || "N/A"}</TableCell>
                            <TableCell className="max-w-md truncate">{item.title || "Untitled"}</TableCell>
                            <TableCell>
                                <Badge className={
                                    item.status === 'approved' ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' :
                                    item.status === 'rejected' ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800' :
                                    item.status === 'under review' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                                    'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                }>
                                    {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Button 
                                    size="sm" 
                                    onClick={() => {
                                        // Navigate to application details
                                        window.location.href = `/rec-chair/applications/${item.id}`;
                                    }}
                                >
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                }
            });
        } else {
            // Show placeholder row if no data is available
            return (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
            <div className="flex justify-between items-center mb-6">
                {title && <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">{title}</h2>}
                
                {tableType === 'default' && (
                    <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4 text-gray-500" />
                        <Select
                            value={categoryFilter || 'all'}
                            onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Biomedical">Biomedical</SelectItem>
                                <SelectItem value="Social Science">Social Science</SelectItem>
                                <SelectItem value="Clinical Trial">Clinical Trial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            
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