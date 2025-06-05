"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PlusCircle, Search, Sparkles } from "lucide-react";
import { PipelineCard } from "@/components/pipeline-card";
import type { Pipeline } from "@/types/pipeline";

export function PipelineDashboard() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPipelines() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/pipelines');
        if (res.ok) {
          const data = await res.json();
          setPipelines(data);
        }
      } catch (error) {
        console.error("Failed to load pipelines:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPipelines();
  }, []);

  const filteredPipelines = pipelines.filter(
    (pipeline) =>
      pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pipeline.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pipelines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPipelines(pipelines.filter((p) => p.id !== id));
      } else {
        // Optionally show an error toast
        console.error('Failed to delete pipeline');
      }
    } catch (error) {
      console.error('Error deleting pipeline:', error);
    }
  };

  return (
    <div className="space-y-8" data-oid="pxl64jy">
      {/* Hero Section */}
      <div className="flex justify-end gap-4 px-8 py-6 items-center">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search pipelines..."
            className="w-full min-w-[250px] pl-12 text-base h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Link href="/dashboard/pipelines/new">
          <Button className="h-11 px-5 flex items-center text-base bg-gradient-to-r from-maive-orange to-maive-yellow hover:from-maive-orange/90 hover:to-maive-yellow/90 text-maive-darker-gray font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Pipeline
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted/50 rounded-t-lg" />
                <CardContent className="p-6">
                  <div className="h-4 w-3/4 bg-muted rounded-lg mb-4" />
                  <div className="h-3 w-full bg-muted/60 rounded-lg mb-2" />
                  <div className="h-3 w-2/3 bg-muted/60 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPipelines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPipelines.map((pipeline) => (
              <PipelineCard key={pipeline.id} pipeline={pipeline} onDelete={handleDelete} />
            ))}
          </div>
        ) : pipelines.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-md">
              We couldn't find any pipelines matching your search. Try adjusting your search terms.
            </p>
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pipelines yet</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Create your first data pipeline to start transforming your data with AI-powered workflows.
              </p>
              <Link href="/dashboard/pipelines/new">
                <Button className="bg-gradient-to-r from-maive-orange to-maive-yellow text-maive-darker-gray font-semibold">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Pipeline
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
