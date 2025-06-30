import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';

interface AiWebSearchSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function AiWebSearchSidebar({ node, onChange }: AiWebSearchSidebarProps) {
  const [prompt, setPrompt] = useState(node.data.prompt || '');
  const [websites, setWebsites] = useState<string[]>(node.data.websites || ['']);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPrompt(node.data.prompt || '');
    setWebsites(node.data.websites || ['']);
  }, [node]);

  // Auto-expand textarea height
  useEffect(() => {
    const ta = promptRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [prompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    onChange(node.id, { prompt: e.target.value, websites });
  };

  const handleWebsiteChange = (idx: number, value: string) => {
    const updated = [...websites];
    updated[idx] = value;
    setWebsites(updated);
    onChange(node.id, { prompt, websites: updated });
  };

  const handleAddWebsite = () => {
    const updated = [...websites, ''];
    setWebsites(updated);
    onChange(node.id, { prompt, websites: updated });
  };

  const handleRemoveWebsite = (idx: number) => {
    const updated = websites.filter((_, i) => i !== idx);
    setWebsites(updated.length ? updated : ['']);
    onChange(node.id, { prompt, websites: updated.length ? updated : [''] });
  };

  return (
    <div className="space-y-8 px-2 pt-4 pb-0">
      {/* Prompt Section */}
      <div>
        <label className="block text-sm font-medium mb-2">Search Prompt</label>
        <Textarea
          ref={promptRef}
          value={prompt}
          onChange={handlePromptChange}
          placeholder="e.g. Find the latest research on quantum computing..."
          className="resize-none min-h-[80px] max-h-[40vh] overflow-y-auto focus-visible:ring-[hsl(var(--sidebar-active))]"
        />
      </div>

      {/* Websites Section */}
      <div>
        <label className="block text-sm font-medium mb-2">Websites to Search</label>
        <div className="space-y-2">
          {websites.map((site, idx) => (
            <div key={idx} className="flex items-center w-full">
              <Input
                value={site}
                onChange={e => handleWebsiteChange(idx, e.target.value)}
                placeholder="www.example.com"
                className="w-full focus-visible:ring-[hsl(var(--sidebar-active))]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveWebsite(idx)}
                disabled={websites.length === 1}
                aria-label="Remove website"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-3">
          <Button
            type="button"
            variant="secondary"
            className="w-8 h-8 p-0 rounded-full flex items-center justify-center"
            onClick={handleAddWebsite}
            aria-label="Add website"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 