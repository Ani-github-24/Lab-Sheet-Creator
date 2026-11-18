import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { LabMetadata, LabQuestion } from '../store';
//@ts-ignore
import amritaLogo from '../amrita-logo.png';

const getBoldFont = (baseFont?: string) => {
  if (baseFont === 'Times-Roman') return 'Times-Bold';
  if (baseFont === 'Courier') return 'Courier-Bold';
  return 'Helvetica-Bold';
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 36,
    fontSize: 12,
    color: '#333333',
  },
  pageBorderFrame: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    bottom: 18,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  frontPageContainer: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
  },
  topCenterBlock: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 16,
  },
  logo: {
    width: 280,
    height: 'auto',
    marginBottom: 16,
  },
  campusName: {
    fontSize: 18,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  assignmentType: {
    fontSize: 16,
  },
  leftBlock: {
    marginBottom: 22,
    lineHeight: 1.6,
  },
  blockTextBold: {},
  tableRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  tableLabel: {
    width: 130,
  },
  tableValue: {
    flex: 1,
  },
  signatureGrid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  signatureText: {
    fontSize: 12,
  },
  questionsContainer: {
    marginTop: 6,
  },
  questionContainer: {
    marginBottom: 18,
  },
  questionTextContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  questionNumber: {
    marginRight: 6,
  },
  questionText: {
    flex: 1,
    lineHeight: 1.4,
  },
  image: {
    maxWidth: '100%',
    maxHeight: 650,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 4,
    marginTop: 6,
  },
  subheading: {
    fontSize: 14,
    marginTop: 14,
    marginBottom: 6,
    textDecoration: 'underline',
  },
  codeBlock: {
    backgroundColor: '#1e1e1e',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  codeText: {
    color: '#d4d4d4',
    fontFamily: 'Courier',
    fontSize: 8.5,
    lineHeight: 1.25,
  },
});

interface LabDocumentProps {
  metadata: LabMetadata;
  questions: LabQuestion[];
}

const LabDocument: React.FC<LabDocumentProps> = ({ metadata, questions }) => {
  const boldFont = { fontFamily: getBoldFont(metadata.fontFamily) };

  return (
    <Document>
      {/* Front Page - Dedicated Page to prevent cross-page layout collision */}
      {metadata.includeFrontPage ? (
        <Page size="A4" style={[styles.page, { fontFamily: metadata.fontFamily || 'Helvetica' }]}>
          <View style={styles.pageBorderFrame} />
          <View style={styles.frontPageContainer}>
            {/* Top Center */}
            <View style={styles.topCenterBlock}>
              <Image src={metadata.logoUrl || amritaLogo} style={styles.logo} />
              <Text style={[styles.campusName, boldFont]}>{metadata.campus}</Text>
              <Text style={[styles.assignmentType, boldFont]}>{metadata.assignmentType}</Text>
            </View>

            {/* Left-Aligned Block 1 */}
            <View style={styles.leftBlock}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Title</Text>
                <Text style={styles.tableValue}>: {metadata.title}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Course Code</Text>
                <Text style={styles.tableValue}>: {metadata.courseCode}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Course Title</Text>
                <Text style={styles.tableValue}>: {metadata.courseTitle}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Semester</Text>
                <Text style={styles.tableValue}>: {metadata.semester}</Text>
              </View>
            </View>

            {/* Left-Aligned Block 2 */}
            <View style={styles.leftBlock}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Academic Year</Text>
                <Text style={styles.tableValue}>: {metadata.academicYear}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Batch</Text>
                <Text style={styles.tableValue}>: {metadata.batch}</Text>
              </View>
            </View>

            {/* Left-Aligned Block 3 */}
            <View style={styles.leftBlock}>
              <Text style={{ marginBottom: 4 }}>Submitted by,</Text>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Name</Text>
                <Text style={styles.tableValue}>: {metadata.studentName}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Roll Number</Text>
                <Text style={styles.tableValue}>: {metadata.rollNumber}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Date of Submission</Text>
                <Text style={styles.tableValue}>: {metadata.dateOfSubmission}</Text>
              </View>
            </View>

            {/* Left-Aligned Block 4 */}
            <View style={styles.leftBlock}>
              <Text style={{ marginBottom: 4 }}>Submitted To,</Text>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, boldFont]}>Name</Text>
                <Text style={styles.tableValue}>: {metadata.coordinatorName}</Text>
              </View>
            </View>

            {/* Bottom Signature Grid */}
            <View style={styles.signatureGrid}>
              <Text style={[styles.signatureText, boldFont]}>Signature of the course coordinator</Text>
              <Text style={[styles.signatureText, boldFont]}>Signature of the Student</Text>
            </View>
          </View>
        </Page>
      ) : null}

      {/* Questions Pages - Automatic multi-page wrapping for text and code blocks */}
      {questions.length > 0 ? (
        <Page size="A4" style={[styles.page, { fontFamily: metadata.fontFamily || 'Helvetica' }]}>
          {/* Global Page Border rendered across all questions pages */}
          <View fixed style={styles.pageBorderFrame} />

          <View style={styles.questionsContainer}>
            {questions.map((q) => {
              if (q.type === 'subheading') {
                return (
                  <Text key={q.id} style={[styles.subheading, boldFont]} minPresenceAhead={40}>
                    {q.questionText}
                  </Text>
                );
              }

              return (
                <View key={q.id} style={styles.questionContainer}>
                  {(q.prefix || q.questionText) ? (
                    <View style={styles.questionTextContainer} minPresenceAhead={25}>
                      {q.prefix ? <Text style={[styles.questionNumber, boldFont]}>{q.prefix}</Text> : null}
                      {q.questionText ? <Text style={styles.questionText}>{q.questionText}</Text> : null}
                    </View>
                  ) : null}
                  {Boolean(q.codeSnippet) ? (
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeText}>{q.codeSnippet!.replace(/\r\n/g, '\n').trimEnd()}</Text>
                    </View>
                  ) : null}
                  {Boolean(q.screenshotUrl) ? (
                    <Image
                      src={q.screenshotUrl!}
                      style={styles.image}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </Page>
      ) : null}

      {/* Fallback empty page if both cover page is disabled and no questions exist */}
      {!metadata.includeFrontPage && questions.length === 0 ? (
        <Page size="A4" style={[styles.page, { fontFamily: metadata.fontFamily || 'Helvetica' }]}>
          <View style={styles.pageBorderFrame} />
        </Page>
      ) : null}
    </Document>
  );
};

export default LabDocument;
