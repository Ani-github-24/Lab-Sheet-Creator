import { LabQuestion, LabMetadata } from '../store';

export interface MarkdownParseResult {
  metadataUpdates: Partial<LabMetadata>;
  questions: LabQuestion[];
  stats: {
    subheadingsCount: number;
    questionsCount: number;
    codeBlocksCount: number;
  };
}

/**
 * Parses markdown text into Lab questions, subheadings, code snippets, and optional cover metadata.
 */
export function parseMarkdownToLab(markdown: string): MarkdownParseResult {
  const metadataUpdates: Partial<LabMetadata> = {};
  let content = markdown.trim();

  // 1. Extract YAML frontmatter if present (between leading --- and ---)
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];
    content = content.slice(frontmatterMatch[0].length).trim();

    const lines = yaml.split(/\r?\n/);
    for (const line of lines) {
      const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (kv) {
        const key = kv[1].toLowerCase().replace(/[-_]/g, '');
        const val = kv[2].trim().replace(/^['"]|['"]$/g, '');

        if (key === 'labnumber' || key === 'lab' || key === 'number' || key === 'sheetnumber') {
          metadataUpdates.labNumber = val;
        } else if (key === 'title' || key === 'labtitle') {
          metadataUpdates.title = val;
        } else if (key === 'coursecode' || key === 'course') {
          metadataUpdates.courseCode = val;
        } else if (key === 'coursetitle') {
          metadataUpdates.courseTitle = val;
        } else if (key === 'studentname' || key === 'name' || key === 'author') {
          metadataUpdates.studentName = val;
        } else if (key === 'rollnumber' || key === 'roll' || key === 'rollno') {
          metadataUpdates.rollNumber = val;
        } else if (key === 'semester' || key === 'sem') {
          metadataUpdates.semester = val;
        } else if (key === 'academicyear' || key === 'year') {
          metadataUpdates.academicYear = val;
        } else if (key === 'batch') {
          metadataUpdates.batch = val;
        } else if (key === 'campus') {
          metadataUpdates.campus = val;
        } else if (key === 'coordinatorname' || key === 'coordinator' || key === 'faculty') {
          metadataUpdates.coordinatorName = val;
        } else if (key === 'assignmenttype' || key === 'type') {
          metadataUpdates.assignmentType = val;
        } else if (key === 'dateofsubmission' || key === 'date') {
          metadataUpdates.dateOfSubmission = val;
        }
      }
    }
  }

  // Check if first line is H1 (# Title) and title not set
  const h1Match = content.match(/^#\s+([^\r\n]+)\r?\n?/);
  if (h1Match && !metadataUpdates.title) {
    metadataUpdates.title = h1Match[1].trim();
    // Check if title mentions lab number: "Lab 3: ..."
    const labNumMatch = metadataUpdates.title.match(/Lab\s*(\d+)/i);
    if (labNumMatch && !metadataUpdates.labNumber) {
      metadataUpdates.labNumber = labNumMatch[1];
    }
    content = content.slice(h1Match[0].length).trim();
  }

  const questions: LabQuestion[] = [];
  const lines = content.split(/\r?\n/);
  let i = 0;

  let currentQuestion: LabQuestion | null = null;
  let textBuffer: string[] = [];

  const finalizeCurrent = () => {
    if (currentQuestion) {
      if (textBuffer.length > 0) {
        const extraText = textBuffer.join('\n').trim();
        if (extraText) {
          if (currentQuestion.questionText) {
            currentQuestion.questionText += '\n' + extraText;
          } else {
            currentQuestion.questionText = extraText;
          }
        }
        textBuffer = [];
      }

      if (
        currentQuestion.type === 'subheading' ||
        currentQuestion.questionText.trim() ||
        currentQuestion.codeSnippet ||
        currentQuestion.screenshotUrl
      ) {
        questions.push(currentQuestion);
      }
      currentQuestion = null;
    } else if (textBuffer.length > 0) {
      const text = textBuffer.join('\n').trim();
      textBuffer = [];
      if (text) {
        questions.push({
          id: crypto.randomUUID(),
          prefix: '',
          questionText: text,
          screenshotUrl: null,
          type: 'question',
        });
      }
    }
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for code fence (``` or ~~~)
    const codeFenceMatch = rawLine.match(/^(\s*)(```|~~~)(.*)$/);
    if (codeFenceMatch) {
      const fenceMarker = codeFenceMatch[2];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length) {
        if (lines[i].trim().startsWith(fenceMarker)) {
          i++;
          break;
        }
        codeLines.push(lines[i]);
        i++;
      }
      const codeSnippet = codeLines.join('\n');

      if (currentQuestion && currentQuestion.type === 'question' && !currentQuestion.codeSnippet) {
        if (textBuffer.length > 0) {
          const extra = textBuffer.join('\n').trim();
          if (extra) {
            currentQuestion.questionText = currentQuestion.questionText
              ? currentQuestion.questionText + '\n' + extra
              : extra;
          }
          textBuffer = [];
        }
        currentQuestion.codeSnippet = codeSnippet;
      } else {
        finalizeCurrent();
        currentQuestion = {
          id: crypto.randomUUID(),
          prefix: '',
          questionText: '',
          codeSnippet: codeSnippet,
          screenshotUrl: null,
          type: 'question',
        };
      }
      continue;
    }

    // Check for Headings (#, ##, ###)
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // Check if heading is formatted like a question: "## 1. Description" or "### Q2: ..."
      const numMatch = headingText.match(/^(\d+[\.\)]|[Qq]\d+[\.:]?|(?:Task|Step|Exercise|Experiment|Problem)\s*\d+[\.:]?)\s*(.*)/);
      if (numMatch && level >= 2) {
        finalizeCurrent();
        currentQuestion = {
          id: crypto.randomUUID(),
          prefix: numMatch[1],
          questionText: numMatch[2].trim(),
          screenshotUrl: null,
          type: 'question',
        };
      } else {
        finalizeCurrent();
        questions.push({
          id: crypto.randomUUID(),
          prefix: '',
          questionText: headingText,
          screenshotUrl: null,
          type: 'subheading',
        });
      }
      i++;
      continue;
    }

    // Check for Image tag: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      const imgUrl = imgMatch[2].trim();
      if (currentQuestion && currentQuestion.type === 'question' && !currentQuestion.screenshotUrl) {
        currentQuestion.screenshotUrl = imgUrl;
      } else {
        finalizeCurrent();
        currentQuestion = {
          id: crypto.randomUUID(),
          prefix: '',
          questionText: '',
          screenshotUrl: imgUrl,
          type: 'question',
        };
      }
      i++;
      continue;
    }

    // Check for Question prefix in body text: "1. Question", "1) Question", "Q1: Question"
    const questionMatch = rawLine.match(/^(\d+[\.\)]|[Qq]\d+[\.:]?|(?:Task|Step|Exercise|Experiment|Problem)\s*\d+[\.:]?)\s+(.*)/);
    if (questionMatch) {
      finalizeCurrent();
      currentQuestion = {
        id: crypto.randomUUID(),
        prefix: questionMatch[1],
        questionText: questionMatch[2].trim(),
        screenshotUrl: null,
        type: 'question',
      };
      i++;
      continue;
    }

    // Normal text lines
    if (trimmed.length > 0) {
      textBuffer.push(rawLine);
    } else {
      // Empty line breaks text paragraphs
      if (currentQuestion && textBuffer.length > 0) {
        const extra = textBuffer.join('\n').trim();
        if (extra) {
          currentQuestion.questionText = currentQuestion.questionText
            ? currentQuestion.questionText + '\n\n' + extra
            : extra;
        }
        textBuffer = [];
      } else if (!currentQuestion && textBuffer.length > 0) {
        finalizeCurrent();
      }
    }

    i++;
  }

  finalizeCurrent();

  // Calculate statistics
  let subheadingsCount = 0;
  let questionsCount = 0;
  let codeBlocksCount = 0;

  for (const q of questions) {
    if (q.type === 'subheading') {
      subheadingsCount++;
    } else {
      questionsCount++;
      if (q.codeSnippet) codeBlocksCount++;
    }
  }

  return {
    metadataUpdates,
    questions,
    stats: {
      subheadingsCount,
      questionsCount,
      codeBlocksCount,
    },
  };
}

