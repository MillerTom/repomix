export const getSqlTemplate = () => {
  return `
-- Repomix Output
-- Generated on: {{{generationDate}}}

{{#if fileSummaryEnabled}}
/*
{{{generationHeader}}}

Purpose:
--------
{{{summaryPurpose}}}

Usage Guidelines:
-----------------
{{{summaryUsageGuidelines}}}

Notes:
------
{{{summaryNotes}}}
*/
{{/if}}

{{#if headerText}}
/*
User Provided Header:
---------------------
{{{headerText}}}
*/
{{/if}}

{{#if directoryStructureEnabled}}
/*
Directory Structure:
--------------------
{{{treeString}}}
*/
{{/if}}

-- Create table for files
CREATE TABLE IF NOT EXISTS repository_files (
    path TEXT PRIMARY KEY,
    content TEXT
);

-- Insert files
{{#if filesEnabled}}
{{#each processedFiles}}
INSERT INTO repository_files (path, content) VALUES ('{{{this.path}}}', '{{{escapeSql this.content}}}');
{{/each}}
{{/if}}

{{#if instruction}}
/*
Instruction:
------------
{{{instruction}}}
*/
{{/if}}
`;
};
