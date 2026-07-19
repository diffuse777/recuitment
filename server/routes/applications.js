import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import Application from '../models/Application.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { resolveUserId } from '../utils/resolveUserId.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads/resumes');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF resumes are allowed.'));
  },
});

function attachResumeFromFile(application, file) {
  if (!file) return application;
  const absolutePath = file.path;
  application.resumeFileName = file.originalname;
  application.resumePath = path.relative(path.join(__dirname, '..'), absolutePath);
  application.resumeData = fs.readFileSync(absolutePath);
  application.hasResume = true;
  return application;
}

function attachResumeFromBase64(application, resumeBase64, resumeFileName) {
  if (!resumeBase64) return false;
  const raw = String(resumeBase64).includes(',')
    ? String(resumeBase64).split(',')[1]
    : String(resumeBase64);
  const buffer = Buffer.from(raw, 'base64');
  if (!buffer.length) return false;
  if (buffer.length > 1 * 1024 * 1024) {
    throw new Error('Resume must be under 1 MB.');
  }
  application.resumeData = buffer;
  application.resumeFileName = resumeFileName || application.resumeFileName || 'resume.pdf';
  application.hasResume = true;
  return true;
}

function deleteResumeFile(resumePath) {
  if (!resumePath) return;
  const absolutePath = path.join(__dirname, '..', resumePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

// Submit an application (requires validated fields + resume PDF)
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const {
      userId, registerNumber, gender,
      department, yearOfStudy, section, mobileNumber,
      preferredClub, preferredDomain, hasProject,
      projectDescription, availableForInterview
    } = req.body;

    if (!userId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({ message: 'Please log in to submit an application.' });
    }

    let resolvedUserId;
    try {
      resolvedUserId = await resolveUserId(userId);
    } catch {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({
        message: 'Your session is no longer valid. Please log out and log in again.',
        code: 'SESSION_INVALID',
      });
    }

    const participant = await User.findById(resolvedUserId);
    if (!participant || participant.role !== 'participant') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({
        message: 'Your session is no longer valid. Please log out and log in again.',
        code: 'SESSION_INVALID',
      });
    }

    const universityEmail = String(participant.email || '').trim().toLowerCase();
    if (!universityEmail.endsWith('@klu.ac.in')) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        message: 'Applications must be linked to a university email ending with @klu.ac.in.',
      });
    }

    // Prevent duplicate applications (by user and by university email)
    const existingApp = await Application.findOne({
      $or: [{ userId: resolvedUserId }, { email: universityEmail }],
    });
    if (existingApp) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'You have already submitted your application.' });
    }

    const missing = [];
    if (!String(registerNumber || '').trim()) missing.push('registerNumber');
    if (!gender) missing.push('gender');
    if (!department) missing.push('department');
    if (!yearOfStudy) missing.push('yearOfStudy');
    if (!String(section || '').trim()) missing.push('section');
    if (!String(mobileNumber || '').trim()) missing.push('mobileNumber');
    if (!preferredClub) missing.push('preferredClub');
    if (!preferredDomain) missing.push('preferredDomain');
    if (!hasProject) missing.push('hasProject');
    if (!availableForInterview) missing.push('availableForInterview');
    if (hasProject === 'Yes' && !String(projectDescription || '').trim()) {
      missing.push('projectDescription');
    }

    if (missing.length) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'Please fill in all required fields.',
        missing,
      });
    }

    if (!/^[6-9]\d{9}$/.test(String(mobileNumber).trim())) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number.' });
    }

    const hasResumeFile = !!req.file;
    const hasResumeBase64 = !!req.body.resumeBase64;
    if (!hasResumeFile && !hasResumeBase64) {
      return res.status(400).json({ message: 'Resume PDF is required (max 1 MB).' });
    }

    const application = new Application({
      userId: resolvedUserId,
      name: participant.name,
      email: universityEmail,
      registerNumber: String(registerNumber).trim(),
      gender,
      department,
      yearOfStudy,
      section: String(section).trim(),
      mobileNumber: String(mobileNumber).trim(),
      preferredClub,
      preferredDomain,
      hasProject,
      projectDescription: hasProject === 'Yes' ? String(projectDescription || '').trim() : '',
      availableForInterview,
    });

    if (req.file) {
      attachResumeFromFile(application, req.file);
    } else {
      attachResumeFromBase64(
        application,
        req.body.resumeBase64,
        req.body.resumeFileName
      );
    }

    if (!application.hasResume) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Resume PDF is required (max 1 MB).' });
    }

    await application.save();

    const safe = application.toObject();
    delete safe.resumeData;
    res.status(201).json({
      message: 'Application submitted successfully.',
      application: safe,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Submit application error:', error);

    if (error?.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted your application.' });
    }

    const message = error.message?.includes('log in again')
      ? error.message
      : error.message?.includes('PDF') || error.message?.includes('1 MB')
        ? error.message
        : 'Failed to submit application.';
    res.status(500).json({ message, error: error.message });
  }
});

