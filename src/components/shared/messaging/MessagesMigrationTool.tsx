"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { 
  runCompleteMigration, 
  findAllApplicationIds,
  migrateMessages,
  fixDuplicateMessages 
} from "@/lib/messaging/migration";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function MessagesMigrationTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    migrated?: number;
    duplicatesRemoved?: number;
    applicationsChecked?: number;
    error?: string;
  }>({});
  const [applications, setApplications] = useState<string[]>([]);
  const [oldCollectionPath, setOldCollectionPath] = useState("applications");
  const [newCollectionPath, setNewCollectionPath] = useState("protocolReviewApplications");

  // Run the complete migration process
  const handleRunMigration = async () => {
    setIsRunning(true);
    setResults({});

    try {
      const result = await runCompleteMigration();
      setResults(result);
    } catch (error) {
      console.error("Migration failed:", error);
      setResults({ error: String(error) });
    } finally {
      setIsRunning(false);
    }
  };

  // Find all applications
  const handleFindApplications = async () => {
    setIsRunning(true);
    setApplications([]);

    try {
      const oldIds = await findAllApplicationIds(oldCollectionPath);
      const newIds = await findAllApplicationIds(newCollectionPath);
      
      // Combine and deduplicate
      const allIds = [...new Set([...oldIds, ...newIds])];
      setApplications(allIds);
    } catch (error) {
      console.error("Failed to find applications:", error);
      setResults({ error: String(error) });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Messaging System Migration Tool</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This tool helps fix messaging issues by migrating messages between collections 
            and removing duplicates. Only use this if you're experiencing problems with the 
            messaging system.
          </p>

          {results.error && (
            <Alert variant="destructive">
              <AlertTitle>Migration Error</AlertTitle>
              <AlertDescription>{results.error}</AlertDescription>
            </Alert>
          )}

          {results.applicationsChecked !== undefined && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <AlertTitle>Migration Complete</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  <li>{results.applicationsChecked} applications checked</li>
                  <li>{results.migrated} messages migrated</li>
                  <li>{results.duplicatesRemoved} duplicate messages removed</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">1. Run Migration</h3>
              <Button
                onClick={handleRunMigration}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Migration...
                  </>
                ) : (
                  "Run Complete Migration"
                )}
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">2. Find Applications</h3>
              <Button
                onClick={handleFindApplications}
                disabled={isRunning}
                variant="outline"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Find Applications"
                )}
              </Button>
            </div>
          </div>

          {applications.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Application IDs</h3>
              <div className="border rounded-md p-4 bg-muted/20 max-h-60 overflow-y-auto">
                <ul className="space-y-1">
                  {applications.map((id) => (
                    <li key={id} className="text-sm font-mono">
                      {id}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Found {applications.length} applications across both collections.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 