/**
 * Generates sample markdown demonstrating headers, questions, and code blocks.
 */
export const SAMPLE_MARKDOWN = `---
labNumber: "1"
title: "Linux System Calls & Process Management"
courseCode: "21CSE211"
courseTitle: "Operating Systems Lab"
studentName: "John Doe"
rollNumber: "CB.EN.U4CSE21001"
batch: "CSE-A"
semester: "4"
academicYear: "2025-2026"
campus: "Amrita School of Computing"
assignmentType: "LAB"
coordinatorName: "Dr. Faculty Name"
dateOfSubmission: "2026-06-15"
---

# Lab 1: Linux Process Management

## Section 1: Process Creation

1. Write a C program to create a child process using fork() and display parent and child PIDs.
Here is the implementation using fork() and getpid():

\`\`\`c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

int main() {
    pid_t pid = fork();

    if (pid < 0) {
        fprintf(stderr, "Fork failed\\n");
        return 1;
    } else if (pid == 0) {
        printf("Child Process: PID = %d, Parent PID = %d\\n", getpid(), getppid());
    } else {
        printf("Parent Process: PID = %d, Child PID = %d\\n", getpid(), pid);
    }
    return 0;
}
\`\`\`

2. Explain the state of an Orphan process and demonstrate how it is adopted by init/systemd.
An orphan process is a computer process whose parent process has finished or terminated, though it remains running itself.

\`\`\`bash
# Compile and run in background
gcc orphan.c -o orphan
./orphan &
ps -ef | grep orphan
\`\`\`

## Section 2: IPC Mechanisms

3. Implement Pipe communication between parent and child processes.

\`\`\`c
#include <stdio.h>
#include <unistd.h>
#include <string.h>

int main() {
    int fd[2];
    char write_msg[] = "Hello from parent!";
    char read_msg[100];

    if (pipe(fd) == -1) return 1;

    pid_t pid = fork();
    if (pid > 0) {
        close(fd[0]);
        write(fd[1], write_msg, strlen(write_msg) + 1);
        close(fd[1]);
    } else {
        close(fd[1]);
        read(fd[0], read_msg, sizeof(read_msg));
        printf("Child received: %s\\n", read_msg);
        close(fd[0]);
    }
    return 0;
}
\`\`\`
`;