// Get user's application
router.get('/my-application', async (req, res) => {
  try {
    const { userId } = req.query;
    const resolvedUserId = await resolveUserId(userId);
    const application = await Application.findOne({ userId: resolvedUserId }).select('-resumeData');
    res.json({ application });
  } catch (error) {
    console.error('Fetch application error:', error);
    res.status(500).json({ message: 'Failed to fetch application from database.' });
  }
});

// Get all applications (Admin)
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find()
      .select('-resumeData')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (error) {
    console.error('Fetch all applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications from database.' });
  }
});

const EXPORT_COLUMNS = [
  'name',
  'email',
  'registerNumber',
  'gender',
  'department',
  'yearOfStudy',
  'section',
  'mobileNumber',
  'preferredClub',
  'preferredDomain',
  'hasProject',
  'projectDescription',
  'availableForInterview',
  'resumeFileName',
  'hasResume',
  'status',
  'submittedAt',
  'updatedAt',
];

function toExportRows(applications) {
  return applications.map((app) => ({
    name: app.name || '',
    email: app.email || '',
    registerNumber: app.registerNumber || '',
    gender: app.gender || '',
    department: app.department || '',
    yearOfStudy: app.yearOfStudy || '',
    section: app.section || '',
    mobileNumber: app.mobileNumber || '',
    preferredClub: app.preferredClub || '',
    preferredDomain: app.preferredDomain || '',
    hasProject: app.hasProject || '',
    projectDescription: app.projectDescription || '',
    availableForInterview: app.availableForInterview || '',
    resumeFileName: app.resumeFileName || '',
    hasResume: app.hasResume ? 'Yes' : 'No',
    status: app.status === 'Interview' ? 'Interview Done' : (app.status || ''),
    submittedAt: app.createdAt ? new Date(app.createdAt).toISOString() : '',
    updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString() : '',
  }));
}

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows) {
  const header = EXPORT_COLUMNS.join(',');
  const lines = rows.map((row) =>
    EXPORT_COLUMNS.map((col) => escapeCsvCell(row[col])).join(',')
  );
  return [header, ...lines].join('\r\n');
}

const assetsDir = path.join(__dirname, '../../src/assets');
const LOGO_CYBERNERDS = path.join(assetsDir, 'cybernerds.png');
const LOGO_OWASP = path.join(assetsDir, 'owasp.png');
const LOGO_UNIVERSITY = path.join(assetsDir, 'kalasalingam.png');

const PDF_TABLE_COLUMNS = [
  { key: 'name', label: 'Name', width: 0.3 },
  { key: 'registerNumber', label: 'Register Number', width: 0.22 },
  { key: 'preferredClub', label: 'Preferred Club', width: 0.23 },
  { key: 'preferredDomain', label: 'Domain', width: 0.25 },
];

