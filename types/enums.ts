// Node type enums
export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  OUTPUT = 'output',
  HTTP_TRIGGER = 'httpTrigger',
  HTTP_RESPONSE = 'httpResponse',
  AI_OPERATOR = 'aiOperator',
  ERP_LOOKUP = 'erpLookup',
  LOOP = 'loop',
  INTEGRATION = 'integration',
}

// Node sub-type enums
export enum TriggerSubType {
  MANUAL = 'manual',
  EVENT = 'event',
  SCHEDULE = 'schedule',
  HTTP = 'http'
}

export enum OutputSubType {
  EXCEL = 'excel',
  DOC = 'doc',
  HTTP = 'http'
}

export enum ActionSubType {
  DECISION = 'decision',
  AI_TRANSFORM = 'action',
  EXCEL_TRANSFORM = 'action',
  LOOP = 'action'
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
  AI_OPERATOR = 'AI Operator',
  EXCEL_EXPORT = 'Excel Export',
  EXCEL_TRANSFORM = 'Excel Transform',
  DOC_EXPORT = 'Doc Export',
  MANUAL_UPLOAD = 'Manual Upload',
  SCHEDULE = 'Schedule',
  HTTP_ENDPOINT = 'HTTP Endpoint',
  HTTP_RESPONSE = 'HTTP Response',
  DECISION = 'Decision',
  LOOP = 'Loop',
  CSV_APPEND = 'CSV Append',
  ERP = 'ERP'
}

export enum IntegrationSubType {
  ERP = 'erp',
  EMAIL = 'email',
  FILE_STORAGE = 'fileStorage',
  DATABASE = 'database',
  API = 'api',
  WEBHOOK = 'webhook',
}

// ERP specific enums
export enum ErpAction {
  BOM_LOOKUP = 'bom-lookup',
  BOM_GENERATION = 'bom-generation',
  INVENTORY_CHECK = 'inventory-check',
  PRICE_LOOKUP = 'price-lookup',
  SUPPLIER_LOOKUP = 'supplier-lookup',
  LEAD_TIME_CHECK = 'lead-time-check',
  ALTERNATE_PARTS = 'alternate-parts',
  COMPLIANCE_CHECK = 'compliance-check'
}

export enum ErpActionLabel {
  BOM_LOOKUP = 'BOM Part Lookup',
  BOM_GENERATION = 'BOM Generation',
  INVENTORY_CHECK = 'Inventory Availability',
  PRICE_LOOKUP = 'Price Lookup',
  SUPPLIER_LOOKUP = 'Supplier Information',
  LEAD_TIME_CHECK = 'Lead Time Check',
  ALTERNATE_PARTS = 'Alternate Parts Search',
  COMPLIANCE_CHECK = 'Compliance Verification'
}

// Email specific enums
export enum EmailAction {
  SEND = 'send',
  RECEIVE = 'receive',
  FORWARD = 'forward',
  REPLY = 'reply'
}

// Integration direction enum
export enum IntegrationDirection {
  READ = 'read',
  WRITE = 'write',
  BOTH = 'both'
}