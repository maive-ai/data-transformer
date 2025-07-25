import fs from 'fs/promises';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'pipelines.json');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
fs.mkdir(dataDir, { recursive: true }).catch(() => {});

// Initialize storage file if it doesn't exist
fs.access(STORAGE_FILE).catch(async () => {
  await fs.writeFile(STORAGE_FILE, JSON.stringify({}));
});

export async function getPipelines() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading pipelines:', error);
    return {};
  }
}

export async function savePipeline(id: string, pipeline: any) {
  try {
    const pipelines = await getPipelines();
    pipelines[id] = pipeline;
    await fs.writeFile(STORAGE_FILE, JSON.stringify(pipelines, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving pipeline:', error);
    return false;
  }
}

export async function getPipeline(id: string) {
  const pipelines = await getPipelines();
  return pipelines[id];
}

export async function deletePipeline(id: string) {
  try {
    const pipelines = await getPipelines();
    delete pipelines[id];
    await fs.writeFile(STORAGE_FILE, JSON.stringify(pipelines, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return false;
  }
}