function drawPdfHeader(doc) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = doc.page.margins.top;
  const contentWidth = right - left;

  const clubLogoH = 36;
  const clubLogoW = 110;
  const uniLogoSize = 58;
  let logosBottom = top;

  if (fs.existsSync(LOGO_CYBERNERDS)) {
    doc.image(LOGO_CYBERNERDS, left, top, { height: clubLogoH, width: clubLogoW });
  }
  if (fs.existsSync(LOGO_OWASP)) {
    doc.image(LOGO_OWASP, left + clubLogoW + 8, top, { height: clubLogoH, width: clubLogoW });
  }
  logosBottom = Math.max(logosBottom, top + clubLogoH);

  if (fs.existsSync(LOGO_UNIVERSITY)) {
    doc.image(LOGO_UNIVERSITY, right - uniLogoSize, top, {
      width: uniLogoSize,
      height: uniLogoSize,
    });
    logosBottom = Math.max(logosBottom, top + uniLogoSize);
  }

  const titleTop = logosBottom + 14;
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text('KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION', left, titleTop, {
      width: contentWidth,
      align: 'center',
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#111827')
    .text('SHORTLISTED STUDENTS', left, doc.y + 6, {
      width: contentWidth,
      align: 'center',
    });

  const lineY = doc.y + 10;
  doc
    .strokeColor('#1e3a5f')
    .lineWidth(1.2)
    .moveTo(left, lineY)
    .lineTo(right, lineY)
    .stroke();

  doc.y = lineY + 14;
}

function drawPdfTableHeader(doc, colWidths, left) {
  const rowH = 22;
  const y = doc.y;

  doc.rect(left, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill('#1e3a5f');

  let x = left;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  PDF_TABLE_COLUMNS.forEach((col, i) => {
    doc.text(col.label, x + 4, y + 6, {
      width: colWidths[i] - 8,
      align: 'left',
      ellipsis: true,
    });
    x += colWidths[i];
  });

  doc.y = y + rowH;
  doc.fillColor('#111827');
}

function drawPdfTableRow(doc, row, colWidths, left, zebra) {
  const paddingY = 5;
  const fontSize = 9;
  const cellTexts = PDF_TABLE_COLUMNS.map((col) => String(row[col.key] ?? '').trim() || '—');

  doc.font('Helvetica').fontSize(fontSize);
  const heights = cellTexts.map((text, i) =>
    doc.heightOfString(text, { width: colWidths[i] - 8 })
  );
  const rowH = Math.max(20, Math.max(...heights) + paddingY * 2);
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const y = doc.y;

  if (zebra) {
    doc.rect(left, y, tableWidth, rowH).fill('#f1f5f9');
  }

  doc.strokeColor('#cbd5e1').lineWidth(0.5);
  doc.rect(left, y, tableWidth, rowH).stroke();

  let x = left;
  cellTexts.forEach((text, i) => {
    if (i > 0) {
      doc
        .strokeColor('#cbd5e1')
        .moveTo(x, y)
        .lineTo(x, y + rowH)
        .stroke();
    }
    doc.fillColor('#111827').font('Helvetica').fontSize(fontSize);
    doc.text(text, x + 4, y + paddingY, {
      width: colWidths[i] - 8,
      align: 'left',
    });
    x += colWidths[i];
  });

  doc.y = y + rowH;
}

function buildExportPdf(rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidths = PDF_TABLE_COLUMNS.map((col) => contentWidth * col.width);
    const bottomLimit = () => doc.page.height - doc.page.margins.bottom;

    const startPage = () => {
      drawPdfHeader(doc);
      drawPdfTableHeader(doc, colWidths, left);
    };

    startPage();

    if (rows.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#334155');
      doc.text('No shortlisted students matched the selected filters.', left, doc.y + 8, {
        width: contentWidth,
        align: 'center',
      });
      doc.end();
      return;
    }

    rows.forEach((row, index) => {
      const estimatedRowH = 28;
      if (doc.y + estimatedRowH > bottomLimit()) {
        doc.addPage();
        startPage();
      }
      drawPdfTableRow(doc, row, colWidths, left, index % 2 === 1);
    });

    doc.end();
  });
}

