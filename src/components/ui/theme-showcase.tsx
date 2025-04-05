"use client";
import { useState } from "react";
import { useTheme } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Checkbox } from "./checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { Label } from "./label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Separator } from "./separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Textarea } from "./textarea";
import { Toggle } from "./toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { FileUploader } from "./file-upload";

export function ThemeShowcase() {
  const { colors } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [compactCurrentPage, setCompactCurrentPage] = useState(3);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCompactPageChange = (page: number) => {
    setCompactCurrentPage(page);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">UI Component Showcase</h1>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="typography" className="mb-12">
        <TabsList className="mb-6">
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>
        
        <TabsContent value="typography">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-primary-600">Typography</h2>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold">Heading 1</h1>
                <p className="text-sm text-gray-500">text-4xl font-bold</p>
              </div>
              <div>
                <h2 className="text-3xl font-semibold">Heading 2</h2>
                <p className="text-sm text-gray-500">text-3xl font-semibold</p>
              </div>
              <div>
                <h3 className="text-2xl font-medium">Heading 3</h3>
                <p className="text-sm text-gray-500">text-2xl font-medium</p>
              </div>
              <div>
                <h4 className="text-xl font-medium">Heading 4</h4>
                <p className="text-sm text-gray-500">text-xl font-medium</p>
              </div>
              <div>
                <p className="text-base">Base Text - The quick brown fox jumps over the lazy dog.</p>
                <p className="text-sm text-gray-500">text-base</p>
              </div>
              <div>
                <p className="text-sm">Small Text - The quick brown fox jumps over the lazy dog.</p>
                <p className="text-sm text-gray-500">text-sm</p>
              </div>
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="colors">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-primary-600">Color Palette - Primary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(colors.primary).map(([shade, color]) => (
                <div key={shade} className="flex flex-col">
                  <div 
                    className="h-20 rounded-md mb-2"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="text-sm font-medium">{shade === 'DEFAULT' ? 'primary' : `primary-${shade}`}</div>
                  <div className="text-xs text-gray-500">{color}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-primary-600">Color Palette - Secondary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(colors.secondary).map(([shade, color]) => (
                <div key={shade} className="flex flex-col">
                  <div 
                    className="h-20 rounded-md mb-2"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="text-sm font-medium">{shade === 'DEFAULT' ? 'secondary' : `secondary-${shade}`}</div>
                  <div className="text-xs text-gray-500">{color}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary-600">Utility Colors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries({
                success: colors.success.DEFAULT,
                "success-light": colors.success.light,
                warning: colors.warning.DEFAULT,
                "warning-light": colors.warning.light,
                error: colors.error.DEFAULT,
                "error-light": colors.error.light,
                info: colors.info.DEFAULT,
                "info-light": colors.info.light,
              }).map(([name, color]) => (
                <div key={name} className="flex flex-col">
                  <div 
                    className="h-16 rounded-md mb-2"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-xs text-gray-500">{color}</div>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="components">
          <div className="space-y-16">
            {/* Buttons Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Buttons</h2>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button disabled>Disabled</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
              </div>
            </section>

            {/* Form Elements */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Form Elements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="Enter your email" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Type your message here" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Accept terms and conditions
                    </label>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="select">Select</Label>
                    <Select>
                      <SelectTrigger id="select">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Toggle</Label>
                    <div className="flex items-center space-x-4">
                      <Toggle>Bold</Toggle>
                      <Toggle>Italic</Toggle>
                      <Toggle>Underline</Toggle>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Cards */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description goes here</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This is the main content area of the card component.</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost">Cancel</Button>
                    <Button>Submit</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Content</CardTitle>
                    <CardDescription>Important information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This card showcases how to present important content with proper hierarchy.</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View Details</Button>
                  </CardFooter>
                </Card>
              </div>
            </section>

            {/* Dialogs */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Dialogs & Dropdowns</h2>
              <div className="flex flex-wrap gap-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dialog Title</DialogTitle>
                      <DialogDescription>
                        This is a dialog component for displaying important content that requires user attention.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p>Dialog content goes here.</p>
                    </div>
                    <DialogFooter>
                      <Button>Save changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Open Dropdown</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                    <DropdownMenuItem>Subscription</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </section>

            {/* Accordion */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Accordion</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is it accessible?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Is it styled?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It comes with default styles that matches your theme.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is it animated?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It's animated by default, but you can disable it if you prefer.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* Alerts */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Alerts</h2>
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    This is an informational alert to notify users about something important.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Something went wrong. Please try again later.
                  </AlertDescription>
                </Alert>
              </div>
            </section>

            {/* Tables */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Tables</h2>
              <Table>
                <TableCaption>A list of recent transactions</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>TRX-001</TableCell>
                    <TableCell>2023-10-15</TableCell>
                    <TableCell>$250.00</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TRX-002</TableCell>
                    <TableCell>2023-10-16</TableCell>
                    <TableCell>$120.00</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TRX-003</TableCell>
                    <TableCell>2023-10-17</TableCell>
                    <TableCell>$85.50</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </section>

            {/* Misc Components */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Miscellaneous Components</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Avatar</h3>
                    <div className="flex gap-4">
                      <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <Avatar>
                        <AvatarImage src="https://github.com/user2.png" alt="@user2" />
                        <AvatarFallback>U2</AvatarFallback>
                      </Avatar>
                      <Avatar>
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Separator</h3>
                    <div className="space-y-2">
                      <p>Above separator</p>
                      <Separator />
                      <p>Below separator</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Tooltip</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline">Hover Me</Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Tooltip content</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </section>

            {/* Pagination Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-primary-600">Pagination</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Standard Pagination</h3>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {[1, 2, 3, 4, 5].map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => handlePageChange(10)}
                          isActive={currentPage === 10}
                        >
                          10
                        </PaginationLink>
                      </PaginationItem>
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(10, currentPage + 1))}
                          className={currentPage === 10 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Compact Pagination</h3>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handleCompactPageChange(Math.max(1, compactCurrentPage - 1))}
                          className={compactCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {compactCurrentPage > 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handleCompactPageChange(1)}>
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {compactCurrentPage > 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {compactCurrentPage > 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handleCompactPageChange(compactCurrentPage - 1)}>
                            {compactCurrentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationLink isActive>
                          {compactCurrentPage}
                        </PaginationLink>
                      </PaginationItem>
                      
                      {compactCurrentPage < 10 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handleCompactPageChange(compactCurrentPage + 1)}>
                            {compactCurrentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {compactCurrentPage < 9 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {compactCurrentPage < 10 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handleCompactPageChange(10)}>
                            10
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handleCompactPageChange(Math.min(10, compactCurrentPage + 1))}
                          className={compactCurrentPage === 10 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Simple Pagination</h3>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </section>
            <FileUploader 
  onFilesSelected={(files) => console.log(files)}
  accept={{ 'application/*': ['.pdf'] }}
/>
          </div>
        </TabsContent>
      </Tabs>


    </div>
  );
} 