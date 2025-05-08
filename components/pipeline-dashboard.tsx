"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PlusCircle, Search } from "lucide-react";
import { PipelineCard } from "@/components/pipeline-card";
import type { Pipeline } from "@/types/pipeline";

export function PipelineDashboard() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    const loadPipelines = () => {
      try {
        const storedPipelines = localStorage.getItem("pipelines");
        if (storedPipelines) {
          setPipelines(JSON.parse(storedPipelines));
        }
      } catch (error) {
        console.error("Failed to load pipelines:", error);
      } finally {
        setIsLoading(false);
      }
    };

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

  const handleDelete = (id: string) => {
    const updated = pipelines.filter((p) => p.id !== id);
    setPipelines(updated);
    localStorage.setItem("pipelines", JSON.stringify(updated));
  };

  return (
    <div className="space-y-6" data-oid="pxl64jy">
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        data-oid="h5.8wbk"
      >
        <div data-oid="2:_axau">
          <h1 className="text-2xl font-bold" data-oid="zhtq_6_">
            Pipeline Dashboard
          </h1>
          <p className="text-muted-foreground" data-oid=":-4n6m.">
            Manage and monitor your data pipelines
          </p>
        </div>
        <div className="flex items-center gap-2" data-oid="e5w5yhw">
          <div className="relative" data-oid="m1hxx54">
            <Search
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              data-oid="resro1s"
            />

            <Input
              type="search"
              placeholder="Search pipelines..."
              className="w-full min-w-[200px] pl-8 md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-oid="6fexfoa"
            />
          </div>
          <Link href="/dashboard/pipelines/new" data-oid="ovh0kol">
            <Button data-oid="y1q6_ee">
              <PlusCircle className="mr-2 h-4 w-4" data-oid=":upz937" />
              New Pipeline
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" data-oid="_fnogb:">
        <TabsList data-oid="zw8b18f">
          <TabsTrigger value="all" data-oid="140zldt">
            All Pipelines
          </TabsTrigger>
          <TabsTrigger value="recent" data-oid="y82hquq">
            Recent
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6" data-oid="ja_n0gd">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-oid="we8ckf-"
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse" data-oid="du-zq1:">
                  <CardHeader
                    className="h-24 bg-muted rounded-t-lg"
                    data-oid="nlfqe1h"
                  />

                  <CardContent className="p-6" data-oid="ex1n9tn">
                    <div
                      className="h-4 w-3/4 bg-muted rounded mb-4"
                      data-oid="x8z:pxi"
                    />

                    <div
                      className="h-3 w-full bg-muted rounded mb-2"
                      data-oid="bvnyhr-"
                    />

                    <div
                      className="h-3 w-2/3 bg-muted rounded"
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
              className="flex flex-col items-center justify-center py-12"
              data-oid="m:8zdhx"
            >
              <div
                className="rounded-full bg-muted p-3 mb-4"
                data-oid="saqqiie"
              >
                <Search
                  className="h-6 w-6 text-muted-foreground"
                  data-oid="_le0d:4"
                />
              </div>
              <h3 className="text-lg font-semibold mb-1" data-oid="fw51u_d">
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
            <Card className="border-dashed" data-oid="h11n2my">
              <CardContent
                className="flex flex-col items-center justify-center py-12"
                data-oid="k7p4els"
              >
                <div
                  className="rounded-full bg-muted p-3 mb-4"
                  data-oid="fvql9rv"
                >
                  <FileText
                    className="h-6 w-6 text-muted-foreground"
                    data-oid=".:gnmio"
                  />
                </div>
                <h3 className="text-lg font-semibold mb-1" data-oid="hwes1qk">
                  No pipelines yet
                </h3>
                <p
                  className="text-muted-foreground text-center max-w-md mb-4"
                  data-oid="7m00cmj"
                >
                  Create your first data pipeline to start transforming your
                  data.
                </p>
                <Link href="/dashboard/pipelines/new" data-oid="ifjbhb1">
                  <Button data-oid="4_:ati0">
                    <PlusCircle className="mr-2 h-4 w-4" data-oid="1j.rn3k" />
                    Create Pipeline
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="recent" className="mt-6" data-oid="na-98ql">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-oid="9agrlmw"
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse" data-oid="0.imdhl">
                  <CardHeader
                    className="h-24 bg-muted rounded-t-lg"
                    data-oid="y6_oo:w"
                  />

                  <CardContent className="p-6" data-oid="gs-2q63">
                    <div
                      className="h-4 w-3/4 bg-muted rounded mb-4"
                      data-oid="y8d7-1t"
                    />

                    <div
                      className="h-3 w-full bg-muted rounded mb-2"
                      data-oid="28ut_-."
                    />

                    <div
                      className="h-3 w-2/3 bg-muted rounded"
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
            <Card className="border-dashed" data-oid="cy7sho9">
              <CardContent
                className="flex flex-col items-center justify-center py-12"
                data-oid="n1hgxq8"
              >
                <div
                  className="rounded-full bg-muted p-3 mb-4"
                  data-oid="wtu_0zz"
                >
                  <FileText
                    className="h-6 w-6 text-muted-foreground"
                    data-oid="h:wxwmr"
                  />
                </div>
                <h3 className="text-lg font-semibold mb-1" data-oid="_blc0x3">
                  No recent pipelines
                </h3>
                <p
                  className="text-muted-foreground text-center max-w-md mb-4"
                  data-oid="59x8tfg"
                >
                  Create your first data pipeline to get started.
                </p>
                <Link href="/dashboard/pipelines/new" data-oid="bni-v51">
                  <Button data-oid="qr6-86z">
                    <PlusCircle className="mr-2 h-4 w-4" data-oid="26_9mrb" />
                    Run Transformation
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
