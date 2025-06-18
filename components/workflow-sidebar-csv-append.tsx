import { useState, useEffect, useRef } from "react";
import { OutputTemplateUpload } from "./output-template-upload";

interface CsvAppendSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function CsvAppendSidebar({ node, onChange }: CsvAppendSidebarProps) {
  const [outputFileName, setOutputFileName] = useState(node.data.outputFileName || 'merged_data.csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update state when node changes
  useEffect(() => {
    setOutputFileName(node.data.outputFileName || 'merged_data.csv');
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, {
      outputFileName,
      ioConfig: {
        inputTypes: [{ type: "csv" }],
        outputType: { type: "csv" }
      }
    });
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange(node.id, { templateFile: file, templateFileUrl: url, templateFileName: file.name });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="font-medium mb-2">Description</div>
        <p className="text-sm text-gray-600">
          This node takes multiple CSV files as input and combines them into a single CSV file. 
          All input CSV files must have the same column headers. Data rows from all files will be appended together.
        </p>
      </div>
      <OutputTemplateUpload
        templateName={node.data.templateFileName || ""}
        templateUrl={node.data.templateFileUrl || ""}
        accept={".csv"}
        onTemplateChange={(url, name, file) => {
          onChange(node.id, { templateFile: file, templateFileUrl: url, templateFileName: name });
        }}
        onRemove={() => {
          onChange(node.id, { templateFile: undefined, templateFileUrl: "", templateFileName: "" });
        }}
        helpText="If provided, each row will be appended to this template and the final CSV will be passed to the next node after the loop completes. Only CSV files are allowed."
      />
      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Save Configuration
      </button>
    </div>
  );
} 