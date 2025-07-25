"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pipeline, PipelineStep } from "@/types/pipeline";
import { ArrowDown, Plus, Trash2 } from "lucide-react";

interface PipelineVisualEditorProps {
  pipeline: Pipeline;
}

const STEP_TYPES = [
  { value: "extract", label: "Extract Data" },
  { value: "transform", label: "Transform Data" },
  { value: "load", label: "Load Data" },
  { value: "filter", label: "Filter Data" },
  { value: "join", label: "Join Data" },
  { value: "aggregate", label: "Aggregate Data" },
];

const SOURCE_TYPES = [
  { value: "file", label: "File Upload" },
  { value: "database", label: "Database" },
  { value: "api", label: "API" },
  { value: "sharepoint", label: "SharePoint" },
  { value: "lims", label: "LIMS System" },
  { value: "sap", label: "SAP" },
];

export function PipelineVisualEditor({ pipeline }: PipelineVisualEditorProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(pipeline.steps || []);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: `step-${Date.now()}`,
        type: "extract",
        name: `Step ${steps.length + 1}`,
        source: "file",
        config: {},
      },
    ]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
    };
    setSteps(newSteps);
  };

  return (
    <div className="space-y-4" data-oid="bj4946f">
      {steps.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg"
          data-oid=".jsfsb8"
        >
          <p className="text-muted-foreground mb-4" data-oid="inff9pv">
            No steps defined yet
          </p>
          <Button onClick={addStep} data-oid="5x2-ybd">
            <Plus className="mr-2 h-4 w-4" data-oid="m0eqy1g" />
            Add First Step
          </Button>
        </div>
      ) : (
        <div className="space-y-6" data-oid="xp5:mfk">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-2" data-oid="4m737ju">
              <Card data-oid="p-zal-u">
                <CardContent className="p-4" data-oid="ebwl:5p">
                  <div
                    className="flex items-center justify-between mb-4"
                    data-oid="8.896bc"
                  >
                    <h3 className="font-medium" data-oid="jpoguz_">
                      Step {index + 1}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                      data-oid="o97tuq8"
                    >
                      <Trash2 className="h-4 w-4" data-oid="5la9ts2" />
                    </Button>
                  </div>
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    data-oid="xcyk29y"
                  >
                    <div className="space-y-2" data-oid="mdtgybp">
                      <Label htmlFor={`step-${index}-name`} data-oid="qeh9f01">
                        Step Name
                      </Label>
                      <Input
                        id={`step-${index}-name`}
                        value={step.name}
                        onChange={(e) =>
                          updateStep(index, "name", e.target.value)
                        }
                        data-oid="y1hkj7f"
                      />
                    </div>
                    <div className="space-y-2" data-oid="c0znyc5">
                      <Label htmlFor={`step-${index}-type`} data-oid="efr-ur5">
                        Step Type
                      </Label>
                      <Select
                        value={step.type}
                        onValueChange={(value) =>
                          updateStep(index, "type", value)
                        }
                        data-oid="o:2hw4."
                      >
                        <SelectTrigger
                          id={`step-${index}-type`}
                          data-oid="42ltrix"
                        >
                          <SelectValue
                            placeholder="Select step type"
                            data-oid="ze.3y6v"
                          />
                        </SelectTrigger>
                        <SelectContent data-oid="yi4wzwf">
                          {STEP_TYPES.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              data-oid="5tc36g0"
                            >
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2" data-oid=":8:lc44">
                      <Label
                        htmlFor={`step-${index}-source`}
                        data-oid="7qn906p"
                      >
                        Data Source
                      </Label>
                      <Select
                        value={step.source}
                        onValueChange={(value) =>
                          updateStep(index, "source", value)
                        }
                        data-oid="nyt5hpu"
                      >
                        <SelectTrigger
                          id={`step-${index}-source`}
                          data-oid="ha9bf.g"
                        >
                          <SelectValue
                            placeholder="Select data source"
                            data-oid="yld9yd6"
                          />
                        </SelectTrigger>
                        <SelectContent data-oid=":0.2fmt">
                          {SOURCE_TYPES.map((source) => (
                            <SelectItem
                              key={source.value}
                              value={source.value}
                              data-oid="kdylreh"
                            >
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2" data-oid="s2ekswx">
                      <Label
                        htmlFor={`step-${index}-description`}
                        data-oid="llcd0w0"
                      >
                        Description
                      </Label>
                      <Input
                        id={`step-${index}-description`}
                        placeholder="Describe what this step does"
                        value={step.description || ""}
                        onChange={(e) =>
                          updateStep(index, "description", e.target.value)
                        }
                        data-oid="4-tijc5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1" data-oid="2154nwi">
                  <ArrowDown
                    className="h-6 w-6 text-muted-foreground"
                    data-oid="-g_czbq"
                  />
                </div>
              )}
            </div>
          ))}
          <Button
            onClick={addStep}
            variant="outline"
            className="w-full"
            data-oid="9oft8ib"
          >
            <Plus className="mr-2 h-4 w-4" data-oid="eg8ueo3" />
            Add Step
          </Button>
        </div>
      )}
    </div>
  );
}
