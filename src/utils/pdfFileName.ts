import { LabMetadata } from '../store';

/**
 * Returns the standardized PDF filename.
 * Guarantees that when the filename format starts with "Lab_",
 * the lab sheet number immediately follows "Lab_".
 * Example: Lab_1_21CSE211_John_Doe.pdf
 */
export function getPdfFileName(metadata: LabMetadata): string {
  // Extract and sanitize lab number: remove leading 'lab' if the user typed "Lab 1" or "Lab 01"
  let cleanLabNum = (metadata.labNumber || '').trim();
  const labMatch = cleanLabNum.match(/^(?:lab\s*#?\s*)?(\w+)/i);
  if (labMatch) {
    cleanLabNum = labMatch[1];
  }

  const cleanCourse = (metadata.courseCode || '').trim();
  const rawName = (metadata.studentName || 'Student').trim();
  const cleanName = rawName ? rawName.replace(/\s+/g, '_') : 'Student';
  const cleanRoll = (metadata.rollNumber || '').trim();

  const isLab = !metadata.assignmentType || metadata.assignmentType.toUpperCase().includes('LAB');

  if (isLab) {
    const parts: string[] = ['Lab'];
    if (cleanLabNum) {
      parts.push(cleanLabNum);
    }
    if (cleanCourse) {
      parts.push(cleanCourse);
    }
    if (cleanName) {
      parts.push(cleanName);
    }
    return `${parts.join('_')}.pdf`;
  } else {
    // If specifically designated as another assignment type (e.g. ASSIGNMENT)
    const parts: string[] = [];
    if (cleanRoll) parts.push(cleanRoll);
    if (cleanCourse) parts.push(cleanCourse);
    if (cleanName) parts.push(cleanName);
    return `${parts.join('_') || 'Assignment'}.pdf`;
  }
}
