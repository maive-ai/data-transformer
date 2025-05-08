"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PipelineVisualEditor } from "@/components/pipeline-visual-editor";
import type { Pipeline } from "@/types/pipeline";
import { Save } from "lucide-react";

interface PipelineEditorProps {
  pipeline: Pipeline;
}

export function PipelineEditor({ pipeline }: PipelineEditorProps) {
  const [naturalLanguageDescription, setNaturalLanguageDescription] =
    useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("visual");

  useEffect(() => {
    // Initialize with existing description if available
    if (pipeline.naturalLanguageDescription) {
      setNaturalLanguageDescription(pipeline.naturalLanguageDescription);
    }
  }, [pipeline]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // In a real app, this would be an API call
      const pipelines = JSON.parse(localStorage.getItem("pipelines") || "[]");
      const pipelineIndex = pipelines.findIndex(
        (p: Pipeline) => p.id === pipeline.id,
      );

      if (pipelineIndex !== -1) {
        pipelines[pipelineIndex] = {
          ...pipelines[pipelineIndex],
          naturalLanguageDescription,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem("pipelines", JSON.stringify(pipelines));

        toast({
          title: "Success",
          description: "Pipeline saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save pipeline",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-full flex flex-col" data-oid="sj2d5fe">
      <CardHeader className="pb-3" data-oid="5g7o1h9">
        <div className="flex items-center justify-between" data-oid="fvq-h43">
          <div data-oid="y98t75c">
            <CardTitle data-oid="0ozubkq">Pipeline Editor</CardTitle>
            <CardDescription data-oid="_s6xp27">
              Define your data transformation pipeline
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isSaving} data-oid=":.iu:qg">
            <Save className="mr-2 h-4 w-4" data-oid="7o6f4fk" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0" data-oid="ctszpd4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
          data-oid="-sn2fjp"
        >
          <div className="px-6" data-oid="tw3trqf">
            <TabsList className="grid w-full grid-cols-2" data-oid="zgijzlb">
              <TabsTrigger value="visual" data-oid="x2gwi3q">
                Visual Editor
              </TabsTrigger>
              <TabsTrigger value="natural" data-oid="ds3m2y1">
                Natural Language
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="visual"
            className="flex-1 p-6 pt-4"
            data-oid="emxcsfg"
          >
            <PipelineVisualEditor pipeline={pipeline} data-oid="l:.ni:j" />
          </TabsContent>
          <TabsContent
            value="natural"
            className="flex-1 p-6 pt-4 flex flex-col"
            data-oid="u:hc0-0"
          >
            <p
              className="text-sm text-muted-foreground mb-4"
              data-oid="hitrj7e"
            >
              Describe your data transformation in natural language. For
              example: "Extract customer names and emails from the Excel file,
              then format them as a CSV with headers."
            </p>
            <Textarea
              className="flex-1 min-h-[300px] resize-none"
              placeholder="Describe your data transformation pipeline..."
              value={naturalLanguageDescription}
              onChange={(e) => setNaturalLanguageDescription(e.target.value)}
              data-oid="q1uojsp"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
