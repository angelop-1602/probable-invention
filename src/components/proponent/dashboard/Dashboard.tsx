"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Protocol } from "@/lib/application";
import { ProponentHeader } from "../shared/ProponentHeader";

interface DashboardProps {
  protocols: Protocol[];
  isLoading: boolean;
}

export function Dashboard({ protocols, isLoading }: DashboardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <ProponentHeader 
        title="My Dashboard" 
        subtitle="Manage and track your research protocols"
      />

      {protocols.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-lg">
          <div className="text-center space-y-6 max-w-lg mx-auto p-8">
            <h2 className="text-2xl font-bold text-gray-900">No Protocols Yet</h2>
            <p className="text-gray-600">
              You haven't submitted any research protocols yet. Start your research journey by submitting your first protocol.
            </p>
            <Button
              onClick={() => router.push("/submission-application")}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              Submit New Protocol
            </Button>
          </div>
        </div>
      ) : (
        <>

          <ScrollArea className="h-[calc(100vh-300px)] pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {protocols.map((protocol) => (
                <Card key={protocol.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                          {protocol.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(protocol.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">SPUP REC Code:</p>
                      <p className="text-sm text-gray-600">
                        {protocol.spupRecCode || "Not yet assigned"}
                      </p>

                    </div>

                    <div className="pt-4 flex justify-between space-x-3">
                      <StatusBadge status={protocol.status} />
                      {!protocol.spupRecCode && protocol.status === "draft" ? (
                        <Button
                          onClick={() => router.push(`/submission-application?edit=${protocol.id}`)}
                          variant="outline"
                          className="text-green-700 border-green-700 hover:bg-green-50"
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          onClick={() => router.push(`/track-application/${protocol.spupRecCode}`)}
                          variant="outline"
                          className="text-green-700 border-green-700 hover:bg-green-50"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
} 