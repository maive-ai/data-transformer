import { useState, useEffect } from "react";

interface AiTransformSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function AiTransformSidebar({ node, onChange }: AiTransformSidebarProps) {
  const [prompt, setPrompt] = useState(node.data.prompt || "");
  const [inputTypes, setInputTypes] = useState(node.data.ioConfig?.inputTypes?.map((t: any) => t.type) || [""]);
  const [outputType, setOutputType] = useState(node.data.ioConfig?.outputType?.type || "");
  const [useOutputTemplate, setUseOutputTemplate] = useState(node.data.useOutputTemplate || false);
  const [outputTemplateName, setOutputTemplateName] = useState(node.data.outputTemplateName || "");
  const [outputTemplateUrl, setOutputTemplateUrl] = useState(node.data.outputTemplateUrl || "");

  // Update state when node changes
  useEffect(() => {
    setPrompt(node.data.prompt || "");
    setInputTypes(node.data.ioConfig?.inputTypes?.map((t: any) => t.type) || [""]);
    setOutputType(node.data.ioConfig?.outputType?.type || "");
    setUseOutputTemplate(node.data.useOutputTemplate || false);
    setOutputTemplateName(node.data.outputTemplateName || "");
    setOutputTemplateUrl(node.data.outputTemplateUrl || "");
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, {
      prompt,
      useOutputTemplate,
      outputTemplateName,
      outputTemplateUrl,
      ioConfig: {
        inputTypes: inputTypes.map((type: string) => ({ type })),
        outputType: { type: outputType }
      }
    });
  };

  const handleOutputTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload?template=1', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const { url } = await response.json();
        setOutputTemplateUrl(url);
        setOutputTemplateName(file.name);
        setUseOutputTemplate(true);
        onChange(node.id, { 
          outputTemplateUrl: url, 
          outputTemplateName: file.name,
          useOutputTemplate: true
        });
      }
    }
  };

  const handleInputTypeChange = (type: string, index: number) => {
    const newTypes = [...inputTypes];
    newTypes[index] = type;
    setInputTypes(newTypes);
    if (type === "mp4") {
      setOutputType("json");
      onChange(node.id, { 
        outputFileName: "P-650-WTH-BKM.json",
        ioConfig: {
          inputTypes: newTypes.map(t => ({ type: t })),
          outputType: { type: "json" }
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Prompt Section */}
      <div>
        <div className="font-medium mb-2">AI Prompt</div>
        <textarea
          className="w-full min-h-[120px] border rounded-lg p-2 text-sm"
          placeholder="Describe what the AI should do with the input data..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Input Types Section */}
      <div>
        <div className="font-medium mb-2">Input File Types</div>
        {inputTypes.map((type: string, index: number) => (
          <div key={index} className="mb-2">
            <select
              className="w-full border rounded-lg p-2 text-sm"
              value={type}
              onChange={(e) => handleInputTypeChange(e.target.value, index)}
            >
              <option value="">Select input type</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
              <option value="mp4">MP4 Video</option>
              <option value="txt">Text</option>
            </select>
          </div>
        ))}
      </div>

      {/* Output Type Section */}
      <div>
        <div className="font-medium mb-2">Output File Type</div>
        <select
          className="w-full border rounded-lg p-2 text-sm"
          value={outputType}
          onChange={(e) => setOutputType(e.target.value)}
        >
          <option value="">Select output type</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="xlsx">Excel</option>
          <option value="markdown">Markdown</option>
          <option value="txt">Text</option>
        </select>
      </div>

      {/* Output Template Section */}
      <div>
        <div className="font-medium mb-2">Output Template</div>
        {outputTemplateName ? (
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="flex-1">
              <div className="text-sm text-gray-600">{outputTemplateName}</div>
            </div>
            <button
              onClick={() => {
                setOutputTemplateName("");
                setOutputTemplateUrl("");
                setUseOutputTemplate(false);
                onChange(node.id, { 
                  outputTemplateName: "", 
                  outputTemplateUrl: "", 
                  useOutputTemplate: false 
                });
              }}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Remove template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleOutputTemplateChange}
              className="w-full border rounded-lg p-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Upload a template to structure the AI output</p>
          </div>
        )}
      </div>

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