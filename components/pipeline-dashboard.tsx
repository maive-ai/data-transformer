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

  const recentPipelines = [...pipelines]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maive-orange/10 via-maive-yellow/5 to-maive-cream/20 border border-maive-orange/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkI1MTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-maive-orange to-maive-yellow flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-maive-darker-gray" />
                </div>
                <h1 className="text-3xl font-bold maive-text-gradient">
                  Pipeline Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground text-lg mb-2">
                Transform your data with AI-powered pipelines
              </p>
              <p className="text-sm text-muted-foreground/80">
                Create, manage, and monitor your data transformation workflows
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                />
                <Input
                  type="search"
                  placeholder="Search pipelines..."
                  className="w-full min-w-[250px] pl-10 bg-background/80 backdrop-blur-sm border-maive-orange/20 focus:border-maive-orange/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link href="/dashboard/pipelines/new">
                <Button className="bg-gradient-to-r from-maive-orange to-maive-yellow hover:from-maive-orange/90 hover:to-maive-yellow/90 text-maive-darker-gray font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Pipeline
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" data-oid="_fnogb:">
        <TabsList className="bg-muted/50 p-1" data-oid="zw8b18f">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            data-oid="140zldt"
          >
            All Pipelines
          </TabsTrigger>
          <TabsTrigger 
            value="recent"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            data-oid="y82hquq"
          >
            Recent
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-8" data-oid="ja_n0gd">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-oid="we8ckf-"
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-maive-orange/10" data-oid="du-zq1:">
                  <CardHeader
                    className="h-24 bg-gradient-to-br from-muted/50 to-muted rounded-t-lg"
                    data-oid="nlfqe1h"
                  />
                  <CardContent className="p-6" data-oid="ex1n9tn">
                    <div
                      className="h-4 w-3/4 bg-muted rounded-lg mb-4"
                      data-oid="x8z:pxi"
                    />
                    <div
                      className="h-3 w-full bg-muted/60 rounded-lg mb-2"
                      data-oid="bvnyhr-"
                    />
                    <div
                      className="h-3 w-2/3 bg-muted/60 rounded-lg"
                      data-oid="d.8.b5o"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPipelines.length > 0 ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-oid="vd5_ej6"
            >
              {filteredPipelines.map((pipeline) => (
                <PipelineCard
                  key={pipeline.id}
                  pipeline={pipeline}
                  onDelete={handleDelete}
                  data-oid="9l9jn91"
                />
              ))}
            </div>
          ) : pipelines.length > 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16"
              data-oid="m:8zdhx"
            >
              <div
                className="rounded-2xl bg-gradient-to-br from-maive-orange/10 to-maive-yellow/10 p-6 mb-6"
                data-oid="saqqiie"
              >
                <Search
                  className="h-8 w-8 text-maive-orange"
                  data-oid="_le0d:4"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-oid="fw51u_d">
                No results found
              </h3>
              <p
                className="text-muted-foreground text-center max-w-md"
                data-oid="_hq19i-"
              >
                We couldn't find any pipelines matching your search. Try
                adjusting your search terms.
              </p>
            </div>
          ) : (
            <Card className="border-dashed border-2 border-maive-orange/30 bg-gradient-to-br from-maive-cream/30 to-transparent" data-oid="h11n2my">
              <CardContent
                className="flex flex-col items-center justify-center py-16"
                data-oid="k7p4els"
              >
                <div
                  className="rounded-2xl bg-gradient-to-br from-maive-orange/20 to-maive-yellow/20 p-6 mb-6"
                  data-oid="fvql9rv"
                >
                  <FileText
                    className="h-8 w-8 text-maive-orange"
                    data-oid=".:gnmio"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2" data-oid="hwes1qk">
                  No pipelines yet
                </h3>
                <p
                  className="text-muted-foreground text-center max-w-md mb-6"
                  data-oid="7m00cmj"
                >
                  Create your first data pipeline to start transforming your
                  data with AI-powered workflows.
                </p>
                <Link href="/dashboard/pipelines/new" data-oid="ifjbhb1">
                  <Button className="bg-gradient-to-r from-maive-orange to-maive-yellow hover:from-maive-orange/90 hover:to-maive-yellow/90 text-maive-darker-gray font-semibold shadow-lg hover:shadow-xl transition-all duration-200" data-oid="4_:ati0">
                    <PlusCircle className="mr-2 h-4 w-4" data-oid="1j.rn3k" />
                    Create Your First Pipeline
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="recent" className="mt-8" data-oid="na-98ql">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-oid="9agrlmw"
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-maive-orange/10" data-oid="0.imdhl">
                  <CardHeader
                    className="h-24 bg-gradient-to-br from-muted/50 to-muted rounded-t-lg"
                    data-oid="y6_oo:w"
                  />
                  <CardContent className="p-6" data-oid="gs-2q63">
                    <div
                      className="h-4 w-3/4 bg-muted rounded-lg mb-4"
                      data-oid="y8d7-1t"
                    />
                    <div
                      className="h-3 w-full bg-muted/60 rounded-lg mb-2"
                      data-oid="28ut_-."
                    />
                    <div
                      className="h-3 w-2/3 bg-muted/60 rounded-lg"
                      data-oid="7bku9lm"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentPipelines.length > 0 ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-oid="movofy-"
            >
              {recentPipelines.map((pipeline) => (
                <PipelineCard
                  key={pipeline.id}
                  pipeline={pipeline}
                  onDelete={handleDelete}
                  data-oid="3qpflh2"
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-maive-orange/30 bg-gradient-to-br from-maive-cream/30 to-transparent" data-oid="cy7sho9">
              <CardContent
                className="flex flex-col items-center justify-center py-16"
                data-oid="n1hgxq8"
              >
                <div
                  className="rounded-2xl bg-gradient-to-br from-maive-orange/20 to-maive-yellow/20 p-6 mb-6"
                  data-oid="wtu_0zz"
                >
                  <FileText
                    className="h-8 w-8 text-maive-orange"
                    data-oid="h:wxwmr"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2" data-oid="_blc0x3">
                  No recent pipelines
                </h3>
                <p
                  className="text-muted-foreground text-center max-w-md mb-6"
                  data-oid="59x8tfg"
                >
                  Create your first data pipeline to get started.
                </p>
                <Link href="/dashboard/pipelines/new" data-oid="bni-v51">
                  <Button className="bg-gradient-to-r from-maive-orange to-maive-yellow hover:from-maive-orange/90 hover:to-maive-yellow/90 text-maive-darker-gray font-semibold shadow-lg hover:shadow-xl transition-all duration-200" data-oid="qr6-86z">
                    <PlusCircle className="mr-2 h-4 w-4" data-oid="26_9mrb" />
                    Create Pipeline
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
