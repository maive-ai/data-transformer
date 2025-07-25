"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Pipeline, PipelineRun } from "@/types/pipeline";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface PipelineHistoryProps {
  pipelineId: string;
}

export function PipelineHistory({ pipelineId }: PipelineHistoryProps) {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPipelineRuns = async () => {
      try {
        const response = await fetch(`/api/run-history/${pipelineId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pipeline runs');
        }
        const data = await response.json();
        setRuns(
          data.runs.sort(
            (a: PipelineRun, b: PipelineRun) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime(),
          ),
        );
      } catch (error) {
        console.error("Failed to load pipeline runs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPipelineRuns();
  }, [pipelineId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="h-full flex flex-col" data-oid="cvf3lu2">
      <CardHeader data-oid="ohyib6t">
        <CardTitle data-oid=".k_zjtc">Pipeline History</CardTitle>
        <CardDescription data-oid="jw:b3a1">
          View past executions and results
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0" data-oid="v3z:w_c">
        <ScrollArea className="h-[calc(100%-80px)]" data-oid="piiuo3h">
          {isLoading ? (
            <div className="p-6 space-y-4" data-oid=".s8d6-:">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse" data-oid="-eez2xh">
                  <div
                    className="h-5 w-1/3 bg-muted rounded mb-2"
                    data-oid="1f:t.7v"
                  />
                  <div
                    className="h-4 w-full bg-muted rounded mb-1"
                    data-oid="hlbcx5x"
                  />
                  <div
                    className="h-4 w-2/3 bg-muted rounded"
                    data-oid="yvccm8d"
                  />
                </div>
              ))}
            </div>
          ) : runs.length > 0 ? (
            <div className="divide-y" data-oid="krtmrko">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                  data-oid="zxf6361"
                >
                  <div
                    className="flex items-center justify-between mb-1"
                    data-oid="i.mh1_d"
                  >
                    <div className="font-medium" data-oid="w5l3tqv">
                      {formatDate(run.timestamp)}
                    </div>
                    <div className="flex items-center" data-oid="i6yo38h">
                      {run.status === "success" ? (
                        <CheckCircle
                          className="h-4 w-4 text-green-500"
                          data-oid="ohmnb:l"
                        />
                      ) : (
                        <XCircle
                          className="h-4 w-4 text-red-500"
                          data-oid="8n1umx-"
                        />
                      )}
                    </div>
                  </div>
                  <div
                    className="flex items-center text-sm text-muted-foreground mb-1"
                    data-oid="16r_wly"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" data-oid="1hs:qx:" />
                    <span data-oid="k949ibb">{formatTime(run.timestamp)}</span>
                  </div>
                  <div className="text-sm" data-oid="1213714">
                    <span className="text-muted-foreground" data-oid="aiv6icl">
                      Input:{" "}
                    </span>
                    {run.inputFile}
                  </div>
                  {run.outputFile && (
                    <div className="text-sm" data-oid="l3hfjmp">
                      <span
                        className="text-muted-foreground"
                        data-oid="igivujj"
                      >
                        Output:{" "}
                      </span>
                      {run.outputFile}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center p-6 text-center"
              data-oid="bzlr_qe"
            >
              <div
                className="rounded-full bg-muted p-3 mb-4"
                data-oid="lb_wz7u"
              >
                <Clock
                  className="h-6 w-6 text-muted-foreground"
                  data-oid="mfdj.o6"
                />
              </div>
              <h3 className="font-medium mb-1" data-oid="8shopw2">
                No execution history
              </h3>
              <p className="text-sm text-muted-foreground" data-oid="66sds85">
                Run the pipeline to see execution history
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