// Admin export — CSV, Excel, or PDF
router.get('/export', async (req, res) => {
  try {
    const {
      scope = 'all',
      status = '',
      club = '',
      domain = '',
      format = 'csv',
    } = req.query;

    const query = {};

    if (scope === 'shortlisted') {
      // Interview Done or Accepted
      query.status = { $in: ['Interview', 'Accepted'] };
    } else if (scope === 'filtered') {
      if (!status) {
        return res.status(400).json({ message: 'Please select a status filter.' });
      }
      const allowed = ['Under Review', 'Interview', 'Accepted', 'Rejected'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status filter.' });
      }
      query.status = status;
    } else if (scope === 'club') {
      if (!['CYBERNERDS', 'OWASP'].includes(club)) {
        return res.status(400).json({ message: 'Please select a preferred club.' });
      }
      query.preferredClub = club;
    } else if (scope === 'domain') {
      if (!domain) {
        return res.status(400).json({ message: 'Please select a preferred domain.' });
      }
      query.preferredDomain = domain;
    } else if (scope !== 'all') {
      return res.status(400).json({ message: 'Invalid export scope.' });
    }

    const applications = await Application.find(query)
      .select('-resumeData')
      .sort({ createdAt: -1 })
      .lean();

    const rows = toExportRows(applications);
    const stamp = new Date().toISOString().slice(0, 10);
    const scopeLabel = String(scope).replace(/[^a-z0-9_-]/gi, '_');

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `applicants_${scopeLabel}_${stamp}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    if (format === 'csv') {
      const csv = rowsToCsv(rows);
      const filename = `applicants_${scopeLabel}_${stamp}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // BOM helps Excel open UTF-8 CSV correctly
      return res.send(`\uFEFF${csv}`);
    }

    if (format === 'pdf') {
      const buffer = await buildExportPdf(rows);
      const filename = `shortlisted_students_${scopeLabel}_${stamp}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    return res.status(400).json({ message: 'Format must be csv, xlsx, or pdf.' });
  } catch (error) {
    console.error('Export applications error:', error);
    res.status(500).json({ message: 'Failed to export applications.' });
  }
});

// Upload / replace resume for an existing application (admin or applicant)
router.post('/:id/resume', upload.single('resume'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).select('+resumeData');
    if (!application) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (!req.file && !req.body.resumeBase64) {
      return res.status(400).json({ message: 'Please attach a PDF resume.' });
    }

    if (req.file) {
      deleteResumeFile(application.resumePath);
      attachResumeFromFile(application, req.file);
    } else {
      attachResumeFromBase64(
        application,
        req.body.resumeBase64,
        req.body.resumeFileName || application.resumeFileName
      );
    }

    await application.save();

    const safe = application.toObject();
    delete safe.resumeData;
    res.json({ message: 'Resume uploaded successfully', application: safe });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Resume upload error:', error);
    res.status(500).json({
      message:
        error.message?.includes('PDF') || error.message?.includes('1 MB')
          ? error.message
          : 'Failed to upload resume.',
    });
  }
});

// Get one application by id (Admin)
router.get('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).select('-resumeData');
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.json({ application });
  } catch (error) {
    console.error('Fetch application by id error:', error);
    res.status(500).json({ message: 'Failed to fetch application.' });
  }
});

// Serve resume PDF for admin viewing
router.get('/:id/resume', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).select('+resumeData');
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const fileName = application.resumeFileName || 'resume.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    if (application.resumeData?.length) {
      return res.send(application.resumeData);
    }

    if (application.resumePath) {
      const absolutePath = path.join(__dirname, '..', application.resumePath);
      if (fs.existsSync(absolutePath)) {
        return fs.createReadStream(absolutePath).pipe(res);
      }
    }

    return res.status(404).json({ message: 'No resume file available for this application.' });
  } catch (error) {
    console.error('Serve resume error:', error);
    res.status(500).json({ message: 'Failed to load resume.' });
  }
});

// Update application status (Admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Under Review', 'Interview', 'Accepted', 'Rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-resumeData');

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status.' });
  }
});

// Delete applicant application + related messages — keep the user so they can re-apply
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).select('+resumeData');
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const userId = application.userId;

    deleteResumeFile(application.resumePath);
    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });
    await Application.deleteOne({ _id: application._id });

    // Do NOT delete the User account — participants must be able to log in and apply again

    res.json({ message: 'Applicant deleted successfully. They can submit a new application.' });
  } catch (error) {
    console.error('Delete applicant error:', error);
    res.status(500).json({ message: 'Failed to delete applicant.' });
  }
});

export default router;
