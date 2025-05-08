"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight, FileUp, Upload } from "lucide-react";

export default function NewPipelinePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransformed, setIsTransformed] = useState(false);

  const handleInputFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setInputFile(file);

      try {
        // Send file directly to Pulse AI
        const formData = new FormData();
        formData.append("file", file);

        const pulseResponse = await fetch("/api/pulse", {
          method: "POST",
          body: formData,
        });

        if (!pulseResponse.ok) {
          const errorData = await pulseResponse.json();
          if (pulseResponse.status === 503) {
            // Pulse API is disabled, just set the file without analysis
            return;
          }
          throw new Error(
            errorData.error || "Failed to process file with Pulse AI",
          );
        }

        const data = await pulseResponse.json();

        // Update the description with Pulse AI's analysis
        if (data.markdown) {
          setDescription(data.markdown);
        }

        toast({
          title: "Success",
          description: "File processed with Pulse AI",
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to process file",
          variant: "destructive",
        });
      }
    }
  };

  const handleOutputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setOutputFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Pipeline name is required",
        variant: "destructive",
      });
      return;
    }

    if (!inputFile || !outputFile) {
      toast({
        title: "Error",
        description: "Both input and output example files are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setIsTransformed(false);

    try {
      // Simulate transformation process for 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // In a real app, this would be an API call to create the pipeline
      const newPipelineId = `pipeline-${Date.now()}`;

      // Store in local storage for demo purposes
      const pipelines = JSON.parse(localStorage.getItem("pipelines") || "[]");
      pipelines.push({
        id: newPipelineId,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: [],
        runs: [],
        inputExample: inputFile.name,
        outputExample: outputFile.name,
      });
      localStorage.setItem("pipelines", JSON.stringify(pipelines));

      setIsTransformed(true);
      toast({
        title: "Success",
        description: "Transformation completed successfully",
      });

      // Trigger file download from public directory
      const link = document.createElement("a");
      link.href = "/transformed/Completed Tray Inspection Time Tracking.xlsx";
      link.download = "Completed Tray Inspection Time Tracking.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto" data-oid="mdch6wb">
      <h1 className="text-2xl font-bold mb-6" data-oid="6flnz.m">
        Create New Pipeline
      </h1>
      <Card data-oid="yxobg91">
        <form onSubmit={handleSubmit} data-oid="er7ge3t">
          <CardHeader data-oid="p0dm8nc">
            <CardTitle data-oid="ieh130b">Pipeline Details</CardTitle>
            <CardDescription data-oid="-wjzca3">
              Provide basic information about your data pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6" data-oid="ytdk823">
            <div className="space-y-2" data-oid="bvzczmd">
              <Label htmlFor="name" data-oid="wa7eg4i">
                Pipeline Name
              </Label>
              <Input
                id="name"
                placeholder="Enter pipeline name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-oid="2dyhv:t"
              />
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
              data-oid="0oh1.yy"
            >
              {/* Input Example */}
              <Card className="border-dashed" data-oid="9fp89uq">
                <CardHeader className="pb-3" data-oid="3-9s0ty">
                  <CardTitle className="text-lg" data-oid="apj22rq">
                    Input File
                  </CardTitle>
                  <CardDescription data-oid="zq7a5l_">
                    Upload a sample input file
                  </CardDescription>
                </CardHeader>
                <CardContent data-oid="99n_l6:">
                  <div
                    className="flex flex-col items-center justify-center py-4"
                    data-oid="iw-rxtc"
                  >
                    <div
                      className="mb-4 rounded-full bg-muted p-3"
                      data-oid="m5.jzpp"
                    >
                      <FileUp
                        className="h-6 w-6 text-muted-foreground"
                        data-oid="sc:1jx6"
                      />
                    </div>
                    {inputFile ? (
                      <div className="text-center" data-oid="e1ltqmn">
                        <p className="font-medium break-all" data-oid=".q_med9">
                          {inputFile.name}
                        </p>
                        <p
                          className="text-sm text-muted-foreground mt-1"
                          data-oid="vtzufy1"
                        >
                          {(inputFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <p
                        className="text-sm text-muted-foreground text-center"
                        data-oid="_rxeudd"
                      >
                        Upload an example of your source data
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter data-oid="wt8ez57">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      document.getElementById("input-file")?.click()
                    }
                    data-oid="y:mv3.8"
                  >
                    <Upload className="mr-2 h-4 w-4" data-oid="8qrn9u." />
                    {inputFile ? "Change File" : "Select File"}
                  </Button>
                  <input
                    type="file"
                    id="input-file"
                    className="hidden"
                    onChange={handleInputFileChange}
                    data-oid="wn1.fnk"
                  />
                </CardFooter>
              </Card>

              {/* Transformation Description */}
              <Card data-oid="o4wd57y">
                <CardHeader className="pb-3" data-oid="d8dm5l2">
                  <CardTitle className="text-lg" data-oid="n2o_k23">
                    Transformation
                  </CardTitle>
                  <CardDescription data-oid=".elau0i">
                    Describe the data transformation
                  </CardDescription>
                </CardHeader>
                <CardContent
                  className="flex flex-col items-center"
                  data-oid="vwifgm0"
                >
                  <div
                    className="flex items-center justify-center mb-4"
                    data-oid="9x-7w4k"
                  >
                    <ArrowRight
                      className="h-8 w-8 text-muted-foreground"
                      data-oid="pwev2m2"
                    />
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Describe how the input should be transformed into the output..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px]"
                    data-oid="7ol6lza"
                  />
                </CardContent>
              </Card>

              {/* Output Example */}
              <Card className="border-dashed" data-oid="hw5.icx">
                <CardHeader className="pb-3" data-oid="a0c09b-">
                  <CardTitle className="text-lg" data-oid="dec541q">
                    Output File
                  </CardTitle>
                  <CardDescription data-oid="v4nsxkc">
                    Upload your source data in any format
                  </CardDescription>
                </CardHeader>
                <CardContent data-oid="1a07_00">
                  <div
                    className="flex flex-col items-center justify-center py-4"
                    data-oid="c7vki2q"
                  >
                    <div
                      className="mb-4 rounded-full bg-muted p-3"
                      data-oid="4bpnlc3"
                    >
                      <FileUp
                        className="h-6 w-6 text-muted-foreground"
                        data-oid="ehosjql"
                      />
                    </div>
                    {outputFile ? (
                      <div className="text-center" data-oid="9rb67ke">
                        <p className="font-medium break-all" data-oid="6vcp2q9">
                          {outputFile.name}
                        </p>
                        <p
                          className="text-sm text-muted-foreground mt-1"
                          data-oid=":yj7jdb"
                        >
                          {(outputFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <p
                        className="text-sm text-muted-foreground text-center"
                        data-oid="1gwh7aa"
                      >
                        Upload a template of your desired output
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter data-oid="auqi3ur">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      document.getElementById("output-file")?.click()
                    }
                    data-oid="02r7ut8"
                  >
                    <Upload className="mr-2 h-4 w-4" data-oid="1w99x8j" />
                    {outputFile ? "Change File" : "Select File"}
                  </Button>
                  <input
                    type="file"
                    id="output-file"
                    className="hidden"
                    onChange={handleOutputFileChange}
                    data-oid="b_uezhc"
                  />
                </CardFooter>
              </Card>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between" data-oid="neli8g-">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              data-oid="3h4btz5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isTransformed}
              data-oid="iuqcww5"
            >
              {isSubmitting
                ? "Running..."
                : isTransformed
                  ? "Transformation Complete"
                  : "Run Pipeline"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
