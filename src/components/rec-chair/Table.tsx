"use client";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";

import { Button } from "../ui/button";
import { 
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "../ui/pagination";
import { useState } from "react";

interface ChairTableProps {
    title?: string;
    caption?: string;
}

export function ChairTable({ 
    title = "Applications", 
    caption = "A list of recent submission of protocol review applications" 
}: ChairTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5; // Example total

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <section>
            <h2 className="text-2xl font-semibold mb-6 text-primary-600">{title}</h2>
            <Table>
                <TableCaption>{caption}</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>SPUP REC Code</TableHead>
                        <TableHead>Principal Investigator</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Course/Program</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>SPUP_2025_00165_SR_KD</TableCell>
                        <TableCell>Keith Dela Cruz</TableCell>
                        <TableCell>2023-10-15</TableCell>
                        <TableCell>DIT</TableCell>
                        <TableCell><Button size="sm">View</Button></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            
            <div className="mt-6">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>

                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                            const pageNum = i + 1;
                            return (
                                <PaginationItem key={i}>
                                    <PaginationLink 
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
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </section>
    )
}