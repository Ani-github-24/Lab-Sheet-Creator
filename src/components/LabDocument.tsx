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
    padding: 40,
    fontSize: 12,
    color: '#333333',
  },
  pageBorderFrame: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
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
    marginBottom: 40,
    marginTop: 20,
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
    marginBottom: 24,
    lineHeight: 1.6,
  },
  blockTextBold: {
  },
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
    paddingTop: 20,
  },
  signatureText: {
    fontSize: 12,
  },
  questionsContainer: {
    marginTop: 10,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionTextContainer: {
    flexDirection: 'row',
    marginBottom: 12,
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
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  subheading: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 5,
    textDecoration: 'underline',
  },
  codeBlock: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: 10,
    fontFamily: 'Courier',
    fontSize: 10,
    borderRadius: 4,
    marginTop: 8,
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
      <Page size="A4" style={[styles.page, { fontFamily: metadata.fontFamily || 'Helvetica' }]}>
        {/* Global Page Border */}
        <View fixed style={styles.pageBorderFrame} />

        {/* Front Page Container */}
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

        {/* Questions start on a new page but within the same Page element to inherit border */}
        {questions.length > 0 && (
          <View break style={styles.questionsContainer}>
            {questions.map((q) => {
              if (q.type === 'subheading') {
                return (
                  <Text key={q.id} style={[styles.subheading, boldFont]}>
                    {q.questionText}
                  </Text>
                );
              }

              return (
                <View key={q.id} style={styles.questionContainer} wrap={false}>
                  <View style={styles.questionTextContainer}>
                    <Text style={[styles.questionNumber, boldFont]}>{q.prefix}</Text>
                    <Text style={styles.questionText}>{q.questionText}</Text>
                  </View>
                  {q.codeSnippet && (
                    <View style={styles.codeBlock}>
                      <Text>{q.codeSnippet}</Text>
                    </View>
                  )}
                  {q.screenshotUrl && (
                    <Image
                      src={q.screenshotUrl}
                      style={styles.image}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default LabDocument;
