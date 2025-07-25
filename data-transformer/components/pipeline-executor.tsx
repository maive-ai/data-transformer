"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import type { Pipeline, PipelineRun } from "@/types/pipeline";
import { Calendar, Clock, Download, Play, Upload } from "lucide-react";

interface PipelineExecutorProps {
  pipeline: Pipeline | null;
}

export function PipelineExecutor({ pipeline }: PipelineExecutorProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("manual");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const executePipeline = async () => {
    if (!pipeline || !selectedFile) return;

    setIsExecuting(true);
    setOutputFile(null);

    try {
      // In a real app, this would be an API call
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("pipelineId", pipeline.id);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, this would process the file and return a result
      const outputFileName = `processed-${selectedFile.name}`;
      setOutputFile(outputFileName);

      // Record the pipeline run
      const newRun: PipelineRun = {
        id: `run-${Date.now()}`,
        pipelineId: pipeline.id,
        timestamp: new Date().toISOString(),
        status: "success",
        inputFile: selectedFile.name,
        outputFile: outputFileName,
      };

      // Save run history through API
      const response = await fetch(`/api/run-history/${pipeline.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ run: newRun }),
      });

      if (!response.ok) {
        throw new Error('Failed to save pipeline run');
      }

      // Update pipeline in storage
      const updatedPipeline = {
        ...pipeline,
        updatedAt: new Date().toISOString(),
      };
      await fetch(`/api/pipelines/${pipeline.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPipeline),
      });

      toast({
        title: "Success",
        description: "Pipeline executed successfully",
      });
    } catch (error) {
      console.error("Failed to execute pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to execute pipeline",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadOutput = () => {
    // In a real app, this would download the actual processed file
    toast({
      title: "Download started",
      description: `Downloading ${outputFile}`,
    });
  };

  if (!pipeline) {
    return (
      <Card className="h-full flex flex-col" data-oid="sj2d5fe">
        <CardHeader className="pb-3" data-oid="5g7o1h9">
          <div className="flex items-center justify-between" data-oid="fvq-h43">
            <div data-oid="y98t75c">
              <CardTitle data-oid="0ozubkq">Pipeline Executor</CardTitle>
              <CardDescription data-oid="_s6xp27">
                Create a pipeline first to execute it
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col" data-oid="sj2d5fe">
      <CardHeader className="pb-3" data-oid="5g7o1h9">
        <div className="flex items-center justify-between" data-oid="fvq-h43">
          <div data-oid="y98t75c">
            <CardTitle data-oid="0ozubkq">Pipeline Executor</CardTitle>
            <CardDescription data-oid="_s6xp27">
              Execute your data transformation pipeline
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1" data-oid="qvc0ups">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full"
          data-oid="arqc41s"
        >
          <TabsList className="grid w-full grid-cols-2" data-oid="7l0i0zg">
            <TabsTrigger value="manual" data-oid="c:megg3">
              Manual Run
            </TabsTrigger>
            <TabsTrigger value="schedule" data-oid="rmbz.pn">
              Schedule
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="manual"
            className="space-y-4 mt-4"
            data-oid=".1.lkt-"
          >
            <div className="space-y-2" data-oid="o8e1-lu">
              <Label htmlFor="input-file" data-oid="w:1so6_">
                Input File
              </Label>
              <div className="flex items-center gap-2" data-oid="lv02qwf">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("input-file")?.click()}
                  className="w-full"
                  data-oid="_zw:gl7"
                >
                  <Upload className="mr-2 h-4 w-4" data-oid="2mv:bu6" />
                  {selectedFile ? selectedFile.name : "Select File"}
                </Button>
                <input
                  type="file"
                  id="input-file"
                  className="hidden"
                  onChange={handleFileChange}
                  data-oid="uq8w21z"
                />
              </div>
            </div>

            <Button
              onClick={executePipeline}
              disabled={isExecuting || !selectedFile}
              className="w-full"
              data-oid="5vvw_0j"
            >
              <Play className="mr-2 h-4 w-4" data-oid="-6w3nbp" />
              {isExecuting ? "Executing..." : "Execute Pipeline"}
            </Button>

            {outputFile && (
              <div className="mt-6 p-4 border rounded-lg" data-oid="1i5kfg1">
                <h3 className="font-medium mb-2" data-oid="mu2_b34">
                  Output
                </h3>
                <p
                  className="text-sm text-muted-foreground mb-4"
                  data-oid="q024btt"
                >
                  Your file has been processed successfully.
                </p>
                <Button
                  variant="outline"
                  onClick={downloadOutput}
                  className="w-full"
                  data-oid="t9n01on"
                >
                  <Download className="mr-2 h-4 w-4" data-oid="k-k_v9." />
                  Download {outputFile}
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="schedule" className="mt-4" data-oid="iarg1xu">
            <div
              className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg"
              data-oid="valjc9f"
            >
              <p
                className="text-muted-foreground text-center mb-2"
                data-oid="-943o6_"
              >
                Set up automatic pipeline execution
              </p>
              <p
                className="text-sm text-muted-foreground text-center mb-4"
                data-oid="rzggl9-"
              >
                Schedule your pipeline to run on a recurring basis or when new
                data arrives.
              </p>
              <Button variant="outline" data-oid="3e_0ada">
                Configure Schedule
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4" data-oid="2ffuw32">
        <div className="w-full" data-oid="59_7oek">
          <h3 className="text-sm font-medium mb-2" data-oid=":kw:v25">
            Last Execution
          </h3>
          {pipeline.runs && pipeline.runs.length > 0 ? (
            <div
              className="flex items-center justify-between text-sm"
              data-oid="48bu.6z"
            >
              <div
                className="flex items-center gap-1 text-muted-foreground"
                data-oid="7ap8ohi"
              >
                <Calendar className="h-3.5 w-3.5" data-oid="xy0n3ua" />
                <span data-oid="gd.17j1">
                  {new Date(
                    pipeline.runs[pipeline.runs.length - 1].timestamp,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div
                className="flex items-center gap-1 text-muted-foreground"
                data-oid=":fznlxq"
              >
                <Clock className="h-3.5 w-3.5" data-oid="-3bsy_n" />
                <span data-oid="er4kx04">
                  {new Date(
                    pipeline.runs[pipeline.runs.length - 1].timestamp,
                  ).toLocaleTimeString()}
                </span>
              </div>
              <span className="text-green-500 font-medium" data-oid="jizkbpr">
                Success
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-oid="fo8f8hg">
              No executions yet
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
