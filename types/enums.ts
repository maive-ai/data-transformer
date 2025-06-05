// Node type enums
export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  OUTPUT = 'output',
  HTTP_TRIGGER = 'httpTrigger',
  HTTP_RESPONSE = 'httpResponse',
  AI_OPERATOR = 'aiOperator',
  ERP_LOOKUP = 'erpLookup',
  LOOP = 'loop'
}

// Node sub-type enums
export enum TriggerSubType {
  MANUAL = 'manual',
  EVENT = 'event'
}

export enum OutputSubType {
  EXCEL = 'excel',
  DOC = 'doc'
}

export enum ActionSubType {
  DECISION = 'decision'
}

// Run state enums
export enum RunState {
  IDLE = 'idle',
  RUNNING = 'running',
  DONE = 'done',
  ERROR = 'error',
  PROMPT = 'prompt'
}

// File type enums
export enum FileType {
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
  PDF = 'pdf',
  DOC = 'doc',
  DOCX = 'docx',
  MP4 = 'mp4',
  TXT = 'txt',
  MARKDOWN = 'markdown'
}

// MIME type enums
export enum MimeType {
  TEXT_CSV = 'text/csv',
  APPLICATION_JSON = 'application/json',
  APPLICATION_PDF = 'application/pdf',
  APPLICATION_MSWORD = 'application/msword',
  APPLICATION_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  APPLICATION_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  TEXT_PLAIN = 'text/plain',
  APPLICATION_XML = 'application/xml'
}

// Pipeline run status
export enum PipelineRunStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  RUNNING = 'running'
}

// HTTP methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// Content types
export enum ContentType {
  APPLICATION_JSON = 'application/json',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  APPLICATION_XML = 'application/xml'
}

// Node labels that are frequently used
export enum NodeLabel {
  AI_TRANSFORM = 'AI Transform',
  EXCEL_EXPORT = 'Excel Export'
}