import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'pipelines.json');

// Ensure the data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

// Initialize storage file if it doesn't exist
if (!fs.existsSync(STORAGE_FILE)) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({}));
}

export function getPipelines() {
  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading pipelines:', error);
    return {};
  }
}

export function savePipeline(id: string, pipeline: any) {
  try {
    const pipelines = getPipelines();
    pipelines[id] = pipeline;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(pipelines, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving pipeline:', error);
    return false;
  }
}

export function getPipeline(id: string) {
  const pipelines = getPipelines();
  return pipelines[id];
}

export function deletePipeline(id: string) {
  try {
    const pipelines = getPipelines();
    delete pipelines[id];
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(pipelines, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return false;
  }
} 